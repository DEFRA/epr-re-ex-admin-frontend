import Boom from '@hapi/boom'

/**
 * Fetch JSON from a given path in the backend service.
 * @param {Response} response
 * @returns {Promise<{res: *, error}|{res: *, data: *}>}
 */
async function handleApiResponse(response) {
  if (!response.ok) {
    // Create a Boom error from the fetch response
    const error = Boom.boomify(new Error(response.statusText), {
      statusCode: response.status
    })

    // Add response body to the error payload if needed
    if (response.headers.get('content-type')?.includes('application/json')) {
      error.output.payload = await response.json()
    }

    throw error
  }

  return await response.json()
}

export { handleApiResponse }
