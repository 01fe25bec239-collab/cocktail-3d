export default function Loading() {
  return (
    <div className="w-screen h-[100dvh] text-white overflow-hidden flex flex-col md:flex-row relative font-sans bg-neutral-950">
      {/* Left Container: Details Skeleton */}
      <div className="w-full md:w-[40%] h-[45dvh] md:h-full overflow-y-auto p-6 md:p-12 z-20 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-800/50 bg-neutral-950/40 backdrop-blur-md relative shadow-2xl">
        <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full py-4">
          <div className="w-24 h-4 bg-neutral-800 animate-pulse rounded mb-6" />
          
          <div className="w-3/4 h-12 bg-neutral-800 animate-pulse rounded mb-2" />
          <div className="w-1/2 h-4 bg-neutral-800 animate-pulse rounded mb-8 pb-4 border-b border-neutral-800/80" />
          
          <div className="w-full h-24 bg-neutral-800 animate-pulse rounded mb-6" />

          {/* Ingredients list skeleton */}
          <div className="mb-6 space-y-3">
            <div className="w-20 h-3 bg-neutral-800 animate-pulse rounded mb-3" />
            <div className="w-full h-6 bg-neutral-800 animate-pulse rounded border-b border-neutral-800/40" />
            <div className="w-full h-6 bg-neutral-800 animate-pulse rounded border-b border-neutral-800/40" />
            <div className="w-full h-6 bg-neutral-800 animate-pulse rounded border-b border-neutral-800/40" />
          </div>
        </div>

        {/* Footer meta info skeleton */}
        <div className="pt-4 border-t border-neutral-800/80 flex flex-wrap gap-2 items-center justify-between">
          <div className="w-24 h-4 bg-neutral-800 animate-pulse rounded" />
          <div className="w-16 h-4 bg-neutral-800 animate-pulse rounded" />
        </div>
      </div>

      {/* Right Container: 3D Scene Skeleton */}
      <div className="w-full md:w-[60%] h-[55dvh] md:h-full relative overflow-hidden flex-1 z-10 bg-neutral-900 animate-pulse flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neutral-700 mb-4" />
      </div>
    </div>
  );
}
