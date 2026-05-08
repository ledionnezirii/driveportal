export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-700 rounded" />
        <div className="space-y-1.5">
          <div className="h-3 w-36 bg-gray-700 rounded" />
          <div className="h-2 w-52 bg-gray-700 rounded" />
        </div>
      </div>
      <div className="h-3 w-10 bg-gray-700 rounded" />
    </div>
  )
}

export function SkeletonFile() {
  return (
    <div className="bg-gray-900 rounded-xl px-5 py-4 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-800 rounded" />
        <div className="h-3 w-48 bg-gray-800 rounded" />
      </div>
      <div className="h-8 w-24 bg-gray-800 rounded-lg" />
    </div>
  )
}
