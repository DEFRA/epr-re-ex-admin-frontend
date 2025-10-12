// TODO move this out of src

import { fileURLToPath } from 'node:url'
import path from 'path'
import nunjucks from 'nunjucks'
import { load } from 'cheerio'
import { camelCase, upperFirst } from 'lodash'

import * as filters from '#config/nunjucks/filters/filters.js'
import * as globals from '#config/nunjucks/globals/globals.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const nunjucksTestEnv = nunjucks.configure(
  [
    '../../../../node_modules/govuk-frontend/dist/',
    path.normalize(path.resolve(dirname, '../../templates')),
    path.normalize(path.resolve(dirname, '../../components'))
  ],
  {
    trimBlocks: true,
    lstripBlocks: true
  }
)

Object.entries(globals).forEach(([name, global]) => {
  nunjucksTestEnv.addGlobal(name, global)
})

Object.entries(filters).forEach(([name, filter]) => {
  nunjucksTestEnv.addFilter(name, filter)
})

export function renderTestComponent(componentName, options = {}) {
  const params = options?.params ?? {}
  const callBlock = options?.callBlock ?? []
  const context = options?.context ?? {}

  const macroPath = `${componentName}/macro.njk`
  const macroName = `app${upperFirst(camelCase(componentName))}`
  const macroParams = JSON.stringify(params, null, 2)
  let macroString = `{%- from "${macroPath}" import ${macroName} with context -%}`

  if (Array.isArray(callBlock) && callBlock.length > 0) {
    macroString += `{%- call ${macroName}(${macroParams}) -%}${callBlock.join(' ')}{%- endcall -%}`
  } else {
    macroString += `{{- ${macroName}(${macroParams}) -}}`
  }

  return load(nunjucksTestEnv.renderString(macroString, context))
}
