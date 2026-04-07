<#
.SYNOPSIS
    Strips VBA macros from a directory of ORS .xlsm workbooks, producing macro-free
    .xlsx copies for upload via the admin UI ORS upload page.

.DESCRIPTION
    Background:
    Defra ORS workbooks arrive from regulators as .xlsm files containing a VBA macro
    project. CDP's ClamAV virus scanner rejects any OLE2 file with macros
    (Heuristics.OLE2.ContainsMacros.VBA), blocking the admin UI ORS upload step. The
    macros only fire on cell edit (auto-assigning Interim Site IDs) -- they never
    run at open, save or close time, and they have no effect on data that has
    already been typed in. Stripping the macros and re-saving as .xlsx is therefore
    safe for the frozen backlog of populated files.

    What this script does:
    For each .xlsm file in -InputPath, opens it with VBA execution forcibly disabled,
    re-saves it as .xlsx in -OutputPath (preserving the base filename), and reports a
    per-file pass/fail summary at the end. Source files are never modified or
    overwritten.

    Safety:
    Runs Excel with AutomationSecurity = msoAutomationSecurityForceDisable so no VBA
    executes under any circumstances, regardless of Trust Center settings. External
    link refresh prompts are suppressed (the reference workbook has a dead link to
    the original author's local machine). DisplayAlerts is suppressed so no save
    format dialogs block the batch.

    Requirements:
    Windows 11 with Microsoft Excel installed. No additional packages, no network
    access.

.PARAMETER InputPath
    Directory containing the .xlsm files to convert. Files in this directory are
    read but never modified.

.PARAMETER OutputPath
    Directory to write the macro-free .xlsx copies into. Created if it does not
    exist. Must be different from -InputPath.

.EXAMPLE
    .\strip-ors-macros.ps1 -InputPath C:\Temp\ors-batch -OutputPath C:\Temp\ors-batch-clean

    Converts every .xlsm file in C:\Temp\ors-batch to a macro-free .xlsx in
    C:\Temp\ors-batch-clean, then prints a summary.

.NOTES
    Temporary tooling. Becomes redundant once Defra publish a macro-free ORS
    template upstream. See Jira PAE-1304 for the full problem statement, impact and
    policy context.

    Workflow position:
    1. Download ORS batch from SharePoint.
    2. Unzip the batch.
    3. Run this script (input = unzipped folder, output = sibling folder).
    4. Select all files in the output folder, upload via the admin UI.
    5. Delete both folders immediately per data-protection policy.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Excel constants -- defined inline so the script does not depend on Office interop
# assemblies being registered.
$msoAutomationSecurityForceDisable = 3
$xlOpenXMLWorkbook = 51

function Release-ComObject {
    param($ComObject)
    if ($ComObject) {
        try {
            [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ComObject) | Out-Null
        }
        catch { }
    }
}

# Resolve and validate paths.
$resolvedInput = (Resolve-Path -LiteralPath $InputPath -ErrorAction Stop).ProviderPath
if (-not (Test-Path -LiteralPath $resolvedInput -PathType Container)) {
    throw "Input path '$InputPath' is not a directory."
}

if (-not (Test-Path -LiteralPath $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
}
$resolvedOutput = (Resolve-Path -LiteralPath $OutputPath -ErrorAction Stop).ProviderPath

if ($resolvedInput -ieq $resolvedOutput) {
    throw "Input and output paths must be different. Both resolve to '$resolvedInput'."
}

$inputFiles = @(Get-ChildItem -LiteralPath $resolvedInput -Filter '*.xlsm' -File)
if ($inputFiles.Count -eq 0) {
    Write-Host "No .xlsm files found in '$resolvedInput'." -ForegroundColor Yellow
    return
}

Write-Host "Found $($inputFiles.Count) .xlsm file(s) to process." -ForegroundColor Cyan
Write-Host "Input:  $resolvedInput"
Write-Host "Output: $resolvedOutput"
Write-Host ""

$succeeded = New-Object 'System.Collections.Generic.List[string]'
$failed = New-Object 'System.Collections.Generic.List[pscustomobject]'

$excel = $null
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.AskToUpdateLinks = $false
    # Force-disable all VBA macros regardless of Trust Center settings. Files from
    # SharePoint are untrusted input on a production-access machine.
    $excel.AutomationSecurity = $msoAutomationSecurityForceDisable

    foreach ($file in $inputFiles) {
        $sourcePath = $file.FullName
        $targetName = [System.IO.Path]::ChangeExtension($file.Name, '.xlsx')
        $targetPath = Join-Path -Path $resolvedOutput -ChildPath $targetName

        Write-Host "-> $($file.Name)" -NoNewline

        if (Test-Path -LiteralPath $targetPath) {
            Write-Host "  SKIP (output already exists)" -ForegroundColor Yellow
            $failed.Add([pscustomobject]@{ File = $file.Name; Reason = 'Output already exists' })
            continue
        }

        $workbook = $null
        try {
            # Workbooks.Open positional args:
            #   1: FileName
            #   2: UpdateLinks  -- 0 means never refresh external links (the
            #      reference workbook has a dead link to the original author's
            #      local machine)
            #   3: ReadOnly     -- true so we cannot modify the source on disk
            $workbook = $excel.Workbooks.Open($sourcePath, 0, $true)

            $workbook.SaveAs($targetPath, $xlOpenXMLWorkbook)
            $workbook.Close($false)

            Write-Host "  OK" -ForegroundColor Green
            $succeeded.Add($file.Name)
        }
        catch {
            $reason = $_.Exception.Message
            Write-Host "  FAIL: $reason" -ForegroundColor Red
            $failed.Add([pscustomobject]@{ File = $file.Name; Reason = $reason })

            if ($workbook) {
                try { $workbook.Close($false) } catch { }
            }
        }
        finally {
            Release-ComObject $workbook
            $workbook = $null
        }
    }
}
finally {
    if ($excel) {
        try { $excel.Quit() } catch { }
        Release-ComObject $excel
        $excel = $null
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

Write-Host ""
Write-Host "==================== Summary ====================" -ForegroundColor Cyan
Write-Host "Converted: $($succeeded.Count)" -ForegroundColor Green
$failColour = if ($failed.Count -gt 0) { 'Red' } else { 'Green' }
Write-Host "Failed:    $($failed.Count)" -ForegroundColor $failColour

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Failures:" -ForegroundColor Red
    foreach ($f in $failed) {
        Write-Host "  $($f.File): $($f.Reason)" -ForegroundColor Red
    }
    exit 1
}
