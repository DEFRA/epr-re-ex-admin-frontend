import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/**
 * @typedef {Object} DlqMessage
 * @property {string} messageId
 * @property {string} sentTimestamp - ISO 8601 timestamp
 * @property {number} approximateReceiveCount
 * @property {{ type: string, payload?: { summaryLogId?: string } } | null} command
 * @property {string} body - Raw JSON string
 */

/**
 * @typedef {Object} FormattedDlqMessage
 * @property {string} commandType
 * @property {string} summaryLogId
 * @property {string} sentTimestamp
 * @property {number} receiveCount
 * @property {string} bodyJson - Pretty-printed JSON or raw string
 */

export const queueManagementGetController = {
  async handler(request, h) {
    const data = await fetchJsonFromBackend(
      request,
      '/v1/admin/queues/dlq/messages',
      {}
    )

    const success = request.yar.get('success')
    request.yar.clear('success')

    const pageTitle = request.route.settings.app.pageTitle

    const messages = (data.messages ?? []).map(formatMessage)

    const viewContext = {
      pageTitle,
      heading: 'Queue management',
      approximateMessageCount: data.approximateMessageCount,
      messages
    }

    if (success) {
      viewContext.success = true
    }

    return h.view('routes/queue-management/index', viewContext)
  }
}

/**
 * Format a raw DLQ message for display in the template.
 * @param {DlqMessage} message - Raw message from the backend
 * @returns {FormattedDlqMessage} Formatted message for the view
 */
function formatMessage(message) {
  return {
    commandType: message.command?.type ?? 'Unknown',
    summaryLogId: message.command?.payload?.summaryLogId ?? 'N/A',
    sentTimestamp: message.sentTimestamp,
    receiveCount: message.approximateReceiveCount,
    bodyJson: formatJson(message.body)
  }
}

/**
 * Attempt to pretty-print a JSON string. Returns the
 * original string if parsing fails.
 * @param {string} raw - Raw JSON string
 * @returns {string} Prettified JSON or original string
 */
function formatJson(raw) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}
