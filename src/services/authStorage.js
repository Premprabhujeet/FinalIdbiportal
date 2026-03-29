import { authStorageKeys } from '../config/authConfig'

function getStorageForPersistence(persist) {
  return persist ? window.localStorage : window.sessionStorage
}

export function saveAuthSession(session, { persist = true } = {}) {
  const targetStorage = getStorageForPersistence(persist)
  const staleStorage = persist ? window.sessionStorage : window.localStorage
  const targetKey = persist ? authStorageKeys.local : authStorageKeys.session
  const staleKey = persist ? authStorageKeys.session : authStorageKeys.local

  targetStorage.setItem(targetKey, JSON.stringify(session))
  staleStorage.removeItem(staleKey)
}

export function getAuthSession() {
  const temporarySession = window.sessionStorage.getItem(authStorageKeys.session)
  if (temporarySession) {
    return JSON.parse(temporarySession)
  }

  const localSession = window.localStorage.getItem(authStorageKeys.local)
  if (localSession) {
    return JSON.parse(localSession)
  }

  return null
}

export function clearAuthSession() {
  window.localStorage.removeItem(authStorageKeys.local)
  window.sessionStorage.removeItem(authStorageKeys.session)
}

export function getAccessToken() {
  return getAuthSession()?.accessToken ?? null
}
