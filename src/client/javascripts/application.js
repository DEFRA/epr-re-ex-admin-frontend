import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)

// Lazy-load JSONEditor initialiser when present on the page
if (typeof document !== 'undefined' && document.getElementById('jsoneditor')) {
  // Name the chunk for predictable output filename
  import('./jsoneditor.js')
}
