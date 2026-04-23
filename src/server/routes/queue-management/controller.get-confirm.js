export const queueManagementConfirmClearGetController = {
  handler(request, h) {
    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/queue-management/confirm-clear', {
      pageTitle,
      heading: 'Confirm clear all messages'
    })
  }
}
