import { NavLink } from 'react-router-dom'

const IDBI_LOGO_URL = 'https://www.idbi.bank.in/assets/images/IDBI_Logo.jpg'

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9h-9Z" />
      <path d="M13 3a9 9 0 0 1 8 8h-8Z" />
      <path d="M12 12l4-4" />
    </svg>
  )
}

function LanguageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h12" />
      <path d="M12 5v14" />
      <path d="M8 10h8" />
      <path d="M7 19l5-9 5 9" />
    </svg>
  )
}

function ReportsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h9l3 3v13H6Z" />
      <path d="M9 12h6M9 16h4M15 4v4h4" />
    </svg>
  )
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h6v6H4Z" />
      <path d="M14 4h6v6h-6Z" />
      <path d="M4 14h6v6H4Z" />
      <path d="M14 14h2M18 14h2M14 18h6M17 14v6" />
    </svg>
  )
}

function HelpSupportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.2a2.7 2.7 0 1 1 4.5 2c-.8.7-1.6 1.2-1.6 2.3" />
      <path d="M12 17h.01" />
    </svg>
  )
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/reports', label: 'Transaction Reports', icon: ReportsIcon },
  { to: '/qr-details', label: 'QR Details', icon: QrIcon },
  { to: '/language-update', label: 'Language Update', icon: LanguageIcon },
  { to: '/help-support', label: 'Help & Support', icon: HelpSupportIcon },
]

export function PortalSidebar({ isCollapsed }) {
  return (
    <aside className={`portal-sidebar${isCollapsed ? ' is-collapsed' : ''}`}>
      <div className="portal-sidebar__brand">
        <img src={IDBI_LOGO_URL} alt="IDBI Bank" />
      </div>

      <nav className="portal-nav" aria-label="Portal navigation">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `portal-nav__item${isActive ? ' is-active' : ''}`
              }
            >
              <span className="portal-nav__main">
                <span className="portal-nav__icon">
                  <Icon />
                </span>
                <span className="portal-nav__label">{item.label}</span>
              </span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
