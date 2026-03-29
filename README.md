# IDBI Bank Portal

## Overview

This project is a React + Vite internal portal for IDBI Bank workflows.

It currently includes:

- OIDC-based login and logout
- Protected portal routes
- Dashboard bootstrap that fetches merchant/user details after login
- Language update flow
- QR details flow with static QR image rendering and download
- Reports flow backed by a live reports API

The main libraries are:

- `react`
- `react-router-dom`
- `oidc-react`
- `crypto-js`

## Project Structure

- `src/main.jsx`
  Bootstraps the app, configures `AuthProvider`, stores the static pass key, and redirects after sign-in/sign-out.
- `src/App.jsx`
  Defines routes and protects portal pages.
- `src/config`
  Holds auth, OIDC, and API configuration.
- `src/services`
  Contains auth/session helpers, encrypted API handling, and OIDC discovery utilities.
- `src/pages`
  Contains login, callback, and portal feature pages.
- `src/components`
  Contains shared UI, sidebar, top nav, loader, snackbar, and cards.

## Login Flow

1. The app starts in `src/main.jsx`.
2. `AuthProvider` from `oidc-react` wraps the application.
3. `LoginPage` triggers `auth.signIn()` automatically.
4. After successful OIDC login, `onSignIn` stores the normalized session and redirects to `/dashboard`.
5. Protected routes are then available through `App.jsx`.

Important notes:

- Route access depends on `auth.userData?.access_token`.
- The app also mirrors token data into its own storage for API access.
- Logout clears stored session data and then redirects through OIDC logout.

## Storage Model

The app uses browser storage for feature-to-feature data sharing.

Key stored items include:

- OIDC raw session
- OIDC profile
- normalized auth session
- fetched user details
- current language response
- language list response
- language update response
- static QR response

The most important shared record is:

- `idbi-user-details-response`

This is used by:

- Dashboard
- Language Update
- QR Details
- Reports
- Profile details modal

## API Layer

Most protected backend calls use `src/services/apiClient.js`.

That wrapper is responsible for:

- adding `Authorization` headers
- adding the configured pass-key header
- encrypting non-GET request bodies as `RequestData`
- decrypting API responses that return `ResponseData`
- retrying once on `401` using refresh-token logic

### Encryption

`src/services/payloadCrypto.js` handles AES-CBC encryption/decryption using `VITE_PAYLOAD_ENCRYPTION_KEY`.

Behavior:

- non-GET requests through `apiRequest()` are encrypted
- GET requests are sent normally
- encrypted responses are decoded automatically when the API returns `ResponseData`

### Exception: reports API

The reports API is intentionally called with plain `fetch()` and does **not** use:

- auth headers
- encrypted payloads
- encrypted response decoding

This matches the current backend requirement for reports.

## Current Features

### Dashboard

File:

- `src/pages/portal/DashboardPage.jsx`

Behavior:

- after login, checks `idbi-user-details-fetch-pending`
- reads `user_name` from stored OIDC profile
- calls `fetchUserDetailsEndpoint`
- stores the response in session storage

The visible dashboard cards are still static UI, but the fetched user data is important for other pages.

### Language Update

File:

- `src/pages/portal/LanguageUpdatePage.jsx`

Behavior:

1. Reads stored user details from session storage
2. Prefills:
   - `vpa_id`
   - `serial_number`
3. Calls the current-language API first
4. On success of the first API, calls the language-list API
5. Uses a single shared loader for both initialization calls
6. Lets the user submit language updates through `updateLanguageEndpoint`
7. Shows a success modal after update

Important notes:

- VPA ID and serial number are read-only
- the two initial APIs are sequential, not parallel
- the page uses one loader for initial fetch and another state for submit

### QR Details

File:

- `src/pages/portal/QrDetailsPage.jsx`

Behavior:

#### Static QR

1. Reads `qr_string` from stored user details
2. Calls `staticQrEndpoint`
3. Reads `base64Image` from the API response
4. Converts the base64 string to a PNG data URL
5. Renders the actual QR image
6. Allows download as `idbi-static-qr.png`

If the API fails or the image is missing, the page shows:

- `Unable to fetch QR`

#### Dynamic QR

This is still local UI behavior only.

It:

- accepts an amount
- validates input
- shows a generated preview
- runs a 60-second countdown

No backend API is used yet for dynamic QR generation.

### Reports

File:

- `src/pages/portal/ReportsPage.jsx`

Behavior:

- uses a live reports API endpoint
- reads `vpa_id` from `idbi-user-details-response -> data[0].vpa_id`
- sends `mode: "both"` in every request
- renders every object in the returned `data` array as a table row

#### Today

- selecting `Today` immediately triggers the report API
- `startDate` and `endDate` are both set to today

#### Custom Range

- uses the selected start and end dates from the date pickers
- sends those values on submit

#### Monthly

- dropdown contains month names from January to December
- months later than the current month are disabled
- on submit:
  - `startDate` is the first date of the selected month
  - `endDate` is the last date of the selected month
  - both use the current year

#### Download All

- exports all fetched rows, not just the current page
- downloads an Excel-compatible file: `idbi-reports.xls`

If the reports API fails, the snackbar prefers:

1. `statusDescription`
2. `message`
3. fallback custom text

## Auth and Config Files

### `src/config/oidcConfig.js`

Controls the browser OIDC client used by `oidc-react`.

### `src/config/authConfig.js`

Contains the app's custom auth/session config and storage keys.

This file also still includes support for alternate auth modes like:

- static auth
- mock auth
- token refresh

### `src/config/apiConfig.js`

Contains endpoint definitions and API-related settings, including:

- fetch user details
- current language
- fetch language list
- update language
- static QR
- reports API
- pass-key config

## Notes For Maintenance

Keep this mental model while working in the project:

1. `main.jsx`
   App bootstrap and OIDC callbacks
2. `App.jsx`
   Route gating and protected pages
3. `authService.js` / `authStorage.js`
   Session normalization and API token access
4. `apiClient.js`
   Shared encrypted API behavior
5. Feature pages
   Dashboard, Language Update, QR Details, Reports

## Current Status Summary

- Login: functional through OIDC
- Dashboard: bootstrap API call plus static cards
- Language Update: functional and API-backed
- QR Details: static QR API-backed, dynamic QR still simulated locally
- Reports: API-backed, searchable, paginated, exportable

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Note:

- this project uses Vite 8
- the environment should use a Node version supported by that Vite version
