type NavIconName = 'user' | 'calendar' | 'settings'

export function NavIcon({ name }: { name: NavIconName }) {
  if (name === 'user') {
    return (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.75 20c.45-4.05 2.55-6.1 6.25-6.1s5.8 2.05 6.25 6.1" />
      </svg>
    )
  }

  if (name === 'calendar') {
    return (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5.25" width="17" height="15.25" rx="2.25" />
        <path d="M7.5 3.5v3.25M16.5 3.5v3.25M3.5 9.25h17" />
        <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" strokeWidth="2.25" />
      </svg>
    )
  }

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.25" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 2v2.75M12 19.25V22M2 12h2.75M19.25 12H22M4.93 4.93l1.95 1.95M17.12 17.12l1.95 1.95M19.07 4.93l-1.95 1.95M6.88 17.12l-1.95 1.95" />
    </svg>
  )
}
