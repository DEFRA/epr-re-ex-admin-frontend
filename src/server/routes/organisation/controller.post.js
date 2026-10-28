import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/** @import { HapiRequest } from '#server/common/hapi-types.js' */

/**
 * Where the editor reopens after a save. The saved JSON can change the
 * organisation's number, so an address by number follows it.
 * @param {HapiRequest} request
 * @param {{ orgId: number }} saved
 * @returns {string}
 */
const editorAfterSave = (request, saved) =>
  request.params.organisationNumber === undefined
    ? request.path
    : `/organisations/${encodeURIComponent(saved.orgId)}/edit`

export const organisationsPOSTController = {
  async handler(request, h) {
    // An address by number carries the id the page was read with
    const id = request.params.id ?? request.payload.organisationId

    const postedData = JSON.parse(request.payload.organisation)

    try {
      await fetchJsonFromBackend(request, `/v1/organisations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          version: postedData.version,
          updateFragment: postedData
        })
      })

      request.yar.set('success', true)

      return h.redirect(editorAfterSave(request, postedData))
    } catch (error) {
      const message =
        error.output?.payload?.message ?? 'An unknown error occurred'
      const errorList = message.split('; ').map((text) => ({ text }))

      request.yar.set('errorList', errorList)

      return h.redirect(request.path)
    }
  }
}
