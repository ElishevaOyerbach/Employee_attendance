import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'
import { TopBar } from './TopBar'
import './app-shell.css'

/**
 * Authenticated layout frame: right-aligned sidebar + sticky top bar wrapping
 * the routed content. Rendered as the element of the protected route branch,
 * so every feature page mounts into this shell.
 */
export function AppShell() {
  return (
    <div className="shell">
      <SideNav />
      <TopBar />
      <main className="content">
        <div className="content__inner">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
