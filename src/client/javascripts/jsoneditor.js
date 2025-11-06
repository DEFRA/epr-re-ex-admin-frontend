import { initJSONEditor } from './jsoneditor.helpers.js'
import validate from '#server/common/schemas/organisation.ajv.js'
import schema from '#server/common/schemas/organisation.json'

initJSONEditor({
  schema,
  validate,
  storageKey: 'organisation-jsoneditor-draft'
})
