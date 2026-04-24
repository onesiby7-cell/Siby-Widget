export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 w-48 bg-elevated rounded-lg"></div>
        <div className="h-10 w-32 bg-elevated rounded-lg"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-surface border border-border rounded-2xl"></div>
        ))}
      </div>
      
      <div className="h-96 bg-surface border border-border rounded-2xl w-full"></div>
    </div>
  );
}
