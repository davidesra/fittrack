export default function WorkoutsLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-28 bg-[#2a2a32] rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-96 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
        <div className="lg:col-span-2 space-y-5">
          <div className="h-56 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
          <div className="h-48 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
