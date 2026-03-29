import { useEffect, useRef, useState } from 'react'
import { authStorageKeys } from '../../config/authConfig'
import { apiConfig } from '../../config/apiConfig'
import { Button } from '../ui/Button'
import { LoaderOverlay } from '../ui/LoaderOverlay'
import { Snackbar } from '../ui/Snackbar'
import { apiRequest } from '../../services/apiClient'

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8.5" cy="15.5" r="3.5" />
      <path d="M11 13l8-8" />
      <path d="M16 5h3v3" />
      <path d="M14 7l3 3" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function PortalTopNav({ isSidebarCollapsed, onToggleSidebar, onLogout }) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isProfileDetailsOpen, setIsProfileDetailsOpen] = useState(false)
  const [isFetchingProfileDetails, setIsFetchingProfileDetails] = useState(false)
  const [profileDetails, setProfileDetails] = useState(null)
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    autoClose: true,
    colorType: 'danger',
  })
  const profileMenuRef = useRef(null)

  useEffect(() => {
    // Close the dropdown when the user clicks outside it or presses Escape.
    const handleClickOutside = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const formatLabel = (value) => {
    return value
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  const getDisplayEntries = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return []
    }

    // Only render primitive values so nested objects do not break the simple key/value modal.
    return Object.entries(value).filter(([, entryValue]) => {
      return typeof entryValue !== 'object' || entryValue === null
    })
  }

  // The user details API can return different shapes, so normalize it before rendering.
  const detailSource = Array.isArray(profileDetails)
    ? profileDetails[0] ?? null
    : profileDetails?.data && Array.isArray(profileDetails.data)
      ? profileDetails.data[0] ?? null
      : profileDetails?.data && typeof profileDetails.data === 'object'
        ? profileDetails.data
        : profileDetails
  const detailEntries = getDisplayEntries(detailSource)

  const handleViewDetails = async () => {
    const storedProfile = window.sessionStorage.getItem(authStorageKeys.oidcProfile)
    const profileData = storedProfile ? JSON.parse(storedProfile) : null
    const mobileNumber = profileData?.user_name ?? ''

    // Collapse the menu before opening the loading state or modal.
    setIsProfileMenuOpen(false)
    setIsFetchingProfileDetails(true)

    try {
      if (!mobileNumber) {
        throw new Error('Missing user_name in stored profile data.')
      }

      const response = await apiRequest(apiConfig.fetchUserDetailsEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          mobile_number: mobileNumber,
        }),
      })

      console.log('[Profile Details] fetchById response', response)
      setProfileDetails(response)
      setIsProfileDetailsOpen(true)
    } catch (error) {
      console.error('[Profile Details] Failed to fetch user details', error)
      setSnackbarState({
        open: true,
        message: 'Failed to fetch userdetails',
        autoClose: true,
        colorType: 'danger',
      })
    } finally {
      setIsFetchingProfileDetails(false)
    }
  }

  const handleLogout = () => {
    setIsProfileMenuOpen(false)
    onLogout?.()
  }

  return (
    <header className="portal-topnav">
      <LoaderOverlay open={isFetchingProfileDetails} text="IDBI Bank Loading........" />

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

      <button
        className="portal-icon-button"
        type="button"
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onToggleSidebar}
      >
        <MenuIcon />
      </button>

      <div className="portal-topnav__actions">
        <div className="portal-profile-menu" ref={profileMenuRef}>
          <button
            className={`portal-profile${isProfileMenuOpen ? ' is-open' : ''}`}
            type="button"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
          >
            <div className="portal-profile__avatar" aria-hidden="true">
              I
            </div>
            <span>IDBI INTERNAL</span>
            <span className="portal-profile__chevron" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </button>

          <div
            className={`portal-profile-dropdown${isProfileMenuOpen ? ' is-open' : ''}`}
            role="menu"
            aria-label="Profile actions"
          >
            <button
              className="portal-profile-dropdown__item"
              type="button"
              role="menuitem"
              onClick={handleViewDetails}
              disabled={isFetchingProfileDetails}
            >
              <span>{isFetchingProfileDetails ? 'Loading...' : 'View Details'}</span>
              <KeyIcon />
            </button>

            <button
              className="portal-profile-dropdown__item portal-profile-dropdown__color"
              type="button"
              role="menuitem"
              onClick={handleLogout}
            >
              <span>Logout</span>
              <LogoutIcon />
            </button>
          </div>
        </div>
      </div>

      {/* The modal stays in the top-nav component because the trigger and fetched state live here. */}
      {isProfileDetailsOpen ? (
        <div className="profile-details-modal-overlay" role="presentation">
          <div
            className="profile-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-details-title"
          >
            <div className="profile-details-modal__header">
              <h2 id="profile-details-title">View Profile Details</h2>
            </div>

            <div className="profile-details-modal__body">
              <section className="profile-details-section">
                <h3>Fetched User Details</h3>

                <div className="profile-details-grid">
                  {detailEntries.length ? (
                    detailEntries.map(([key, value]) => (
                      <div className="profile-details-grid__pair" key={key}>
                        <span key={`${key}-label`}>{formatLabel(key)}</span>
                        <strong key={`${key}-value`}>{String(value ?? '-')}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="profile-details-grid__pair">
                      <span>Message</span>
                      <strong>No user details available.</strong>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="profile-details-modal__footer">
              <Button
                className="profile-details-modal__button"
                type="button"
                onClick={() => setIsProfileDetailsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
