import { Spinner } from './Spinner'

type Variant = 'primary' | 'success' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white',
  success: 'bg-green-700 hover:bg-green-600 text-white',
  danger:  'bg-red-700 hover:bg-red-600 text-white',
  ghost:   'text-gray-400 hover:text-white hover:bg-gray-800',
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
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {loading && <Spinner size={4} />}
      {children}
    </button>
  )
}
