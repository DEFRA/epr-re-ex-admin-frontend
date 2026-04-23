import { initJSONEditor } from './jsoneditor.helpers.js'
// @ts-expect-error -- generated ajv file is @ts-nocheck; types come from the ValidateFunction cast below
import rawValidate from '#server/common/schemas/organisation.ajv.js'
import schema from '#server/common/schemas/organisation.json'

/** @type {import('ajv').ValidateFunction} */
const validate = rawValidate

initJSONEditor({
  schema,
  validate,
  storageKey: 'organisation-jsoneditor-draft'
})
