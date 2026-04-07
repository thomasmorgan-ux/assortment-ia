import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

/** Panel shell — matches product grouping menu + table border token. */
const scheduleDatePopoverPanelClass =
  'flex max-h-[min(320px,85vh)] flex-col gap-2 overflow-y-auto rounded-[6px] border-[0.5px] border-solid border-[#E3E8F0] bg-white p-2 shadow-[0px_8px_25px_0px_rgba(0,0,0,0.12)]';

function normalizeToIso(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(`${t}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function formatDdMmYyyy(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

function isoFromParts(y: number, monthIndex: number, day: number): string {
  const dd = String(day).padStart(2, '0');
  const mm = String(monthIndex + 1).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function todayIso(): string {
  const n = new Date();
  return isoFromParts(n.getFullYear(), n.getMonth(), n.getDate());
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export function ScheduleDatePopoverInput({
  value,
  onCommit,
  ariaLabel,
  disabled,
  className,
}: {
  value: string | undefined;
  onCommit: (nextIso: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  className: string;
}) {
  const iso = normalizeToIso(value);
  const id = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const initialView = useMemo(() => {
    if (iso) {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [iso]);
  const [view, setView] = useState(() => new Date(initialView.getFullYear(), initialView.getMonth(), 1));

  useEffect(() => {
    if (iso) {
      const [y, m] = iso.split('-').map(Number);
      setView(new Date(y, m - 1, 1));
    }
  }, [iso]);

  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.max(r.width, 268);
    let left = r.left;
    const top = r.bottom + 4;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (left + w > vw - 16) left = Math.max(8, vw - w - 16);
    setPanelStyle({ top, left, width: w, position: 'fixed', zIndex: 220 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const tid = window.setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(tid);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = useMemo(() => {
    const out: { day: number; inMonth: boolean; iso: string }[] = [];
    for (let i = 0; i < startPad; i++) {
      const day = prevMonthDays - startPad + i + 1;
      const pm = month === 0 ? 11 : month - 1;
      const py = month === 0 ? year - 1 : year;
      out.push({ day, inMonth: false, iso: isoFromParts(py, pm, day) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ day: d, inMonth: true, iso: isoFromParts(year, month, d) });
    }
    let nextDay = 1;
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    while (out.length < 42) {
      out.push({ day: nextDay, inMonth: false, iso: isoFromParts(ny, nm, nextDay) });
      nextDay++;
    }
    return out;
  }, [year, month, startPad, daysInMonth, prevMonthDays]);

  const selectDay = useCallback(
    (cellIso: string) => {
      onCommit(cellIso);
      setOpen(false);
    },
    [onCommit]
  );

  const bumpMonth = (delta: number) => {
    setView(new Date(year, month + delta, 1));
  };

  const monthLabel = view.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const today = todayIso();

  return (
    <div ref={anchorRef} className="relative min-w-0 w-full">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[2px] border-[0.5px] border-solid border-[#e9eaeb] bg-white px-3 py-0 text-left font-['Inter',sans-serif] text-[14px] font-semibold tabular-nums leading-normal text-[#101828] transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className="min-w-0 truncate">{iso ? formatDdMmYyyy(iso) : '—'}</span>
        <Calendar size={16} className="shrink-0 text-[#6A7282]" aria-hidden />
      </button>
      {open &&
        createPortal(
          <>
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              className={scheduleDatePopoverPanelClass}
              style={panelStyle}
            >
              <div className="flex items-center justify-between gap-2 px-0.5">
                <div id={`${id}-title`} className="min-w-0 text-sm font-semibold leading-none text-[#101828]">
                  {monthLabel}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-[#101828] hover:bg-slate-100"
                    aria-label="Previous month"
                    onClick={() => bumpMonth(-1)}
                  >
                    <ChevronLeft size={18} strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-[#101828] hover:bg-slate-100"
                    aria-label="Next month"
                    onClick={() => bumpMonth(1)}
                  >
                    <ChevronRight size={18} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {WEEKDAY_LABELS.map((l, i) => (
                  <div key={`${l}-${i}`} className="text-[11px] font-medium text-[#4b535c]">
                    {l}
                  </div>
                ))}
                {cells.map((c, i) => {
                  const isSel = iso !== '' && c.iso === iso;
                  const isTodayMarker = c.iso === today;
                  return (
                    <button
                      key={`${c.iso}-${i}`}
                      type="button"
                      onClick={() => selectDay(c.iso)}
                      className={[
                        'mx-auto flex h-8 w-8 items-center justify-center rounded text-[13px] tabular-nums',
                        c.inMonth ? 'text-[#101828]' : 'text-[#9AA4B2]',
                        isSel
                          ? 'bg-sky-600 font-semibold text-white ring-2 ring-amber-400 ring-offset-0'
                          : 'font-normal hover:bg-slate-100',
                        !isSel && isTodayMarker && c.inMonth ? 'border border-sky-500/50' : '',
                      ].join(' ')}
                    >
                      {c.day}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t-[0.5px] border-solid border-[#e9eaeb] pt-2">
                <button
                  type="button"
                  className="text-sm font-medium text-sky-600 hover:text-sky-700"
                  onClick={() => {
                    onCommit('');
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-sky-600 hover:text-sky-700"
                  onClick={() => {
                    onCommit(today);
                    setOpen(false);
                  }}
                >
                  Today
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

/** Single trigger + popover: pick **start** or **end** via tabs; one calendar grid (same styling as `ScheduleDatePopoverInput`). */
export function ScheduleDateRangePopoverInput({
  start,
  end,
  onCommitStart,
  onCommitEnd,
  ariaLabel,
  disabled,
  className,
  /** Optional block above the month navigation (e.g. product / location context). */
  popoverHeader,
}: {
  start: string | undefined;
  end: string | undefined;
  onCommitStart: (nextIso: string) => void;
  onCommitEnd: (nextIso: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  className: string;
  popoverHeader?: {
    title?: string;
    contextLine: string;
    statsLine: string;
  };
}) {
  const startIso = normalizeToIso(start);
  const endIso = normalizeToIso(end);
  const id = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<'start' | 'end'>('start');

  const displayIso = active === 'start' ? startIso : endIso;

  const [view, setView] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;
    const iso = (active === 'start' ? startIso : endIso) || startIso || endIso;
    if (iso) {
      const [y, m] = iso.split('-').map(Number);
      setView(new Date(y, m - 1, 1));
    }
  }, [open, active, startIso, endIso]);

  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.max(r.width, 268);
    let left = r.left;
    const top = r.bottom + 4;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (left + w > vw - 16) left = Math.max(8, vw - w - 16);
    setPanelStyle({ top, left, width: w, position: 'fixed', zIndex: 220 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const tid = window.setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(tid);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = useMemo(() => {
    const out: { day: number; inMonth: boolean; iso: string }[] = [];
    for (let i = 0; i < startPad; i++) {
      const day = prevMonthDays - startPad + i + 1;
      const pm = month === 0 ? 11 : month - 1;
      const py = month === 0 ? year - 1 : year;
      out.push({ day, inMonth: false, iso: isoFromParts(py, pm, day) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ day: d, inMonth: true, iso: isoFromParts(year, month, d) });
    }
    let nextDay = 1;
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    while (out.length < 42) {
      out.push({ day: nextDay, inMonth: false, iso: isoFromParts(ny, nm, nextDay) });
      nextDay++;
    }
    return out;
  }, [year, month, startPad, daysInMonth, prevMonthDays]);

  const selectDay = useCallback(
    (cellIso: string) => {
      if (active === 'start') onCommitStart(cellIso);
      else onCommitEnd(cellIso);
    },
    [active, onCommitStart, onCommitEnd]
  );

  const bumpMonth = (delta: number) => {
    setView(new Date(year, month + delta, 1));
  };

  const monthLabel = view.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const today = todayIso();

  const rangeLabel = useMemo(() => {
    const a = startIso ? formatDdMmYyyy(startIso) : '—';
    const b = endIso ? formatDdMmYyyy(endIso) : '—';
    return `${a} – ${b}`;
  }, [startIso, endIso]);

  const tabClass = (which: 'start' | 'end') =>
    [
      'flex-1 rounded px-2 py-1.5 text-center text-xs font-semibold transition-colors',
      active === which
                      ? 'bg-white text-[#101828] shadow-sm'
                      : 'text-[#6A7282] hover:text-[#101828]',
    ].join(' ');

  return (
    <div ref={anchorRef} className="relative min-w-0 w-full">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[2px] border-[0.5px] border-solid border-[#e9eaeb] bg-white px-3 py-0 text-left font-['Inter',sans-serif] text-[14px] font-semibold tabular-nums leading-normal text-[#101828] transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className="min-w-0 truncate">{rangeLabel}</span>
        <Calendar size={16} className="shrink-0 text-[#6A7282]" aria-hidden />
      </button>
      {open &&
        createPortal(
          <>
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={popoverHeader ? `${id}-popover-title` : `${id}-month-title`}
              className={scheduleDatePopoverPanelClass}
              style={panelStyle}
            >
              {popoverHeader ? (
                <div className="mb-2 border-b-[0.5px] border-solid border-[#E3E8F0] pb-2">
                  <p
                    id={`${id}-popover-title`}
                    className="font-['Inter',sans-serif] text-sm font-semibold leading-tight text-[#101828]"
                  >
                    {popoverHeader.title ?? 'Edit assortment dates'}
                  </p>
                  <p className="mt-1 font-['Inter',sans-serif] text-[12px] font-normal leading-snug text-[#6A7282]">
                    {popoverHeader.contextLine}
                  </p>
                  <p className="mt-0.5 font-['Inter',sans-serif] text-[12px] font-normal leading-snug text-[#6A7282]">
                    {popoverHeader.statsLine}
                  </p>
                </div>
              ) : null}
              <div className="mb-1 flex gap-0.5 rounded-md bg-slate-100 p-0.5">
                <button type="button" className={tabClass('start')} onClick={() => setActive('start')}>
                  Start
                </button>
                <button type="button" className={tabClass('end')} onClick={() => setActive('end')}>
                  End
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 px-0.5">
                <div
                  id={`${id}-month-title`}
                  className="min-w-0 text-sm font-semibold leading-none text-[#101828]"
                >
                  {monthLabel}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-[#101828] hover:bg-slate-100"
                    aria-label="Previous month"
                    onClick={() => bumpMonth(-1)}
                  >
                    <ChevronLeft size={18} strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-[#101828] hover:bg-slate-100"
                    aria-label="Next month"
                    onClick={() => bumpMonth(1)}
                  >
                    <ChevronRight size={18} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {WEEKDAY_LABELS.map((l, i) => (
                  <div key={`${l}-r-${i}`} className="text-[11px] font-medium text-[#4b535c]">
                    {l}
                  </div>
                ))}
                {cells.map((c, i) => {
                  const isSel = displayIso !== '' && c.iso === displayIso;
                  const isTodayMarker = c.iso === today;
                  return (
                    <button
                      key={`${c.iso}-r-${i}`}
                      type="button"
                      onClick={() => selectDay(c.iso)}
                      className={[
                        'mx-auto flex h-8 w-8 items-center justify-center rounded text-[13px] tabular-nums',
                        c.inMonth ? 'text-[#101828]' : 'text-[#9AA4B2]',
                        isSel
                          ? 'bg-sky-600 font-semibold text-white ring-2 ring-amber-400 ring-offset-0'
                          : 'font-normal hover:bg-slate-100',
                        !isSel && isTodayMarker && c.inMonth ? 'border border-sky-500/50' : '',
                      ].join(' ')}
                    >
                      {c.day}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t-[0.5px] border-solid border-[#e9eaeb] pt-2">
                <button
                  type="button"
                  className="text-sm font-medium text-sky-600 hover:text-sky-700"
                  onClick={() => {
                    if (active === 'start') onCommitStart('');
                    else onCommitEnd('');
                  }}
                >
                  Clear {active === 'start' ? 'start' : 'end'}
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-sky-600 hover:text-sky-700"
                  onClick={() => {
                    if (active === 'start') onCommitStart(today);
                    else onCommitEnd(today);
                  }}
                >
                  Today
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
