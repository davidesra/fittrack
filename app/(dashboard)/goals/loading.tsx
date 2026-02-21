export default function GoalsLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-20 bg-[#2a2a32] rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 bg-[#1a1a1f] border border-[#2a2a32] rounded-2xl" />
      ))}
      <div className="h-12 bg-[#2a2a32] rounded-xl" />
    </div>
  );
}
