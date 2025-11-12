/**
 * Sign-out page functionality
 * Clears localStorage and redirects to the logout URL
 */
function signOut() {
  try {
    globalThis.localStorage.clear()
  } catch (err) {
    console.warn('Failed to clear localStorage:', err)
  }

  // Get the logout URL from the data element
  const signOutData = document.getElementById('sign-out-data')
  const logoutUrl = signOutData?.dataset.logoutUrl

  if (logoutUrl) {
    globalThis.location.href = logoutUrl
  }
}

// Execute sign-out when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', signOut)
} else {
  signOut()
}
