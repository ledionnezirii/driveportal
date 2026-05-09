type Variant = 'primary' | 'success' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-sm shadow-blue-900/40',
  success: 'bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-sm shadow-green-900/40',
  danger:  'bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-sm shadow-red-900/40',
  ghost:   'text-gray-400 hover:text-white hover:bg-white/10',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'primary', loading, disabled, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
