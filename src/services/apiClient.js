import { getAuthorizationHeader, refreshAccessToken } from './authService'
import { apiConfig, getStaticPassKeyHeader } from '../config/apiConfig'
import { decodeApiResponse, encryptRequestData } from './payloadCrypto'

async function parseJsonSafely(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

function shouldEncryptBody(options = {}) {
  const method = (options.method ?? 'GET').toUpperCase()
  return method !== 'GET' && method !== 'HEAD' && options.body != null
}

async function buildRequestOptions(options = {}) {
  const headers = new Headers(options.headers ?? {})
  const authHeader = getAuthorizationHeader()
  const passKeyHeader = getStaticPassKeyHeader()
  const body = shouldEncryptBody(options)
    ? JSON.stringify({
        RequestData: encryptRequestData(options.body),
      })
    : options.body

  Object.entries(authHeader).forEach(([key, value]) => {
    headers.set(key, value)
  })

  Object.entries(passKeyHeader).forEach(([key, value]) => {
    headers.set(key, value)
  })

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  if (!headers.has('Content-Type') && shouldEncryptBody(options)) {
    headers.set('Content-Type', 'application/json')
  }

  return {
    ...options,
    body,
    headers,
  }
}

export async function apiRequest(url, options = {}) {
  let requestOptions = await buildRequestOptions(options)
  const requestUrl =
    apiConfig.baseUrl && !/^https?:\/\//.test(url) ? `${apiConfig.baseUrl}${url}` : url
  let response = await fetch(requestUrl, requestOptions)

  if (response.status === 401) {
    try {
      const freshAccessToken = await refreshAccessToken()
      requestOptions = await buildRequestOptions({
        ...options,
        headers: {
          ...(options.headers ?? {}),
          Authorization: `Bearer ${freshAccessToken}`,
        },
      })
      response = await fetch(requestUrl, requestOptions)
    } catch {
      // If refresh fails we return the original 401 response flow to the caller.
    }
  }

  const rawData = await parseJsonSafely(response)
  const data = decodeApiResponse(rawData)

  if (!response.ok) {
    throw new Error(data?.message || `API request failed with status ${response.status}`)
  }

  return data
}
