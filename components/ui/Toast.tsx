'use client'

import { useEffect, useRef, useState } from 'react'

interface ToastProps {
  message: string
  ok: boolean
  onDone: () => void
}

export function Toast({ message, ok, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDoneRef.current(), 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border shadow-xl backdrop-blur-md transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${
        ok
          ? 'bg-green-950/80 border-green-700/50 text-green-300'
          : 'bg-red-950/80 border-red-700/50 text-red-300'
      }`}
    >
      <span className="text-base">{ok ? '✓' : '✕'}</span>
      {message}
    </div>
  )
}
