import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { findOrganisationIdByNumber } from '#server/common/helpers/natural-keys/find-organisation.js'
import { isDatabaseId } from '#server/common/helpers/natural-keys/key-form.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

export const defraFormsSubmission = {
  plugin: {
    name: 'defra-form-submission-organisation',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/defra-forms-submission/{documentId}',
          options: {
            app: { pageTitle: 'Defra Forms submission data' }
          },
          async handler(request, h) {
            // Submissions are stored by the organisation's id, so a number is
            // looked up first
            const { documentId } = request.params
            const id = isDatabaseId(documentId)
              ? documentId
              : await findOrganisationIdByNumber(request, documentId)

            return renderSubmission(request, h, id)
          }
        }
      ])
    }
  }
}

async function renderSubmission(request, h, documentId) {
  const data = await loadData(request, documentId)

  const organisation = data.organisation
    ? asPayloadAndSchema(data.organisation)
    : undefined

  return h.view('routes/defra-forms-submission/index', {
    pageTitle: request.route.settings.app.pageTitle,
    heading: `ID: ${documentId}`,
    organisation,
    registrations: (data.registrations || []).map(asPayloadAndSchema),
    accreditations: (data.accreditations || []).map(asPayloadAndSchema)
  })
}

async function loadData(request, documentId) {
  try {
    return await fetchJsonFromBackend(
      request,
      `/v1/form-submissions/${documentId}`
    )
  } catch (e) {
    if (e.isBoom && e.output.statusCode === statusCodes.notFound) {
      return {}
    }
    throw e
  }
}

function asPayloadAndSchema(raw) {
  return {
    schema: pretty(raw.rawSubmissionData.meta.definition),
    payload: pretty({
      ...raw,
      rawSubmissionData: {
        ...raw.rawSubmissionData,
        meta: {
          ...raw.rawSubmissionData.meta,
          definition: 'See schema'
        }
      }
    })
  }
}

function pretty(raw) {
  return JSON.stringify(raw, null, 2)
}
