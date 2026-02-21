export default function NutritionLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-[#2a2a32] rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
        <div className="lg:col-span-2 space-y-5">
          <div className="h-48 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
          <div className="h-64 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
