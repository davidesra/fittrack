export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-[#2a2a32] rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-72 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
        <div className="h-72 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
        <div className="space-y-4">
          <div className="h-48 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
          <div className="h-36 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
