export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  fetchUserDetailsEndpoint:
    import.meta.env.VITE_FETCH_USER_DETAILS_ENDPOINT ?? '/idbi/fetch/fetchById',
  reportsQuerySubmitUserEndpoint:
    import.meta.env.VITE_REPORTS_QUERY_SUBMIT_USER_ENDPOINT ??
    'https://api-dev-stage.iserveu.online/idbi/sb/reports/querysubmit_user',
  currentLanguageEndpoint:
    import.meta.env.VITE_CURRENT_LANGUAGE_ENDPOINT ?? '/idbi/isu_soundbox/user_api/current_language',
  fetchLanguageEndpoint:
    import.meta.env.VITE_FETCH_LANGUAGE_ENDPOINT ?? '/idbi/isu_soundbox/lang/fetch_language',
  updateLanguageEndpoint:
    import.meta.env.VITE_UPDATE_LANGUAGE_ENDPOINT ?? '/idbi/isu_soundbox/lang/update_language',
  staticQrEndpoint:
    import.meta.env.VITE_STATIC_QR_ENDPOINT ?? '/idbi/merchant/qr_convert_to_base64',
  userDetailsSerialNumber:
    import.meta.env.VITE_USER_DETAILS_SERIAL_NUMBER ?? '38241108350403',
  staticAuthorizationToken: import.meta.env.VITE_STATIC_AUTH_TOKEN ?? '',
  authorizationScheme: import.meta.env.VITE_STATIC_AUTH_SCHEME ?? 'Bearer',
  staticPassKey: import.meta.env.VITE_STATIC_PASS_KEY ?? '',
  passKeyHeader: import.meta.env.VITE_PASS_KEY_HEADER ?? 'pass_key',
  passKeyStorageKey: 'idbi-pass-key',
}

export function getStaticAuthorizationHeader() {
  if (!apiConfig.staticAuthorizationToken) {
    return {}
  }

  const headerValue = apiConfig.authorizationScheme
    ? `${apiConfig.authorizationScheme} ${apiConfig.staticAuthorizationToken}`
    : apiConfig.staticAuthorizationToken

  return {
    Authorization: headerValue,
  }
}

export function getStaticPassKeyHeader() {
  const storedPassKey =
    window.sessionStorage.getItem(apiConfig.passKeyStorageKey) ?? apiConfig.staticPassKey

  if (!storedPassKey || !apiConfig.passKeyHeader) {
    return {}
  }

  return {
    [apiConfig.passKeyHeader]: storedPassKey,
  }
}

export function storePassKey(passKey) {
  if (!passKey) {
    window.sessionStorage.removeItem(apiConfig.passKeyStorageKey)
    return
  }

  window.sessionStorage.setItem(apiConfig.passKeyStorageKey, passKey)
}
