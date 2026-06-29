import { Readable } from 'node:stream'

import { streamFromBackend } from '#server/common/helpers/stream-from-backend.js'

/** @import { HapiRequest } from '#server/common/hapi-types.js' */
/** @import { ReadableStream as WebReadableStream } from 'node:stream/web' */

const DEFAULT_CONTENT_TYPE = 'text/csv; charset=utf-8'

/**
 * Proxy a backend CSV stream straight through to the browser, preserving the
 * backend's Content-Type and Content-Disposition headers. Throws when the
 * backend responds without a body so callers can surface a download error.
 *
 * @param {HapiRequest} request
 * @param {object} h - Hapi response toolkit
 * @param {string} backendPath - Backend path (with any query string) to stream
 * @param {string} fallbackFilename - Filename used if the backend omits Content-Disposition
 * @returns {Promise<object>} the Hapi response
 */
export const proxyCsvStream = async (
  request,
  h,
  backendPath,
  fallbackFilename
) => {
  const response = await streamFromBackend(request, backendPath)

  if (!response.body) {
    throw new Error(
      `Backend returned a successful response with no body for ${backendPath}`
    )
  }

  // `response.body` from the Fetch API is a Web ReadableStream. Hapi only
  // understands strings, Buffers, and Node Readable streams — given a Web
  // stream it serialises the object, which produces `{}` instead of the CSV
  // payload. Adapt to a Node Readable so Hapi proxies the chunks. The cast
  // works around an upstream `@types/node` mismatch between the Web
  // `ReadableStream<Uint8Array<ArrayBuffer>>` and the older signature
  // `Readable.fromWeb` expects.
  const body = /** @type {WebReadableStream} */ (
    /** @type {unknown} */ (response.body)
  )

  return h
    .response(Readable.fromWeb(body))
    .type(response.headers.get('content-type') ?? DEFAULT_CONTENT_TYPE)
    .header(
      'Content-Disposition',
      response.headers.get('content-disposition') ??
        `attachment; filename="${fallbackFilename}"`
    )
}
