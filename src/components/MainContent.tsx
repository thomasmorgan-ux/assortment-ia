import { useState, useRef, useEffect } from 'react';
import { Layers, History, Sparkles, X } from 'lucide-react';
import { AssortmentTable } from './AssortmentTable';
import { CommitSuccessBanner } from './CommitSuccessBanner';
import { ConfirmCommitRevertModal, type ConfirmCommitRevertState } from './ConfirmCommitRevertModal';
import { EditAllocationPanel } from './EditAllocationPanel';
import { OptimisingIABanner } from './OptimisingIABanner';
import { SelectionActionBar } from './SelectionActionBar';
import { mockRows } from '../data/mockAssortment';
import type { AssortmentRow } from '../types';

const tabs = [
  { id: 'groups', label: 'Groups' },
  { id: 'sku-location', label: 'SKU-Location' },
];

/** Pre-Season IA icon */
function PreSeasonIAIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M4.78932 1.50213L10.243 4.39846L11.8266 3.55752L6.37228 0.66119L4.78873 1.50213H4.78932ZM10.5392 4.90371V6.93233L8.2848 8.12967V6.10105L6.66889 6.95916V13.1799L8.61615 12.1462C8.28074 11.6708 8.08445 11.093 8.08445 10.4695C8.08445 9.66057 8.41582 8.92721 8.95097 8.39691C9.48613 7.8666 10.2256 7.53824 11.0425 7.53824C11.4362 7.53824 11.812 7.61432 12.1555 7.75334V4.04641L10.5396 4.90452L10.5392 4.90371ZM7.95686 5.61308L2.50318 2.71675L0.919036 3.5577L6.37272 6.45403L7.95627 5.61308H7.95686ZM0.591685 4.04564V5.38656H0.000532056V3.3843L6.37331 0L12.7467 3.3843V8.07405C12.8847 8.17073 13.0145 8.27885 13.1335 8.39726C13.6686 8.92757 14 9.66039 14 10.4698C14 11.2787 13.6686 12.0121 13.1335 12.5424C12.5983 13.0727 11.8588 13.401 11.042 13.401C10.2551 13.401 9.53985 13.0961 9.00988 12.5996L6.53502 13.9142C6.48884 13.9445 6.4236 13.9731 6.37337 14C4.24891 12.8719 2.12446 11.7438 0 10.6157V7.16213H0.591153V10.2673L6.0772 13.1809V6.96018L0.591153 4.04656L0.591685 4.04564ZM8.58038 5.28187L9.62068 4.72926L4.16699 1.83293L3.1267 2.38554L8.58038 5.28187ZM9.948 5.2178L8.87596 5.78701V7.15367L9.948 6.58447V5.2178ZM0.000517257 6.53356V6.01355H0.59167V6.53356H0.000517257ZM10.161 10.4168L10.8179 11.0678L11.8773 9.24922L12.3876 9.53983L10.9426 12.0204L9.743 10.8316L10.161 10.4175V10.4168ZM11.0425 12.8138C11.696 12.8138 12.2877 12.5512 12.716 12.1273C13.1438 11.7034 13.4088 11.1164 13.4088 10.4689C13.4088 9.82132 13.1438 9.23493 12.716 8.81049C12.2883 8.38659 11.696 8.124 11.0425 8.124C10.389 8.124 9.79726 8.38659 9.36894 8.81049C8.94116 9.23438 8.67618 9.82075 8.67618 10.4689C8.67618 11.1165 8.94116 11.7028 9.36894 12.1273C9.79671 12.5512 10.3884 12.8138 11.0425 12.8138Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** In Season IA icon */
function InSeasonIAIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M9.15205 4.38552C8.73265 4.0159 8.25322 3.71445 7.73134 3.49834C7.13012 3.24921 6.46887 3.11156 5.77374 3.11156C4.36075 3.11156 3.08156 3.68401 2.15572 4.60978C1.22988 5.53555 0.657393 6.81465 0.657393 8.22754C0.657393 9.64042 1.22988 10.9195 2.15572 11.8453C3.08156 12.7711 4.36075 13.3435 5.77374 13.3435C7.18673 13.3435 8.46592 12.7711 9.39176 11.8453C10.3176 10.9195 10.8901 9.64042 10.8901 8.22754C10.8901 7.89951 10.8601 7.58134 10.8026 7.27561C10.7434 6.96087 10.6551 6.65514 10.5397 6.36184C10.4737 6.19333 10.5573 6.00337 10.7254 5.93776C10.8939 5.87173 11.0839 5.95534 11.1495 6.12343C11.2786 6.45275 11.3781 6.7975 11.4454 7.15512C11.5115 7.50544 11.5458 7.86435 11.5458 8.22754C11.5458 9.82138 10.8995 11.2647 9.8549 12.3093C8.81027 13.3538 7.36726 14 5.77288 14C4.17893 14 2.73592 13.3538 1.69087 12.3093C0.646244 11.2647 0 9.82138 0 8.22754C0 6.6337 0.646244 5.19037 1.69087 4.14582C2.73549 3.10127 4.17893 2.45508 5.77288 2.45508C6.55292 2.45508 7.29822 2.61073 7.9792 2.89288C8.58428 3.14372 9.13704 3.49276 9.61604 3.92027L10.321 3.21533V1.65022C10.321 1.55803 10.3592 1.47485 10.4201 1.41524L11.7396 0.0958361C11.8678 -0.0319454 12.0754 -0.0319454 12.2036 0.0958361C12.2499 0.142575 12.2799 0.199176 12.2924 0.259208L12.5985 1.40195L13.7568 1.7124C13.9318 1.75914 14.0355 1.9388 13.9888 2.11332C13.9734 2.17121 13.9433 2.22095 13.9039 2.2604L12.5814 3.58281C12.5175 3.64713 12.4334 3.67886 12.3494 3.67886H10.7842L8.11771 6.34512L8.11643 6.34641L8.11514 6.34769L6.00359 8.45909C5.87537 8.5873 5.66782 8.5873 5.5396 8.45909C5.41138 8.33088 5.41138 8.12334 5.5396 7.99513L7.40629 6.12858C7.21846 5.9815 7.01134 5.85972 6.79006 5.76796C6.47788 5.63846 6.13396 5.56728 5.7716 5.56728C5.03701 5.56728 4.3719 5.86487 3.89076 6.34641C3.40961 6.82752 3.11158 7.49258 3.11158 8.22711C3.11158 8.96164 3.40918 9.6267 3.89076 10.1078C4.3719 10.5889 5.03701 10.8869 5.7716 10.8869C6.49074 10.8869 7.14299 10.6022 7.62156 10.1395C8.10185 9.67516 8.4076 9.03196 8.43119 8.31716C8.43676 8.13663 8.58771 7.9947 8.76825 8.00071C8.94878 8.00628 9.09072 8.15722 9.08472 8.33774C9.05556 9.22964 8.67433 10.0323 8.07526 10.6112C7.47833 11.188 6.66613 11.5434 5.7716 11.5434C4.85605 11.5434 4.02669 11.1721 3.42676 10.5722C2.82683 9.97188 2.45547 9.14302 2.45547 8.22754C2.45547 7.31206 2.82683 6.48276 3.42676 5.88288C4.02712 5.28299 4.85605 4.91165 5.7716 4.91165C6.21886 4.91165 6.64683 5.00127 7.03878 5.16336C7.34282 5.28942 7.6237 5.45837 7.87285 5.66248L9.1499 4.38552H9.15205ZM13.0402 2.19866L12.2516 1.98726C12.1405 1.95896 12.0475 1.87277 12.0158 1.75442L11.8035 0.962006L10.9784 1.78658V3.02366H12.2156L13.0402 2.19866Z"
        fill="currentColor"
      />
    </svg>
  );
}

type FocusView = 'all' | 'pre-season-ia' | 'in-season-ia' | 'drafts';

function filterRowsByFocusView(rows: AssortmentRow[], view: FocusView): AssortmentRow[] {
  switch (view) {
    case 'pre-season-ia':
      // Pre-season = not assorted (0 assorted)
      return rows.filter((r) => r.assortment.assortedCount === 0);
    case 'in-season-ia':
      return rows.filter((r) => r.assortment.assortedCount > 0);
    case 'drafts':
      return rows.filter((r) => r.hasPendingChanges);
    default:
      return rows;
  }
}

const initRow = (r: AssortmentRow, isDraft = false): AssortmentRow => ({
  ...r,
  selected: false,
  hasPendingChanges: isDraft,
  lastCommittedSnapshot: {
    assortment: {
      assortedCount: r.assortment.assortedCount,
      totalCount: r.assortment.totalCount,
    },
    sumIa: r.sumIa,
    avgIa: r.avgIa,
  },
});

export function MainContent() {
  const [activeTab, setActiveTab] = useState('groups');
  const [rows, setRows] = useState<AssortmentRow[]>(() =>
    mockRows.map((r) => initRow(r, false))
  );
  const [editAllocation, setEditAllocation] = useState<{
    rows: AssortmentRow[];
    openFrom: 'assortment' | 'initial-allocation';
  } | null>(null);
  const [confirmCommitRevert, setConfirmCommitRevert] = useState<ConfirmCommitRevertState | null>(null);
  const [focusView, setFocusView] = useState<FocusView>('all');
  const [isolateRowId, setIsolateRowId] = useState<string | null>(null);
  const [optimisingBannerVisible, setOptimisingBannerVisible] = useState(false);
  const [optimisingBannerDismissed, setOptimisingBannerDismissed] = useState(false);
  const [, setHasGeneratedRecommendations] = useState(false);
  const [recSuccessBanner, setRecSuccessBanner] = useState<{ groupsCount: number } | null>(null);
  const [showRecommendationsInTable, setShowRecommendationsInTable] = useState(false);
  const [commitSuccessBannerVisible, setCommitSuccessBannerVisible] = useState(false);
  const optimisingToSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSuccessGroupsCountRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (optimisingToSuccessTimeoutRef.current) clearTimeout(optimisingToSuccessTimeoutRef.current);
    };
  }, []);

  const handleGenerateRecommendations = () => {
    setOptimisingBannerVisible(true);
    setOptimisingBannerDismissed(false);
    const selected = rows.filter((r) => r.selected);
    const groupsCount = selected.length;
    setHasGeneratedRecommendations(true);
    setRows((prev) =>
      prev.map((r) => {
        if (!r.selected) return r;
        const sumRec = 44;
        const avgRec =
          r.locationCluster.locationCount > 0
            ? sumRec / r.locationCluster.locationCount
            : r.avgIa;
        return {
          ...r,
          sumIaRecommendation: sumRec,
          avgIaRecommendation: avgRec,
          hasPendingChanges: true,
          lastCommittedSnapshot: r.lastCommittedSnapshot ?? {
            assortment: { assortedCount: r.assortment.assortedCount, totalCount: r.assortment.totalCount },
            sumIa: r.sumIa,
            avgIa: r.avgIa,
          },
        };
      })
    );
    pendingSuccessGroupsCountRef.current = groupsCount;
    if (optimisingToSuccessTimeoutRef.current) clearTimeout(optimisingToSuccessTimeoutRef.current);
    optimisingToSuccessTimeoutRef.current = setTimeout(() => {
      optimisingToSuccessTimeoutRef.current = null;
      setOptimisingBannerVisible(false);
      setRecSuccessBanner({ groupsCount });
      setShowRecommendationsInTable(true);
    }, 3000);
  };

  useEffect(() => {
    if (!recSuccessBanner) return;
    const id = setTimeout(() => setRecSuccessBanner(null), 5000);
    return () => clearTimeout(id);
  }, [recSuccessBanner]);

  useEffect(() => {
    if (!commitSuccessBannerVisible) return;
    const id = setTimeout(() => setCommitSuccessBannerVisible(false), 5000);
    return () => clearTimeout(id);
  }, [commitSuccessBannerVisible]);

  const filteredRows = filterRowsByFocusView(rows, focusView);
  const tableRows = isolateRowId
    ? filteredRows.filter((r) => r.id === isolateRowId)
    : filteredRows;

  const updateRow = (id: string, patch: Partial<AssortmentRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const onSelectRow = (id: string, checked: boolean) => {
    updateRow(id, { selected: checked });
  };

  const onSelectAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const onSumIaChange = (id: string, value: number) => {
    updateRow(id, { sumIa: value, hasPendingChanges: true });
  };

  const onAvgIaChange = (id: string, value: number) => {
    updateRow(id, { avgIa: value, hasPendingChanges: true });
  };

  const onAssort = (row: AssortmentRow) => {
    const { assortedCount, totalCount } = row.assortment;
    const next = Math.min(assortedCount + 1, totalCount);
    if (next === assortedCount) return;
    const assorted = `${next}/${totalCount} Assorted`;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== row.id) return r;
        const snapshot = r.lastCommittedSnapshot ?? {
          assortment: { assortedCount: r.assortment.assortedCount, totalCount: r.assortment.totalCount },
          sumIa: r.sumIa,
          avgIa: r.avgIa,
        };
        return {
          ...r,
          assortment: { ...r.assortment, assortedCount: next, assorted },
          hasPendingChanges: true,
          lastCommittedSnapshot: snapshot,
        };
      })
    );
  };

  const onUnassort = (row: AssortmentRow) => {
    const { assortedCount, totalCount } = row.assortment;
    const next = Math.max(assortedCount - 1, 0);
    if (next === assortedCount) return;
    const assorted = `${next}/${totalCount} Assorted`;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== row.id) return r;
        const snapshot = r.lastCommittedSnapshot ?? {
          assortment: { assortedCount: r.assortment.assortedCount, totalCount: r.assortment.totalCount },
          sumIa: r.sumIa,
          avgIa: r.avgIa,
        };
        return {
          ...r,
          assortment: { ...r.assortment, assortedCount: next, assorted },
          hasPendingChanges: true,
          lastCommittedSnapshot: snapshot,
        };
      })
    );
  };

  /** Set each of the given rows to fully assorted (used by SelectionActionBar Assort button). */
  const onAssortSelection = (rowsToAssort: AssortmentRow[]) => {
    setRows((prev) =>
      prev.map((r) => {
        if (!rowsToAssort.some((x) => x.id === r.id)) return r;
        const { totalCount } = r.assortment;
        const assorted = `${totalCount}/${totalCount} Assorted`;
        const snapshot = r.lastCommittedSnapshot ?? {
          assortment: { assortedCount: r.assortment.assortedCount, totalCount: r.assortment.totalCount },
          sumIa: r.sumIa,
          avgIa: r.avgIa,
        };
        return {
          ...r,
          assortment: { ...r.assortment, assortedCount: totalCount, assorted },
          hasPendingChanges: true,
          lastCommittedSnapshot: snapshot,
        };
      })
    );
  };

  /** Set each of the given rows to unassorted (used by SelectionActionBar Unassort button). */
  const onUnassortSelection = (rowsToUnassort: AssortmentRow[]) => {
    setRows((prev) =>
      prev.map((r) => {
        if (!rowsToUnassort.some((x) => x.id === r.id)) return r;
        const { totalCount } = r.assortment;
        const assorted = `0/${totalCount} Assorted`;
        const snapshot = r.lastCommittedSnapshot ?? {
          assortment: { assortedCount: r.assortment.assortedCount, totalCount: r.assortment.totalCount },
          sumIa: r.sumIa,
          avgIa: r.avgIa,
        };
        return {
          ...r,
          assortment: { ...r.assortment, assortedCount: 0, assorted },
          hasPendingChanges: true,
          lastCommittedSnapshot: snapshot,
        };
      })
    );
  };

  const onCommit = (id: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        // When committing after recommendation, make the recommendation the new allocation and remove the pill
        const committedSum = r.sumIaRecommendation ?? r.sumIa;
        const committedAvg = r.avgIaRecommendation ?? r.avgIa;
        const snapshot = {
          assortment: {
            assortedCount: r.assortment.assortedCount,
            totalCount: r.assortment.totalCount,
          },
          sumIa: committedSum,
          avgIa: committedAvg,
        };
        return {
          ...r,
          sumIa: committedSum,
          avgIa: committedAvg,
          sumIaRecommendation: undefined,
          avgIaRecommendation: undefined,
          committed: true,
          hasPendingChanges: false,
          lastCommittedSnapshot: snapshot,
        };
      })
    );
  };

  const onRevert = (id: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id || !r.lastCommittedSnapshot) return r;
        const s = r.lastCommittedSnapshot;
        const assorted = `${s.assortment.assortedCount}/${s.assortment.totalCount} Assorted`;
        return {
          ...r,
          assortment: {
            ...r.assortment,
            assortedCount: s.assortment.assortedCount,
            totalCount: s.assortment.totalCount,
            assorted,
          },
          sumIa: s.sumIa,
          avgIa: s.avgIa,
          hasPendingChanges: false,
        };
      })
    );
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <div
        className="flex gap-2 px-6"
        data-node-id="14764:268954"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-[#0267ff] text-[#00050a]'
                  : 'border-b-2 border-transparent text-[#4b535c] hover:text-[#00050a]'
              }`}
              data-name="tabs"
              data-node-id={isActive ? '14682:253997' : '14682:253998'}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {optimisingBannerVisible && !optimisingBannerDismissed && (
        <div className="fixed left-1/2 top-[116px] z-[60] w-full max-w-2xl -translate-x-1/2">
          <OptimisingIABanner
            onDismiss={() => {
              setOptimisingBannerDismissed(true);
              setOptimisingBannerVisible(false);
              if (optimisingToSuccessTimeoutRef.current) {
                clearTimeout(optimisingToSuccessTimeoutRef.current);
                optimisingToSuccessTimeoutRef.current = null;
              }
              setRecSuccessBanner({ groupsCount: pendingSuccessGroupsCountRef.current });
              setShowRecommendationsInTable(true);
            }}
          />
        </div>
      )}

      {commitSuccessBannerVisible && (
        <div className="fixed left-1/2 top-[116px] z-[60] w-full max-w-2xl -translate-x-1/2">
          <CommitSuccessBanner onDismiss={() => setCommitSuccessBannerVisible(false)} />
        </div>
      )}

      {recSuccessBanner && (
        <div
          className="fixed left-1/2 top-[116px] z-[60] w-full max-w-2xl -translate-x-1/2 flex items-center gap-3 rounded-[6px] border border-[#a234da] p-4"
          style={{ borderWidth: '0.5px', backgroundColor: '#fbf4ff' }}
          role="status"
          aria-live="polite"
        >
          <Sparkles size={24} className="shrink-0 text-[#a234da]" />
          <div className="min-w-0 flex-1 flex flex-col gap-2">
            <p className="text-lg font-medium leading-normal text-[#00050a]">
              Recommendations generated successfully
            </p>
            <p className="text-sm font-normal leading-normal text-[#00050a]">
              {recSuccessBanner.groupsCount} {recSuccessBanner.groupsCount === 1 ? 'group' : 'groups'} assorted
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRecSuccessBanner(null)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-[#00050a] transition-colors hover:bg-[#a234da]/10"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col min-h-0 px-6 py-4 gap-4">
        {/* Figma 618:142167 – Focus bar + Edit Log */}
        <div className="flex items-center gap-0 rounded-[5px] border border-[#e9eaeb] bg-white p-2">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="shrink-0 text-sm text-[#00050a]">Focus:</span>
            <button
              type="button"
              onClick={() => setFocusView('all')}
              className={`inline-flex h-[26px] items-center justify-center rounded-[1000px] border border-[#e9eaeb] px-4 py-1 text-xs font-normal leading-normal ${focusView === 'all' ? 'bg-[#f8f8f8] text-[#00050a]' : 'bg-white text-[#00050a] hover:bg-slate-50'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFocusView('pre-season-ia')}
              className={`inline-flex h-[26px] items-center gap-1.5 rounded-[1000px] border border-[#e9eaeb] px-4 py-1 text-xs font-normal leading-normal ${focusView === 'pre-season-ia' ? 'bg-[#f8f8f8] text-[#00050a]' : 'bg-white text-[#00050a] hover:bg-slate-50'}`}
            >
              <PreSeasonIAIcon size={14} />
              Pre-Season IA
            </button>
            <button
              type="button"
              onClick={() => setFocusView('in-season-ia')}
              className={`inline-flex h-[26px] items-center gap-1.5 rounded-[1000px] border border-[#e9eaeb] px-4 py-1 text-xs font-normal leading-normal ${focusView === 'in-season-ia' ? 'bg-[#f8f8f8] text-[#00050a]' : 'bg-white text-[#00050a] hover:bg-slate-50'}`}
            >
              <InSeasonIAIcon size={14} />
              In Season IA
            </button>
            {/* Drafts chip: match other view chips (pill), active = muted */}
            <button
              type="button"
              onClick={() => setFocusView('drafts')}
              className={`inline-flex h-[26px] items-center justify-center gap-1.5 rounded-[1000px] border border-[#e9eaeb] px-4 py-1 text-xs font-normal leading-normal whitespace-nowrap ${focusView === 'drafts' ? 'bg-[#f8f8f8] text-[#00050a]' : 'bg-white text-[#00050a] hover:bg-slate-50'}`}
            >
              <Layers size={14} className="shrink-0" aria-hidden />
              <span>Drafts</span>
            </button>
          </div>
          <button
            type="button"
            className="ml-2 flex h-10 min-w-[113px] shrink-0 items-center justify-center gap-2 rounded border border-[#e9eaeb] bg-[#f8f8f8] px-4 text-base font-medium text-[#00050a] whitespace-nowrap"
            aria-label="Edit Log"
          >
            <History size={16} className="shrink-0" />
            Edit Log
          </button>
        </div>

        {isolateRowId && (
          <div className="flex items-center gap-2 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            <span>Showing 1 row</span>
            <button
              type="button"
              onClick={() => setIsolateRowId(null)}
              className="font-medium text-sky-600 underline hover:text-sky-700"
            >
              Show all
            </button>
          </div>
        )}

        <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
          <div className="min-w-0 flex-1">
            <AssortmentTable
              rows={tableRows}
              onSelectRow={onSelectRow}
              onSelectAll={onSelectAll}
              onAssort={onAssort}
              onUnassort={onUnassort}
              onSumIaChange={onSumIaChange}
              onAvgIaChange={onAvgIaChange}
              onCommit={onCommit}
              onRevert={onRevert}
              onEditRow={(row, openFrom) => {
                const selected = rows.filter((r) => r.selected);
                const rowsToEdit =
                  openFrom === 'initial-allocation' && selected.length >= 2
                    ? selected
                    : [row];
                setEditAllocation({ rows: rowsToEdit, openFrom });
              }}
              onRequestCommit={(row) => {
                const selected = rows.filter((r) => r.selected);
                const rowsToCommit = selected.length > 0 ? selected : [row];
                setConfirmCommitRevert({ action: 'commit', rows: rowsToCommit });
              }}
              onRequestRevert={(row) => {
                const selected = rows.filter((r) => r.selected && r.hasPendingChanges);
                const rowsToRevert =
                  selected.some((r) => r.id === row.id) && selected.length > 0
                    ? selected
                    : [row];
                setConfirmCommitRevert({ action: 'revert', rows: rowsToRevert });
              }}
              isolateRowId={isolateRowId}
              onIsolateRow={setIsolateRowId}
              showRecommendationBadge={showRecommendationsInTable}
              showDraftsOnly={focusView === 'drafts'}
              onDraftToggle={(on) => setFocusView(on ? 'drafts' : 'all')}
            />
          </div>
        </div>
      </div>

      {editAllocation && (
        <EditAllocationPanel
          rows={editAllocation.rows.map((r) => rows.find((x) => x.id === r.id) ?? r)}
          openFrom={editAllocation.openFrom}
          onClose={() => setEditAllocation(null)}
          onSumIaChange={onSumIaChange}
          onAvgIaChange={onAvgIaChange}
          onAssort={onAssort}
          onUnassort={onUnassort}
          onAssortToMax={(row) => onAssortSelection([row])}
          onUnassortToZero={(row) => onUnassortSelection([row])}
          scheduledAssortmentDate={
            editAllocation.openFrom === 'assortment' && editAllocation.rows[0]
              ? (rows.find((r) => r.id === editAllocation.rows[0].id)?.scheduledAssortmentDate ?? '')
              : undefined
          }
          onScheduledAssortmentDateChange={(rowId, date) =>
            setRows((prev) =>
              prev.map((r) => (r.id === rowId ? { ...r, scheduledAssortmentDate: date || undefined } : r))
            )
          }
        />
      )}

      <ConfirmCommitRevertModal
        open={confirmCommitRevert != null}
        state={confirmCommitRevert}
        variant="slideout"
        onConfirm={(commitRowIds) => {
          if (confirmCommitRevert) {
            if (confirmCommitRevert.action === 'commit') {
              const ids = commitRowIds ?? confirmCommitRevert.rows.map((r) => r.id);
              ids.forEach((id) => onCommit(id));
              setCommitSuccessBannerVisible(true);
            } else {
              (confirmCommitRevert.rows ?? []).forEach((r) => onRevert(r.id));
            }
          }
        }}
        onClose={() => setConfirmCommitRevert(null)}
      />

      <SelectionActionBar
        selectedRows={rows.filter((r) => r.selected) ?? []}
        onClearSelection={() => setRows((prev) => prev.map((r) => ({ ...r, selected: false })))}
        onGenerateRecommendations={handleGenerateRecommendations}
        onOpenInitialAllocation={(rowsToEdit) => setEditAllocation({ rows: rowsToEdit, openFrom: 'initial-allocation' })}
        onAssortSelection={onAssortSelection}
        onUnassortSelection={onUnassortSelection}
        onAssort={onAssort}
        onUnassort={onUnassort}
        onRequestCommit={(selected) => setConfirmCommitRevert({ action: 'commit', rows: selected })}
        onRequestRevert={(selected) => setConfirmCommitRevert({ action: 'revert', rows: selected })}
        onCommit={onCommit}
        onRevert={onRevert}
      />
    </main>
  );
}
