import { authConfig } from '../config/authConfig'

let oidcConfigPromise = null

async function parseDiscoveryError(response) {
  try {
    const data = await response.json()
    return data.error_description || data.message || data.error || 'Unable to load OIDC configuration'
  } catch {
    return `Unable to load OIDC configuration (${response.status})`
  }
}

export async function getOidcConfiguration() {
  if (!authConfig.discoveryUrl) {
    return null
  }

  if (!oidcConfigPromise) {
    oidcConfigPromise = fetch(authConfig.discoveryUrl, {
      headers: {
        Accept: 'application/jwk-set+json, application/json',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await parseDiscoveryError(response))
        }

        return response.json()
      })
      .catch((error) => {
        oidcConfigPromise = null
        throw error
      })
  }

  return oidcConfigPromise
}

export async function getOidcEndpoint(endpointKey, fallback = '') {
  const oidcConfig = await getOidcConfiguration()
  return oidcConfig?.[endpointKey] || fallback
}
