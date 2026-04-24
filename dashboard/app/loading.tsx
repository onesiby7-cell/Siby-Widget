export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-base flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-silver/20 border-t-silver rounded-full animate-spin"></div>
        <div className="text-silver font-bold tracking-widest text-[10px] uppercase">Siby Cloud Protocol Initializing...</div>
      </div>
    </div>
  );
}
