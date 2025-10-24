// Use default import for jsoneditor which exposes the constructor as default
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'

// Initialise JSONEditor on the organisation page if present
const container = document.getElementById('jsoneditor')
if (container) {
  try {
    const payloadEl = document.getElementById('organisation-json')
    const data = payloadEl ? JSON.parse(payloadEl.textContent || '{}') : {}
    // Instantiate the editor with the container (not the payload element)
    const editor = new JSONEditor(container, { mode: 'view' })
    editor.set(data)
  } catch (err) {
    console.error('Failed to initialise JSONEditor:', err)
  }
}
