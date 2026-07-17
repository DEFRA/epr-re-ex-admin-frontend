import { initJSONEditor } from './jsoneditor.helpers.js'
// @ts-expect-error -- generated ajv file is @ts-nocheck; types come from the ValidateFunction cast below
import rawValidate from '#server/common/schemas/organisation.ajv.js'
// @ts-expect-error -- JSON import; eslint parser doesn't support import attributes yet
import schema from '#server/common/schemas/organisation.json'
/** @import { ValidateFunction } from 'ajv' */

/** @type {ValidateFunction} */
const validate = rawValidate

initJSONEditor({
  schema,
  validate,
  storageKey: 'organisation-jsoneditor-draft'
})
