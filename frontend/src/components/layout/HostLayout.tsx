import { Outlet } from 'react-router-dom'

/**
 * Wraps all host (quiz creator) routes so the content fills the viewport
 * below the navbar with no page scrolling. Each host page should use
 * flex-1 min-h-0 and control overflow internally.
 */
export function HostLayout() {
  return (
    <div className="h-[calc(100vh-4rem)] min-h-0 flex flex-col overflow-hidden">
      <Outlet />
    </div>
  )
}
