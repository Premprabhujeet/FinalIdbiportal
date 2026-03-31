import { useEffect, useState } from 'react'
import { authStorageKeys } from '../../config/authConfig'
import { apiConfig } from '../../config/apiConfig'
import { StatCard } from '../../components/portal/StatCard'
import { LoaderOverlay } from '../../components/ui/LoaderOverlay'
import { apiRequest } from '../../services/apiClient'
import '../../components/portal/styles/DashboardPage.css'

function IndentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12M6 12h9M6 16h12" />
      <path d="m14 6 4 3-4 3" />
    </svg>
  )
}

function MappedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 5 8v8l7 4 7-4V8Z" />
      <path d="m12 4 7 4-7 4-7-4 7-4ZM12 12v8" />
    </svg>
  )
}

function TransitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h10v6H7Z" />
      <path d="M10 17H6a2 2 0 0 1 0-4h1" />
      <path d="M14 17h4a2 2 0 1 0 0-4h-1" />
    </svg>
  )
}

function DeliveredIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h10v7H4Z" />
      <path d="M14 10h3l3 3v2h-6Z" />
      <path d="m8 12 2 2 4-4" />
    </svg>
  )
}

const stats = [
  // These summary cards are still static placeholders; the real fetched value is the cached userDetails payload.
  { label: 'Total Indents', value: '622', icon: <IndentIcon /> },
  { label: 'Total Mapped Devices', value: '21', icon: <MappedIcon /> },
  { label: 'Total In-transit Devices', value: '0', icon: <TransitIcon /> },
  { label: 'Total Delivered Devices', value: '2', icon: <DeliveredIcon /> },
]

export function DashboardPage() {
  const [isFetchingUserDetails, setIsFetchingUserDetails] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchUserDetails = async () => {
      // This one-time bootstrap is triggered immediately after OIDC sign-in.
      const shouldFetchAfterRedirect =
        window.sessionStorage.getItem(authStorageKeys.userDetailsFetchPending) === 'true'

      if (!shouldFetchAfterRedirect) {
        return
      }

      const storedProfile = window.sessionStorage.getItem(authStorageKeys.oidcProfile)
      const profileData = storedProfile ? JSON.parse(storedProfile) : null
      // The backend expects the OIDC user_name claim as the mobile number input.
      const mobileNumber = profileData?.user_name ?? ''

      if (!mobileNumber) {
        window.sessionStorage.removeItem(authStorageKeys.userDetailsFetchPending)
        return
      }

      try {
        if (isMounted) {
          setIsFetchingUserDetails(true)
        }

        const response = await apiRequest(apiConfig.fetchUserDetailsEndpoint, {
          method: 'POST',
          body: JSON.stringify({
            mobile_number: mobileNumber,
          }),
        })

        if (!isMounted) {
          return
        }

        console.log('[Dashboard] fetchById response', response)
        // Other portal pages reuse this cached response instead of refetching immediately on mount.
        window.sessionStorage.setItem(authStorageKeys.userDetails, JSON.stringify(response))
        window.sessionStorage.removeItem(authStorageKeys.userDetailsFetchPending)
      } catch (error) {
        console.error('[Dashboard] Failed to fetch user details', error)
        window.sessionStorage.removeItem(authStorageKeys.userDetailsFetchPending)
      } finally {
        if (isMounted) {
          setIsFetchingUserDetails(false)
        }
      }
    }

    fetchUserDetails()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="portal-section">
      <LoaderOverlay open={isFetchingUserDetails} text="IDBI Bank Loading........" />

      <h1 className="portal-section__title">Dashboard</h1>

      <div className="stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </section>
  )
}
