export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Lightning bolt representing "Snap" */}
        <path d="M22 4L10 22H18L16 36L30 16H22L22 4Z" fill="currentColor" className="text-primary" />
        {/* Circular background */}
        <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2" className="text-primary/20" />
      </svg>
      <span className="text-2xl font-bold tracking-tight">
        <span className="text-dark dark:text-dark">SaaS in a </span><span className="text-primary">Snap</span>
      </span>
    </div>
  )
}
