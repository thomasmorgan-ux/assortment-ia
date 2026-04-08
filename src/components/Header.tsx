import { ArrowLeft, Download, Upload } from 'lucide-react';

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
      <div className="flex flex-1 flex-wrap items-center justify-end gap-1.5 shrink-0">
        <button
          type="button"
          className="group flex h-12 shrink-0 items-center justify-center gap-2 rounded-[4px] bg-[#212b36] px-4 font-['Inter',sans-serif] text-sm font-medium leading-normal text-white transition-colors hover:bg-[#2d3844]"
        >
          <Download
            size={20}
            className="shrink-0 text-white transition-colors group-hover:text-[#0267FF]"
            strokeWidth={2}
            aria-hidden
          />
          Download template
        </button>
        <button
          type="button"
          className="group flex h-12 shrink-0 items-center justify-center gap-2 rounded-[4px] bg-[#212b36] px-4 font-['Inter',sans-serif] text-sm font-medium leading-normal text-white transition-colors hover:bg-[#2d3844]"
        >
          <Upload
            size={20}
            className="shrink-0 text-white transition-colors group-hover:text-[#0267FF]"
            strokeWidth={2}
            aria-hidden
          />
          Upload template
        </button>
        <button
          type="button"
          className="flex h-12 shrink-0 items-center justify-center rounded-[4px] bg-[#0267FF] px-4 font-['Inter',sans-serif] text-sm font-semibold leading-normal text-white transition-colors hover:bg-[#0256e6]"
        >
          Re-generate IA recs
        </button>
      </div>
    </header>
  );
}
