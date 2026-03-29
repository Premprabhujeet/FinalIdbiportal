import { authConfig, authStorageKeys } from '../config/authConfig'
import { getStaticAuthorizationHeader } from '../config/apiConfig'
import { clearAuthSession, getAuthSession, saveAuthSession } from './authStorage'
import { getOidcEndpoint } from './oidcDiscovery'

function encodeBase64Url(value) {
  return window
    .btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4
  const padded = padding === 0 ? normalized : normalized.padEnd(normalized.length + (4 - padding), '=')
  return window.atob(padded)
}

export function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split('.')
    if (!payload) {
      return null
    }

    return JSON.parse(decodeBase64Url(payload))
  } catch {
    return null
  }
}

function getScopeValue() {
  return authConfig.scopes.join(' ')
}

function getTokenUrl() {
  if (authConfig.tokenUrl) {
    return authConfig.tokenUrl
  }

  throw new Error(
    'Missing VITE_AUTH_TOKEN_URL. Add your token endpoint in a .env file before trying the real login API.',
  )
}

async function resolveTokenUrl() {
  return getOidcEndpoint('token_endpoint', getTokenUrl())
}

function buildTokenExpiry(expiresInSeconds) {
  if (!expiresInSeconds) {
    return null
  }

  return new Date(Date.now() + Number(expiresInSeconds) * 1000).toISOString()
}

function createMockJwt(payload) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  return [
    encodeBase64Url(JSON.stringify(header)),
    encodeBase64Url(JSON.stringify(payload)),
    encodeBase64Url('mock-signature'),
  ].join('.')
}

function buildMockSession({ username, rememberDevice }) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresIn = 60 * 60
  const expiresAt = issuedAt + expiresIn
  const tokenPayload = {
    sub: username,
    user_name: username,
    preferred_username: username,
    adminName: username,
    bankCode: 'IDBI',
    email: `${username}@example.com`,
    scope: getScopeValue(),
    iss: authConfig.issuer,
    aud: authConfig.clientId,
    iat: issuedAt,
    exp: expiresAt,
    auth_mode: 'mock',
    rememberDevice,
  }

  return {
    accessToken: createMockJwt(tokenPayload),
    refreshToken: `mock-refresh-${crypto.randomUUID()}`,
    idToken: createMockJwt({
      ...tokenPayload,
      token_use: 'id',
      name: username,
    }),
    tokenType: 'Bearer',
    scope: getScopeValue(),
    expiresIn,
    accessTokenExpirationDate: new Date(expiresAt * 1000).toISOString(),
    tokenPayload,
  }
}

function buildStaticSession({ rememberDevice }) {
  const staticHeader = getStaticAuthorizationHeader()
  const accessToken = staticHeader.Authorization?.replace(/^Bearer\s+/i, '') ?? ''

  return {
    accessToken,
    refreshToken: '',
    idToken: '',
    tokenType: 'Bearer',
    scope: getScopeValue(),
    expiresIn: null,
    accessTokenExpirationDate: null,
    tokenPayload: {
      auth_mode: 'static',
      rememberDevice,
    },
  }
}

function normalizeTokenResponse(tokenResponse) {
  const accessToken = tokenResponse.access_token

  if (!accessToken) {
    throw new Error('Login response did not include an access token.')
  }

  return {
    accessToken,
    refreshToken: tokenResponse.refresh_token ?? '',
    idToken: tokenResponse.id_token ?? '',
    tokenType: tokenResponse.token_type ?? 'Bearer',
    scope: tokenResponse.scope ?? getScopeValue(),
    expiresIn: tokenResponse.expires_in ?? null,
    accessTokenExpirationDate: buildTokenExpiry(tokenResponse.expires_in),
    tokenPayload: decodeJwtPayload(accessToken),
  }
}

export function saveOidcUserSession(userData, { persist = true } = {}) {
  if (!userData?.access_token) {
    clearAuthSession()
    window.sessionStorage.removeItem(authStorageKeys.oidcRawSession)
    window.sessionStorage.removeItem(authStorageKeys.oidcProfile)
    return null
  }

  window.sessionStorage.setItem(authStorageKeys.oidcRawSession, JSON.stringify(userData))
  window.sessionStorage.setItem(
    authStorageKeys.oidcProfile,
    JSON.stringify(userData.profile ?? decodeJwtPayload(userData.access_token) ?? {}),
  )
  console.log('[OIDC] Token response', userData)

  const session = {
    accessToken: userData.access_token,
    refreshToken: userData.refresh_token ?? '',
    idToken: userData.id_token ?? '',
    tokenType: userData.token_type ?? 'Bearer',
    scope: userData.scope ?? getScopeValue(),
    expiresIn: userData.expires_in ?? null,
    accessTokenExpirationDate:
      typeof userData.expires_at === 'number'
        ? new Date(userData.expires_at * 1000).toISOString()
        : null,
    tokenPayload: userData.profile ?? decodeJwtPayload(userData.access_token),
  }

  saveAuthSession(session, { persist })
  return session
}

async function parseErrorResponse(response) {
  try {
    const data = await response.json()
    const errorMessage =
      data.error_description || data.message || data.error || 'Login failed'

    return {
      message: errorMessage,
      details: data,
    }
  } catch {
    return {
      message: `Login failed with status ${response.status}`,
      details: null,
    }
  }
}

function buildLoginRequestBody({ username, password }) {
  const requestBody = new URLSearchParams({
    grant_type: authConfig.grantType,
    client_id: authConfig.clientId,
    redirect_uri: authConfig.redirectUrl,
    scope: getScopeValue(),
  })

  if (authConfig.grantType === 'authorization_code') {
    if (authConfig.authorizationCode) {
      requestBody.set('code', authConfig.authorizationCode)
    }

    if (authConfig.codeVerifier) {
      requestBody.set('code_verifier', authConfig.codeVerifier)
    }

    return requestBody
  }

  requestBody.set('username', username)
  requestBody.set('password', password)
  return requestBody
}

export async function loginWithPassword({ username, password, rememberDevice }) {
  if (authConfig.useMockAuth) {
    const session = buildMockSession({ username, rememberDevice })
    saveAuthSession(session, { persist: rememberDevice })
    return session
  }

  if (authConfig.useStaticAuth) {
    const session = buildStaticSession({ rememberDevice })
    saveAuthSession(session, { persist: rememberDevice })
    return session
  }

  const requestBody = buildLoginRequestBody({ username, password })
  const tokenUrl = await resolveTokenUrl()

  // Live token exchange is intentionally bypassed when VITE_USE_STATIC_AUTH=true.
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: requestBody.toString(),
  })

  if (!response.ok) {
    const parsedError = await parseErrorResponse(response)
    console.error('[Auth] Token exchange failed', {
      status: response.status,
      statusText: response.statusText,
      url: tokenUrl,
      grantType: authConfig.grantType,
      requestBody: Object.fromEntries(requestBody.entries()),
      response: parsedError.details,
    })
    throw new Error(
      parsedError.details
        ? `${parsedError.message} | ${JSON.stringify(parsedError.details)}`
        : parsedError.message,
    )
  }

  const tokenResponse = await response.json()
  const session = normalizeTokenResponse(tokenResponse)

  saveAuthSession(session, { persist: rememberDevice })
  return session
}

export async function refreshAccessToken() {
  const currentSession = getAuthSession()

  if (!currentSession?.refreshToken) {
    if (authConfig.useStaticAuth && currentSession?.accessToken) {
      return currentSession.accessToken
    }

    throw new Error('No refresh token found in storage.')
  }

  if (authConfig.useMockAuth) {
    const username =
      currentSession.tokenPayload?.preferred_username ||
      currentSession.tokenPayload?.user_name ||
      'demo.user'
    const persist = Boolean(window.localStorage.getItem(authStorageKeys.local))
    const refreshedSession = buildMockSession({
      username,
      rememberDevice: persist,
    })

    saveAuthSession(refreshedSession, { persist })
    return refreshedSession.accessToken
  }

  const requestBody = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: authConfig.clientId,
    refresh_token: currentSession.refreshToken,
  })
  const tokenUrl = await resolveTokenUrl()

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: requestBody.toString(),
  })

  if (!response.ok) {
    const parsedError = await parseErrorResponse(response)
    console.error('[Auth] Refresh token exchange failed', {
      status: response.status,
      statusText: response.statusText,
      url: tokenUrl,
      requestBody: Object.fromEntries(requestBody.entries()),
      response: parsedError.details,
    })
    throw new Error(
      parsedError.details
        ? `${parsedError.message} | ${JSON.stringify(parsedError.details)}`
        : parsedError.message,
    )
  }

  const refreshedResponse = await response.json()
  const refreshedSession = normalizeTokenResponse({
    ...refreshedResponse,
    refresh_token: refreshedResponse.refresh_token ?? currentSession.refreshToken,
  })

  saveAuthSession(refreshedSession, {
    persist: Boolean(window.localStorage.getItem(authStorageKeys.local)),
  })

  return refreshedSession.accessToken
}

export function logout() {
  clearAuthSession()
  window.sessionStorage.removeItem(authStorageKeys.oidcRawSession)
  window.sessionStorage.removeItem(authStorageKeys.oidcProfile)
}

export function getAuthorizationHeader() {
  const session = getAuthSession()

  if (!session?.accessToken) {
    return authConfig.useStaticAuth ? getStaticAuthorizationHeader() : {}
  }

  return {
    Authorization: `Bearer ${session.accessToken}`,
  }
}
