import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#2563EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Folder body */}
        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
          <rect x="0" y="3" width="20" height="13" rx="2" fill="white" />
          <path d="M0 3 L0 2 Q0 1 1 1 L7 1 L9 3 Z" fill="rgba(255,255,255,0.7)" />
          <rect x="7.5" y="7.5" width="5" height="4" rx="1" fill="#2563EB" />
          <path d="M8.5 7.5 V6.5 Q8.5 4.5 10 4.5 Q11.5 4.5 11.5 6.5 V7.5" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <circle cx="10" cy="9.5" r="0.7" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
