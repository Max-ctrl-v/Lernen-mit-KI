export default function SkeletonCard() {
  return (
    <div className="surface-elevated p-6 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="h-10 bg-gray-200 rounded-xl w-64 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="surface-elevated p-6 animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded-lg w-1/3" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-4/5" />
      </div>
    </div>
  );
}
