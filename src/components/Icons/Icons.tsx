export function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 1v6m0 6v10M23 12h-6m-6 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="19" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="14" width="4" height="2" rx="0.5" fill="currentColor" />
      <rect x="12" y="14" width="6" height="2" rx="0.5" fill="currentColor" />
    </svg>
  )
}

export function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.9 0 1.65-.73 1.65-1.63 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.9.73-1.63 1.63-1.63h1.96c3.03 0 5.48-2.45 5.48-5.48C22 6.48 17.52 2 12 2z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="7" cy="10" r="1.5" fill="currentColor" />
      <circle cx="11" cy="7" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <circle cx="17" cy="14" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
      <path d="M12 17.5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="13.5" cy="10.5" r="1.5" fill="currentColor" />
      <circle cx="23" cy="6" r="1.5" fill="currentColor" />
    </svg>
  )
}
