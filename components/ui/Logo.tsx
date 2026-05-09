export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="16" cy="16" r="16" fill="#2563EB" />

      {/* Folder body */}
      <rect x="6" y="12" width="20" height="13" rx="2" fill="white" fillOpacity="0.95" />

      {/* Folder tab */}
      <path d="M6 12 L6 11 Q6 10 7 10 L13 10 L15 12 Z" fill="white" fillOpacity="0.7" />

      {/* Lock icon */}
      <rect x="13.5" y="16.5" width="5" height="4" rx="1" fill="#2563EB" />
      <path d="M14.5 16.5 V15.5 Q14.5 13.5 16 13.5 Q17.5 13.5 17.5 15.5 V16.5" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="18.5" r="0.7" fill="white" />
    </svg>
  )
}
