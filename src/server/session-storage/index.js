const sessionStorage = {}

export function writeToSession(key, value) {
  sessionStorage[key] = value
}

export function readFromSession(key) {
  return sessionStorage[key]
}
