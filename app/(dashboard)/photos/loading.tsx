export default function PhotosLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-44 bg-[#2a2a32] rounded" />
      <div className="bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl p-6 space-y-4">
        <div className="h-5 w-40 bg-[#2a2a32] rounded" />
        <div className="h-28 bg-[#2a2a32] rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[3/4] bg-[#2a2a32] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
