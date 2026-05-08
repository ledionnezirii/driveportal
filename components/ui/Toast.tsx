'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  ok: boolean
  onDone: () => void
}

export function Toast({ message, ok, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border mb-6 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'} ${ok ? 'bg-green-950 border-green-800 text-green-300' : 'bg-red-950 border-red-800 text-red-300'}`}
    >
      <span className="text-base">{ok ? '✓' : '✕'}</span>
      {message}
    </div>
  )
}
