export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-navy-800" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand-500 animate-spin" />
      </div>
    </div>
  );
}