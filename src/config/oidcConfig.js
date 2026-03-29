import { WebStorageStateStore } from 'oidc-react'

export const oidcConfig = {
  authority: 'https://idbi-auth-stage.isupay.in/application/o/idbi/',
  clientId: 'h0xLFWq1FS6uHKVwk',
  redirectUri: `${window.location.origin}/redirected`,
  postLogoutRedirectUri: `${window.location.origin}/sso/logout`,
  responseType: 'code',
  scope:
    'openid profile email offline_access authorities privileges user_name created adminName bankCode goauthentik.io/api',
  automaticSilentRenew: true,
  loadUserInfo: true,
  monitorSession: true,
  filterProtocolClaims: true,
  userStore: new WebStorageStateStore({
    store: window.sessionStorage,
    sync: true,
  }),
}
