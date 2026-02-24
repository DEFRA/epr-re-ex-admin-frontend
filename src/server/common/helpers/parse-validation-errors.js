/**
 * Converts a dot-separated path like "registrations.1.registrationNumber"
 * into bracket notation like "registrations[1].registrationNumber"
 */
function formatPath(path) {
  return path.replaceAll(/\.(\d+)\./g, '[$1].')
}

/**
 * Parses a raw backend validation error message into friendly user-readable messages.
 *
 * Backend returns messages like:
 *   "Invalid organisation data: registrations.1.registrationNumber: any.invalid;
 *    registrations.1.validFrom: string.base"
 *
 * This function extracts the field paths, deduplicates, and returns friendly messages
 * using bracket notation (e.g. "registrations[1].registrationNumber is required").
 *
 * For non-validation errors (e.g. "Cannot transition..."), the message is returned as-is.
 */
export function parseValidationErrors(message) {
  if (!message) {
    return [{ message: 'An unknown error occurred' }]
  }

  const prefix = 'Invalid organisation data: '
  if (!message.startsWith(prefix)) {
    return [{ message }]
  }

  const errorsPart = message.slice(prefix.length)
  const entries = errorsPart
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  const seenFields = new Set()
  const errors = []

  for (const entry of entries) {
    // Format: "registrations.1.registrationNumber: any.invalid"
    const colonIndex = entry.lastIndexOf(': ')
    if (colonIndex === -1) {
      continue
    }

    const path = entry.slice(0, colonIndex).trim()

    // Deduplicate by full path (same field can have multiple error types)
    if (seenFields.has(path)) {
      continue
    }
    seenFields.add(path)

    errors.push({
      message: `${formatPath(path)} is required`
    })
  }

  if (errors.length === 0) {
    return [{ message }]
  }

  return errors
}
