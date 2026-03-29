import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PortalSidebar } from '../../components/portal/PortalSidebar'
import { PortalTopNav } from '../../components/portal/PortalTopNav'
export function PortalLayout({ onLogout }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <main className="portal-shell">
      <PortalSidebar isCollapsed={isSidebarCollapsed} />

      <div className="portal-shell__content">
        <PortalTopNav
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
          onLogout={onLogout}
        />

        <div className="portal-shell__body">
          <Outlet />
        </div>
      </div>
    </main>
  )
}
