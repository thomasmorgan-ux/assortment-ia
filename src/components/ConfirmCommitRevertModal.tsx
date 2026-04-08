import { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Check } from 'lucide-react';
import type { AssortmentRow } from '../types';

export type ConfirmCommitRevertState =
  | { action: 'commit'; rows: AssortmentRow[] }
  | { action: 'revert'; rows: AssortmentRow[] };

type ConfirmVariant = 'modal' | 'slideout';

interface ConfirmCommitRevertModalProps {
  open: boolean;
  state: ConfirmCommitRevertState | null;
  /** 'slideout' = right-side panel (e.g. for commit); 'modal' = centered dialog (e.g. for revert). */
  variant?: ConfirmVariant;
  /** For commit: called with the list of row ids to commit (only checked rows). For revert: called with no args. */
  onConfirm: (commitRowIds?: string[]) => void;
  onClose: () => void;
}

function formatAssortmentLabel(assortedCount: number, totalCount: number): string {
  if (assortedCount === 0) return 'Unassorted';
  if (assortedCount === totalCount) return 'Assorted';
  return `${assortedCount}/${totalCount} Assorted`;
}

/** Parent row summary: one value if all match, otherwise list unique values. */
function summaryFromTo(froms: string[], tos: string[]): { from: string; to: string } {
  if (froms.length === 0 || tos.length === 0) return { from: '—', to: '—' };
  const uniqFrom = [...new Set(froms)];
  const uniqTo = [...new Set(tos)];
  return {
    from: uniqFrom.length === 1 ? uniqFrom[0] : uniqFrom.join(', '),
    to: uniqTo.length === 1 ? uniqTo[0] : uniqTo.join(', '),
  };
}

export function ConfirmCommitRevertModal({
  open,
  state,
  variant = 'modal',
  onConfirm,
  onClose,
}: ConfirmCommitRevertModalProps) {
  const [assortmentExpanded, setAssortmentExpanded] = useState(true);
  const [assortmentRecExpanded, setAssortmentRecExpanded] = useState(true);
  const [initialAllocRecExpanded, setInitialAllocRecExpanded] = useState(true);
  const [includedRowIds, setIncludedRowIds] = useState<Set<string>>(new Set());

  const isCommit = state?.action === 'commit';
  const rows = state?.action === 'commit' ? state.rows : state?.action === 'revert' ? state.rows : [];
  const row = rows[0];

  useEffect(() => {
    if (open && state && state.rows.length > 0) {
      setIncludedRowIds(new Set(state.rows.map((r) => r.id)));
    }
  }, [open, state]);

  if (!open || !state) return null;

  if (rows.length === 0) return null;

  const snap = row?.lastCommittedSnapshot;

  const title = isCommit
    ? `Confirm commit for ${rows.length} Product group${rows.length !== 1 ? 's' : ''} with recommendations`
    : `Confirm revert for ${rows.length} Product group${rows.length !== 1 ? 's' : ''} with recommendations`;
  const bodyCopy = isCommit
    ? 'The following changes will be committed.'
    : 'The following changes will be reverted. The row(s) will be restored to their last committed state:';

  const hasAssortmentChange =
    snap &&
    rows.some(
      (r) =>
        r.lastCommittedSnapshot &&
        r.lastCommittedSnapshot.assortment.assortedCount !== r.assortment.assortedCount
    );

  const assortmentRows = isCommit
    ? rows.filter(
        (r) =>
          r.lastCommittedSnapshot &&
          r.lastCommittedSnapshot.assortment.assortedCount !== r.assortment.assortedCount
      )
    : [];

  const hasAssortmentRecChange = rows.some(
    (r) =>
      r.assortmentRecommendationLabel != null &&
      r.lastCommittedSnapshot != null
  );

  const assortmentRecRows = isCommit
    ? rows.filter(
        (r) =>
          r.assortmentRecommendationLabel != null && r.lastCommittedSnapshot != null
      )
    : [];

  const hasInitialAllocRecChange =
    rows.some((r) => r.sumIaRecommendation != null) ||
    (!!snap &&
      rows.some((r) => {
        const s = r.lastCommittedSnapshot;
        if (!s) return false;
        const to = r.sumIaRecommendation ?? r.sumIa;
        return s.sumIa !== to;
      }));

  const initialAllocRecRows = rows
    .filter((r) => {
      const s = r.lastCommittedSnapshot;
      if (!s) return false;
      const to = r.sumIaRecommendation ?? r.sumIa;
      return s.sumIa !== to || r.sumIaRecommendation != null;
    })
    .map((r) => {
      const s = r.lastCommittedSnapshot!;
      const from = String(s.sumIa);
      const to =
        r.sumIaRecommendation != null
          ? String(r.sumIaRecommendation)
          : String(r.sumIa);
      const name = `${r.productGroup.name} – ${r.locationCluster.name}`;
      return { id: r.id, name, from, to };
    });

  const toggleRowIncluded = (id: string) => {
    setIncludedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCommit = () => {
    if (state.action === 'commit') {
      onConfirm(Array.from(includedRowIds));
    } else {
      onConfirm();
    }
    onClose();
  };

  const revertAssortmentRows = !isCommit
    ? rows.filter(
        (r) =>
          r.lastCommittedSnapshot &&
          r.lastCommittedSnapshot.assortment.assortedCount !== r.assortment.assortedCount
      )
    : [];
  const hasRevertAssortmentChange = revertAssortmentRows.length > 0;
  const revertAssortmentRecRows = !isCommit
    ? rows
        .filter(
          (r) =>
            r.assortmentRecommendationLabel != null && r.lastCommittedSnapshot != null
        )
        .map((r) => {
          const s = r.lastCommittedSnapshot!;
          const from = formatAssortmentLabel(
            s.assortment.assortedCount,
            r.assortment.totalCount
          );
          const to = r.assortmentRecommendationLabel ?? '—';
          const name = `${r.productGroup.name} – ${r.locationCluster.name}`;
          return { id: r.id, name, from, to };
        })
    : [];
  const hasRevertAssortmentRecChange = revertAssortmentRecRows.length > 0;

  const revertInitialAllocRecRows = !isCommit
    ? rows
        .filter((r) => {
          const s = r.lastCommittedSnapshot;
          if (!s) return false;
          const to = r.sumIaRecommendation ?? r.sumIa;
          return s.sumIa !== to || r.sumIaRecommendation != null;
        })
        .map((r) => {
          const s = r.lastCommittedSnapshot!;
          const from = String(s.sumIa);
          const to = String(r.sumIaRecommendation ?? r.sumIa);
          const name = `${r.productGroup.name} – ${r.locationCluster.name}`;
          return { id: r.id, name, from, to };
        })
    : [];
  const hasRevertInitialAllocRecChange = revertInitialAllocRecRows.length > 0;

  const assortmentRecCommitSummary = summaryFromTo(
    assortmentRecRows.map((r) => {
      const s = r.lastCommittedSnapshot!;
      return formatAssortmentLabel(s.assortment.assortedCount, r.assortment.totalCount);
    }),
    assortmentRecRows.map((r) => r.assortmentRecommendationLabel ?? '—')
  );

  const initialAllocRecCommitSummary = summaryFromTo(
    initialAllocRecRows.map((r) => r.from),
    initialAllocRecRows.map((r) => r.to)
  );

  const assortmentRecRevertSummary = summaryFromTo(
    revertAssortmentRecRows.map((r) => r.from),
    revertAssortmentRecRows.map((r) => r.to)
  );

  const initialAllocRecRevertSummary = summaryFromTo(
    revertInitialAllocRecRows.map((r) => r.from),
    revertInitialAllocRecRows.map((r) => r.to)
  );

  const isSlideout = variant === 'slideout';

  return (
    <div
      className={
        isSlideout
          ? 'fixed inset-0 z-[60]'
          : 'fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50'
      }
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-commit-revert-title"
    >
      {isSlideout && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={onClose}
          aria-hidden
        />
      )}
      <div
        className={
          isSlideout
            ? 'fixed inset-y-0 right-0 z-[60] flex w-full max-w-lg flex-col rounded-l-xl bg-white shadow-2xl transition-transform duration-200 ease-out'
            : 'w-full max-w-lg rounded-lg bg-white shadow-lg border border-[#e9eaeb]'
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e9eaeb] px-5 py-4">
          <h2
            id="confirm-commit-revert-title"
            className="text-base font-semibold text-[#00050a]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-[#00050a] hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={isSlideout ? 'flex min-h-0 flex-1 flex-col overflow-auto px-5 pt-3 pb-4' : 'px-5 pt-3 pb-4'}>
          <p className="mb-4 text-sm text-[#00050a]">{bodyCopy}</p>
          <div className="overflow-hidden rounded-[4px] border border-[#e9eaeb]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e9eaeb] bg-[#f8f8f8]">
                  <th className="w-10 px-3 py-2.5 text-left font-medium text-[#00050a]">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">
                    Change
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">
                    {isCommit ? 'From' : 'Current'}
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">
                    {isCommit ? 'To' : 'Revert to'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {isCommit ? (
                  <>
                    {hasAssortmentChange && (
                      <>
                        <tr className="border-b border-[#e9eaeb]">
                          <td className="w-10 px-3 py-2.5 align-middle" />
                          <td className="px-3 py-2.5 text-[#00050a]">
                            <button
                              type="button"
                              onClick={() => setAssortmentExpanded((e) => !e)}
                              className="flex items-center gap-1.5 text-[#00050a] hover:underline"
                            >
                              Assortment
                              {assortmentExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">—</td>
                          <td className="px-3 py-2.5 text-[#00050a]">—</td>
                        </tr>
                        {assortmentExpanded &&
                          assortmentRows.map((r) => {
                            const s = r.lastCommittedSnapshot!;
                            const from = formatAssortmentLabel(
                              s.assortment.assortedCount,
                              r.assortment.totalCount
                            );
                            const to = formatAssortmentLabel(
                              r.assortment.assortedCount,
                              r.assortment.totalCount
                            );
                            const label = `${r.productGroup.name} – ${r.locationCluster.name}`;
                            const included = includedRowIds.has(r.id);
                            return (
                              <tr
                                key={r.id}
                                className="border-b border-[#e9eaeb] last:border-b-0 bg-slate-50/50"
                              >
                                <td className="w-10 px-3 py-2.5 pl-6 align-middle">
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={included}
                                    aria-label={`Include ${label}`}
                                    onClick={() => toggleRowIncluded(r.id)}
                                    className="flex h-4 w-4 items-center justify-center rounded border border-[#e9eaeb] bg-white"
                                  >
                                    {included ? (
                                      <Check size={12} strokeWidth={2.5} className="text-[#0267ff]" />
                                    ) : null}
                                  </button>
                                </td>
                                <td className="px-3 py-2.5 text-[#00050a]">{label}</td>
                                <td className="px-3 py-2.5 text-[#00050a]">{from}</td>
                                <td className="px-3 py-2.5 text-[#00050a]">{to}</td>
                              </tr>
                            );
                          })}
                      </>
                    )}
                    {hasAssortmentRecChange && (
                      <>
                        <tr className="border-b border-[#e9eaeb]">
                          <td className="w-10 px-3 py-2.5 align-middle" />
                          <td className="px-3 py-2.5 text-[#00050a]">
                            <button
                              type="button"
                              onClick={() => setAssortmentRecExpanded((e) => !e)}
                              className="flex items-center gap-1.5 text-[#00050a] hover:underline"
                            >
                              Assortment recommendations
                              {assortmentRecExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">
                            {assortmentRecCommitSummary.from}
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">
                            {assortmentRecCommitSummary.to}
                          </td>
                        </tr>
                        {assortmentRecExpanded &&
                          assortmentRecRows.map((r) => {
                            const s = r.lastCommittedSnapshot!;
                            const from = formatAssortmentLabel(
                              s.assortment.assortedCount,
                              r.assortment.totalCount
                            );
                            const to = r.assortmentRecommendationLabel ?? '—';
                            const label = `${r.productGroup.name} – ${r.locationCluster.name}`;
                            const included = includedRowIds.has(r.id);
                            return (
                              <tr
                                key={`ar-${r.id}`}
                                className="border-b border-[#e9eaeb] last:border-b-0 bg-slate-50/50"
                              >
                                <td className="w-10 px-3 py-2.5 pl-6 align-middle">
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={included}
                                    aria-label={`Include ${label}`}
                                    onClick={() => toggleRowIncluded(r.id)}
                                    className="flex h-4 w-4 items-center justify-center rounded border border-[#e9eaeb] bg-white"
                                  >
                                    {included ? (
                                      <Check size={12} strokeWidth={2.5} className="text-[#0267ff]" />
                                    ) : null}
                                  </button>
                                </td>
                                <td className="px-3 py-2.5 text-[#00050a]">{label}</td>
                                <td className="px-3 py-2.5 text-[#00050a]">{from}</td>
                                <td className="px-3 py-2.5 text-[#00050a]">{to}</td>
                              </tr>
                            );
                          })}
                      </>
                    )}
                    {hasInitialAllocRecChange && (
                      <>
                        <tr className="border-b border-[#e9eaeb]">
                          <td className="w-10 px-3 py-2.5 align-middle" />
                          <td className="px-3 py-2.5 text-[#00050a]">
                            <button
                              type="button"
                              onClick={() => setInitialAllocRecExpanded((e) => !e)}
                              className="flex items-center gap-1.5 text-[#00050a] hover:underline"
                            >
                              Initial allocation recommendations
                              {initialAllocRecExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">
                            {initialAllocRecCommitSummary.from}
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">
                            {initialAllocRecCommitSummary.to}
                          </td>
                        </tr>
                        {initialAllocRecExpanded &&
                          initialAllocRecRows.map(({ id, name, from, to }) => {
                            const included = includedRowIds.has(id);
                            return (
                              <tr
                                key={`iar-${id}`}
                                className="border-b border-[#e9eaeb] last:border-b-0 bg-slate-50/50"
                              >
                                <td className="w-10 px-3 py-2.5 pl-6 align-middle">
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={included}
                                    aria-label={`Include ${name}`}
                                    onClick={() => toggleRowIncluded(id)}
                                    className="flex h-4 w-4 items-center justify-center rounded border border-[#e9eaeb] bg-white"
                                  >
                                    {included ? (
                                      <Check size={12} strokeWidth={2.5} className="text-[#0267ff]" />
                                    ) : null}
                                  </button>
                                </td>
                                <td className="px-3 py-2.5 text-[#00050a]">{name}</td>
                                <td className="px-3 py-2.5 text-[#00050a]">{from}</td>
                                <td className="px-3 py-2.5 text-[#00050a]">{to}</td>
                              </tr>
                            );
                          })}
                      </>
                    )}
                    {!hasAssortmentChange &&
                      !hasAssortmentRecChange &&
                      !hasInitialAllocRecChange && (
                      <tr className="border-b border-[#e9eaeb] last:border-b-0">
                        <td className="w-10 px-3 py-2.5 align-middle" />
                        <td className="px-3 py-2.5 text-[#00050a]">—</td>
                        <td className="px-3 py-2.5 text-[#00050a]">—</td>
                        <td className="px-3 py-2.5 text-[#00050a]">—</td>
                      </tr>
                    )}
                  </>
                ) : (
                  <>
                    {hasRevertAssortmentChange && (
                      <>
                        <tr className="border-b border-[#e9eaeb]">
                          <td className="w-10 px-3 py-2.5 align-middle" />
                          <td className="px-3 py-2.5 text-[#00050a]">
                            <button
                              type="button"
                              onClick={() => setAssortmentExpanded((e) => !e)}
                              className="flex items-center gap-1.5 text-[#00050a] hover:underline"
                            >
                              Assortment
                              {assortmentExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">—</td>
                          <td className="px-3 py-2.5 text-[#00050a]">—</td>
                        </tr>
                        {assortmentExpanded &&
                          revertAssortmentRows.map((r) => {
                            const s = r.lastCommittedSnapshot!;
                            const from = formatAssortmentLabel(
                              s.assortment.assortedCount,
                              r.assortment.totalCount
                            );
                            const to = formatAssortmentLabel(
                              r.assortment.assortedCount,
                              r.assortment.totalCount
                            );
                            const label = `${r.productGroup.name} – ${r.locationCluster.name}`;
                            return (
                              <tr
                                key={r.id}
                                className="border-b border-[#e9eaeb] last:border-b-0 bg-slate-50/50"
                              >
                                <td className="w-10 px-3 py-2.5 pl-6 align-middle">
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked="true"
                                    disabled
                                    aria-label={`Included ${label}`}
                                    className="flex h-4 w-4 cursor-default items-center justify-center rounded border border-[#e9eaeb] bg-white disabled:opacity-100"
                                  >
                                    <Check size={12} strokeWidth={2.5} className="text-[#0267ff]" />
                                  </button>
                                </td>
                                <td className="px-3 py-2.5 text-[#00050a]">{label}</td>
                                <td className="px-3 py-2.5 text-[#00050a]">{from}</td>
                                <td className="px-3 py-2.5 text-[#00050a]">{to}</td>
                              </tr>
                            );
                          })}
                      </>
                    )}
                    {hasRevertAssortmentRecChange && (
                      <>
                        <tr className="border-b border-[#e9eaeb]">
                          <td className="w-10 px-3 py-2.5 align-middle" />
                          <td className="px-3 py-2.5 text-[#00050a]">
                            <button
                              type="button"
                              onClick={() => setAssortmentRecExpanded((e) => !e)}
                              className="flex items-center gap-1.5 text-[#00050a] hover:underline"
                            >
                              Assortment recommendations
                              {assortmentRecExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">
                            {assortmentRecRevertSummary.from}
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">
                            {assortmentRecRevertSummary.to}
                          </td>
                        </tr>
                        {assortmentRecExpanded &&
                          revertAssortmentRecRows.map(({ id, name, from, to }) => (
                            <tr
                              key={`rar-${id}`}
                              className="border-b border-[#e9eaeb] last:border-b-0 bg-slate-50/50"
                            >
                              <td className="w-10 px-3 py-2.5 pl-6 align-middle">
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked="true"
                                  disabled
                                  aria-label={`Included ${name}`}
                                  className="flex h-4 w-4 cursor-default items-center justify-center rounded border border-[#e9eaeb] bg-white disabled:opacity-100"
                                >
                                  <Check size={12} strokeWidth={2.5} className="text-[#0267ff]" />
                                </button>
                              </td>
                              <td className="px-3 py-2.5 text-[#00050a]">{name}</td>
                              <td className="px-3 py-2.5 text-[#00050a]">{from}</td>
                              <td className="px-3 py-2.5 text-[#00050a]">{to}</td>
                            </tr>
                          ))}
                      </>
                    )}
                    {hasRevertInitialAllocRecChange && (
                      <>
                        <tr className="border-b border-[#e9eaeb]">
                          <td className="w-10 px-3 py-2.5 align-middle" />
                          <td className="px-3 py-2.5 text-[#00050a]">
                            <button
                              type="button"
                              onClick={() => setInitialAllocRecExpanded((e) => !e)}
                              className="flex items-center gap-1.5 text-[#00050a] hover:underline"
                            >
                              Initial allocation recommendations
                              {initialAllocRecExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">
                            {initialAllocRecRevertSummary.from}
                          </td>
                          <td className="px-3 py-2.5 text-[#00050a]">
                            {initialAllocRecRevertSummary.to}
                          </td>
                        </tr>
                        {initialAllocRecExpanded &&
                          revertInitialAllocRecRows.map(({ id, name, from, to }) => (
                            <tr
                              key={`riar-${id}`}
                              className="border-b border-[#e9eaeb] last:border-b-0 bg-slate-50/50"
                            >
                              <td className="w-10 px-3 py-2.5 pl-6 align-middle">
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked="true"
                                  disabled
                                  aria-label={`Included ${name}`}
                                  className="flex h-4 w-4 cursor-default items-center justify-center rounded border border-[#e9eaeb] bg-white disabled:opacity-100"
                                >
                                  <Check size={12} strokeWidth={2.5} className="text-[#0267ff]" />
                                </button>
                              </td>
                              <td className="px-3 py-2.5 text-[#00050a]">{name}</td>
                              <td className="px-3 py-2.5 text-[#00050a]">{from}</td>
                              <td className="px-3 py-2.5 text-[#00050a]">{to}</td>
                            </tr>
                          ))}
                      </>
                    )}
                    {!hasRevertAssortmentChange &&
                      !hasRevertAssortmentRecChange &&
                      !hasRevertInitialAllocRecChange && (
                      <tr className="border-b border-[#e9eaeb] last:border-b-0">
                        <td className="w-10 px-3 py-2.5 align-middle" />
                        <td className="px-3 py-2.5 text-[#00050a]">—</td>
                        <td className="px-3 py-2.5 text-[#00050a]">—</td>
                        <td className="px-3 py-2.5 text-[#00050a]">—</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e9eaeb] px-5 py-4">
          <button
            type="button"
            onClick={handleCommit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[4px] bg-[#0267ff] px-4 py-0 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            {isCommit && <Check size={16} className="shrink-0" />}
            {isCommit ? 'Commit' : 'Confirm revert'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-[4px] border border-[#e9eaeb] bg-white px-4 text-sm font-medium text-[#00050a] transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
