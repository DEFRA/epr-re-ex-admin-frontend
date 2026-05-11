import { Readable } from 'node:stream'

import { streamFromBackend } from '#server/common/helpers/stream-from-backend.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

/** @import { ReadableStream as WebReadableStream } from 'node:stream/web' */

const logger = createLogger()

export const wasteRecordsExportPostController = {
  async handler(request, h) {
    try {
      const response = await streamFromBackend(
        request,
        '/v1/admin/waste-records/export.csv'
      )

      if (!response.body) {
        throw new Error(
          'Backend returned a successful response with no body for waste-records export'
        )
      }

      // `response.body` from the Fetch API is a Web ReadableStream. Hapi only
      // understands strings, Buffers, and Node Readable streams — given a Web
      // stream it serialises the object, which produces `{}` instead of the
      // CSV payload. Adapt to a Node Readable so Hapi proxies the chunks.
      // The cast works around an upstream `@types/node` mismatch between the
      // Web `ReadableStream<Uint8Array<ArrayBuffer>>` and the older signature
      // `Readable.fromWeb` expects.
      const body = /** @type {WebReadableStream} */ (
        /** @type {unknown} */ (response.body)
      )
      return h
        .response(Readable.fromWeb(body))
        .type(response.headers.get('content-type') ?? 'text/csv; charset=utf-8')
        .header(
          'Content-Disposition',
          response.headers.get('content-disposition') ??
            'attachment; filename="waste-records.csv"'
        )
    } catch (error) {
      logger.error({
        message: 'Failed to stream waste records export',
        err: error
      })

      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the waste records export. Please try again.'

      request.yar.set('error', errorMessage)
      return h.redirect('/waste-records-export')
    }
  }
}
