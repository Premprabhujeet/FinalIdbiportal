import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { authStorageKeys } from '../../config/authConfig'
import { apiConfig } from '../../config/apiConfig'
import { LoaderOverlay } from '../../components/ui/LoaderOverlay'
import { Snackbar } from '../../components/ui/Snackbar'
import { apiRequest } from '../../services/apiClient'
import '../../components/portal/styles/LanguageUpdatePage.css'

// Initial form state
const initialValues = {
  vpaId: '',
  deviceSerialNumber: '',
  currentLanguage: '',
  languageUpdate: '',
}

export function LanguageUpdatePage() {
  // Form state
  const [formValues, setFormValues] = useState(initialValues)

  // Track touched fields for validation UI
  const [touched, setTouched] = useState({})

  // Success modal visibility
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isInitializingPage, setIsInitializingPage] = useState(false)
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false)
  const [languageOptions, setLanguageOptions] = useState([])

  // Success message from API
  const [successMessage, setSuccessMessage] = useState('Language update request initiated successfully')

  // Snackbar (error/success toast)
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    autoClose: true,
    colorType: 'danger',
  })

  // Refs to avoid unnecessary API calls
  const fetchedCurrentLanguageForTidRef = useRef('')
  const hasFetchedLanguageOptionsRef = useRef(false)

  // -----------------------------
  // Fetch user details from sessionStorage
  // -----------------------------
  useEffect(() => {
    const storedUserDetails = window.sessionStorage.getItem(authStorageKeys.userDetails)
    if (!storedUserDetails) {
      return
    }

    try {
      const parsedUserDetails = JSON.parse(storedUserDetails)

      // Handle different response formats
      const firstUserDetails = Array.isArray(parsedUserDetails)
        ? parsedUserDetails[0] ?? null
        : parsedUserDetails?.data && Array.isArray(parsedUserDetails.data)
          ? parsedUserDetails.data[0] ?? null
          : parsedUserDetails

      if (!firstUserDetails) {
        return
      }

      // Populate read-only fields
      setFormValues((current) => ({
        ...current,
        vpaId: firstUserDetails.vpa_id ?? current.vpaId,
        deviceSerialNumber: firstUserDetails.serial_number ?? current.deviceSerialNumber,
      }))
    } catch (error) {
      console.error('[Language Update] Failed to parse stored user details', error)
    }
  }, [])

  // -----------------------------
  // Initialize page (Fetch current language + language options)
  // -----------------------------
  useEffect(() => {
    let isMounted = true

    const initializeLanguagePage = async () => {
      // Do nothing if device serial is missing
      if (!formValues.deviceSerialNumber) {
        return
      }

      // Prevent duplicate API calls
      if (
        fetchedCurrentLanguageForTidRef.current === formValues.deviceSerialNumber &&
        hasFetchedLanguageOptionsRef.current
      ) {
        return
      }

      if (isMounted) {
        setIsInitializingPage(true)
      }

      let failedStep = 'current-language'

      try {
        // -----------------------------
        // Fetch Current Language
        // -----------------------------
        if (fetchedCurrentLanguageForTidRef.current !== formValues.deviceSerialNumber) {
          fetchedCurrentLanguageForTidRef.current = formValues.deviceSerialNumber

          const currentLanguageResponse = await apiRequest(
            `${apiConfig.currentLanguageEndpoint}/${formValues.deviceSerialNumber}`,
            {
              method: 'GET',
            },
          )

          if (!isMounted) {
            return
          }

          console.log('[Language Update] current language response', currentLanguageResponse)

          // Store response in session
          window.sessionStorage.setItem(
            authStorageKeys.currentLanguage,
            JSON.stringify(currentLanguageResponse),
          )

          // Extract language safely from different response structures
          const currentLanguageValue =
            typeof currentLanguageResponse === 'string'
              ? currentLanguageResponse
              : currentLanguageResponse?.data?.current_language ??
                currentLanguageResponse?.data?.language ??
                currentLanguageResponse?.current_language ??
                currentLanguageResponse?.language ??
                currentLanguageResponse?.data ??
                ''

          // Update form state
          setFormValues((current) => ({
            ...current,
            currentLanguage:
              typeof currentLanguageValue === 'string'
                ? currentLanguageValue
                : String(currentLanguageValue ?? ''),
          }))
        }

        // -----------------------------
        // Fetch Language Options (Dropdown)
        // -----------------------------
        if (!hasFetchedLanguageOptionsRef.current) {
          failedStep = 'language-options'
          hasFetchedLanguageOptionsRef.current = true

          const languageOptionsResponse = await apiRequest(apiConfig.fetchLanguageEndpoint, {
            method: 'GET',
          })

          if (!isMounted) {
            return
          }

          console.log('[Language Update] fetch language response', languageOptionsResponse)

          // Store response
          window.sessionStorage.setItem(
            authStorageKeys.languageOptions,
            JSON.stringify(languageOptionsResponse),
          )

          // Normalize response into string array
          const rawLanguageList = Array.isArray(languageOptionsResponse?.data)
            ? languageOptionsResponse.data
            : Array.isArray(languageOptionsResponse)
              ? languageOptionsResponse
              : []

          const languageList = rawLanguageList
            .map((item) =>
              typeof item === 'string'
                ? item
                : item?.language_name ?? item?.language ?? item?.name ?? '',
            )
            .filter(Boolean)

          setLanguageOptions(languageList)
        }
      } catch (error) {
        // Reset refs on failure
        if (fetchedCurrentLanguageForTidRef.current === formValues.deviceSerialNumber) {
          fetchedCurrentLanguageForTidRef.current = ''
        }

        hasFetchedLanguageOptionsRef.current = false

        console.error('[Language Update] Failed during initialization', error)

        if (isMounted) {
          setSnackbarState({
            open: true,
            message:
              failedStep === 'language-options'
                ? 'Unable to fetch language list'
                : 'Unable to fetch current launguage',
            autoClose: true,
            colorType: 'danger',
          })
        }
      } finally {
        if (isMounted) {
          setIsInitializingPage(false)
        }
      }
    }

    initializeLanguagePage()

    return () => {
      isMounted = false
    }
  }, [formValues.deviceSerialNumber])

  // -----------------------------
  // Validation Logic
  // -----------------------------
  const errors = useMemo(
    () => ({
      vpaId: formValues.vpaId.trim() ? '' : 'VPA ID is required.',
      deviceSerialNumber: formValues.deviceSerialNumber.trim()
        ? ''
        : 'Device serial number is required.',
      currentLanguage: formValues.currentLanguage ? '' : 'Current language is required.',
      languageUpdate: formValues.languageUpdate ? '' : 'Language update is required.',
    }),
    [formValues],
  )

  // Form validity check
  const isFormValid = Object.values(errors).every((value) => !value)

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleChange = (field) => (event) => {
    const value = event.target.value
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  const handleBlur = (field) => () => {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  const resetEditableFields = () => {
    setFormValues((current) => ({
      ...current,
      languageUpdate: '',
    }))
    setTouched({})
  }

  // Reset only the editable selection, while keeping fetched merchant details on screen.
  const handleCancel = () => {
    resetEditableFields()
  }

  // Close success modal
  const handleCloseModal = () => {
    resetEditableFields()
    setIsSuccessModalOpen(false)
  }

  // -----------------------------
  // Submit Handler (POST API)
  // -----------------------------
  const handleSubmit = async (event) => {
    event.preventDefault()

    // Show all validation errors if invalid
    if (!isFormValid) {
      setTouched({
        vpaId: true,
        deviceSerialNumber: true,
        currentLanguage: true,
        languageUpdate: true,
      })
      return
    }

    try {
      setIsUpdatingLanguage(true)

      // API expects only tid + update_language
      const response = await apiRequest(apiConfig.updateLanguageEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          tid: formValues.deviceSerialNumber,
          update_language: formValues.languageUpdate,
        }),
      })

      console.log('[Language Update] update response', response)

      // Store response
      window.sessionStorage.setItem(authStorageKeys.languageUpdateResponse, JSON.stringify(response))

      // Show success
      setSuccessMessage(response?.statusDesc || response?.message || 'Language updated successfully')
      setIsSuccessModalOpen(true)
    } catch (error) {
      console.error('[Language Update] Failed to update language', error)

      setSnackbarState({
        open: true,
        message: 'unable to update language',
        autoClose: true,
        colorType: 'danger',
      })
    } finally {
      setIsUpdatingLanguage(false)
    }
  }

  // -----------------------------
  // UI Rendering
  // -----------------------------
  return (
    <section className="portal-section language-update-page">
      {/* Loader overlay for API calls */}
      <LoaderOverlay
        open={isInitializingPage || isUpdatingLanguage}
        text="IDBI Bank Loading........"
      />

      {/* Snackbar for errors */}
      <Snackbar
        open={snackbarState.open}
        message={snackbarState.message}
        autoClose={snackbarState.autoClose}
        colorType={snackbarState.colorType}
        onClose={() =>
          setSnackbarState((current) => ({
            ...current,
            open: false,
          }))
        }
      />

      <h1 className="portal-section__title">Language Update</h1>

      {/* Form */}
      <form className="language-update-card" onSubmit={handleSubmit}>
        <div className="language-update-grid">

          {/* VPA ID (read-only) */}
          <label className="language-update-field">
            <span>VPA ID</span>
            <input
              type="text"
              value={formValues.vpaId}
              onChange={handleChange('vpaId')}
              onBlur={handleBlur('vpaId')}
              placeholder="Enter VPA ID"
              readOnly
            />
            {touched.vpaId && errors.vpaId ? (
              <small className="language-update-field__error">{errors.vpaId}</small>
            ) : null}
          </label>

          {/* Device Serial Number (read-only) */}
          <label className="language-update-field">
            <span>Device Serial Number</span>
            <input
              type="text"
              value={formValues.deviceSerialNumber}
              onChange={handleChange('deviceSerialNumber')}
              onBlur={handleBlur('deviceSerialNumber')}
              placeholder="Enter device serial number"
              readOnly
            />
            {touched.deviceSerialNumber && errors.deviceSerialNumber ? (
              <small className="language-update-field__error">
                {errors.deviceSerialNumber}
              </small>
            ) : null}
          </label>

          {/* Current Language */}
          <label className="language-update-field">
            <span>Current Language</span>
            <input
              type="text"
              value={formValues.currentLanguage}
              onBlur={handleBlur('currentLanguage')}
              placeholder="Current language"
              readOnly
            />
            {touched.currentLanguage && errors.currentLanguage ? (
              <small className="language-update-field__error">{errors.currentLanguage}</small>
            ) : null}
          </label>

          {/* Language Dropdown */}
          <label className="language-update-field">
            <span>Language Update</span>
            <select
              value={formValues.languageUpdate}
              onChange={handleChange('languageUpdate')}
              onBlur={handleBlur('languageUpdate')}
            >
              <option value="">Select Language Update</option>
              {languageOptions.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            {touched.languageUpdate && errors.languageUpdate ? (
              <small className="language-update-field__error">{errors.languageUpdate}</small>
            ) : null}
          </label>
        </div>

        {/* Actions */}
        <div className="language-update-actions">
          <button
            className="ui-button ui-button--secondary"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <Button type="submit" disabled={!isFormValid}>
            Update
          </Button>
        </div>
      </form>

      {isSuccessModalOpen ? (
        <div className="language-update-modal-overlay" role="presentation">
          <div
            className="language-update-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-update-success-title"
          >
            <div className="language-update-modal__body">
              <h2 id="language-update-success-title" className="language-update-modal__title">
                {successMessage}
              </h2>

              <div className="language-update-modal__icon" aria-hidden="true">
                <span className="language-update-modal__check">&#10003;</span>
              </div>
            </div>

            <div className="language-update-modal__footer">
              <Button
                className="language-update-modal__button"
                type="button"
                onClick={handleCloseModal}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
