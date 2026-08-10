import { toCriteria } from './criteria.js'
import { renderOrganisations } from './render-organisations.js'

export const organisationsGetController = {
  async handler(request, h) {
    return renderOrganisations(request, h, toCriteria(request.query))
  }
}
