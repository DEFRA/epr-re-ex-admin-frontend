import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)

function clearLocalStorage() {
  try {
    globalThis.localStorage.clear()
  } catch (err) {
    console.warn('Failed to clear localStorage:', err)
  }
}

function setupSignOutHandler() {
  const signOutLink = document.querySelector('a[href="/auth/sign-out"]')
  if (signOutLink) {
    signOutLink.addEventListener('click', () => {
      clearLocalStorage()
    })
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupSignOutHandler)
} else {
  setupSignOutHandler()
}
