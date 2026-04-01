import { ArrowLeft, ExternalLink, Upload } from 'lucide-react';

export function Header() {
  return (
    <header
      className="bg-[#12171e] flex items-center justify-between px-6 py-6 shrink-0 w-full"
      data-name="Top bar"
    >
      <div className="flex flex-1 gap-3 items-center min-w-0">
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded shrink-0 text-[#6A7282] transition-colors hover:bg-white/[0.08] hover:text-[#0267FF]"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <h1 className="text-2xl font-medium text-white leading-none tracking-normal">
            Assortment
          </h1>
          <div className="flex items-center gap-1 text-sm leading-none flex-wrap">
            <span className="text-[#a6aaaf] font-normal">
              Manage your assortment and initial allocations
            </span>
            <span className="text-[#878d94] font-normal">•</span>
            <a
              href="#"
              className="text-[#878d94] font-medium underline underline-offset-2 hover:text-white transition-colors"
            >
              Release notes
            </a>
          </div>
        </div>
      </div>
      <div className="flex flex-1 gap-1.5 items-center justify-end shrink-0">
        <button
          type="button"
          className="flex items-center justify-center gap-2 h-12 px-4 py-3 rounded bg-[#212b36] text-[#a6aaaf] hover:bg-[#2d3844] hover:text-white transition-colors"
          aria-label="External link"
        >
          <ExternalLink size={20} />
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 h-12 px-4 py-3 rounded bg-[#212b36] text-[#a6aaaf] hover:bg-[#2d3844] hover:text-white transition-colors"
          aria-label="Upload"
        >
          <Upload size={20} />
        </button>
      </div>
    </header>
  );
}
