import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, X, Home, ChevronRight, Filter, MapPin } from 'lucide-react';
import { AssortmentTable } from './AssortmentTable';
import { getProductDimensionLabel } from './DrillDownProductModal';
import { CommitSuccessBanner } from './CommitSuccessBanner';
import { ConfirmCommitRevertModal, type ConfirmCommitRevertState } from './ConfirmCommitRevertModal';
import { EditAllocationPanel } from './EditAllocationPanel';
import {
  AdvancedFiltersPopover,
  getAdvancedFilterLabel,
  type AdvancedFilterId,
} from './AdvancedFiltersPopover';
import { OptimisingIABanner } from './OptimisingIABanner';
import { SelectionActionBar } from './SelectionActionBar';
import {
  GenerateRecommendationsModal,
  type RecommendationMode,
} from './GenerateRecommendationsModal';
import { mockRows } from '../data/mockAssortment';
import { dropdownTriggerHoverBg } from '../lib/dropdownMenuClasses';
import type { AssortmentRow } from '../types';

type AdvancedFiltersAnchorState = {
  rect: DOMRect;
  source: 'button' | 'tag';
  /** Set when `source === 'tag'` — which dimension’s value picker is open. */
  tagDimensionId?: AdvancedFilterId;
};

type FocusView = 'all' | 'pre-season-ia' | 'in-season-ia';

type StatusTableFilter = 'all' | 'draft' | 'committed';

/** Split "A | B" breadcrumb labels for hierarchy row (parent → current). */
function splitPipePair(label: string): [string, string] | null {
  const sep = ' | ';
  const idx = label.indexOf(sep);
  if (idx === -1) return null;
  return [label.slice(0, idx), label.slice(idx + sep.length)];
}

/** Reference: gray uppercase truncated parent, | separator, bold dark current page. */
function BreadcrumbHierarchyPair({
  left,
  right,
  className = '',
}: {
  left: string;
  right: string;
  className?: string;
}) {
  return (
    <span
      className={`flex min-w-0 max-w-full items-center gap-3 ${className}`}
    >
      <span
        className="min-w-0 flex-1 truncate text-xs font-normal uppercase tracking-wide text-[#666666]"
        title={left}
      >
        {left}
      </span>
      <span
        className="shrink-0 select-none text-xs font-normal text-[#666666]"
        aria-hidden
      >
        |
      </span>
      <span
        className="line-clamp-2 min-w-0 max-w-[min(14rem,42vw)] shrink-0 text-left text-sm font-semibold leading-snug text-[#00050a] sm:max-w-[20rem]"
        title={right}
      >
        {right}
      </span>
    </span>
  );
}

function filterRowsByFocusView(rows: AssortmentRow[], view: FocusView): AssortmentRow[] {
  switch (view) {
    case 'pre-season-ia': {
      return rows.filter((r) => {
        if (r.assortment.assortedCount === 0) return true;
        const snap = r.lastCommittedSnapshot?.assortment.assortedCount;
        return Boolean(r.hasPendingChanges && snap === 0);
      });
    }
    case 'in-season-ia': {
      return rows.filter((r) => {
        if (r.assortment.assortedCount > 0) return true;
        const snap = r.lastCommittedSnapshot?.assortment.assortedCount;
        return Boolean(r.hasPendingChanges && snap != null && snap > 0);
      });
    }
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
  const [rows, setRows] = useState<AssortmentRow[]>(() =>
    mockRows.slice(0, 5).map((r) => initRow(r, false))
  );
  const [editAllocation, setEditAllocation] = useState<{
    rows: AssortmentRow[];
    openFrom: 'assortment' | 'initial-allocation';
  } | null>(null);
  const [confirmCommitRevert, setConfirmCommitRevert] = useState<ConfirmCommitRevertState | null>(null);
  const [focusView, setFocusView] = useState<FocusView>('all');
  const [statusTableFilter, setStatusTableFilter] = useState<StatusTableFilter>('all');
  const [productDrillPath, setProductDrillPath] = useState<{ id: string; label: string }[]>([]);
  const [regionsDrillBreadcrumb, setRegionsDrillBreadcrumb] = useState<{
    productHeaderLabel: string;
    productValue: string;
    locationHeaderLabel: string;
    locationValue: string;
  } | null>(null);
  /** Table column groupings before opening regions drill (restored when user backs out via breadcrumb). */
  const [regionsTableSnapshot, setRegionsTableSnapshot] = useState<{
    productGrouping: string;
    locationGrouping: string;
  } | null>(null);
  /** Breadcrumb after picking countries/locations from Location Type contextual drill */
  const [locationTypeSubDrillBreadcrumb, setLocationTypeSubDrillBreadcrumb] =
    useState<{ label: string } | null>(null);
  /** Table headers when gray crumb applies (Product + Location Group). */
  const [grayBreadcrumbHeaders, setGrayBreadcrumbHeaders] = useState<{
    productGrouping: string;
    locationGrouping: string;
  } | null>(null);
  /** Table headers in regions view (Product + Region). */
  const [regionsBreadcrumbHeaders, setRegionsBreadcrumbHeaders] = useState<{
    productGrouping: string;
    locationGrouping: string;
  } | null>(null);
  const [productColumnGrouping, setProductColumnGrouping] = useState('Product Group');
  const [locationColumnGrouping, setLocationColumnGrouping] = useState('Location Group');

  const restoreRegionsSnapshot = () => {
    if (!regionsTableSnapshot) return;
    setProductColumnGrouping(regionsTableSnapshot.productGrouping);
    setLocationColumnGrouping(regionsTableSnapshot.locationGrouping);
    setRegionsTableSnapshot(null);
  };
  const [optimisingBannerVisible, setOptimisingBannerVisible] = useState(false);
  const [optimisingBannerDismissed, setOptimisingBannerDismissed] = useState(false);
  const [, setHasGeneratedRecommendations] = useState(false);
  const [recSuccessBanner, setRecSuccessBanner] = useState<{ groupsCount: number } | null>(null);
  const [commitSuccessBannerVisible, setCommitSuccessBannerVisible] = useState(false);
  const [generateRecModalOpen, setGenerateRecModalOpen] = useState(false);
  const [advancedFiltersAnchor, setAdvancedFiltersAnchor] =
    useState<AdvancedFiltersAnchorState | null>(null);
  /** Advanced filter selections per breadcrumb level (button always visible). */
  const [advancedFiltersByScope, setAdvancedFiltersByScope] = useState<
    Record<string, AdvancedFilterId[]>
  >({});
  /** Per-dimension multi-select values (e.g. countries) keyed like advancedFiltersByScope. */
  const [advancedFilterValuesByScope, setAdvancedFilterValuesByScope] = useState<
    Record<string, Partial<Record<AdvancedFilterId, string[]>>>
  >({});
  const advancedFiltersBtnRef = useRef<HTMLButtonElement>(null);
  const advancedFiltersToolbarRef = useRef<HTMLDivElement>(null);

  const advancedFilterScopeKey = useMemo(() => {
    const pathIds = productDrillPath.map((c) => c.id).join('/');
    if (productDrillPath.length > 0 && locationTypeSubDrillBreadcrumb) {
      return `scope:loc-sub:${pathIds}`;
    }
    if (productDrillPath.length > 0 && regionsDrillBreadcrumb) {
      return `scope:regions:${pathIds}`;
    }
    if (productDrillPath.length > 0) {
      return `scope:drill:${pathIds}`;
    }
    return 'scope:home';
  }, [productDrillPath, locationTypeSubDrillBreadcrumb, regionsDrillBreadcrumb]);

  const advancedFilterScopeKeyRef = useRef(advancedFilterScopeKey);
  advancedFilterScopeKeyRef.current = advancedFilterScopeKey;

  const activeAdvancedFilterIds =
    advancedFiltersByScope[advancedFilterScopeKey] ?? [];

  const toggleAdvancedFilter = useCallback((id: AdvancedFilterId) => {
    const key = advancedFilterScopeKeyRef.current;
    setAdvancedFiltersByScope((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.includes(id)
        ? cur.filter((x) => x !== id)
        : [...cur, id];
      return { ...prev, [key]: next };
    });
  }, []);

  const toggleAdvancedFilterValue = useCallback(
    (dimensionId: AdvancedFilterId, valueId: string) => {
      const key = advancedFilterScopeKeyRef.current;
      setAdvancedFilterValuesByScope((prev) => {
        const scopeVals = prev[key] ?? {};
        const cur = scopeVals[dimensionId] ?? [];
        const nextVals = cur.includes(valueId)
          ? cur.filter((x) => x !== valueId)
          : [...cur, valueId];
        return { ...prev, [key]: { ...scopeVals, [dimensionId]: nextVals } };
      });
    },
    []
  );

  const selectAllFilteredAdvancedFilterValues = useCallback(
    (dimensionId: AdvancedFilterId, filteredIds: string[]) => {
      const key = advancedFilterScopeKeyRef.current;
      if (filteredIds.length === 0) return;
      setAdvancedFilterValuesByScope((prev) => {
        const scopeVals = prev[key] ?? {};
        const cur = new Set(scopeVals[dimensionId] ?? []);
        filteredIds.forEach((id) => cur.add(id));
        return { ...prev, [key]: { ...scopeVals, [dimensionId]: [...cur] } };
      });
    },
    []
  );

  const clearAdvancedFilterDimension = useCallback((id: AdvancedFilterId) => {
    const key = advancedFilterScopeKeyRef.current;
    setAdvancedFiltersByScope((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.filter((x) => x !== id);
      if (next.length === 0) {
        const out = { ...prev };
        delete out[key];
        return out;
      }
      return { ...prev, [key]: next };
    });
    setAdvancedFilterValuesByScope((prev) => {
      const scopeVals = prev[key];
      if (!scopeVals?.[id]) return prev;
      const nextScope = { ...scopeVals };
      delete nextScope[id];
      return { ...prev, [key]: nextScope };
    });
    setAdvancedFiltersAnchor((a) =>
      a?.source === 'tag' && a.tagDimensionId === id ? null : a
    );
  }, []);

  const clearActiveAdvancedFilters = useCallback(() => {
    const key = advancedFilterScopeKeyRef.current;
    setAdvancedFiltersByScope((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setAdvancedFilterValuesByScope((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setAdvancedFiltersAnchor(null);
  }, []);

  useEffect(() => {
    if (activeAdvancedFilterIds.length === 0) setAdvancedFiltersAnchor(null);
  }, [activeAdvancedFilterIds.length]);

  useEffect(() => {
    setAdvancedFiltersAnchor(null);
  }, [advancedFilterScopeKey]);

  useEffect(() => {
    const allowed = new Set(activeAdvancedFilterIds);
    setAdvancedFilterValuesByScope((prev) => {
      const scopeVals = prev[advancedFilterScopeKey];
      if (!scopeVals) return prev;
      let changed = false;
      const nextScope: Partial<Record<AdvancedFilterId, string[]>> = { ...scopeVals };
      for (const k of Object.keys(nextScope) as AdvancedFilterId[]) {
        if (!allowed.has(k)) {
          delete nextScope[k];
          changed = true;
        }
      }
      if (!changed) return prev;
      return { ...prev, [advancedFilterScopeKey]: nextScope };
    });
  }, [activeAdvancedFilterIds, advancedFilterScopeKey]);
  const optimisingToSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSuccessGroupsCountRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (optimisingToSuccessTimeoutRef.current) clearTimeout(optimisingToSuccessTimeoutRef.current);
    };
  }, []);

  const generateModalStats = useMemo(() => {
    const selected = rows.filter((r) => r.selected);
    const products = selected.reduce((s, r) => s + r.productGroup.productCount, 0);
    const locations = selected.reduce((s, r) => s + r.locationCluster.locationCount, 0);
    return {
      assortmentProducts: Math.max(products, 1),
      assortmentLocations: Math.max(locations, 1),
      iaOnlyProducts: Math.max(1, Math.round(products * 0.36)),
      iaOnlyLocations: Math.max(1, Math.round(locations * 0.6)),
    };
  }, [rows]);

  const runGenerateRecommendations = (mode: RecommendationMode) => {
    setOptimisingBannerVisible(true);
    setOptimisingBannerDismissed(false);
    setHasGeneratedRecommendations(true);
    setRows((prev) => {
      const selectedList = prev.filter((r) => r.selected);
      const groupsCount = selectedList.length;
      pendingSuccessGroupsCountRef.current = groupsCount;
      return prev.map((r) => {
        if (!r.selected) return r;
        const sumRec = 44;
        const avgRec =
          r.locationCluster.locationCount > 0
            ? sumRec / r.locationCluster.locationCount
            : r.avgIa;
        const base = {
          sumIaRecommendation: sumRec,
          avgIaRecommendation: avgRec,
          hasPendingChanges: true,
          lastCommittedSnapshot: r.lastCommittedSnapshot ?? {
            assortment: {
              assortedCount: r.assortment.assortedCount,
              totalCount: r.assortment.totalCount,
            },
            sumIa: r.sumIa,
            avgIa: r.avgIa,
          },
        };
        if (mode === 'ia-only') {
          return {
            ...r,
            ...base,
            assortmentRecommendationLabel: undefined,
          };
        }
        const recAssortCount = Math.min(
          r.assortment.assortedCount + 1,
          r.assortment.totalCount
        );
        const assortmentRecommendationLabel = `${recAssortCount}/${r.assortment.totalCount} Assorted`;
        return {
          ...r,
          ...base,
          assortmentRecommendationLabel,
        };
      });
    });
    if (optimisingToSuccessTimeoutRef.current) clearTimeout(optimisingToSuccessTimeoutRef.current);
    optimisingToSuccessTimeoutRef.current = setTimeout(() => {
      optimisingToSuccessTimeoutRef.current = null;
      setOptimisingBannerVisible(false);
      setRecSuccessBanner({ groupsCount: pendingSuccessGroupsCountRef.current });
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

  const filteredRows = (() => {
    let f = filterRowsByFocusView(rows, focusView);
    if (statusTableFilter === 'draft') f = f.filter((r) => r.hasPendingChanges);
    else if (statusTableFilter === 'committed') f = f.filter((r) => !r.hasPendingChanges);
    return f;
  })();
  const tableRows = filteredRows;

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
          ...(next === 0
            ? { scheduledAssortmentStart: undefined, scheduledAssortmentFinish: undefined }
            : {}),
          hasPendingChanges: true,
          lastCommittedSnapshot: snapshot,
        };
      })
    );
  };

  /** Set each of the given rows to fully assorted (used by SelectionActionBar Assort button). */
  const onAssortSelection = (rowsToAssort: AssortmentRow[]) => {
    const applyAssort = (r: AssortmentRow): AssortmentRow => {
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
    };
    setRows((prev) =>
      prev.map((r) => (rowsToAssort.some((x) => x.id === r.id) ? applyAssort(r) : r))
    );
    if (rowsToAssort.length >= 2) {
      setEditAllocation({
        rows: rowsToAssort.map(applyAssort),
        openFrom: 'assortment',
      });
    }
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
          scheduledAssortmentStart: undefined,
          scheduledAssortmentFinish: undefined,
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
          assortmentRecommendationLabel: undefined,
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
          className="fixed left-1/2 top-[116px] z-[60] w-full max-w-2xl -translate-x-1/2 flex items-center gap-3 rounded-[6px] border border-[#6864E6] p-4"
          style={{ borderWidth: '0.5px', backgroundColor: '#fbf4ff' }}
          role="status"
          aria-live="polite"
        >
          <Sparkles size={24} className="shrink-0 text-[#6864E6]" />
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-[#00050a] transition-colors hover:bg-[#6864E6]/10"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col min-h-0 bg-white px-6 py-4 gap-4">
        {/* Focus tabs — outside bordered toolbar card */}
        <div
          className="flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-2"
          data-node-id="14764:268954"
        >
          <div
            className="flex min-w-0 flex-wrap items-center gap-2"
            role="group"
            aria-label="Table focus"
          >
            <button
              type="button"
              onClick={() => {
                setFocusView('all');
                setStatusTableFilter('all');
              }}
              className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                focusView === 'all' && statusTableFilter === 'all'
                  ? 'border-[#0267ff] text-[#00050a]'
                  : 'border-transparent text-[#4b535c] hover:text-[#00050a]'
              }`}
              data-name="tabs"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setFocusView('pre-season-ia');
                setStatusTableFilter('all');
              }}
              className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                focusView === 'pre-season-ia' && statusTableFilter === 'all'
                  ? 'border-[#0267ff] text-[#00050a]'
                  : 'border-transparent text-[#4b535c] hover:text-[#00050a]'
              }`}
              data-name="tabs"
            >
              Pre-Season IA
            </button>
            <button
              type="button"
              onClick={() => {
                setFocusView('in-season-ia');
                setStatusTableFilter('all');
              }}
              className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                focusView === 'in-season-ia' && statusTableFilter === 'all'
                  ? 'border-[#0267ff] text-[#00050a]'
                  : 'border-transparent text-[#4b535c] hover:text-[#00050a]'
              }`}
              data-name="tabs"
            >
              In Season IA
            </button>
          </div>
        </div>

        {/* Toolbar: filters | status + breadcrumbs */}
        <div className="flex flex-col gap-[18px] rounded-[5px] border border-[#e9eaeb] bg-white p-2">
          <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div
              ref={advancedFiltersToolbarRef}
              className="flex min-w-0 max-w-full flex-wrap items-center justify-start gap-2"
            >
                  <button
                    ref={advancedFiltersBtnRef}
                    type="button"
                    onClick={() => {
                      setAdvancedFiltersAnchor((prev) => {
                        const r =
                          advancedFiltersBtnRef.current?.getBoundingClientRect();
                        if (!r) return null;
                        if (prev?.source === 'button') return null;
                        return { rect: r, source: 'button' as const };
                      });
                    }}
                    aria-expanded={Boolean(
                      advancedFiltersAnchor?.source === 'button'
                    )}
                    aria-haspopup="menu"
                    className="flex h-10 min-w-[158px] shrink-0 items-center justify-center gap-2 rounded border border-[#e9eaeb] bg-white px-4 whitespace-nowrap text-[#101828]"
                    aria-label="Advanced filters"
                  >
                    <Filter
                      size={16}
                      className="shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828]">
                      Advanced filters
                    </span>
                  </button>
                  {activeAdvancedFilterIds.map((filterId) => {
                    const valueCount =
                      advancedFilterValuesByScope[advancedFilterScopeKey]?.[filterId]
                        ?.length ?? 0;
                    const label = getAdvancedFilterLabel(filterId);
                    return (
                      <div
                        key={filterId}
                        data-filter-chip
                        data-name="tokens"
                        className="flex h-10 shrink-0 items-stretch overflow-hidden rounded-[4px] border-[0.5px] border-solid border-[#E3E8F0] bg-white"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            const root = (e.currentTarget as HTMLElement).parentElement;
                            if (!root) return;
                            const r = root.getBoundingClientRect();
                            setAdvancedFiltersAnchor((prev) => {
                              if (
                                prev?.source === 'tag' &&
                                prev.tagDimensionId === filterId
                              ) {
                                return null;
                              }
                              return {
                                rect: r,
                                source: 'tag' as const,
                                tagDimensionId: filterId,
                              };
                            });
                          }}
                          aria-expanded={Boolean(
                            advancedFiltersAnchor?.source === 'tag' &&
                              advancedFiltersAnchor.tagDimensionId === filterId
                          )}
                          aria-haspopup="menu"
                          className={`flex min-w-0 max-w-[min(220px,45vw)] items-center gap-2 border-0 bg-transparent px-3 py-0 text-left transition-colors ${dropdownTriggerHoverBg}`}
                          aria-label={`Filter by ${label}`}
                        >
                          <MapPin
                            size={14}
                            className="shrink-0 text-[#2EB8C2]"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <span className="truncate font-['Inter',sans-serif] text-[14px] font-normal leading-normal text-[#101828]">
                            Filters: {label}
                          </span>
                        </button>
                        <div
                          className="w-px shrink-0 self-stretch bg-[#E3E8F0]"
                          aria-hidden
                        />
                        <div className="flex min-w-[36px] shrink-0 items-center justify-center px-2">
                          <span className="font-['Inter',sans-serif] text-[14px] font-semibold tabular-nums leading-none text-[#101828]">
                            {valueCount}
                          </span>
                        </div>
                        <div
                          className="w-px shrink-0 self-stretch bg-[#E3E8F0]"
                          aria-hidden
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAdvancedFilterDimension(filterId);
                          }}
                          className={`flex shrink-0 items-center justify-center px-2.5 text-[#9AA4B2] transition-colors ${dropdownTriggerHoverBg} hover:text-[#6A7282]`}
                          aria-label={`Clear ${label} filter`}
                        >
                          <X size={16} strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    );
                  })}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <div
                className="flex flex-wrap items-center gap-2 font-['Inter',sans-serif] text-sm"
                role="group"
                aria-label="Status"
              >
                <span className="shrink-0 font-['Inter',sans-serif] text-[#4b535c]">Status:</span>
                <div className="inline-flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStatusTableFilter('all')}
                    aria-pressed={statusTableFilter === 'all'}
                    className={`rounded border px-3 py-1 font-['Inter',sans-serif] text-sm transition-colors ${
                      statusTableFilter === 'all'
                        ? 'border-oklch bg-[#f8f8f8] font-semibold text-[#00050a]'
                        : 'border-transparent font-normal text-[#4b535c] hover:text-[#00050a]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusTableFilter('draft')}
                    aria-pressed={statusTableFilter === 'draft'}
                    className={`rounded border px-3 py-1 font-['Inter',sans-serif] text-sm transition-colors ${
                      statusTableFilter === 'draft'
                        ? 'border-oklch bg-[#f8f8f8] font-semibold text-[#00050a]'
                        : 'border-transparent font-normal text-[#4b535c] hover:text-[#00050a]'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusTableFilter('committed')}
                    aria-pressed={statusTableFilter === 'committed'}
                    className={`rounded border px-3 py-1 font-['Inter',sans-serif] text-sm transition-colors ${
                      statusTableFilter === 'committed'
                        ? 'border-oklch bg-[#f8f8f8] font-semibold text-[#00050a]'
                        : 'border-transparent font-normal text-[#4b535c] hover:text-[#00050a]'
                    }`}
                  >
                    Committed
                  </button>
                </div>
              </div>
            </div>
          </div>
          <nav
            className="flex flex-wrap items-center gap-2 border-t border-[#e9eaeb] pt-2 text-xs font-normal leading-normal text-[#00050a]"
            aria-label="Product drill-down"
          >
              <button
                type="button"
                onClick={() => {
                  setProductDrillPath([]);
                  setRegionsDrillBreadcrumb(null);
                  setRegionsTableSnapshot(null);
                  setLocationTypeSubDrillBreadcrumb(null);
                  setGrayBreadcrumbHeaders(null);
                  setRegionsBreadcrumbHeaders(null);
                  setProductColumnGrouping('Product Group');
                  setLocationColumnGrouping('Location Group');
                  setAdvancedFiltersByScope({});
                  setAdvancedFilterValuesByScope({});
                  setAdvancedFiltersAnchor(null);
                }}
                className="inline-flex h-[26px] shrink-0 items-center gap-1.5 px-0 py-0.5 text-xs font-normal uppercase tracking-wide text-[#666666] transition-colors hover:text-[#00050a] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#666666]/30"
              >
                <Home size={14} className="shrink-0 text-[#6A7282]" strokeWidth={2} aria-hidden />
                Home
              </button>
              {productDrillPath.length > 0 && (
                <>
              {(() => {
                const hasRegionsTail = Boolean(regionsDrillBreadcrumb);
                const hasLocationTypeSubTail =
                  Boolean(locationTypeSubDrillBreadcrumb) && productDrillPath.length > 0;
                const crumbCompact =
                  'inline-flex h-[26px] shrink-0 max-w-[min(100vw-4rem,20rem)] min-w-0 items-center justify-center rounded-[1000px] border border-[#e9eaeb] bg-white px-4 py-1 text-xs font-normal leading-normal text-[#00050a] whitespace-nowrap transition-colors hover:bg-slate-50';
                /** Flat clickable hierarchy (no pill) — same as region drill segment. */
                const crumbHierarchyFlat =
                  'inline-flex min-h-[26px] max-w-[min(100vw-4rem,36rem)] min-w-0 items-center rounded-md px-1 py-0.5 text-left transition-colors hover:bg-slate-100';
                /** Current region / page segment — matches Status filter pressed (All / Draft / Committed). */
                const crumbHierarchyFlatCurrent =
                  'inline-flex min-h-[30px] max-w-[min(100vw-4rem,36rem)] min-w-0 items-center rounded border border-oklch bg-[#f8f8f8] px-3 py-1 text-left text-sm font-semibold text-[#00050a] transition-colors hover:bg-slate-100';
                const crumbActive =
                  'inline-flex min-h-[26px] max-w-[min(100vw-4rem,36rem)] min-w-0 items-center rounded-[1000px] border border-[#e9eaeb] bg-[#f8f8f8] px-4 py-2 text-left text-xs font-normal leading-normal text-[#00050a]';
                return productDrillPath.map((crumb, i) => {
                  const isLastCrumb = i === productDrillPath.length - 1;
                  const lastCrumbAsRegionsPair = isLastCrumb && hasRegionsTail;
                  return (
                    <span
                      key={`${crumb.id}-${i}`}
                      className={`flex items-center gap-2 ${lastCrumbAsRegionsPair ? 'min-w-0 flex-wrap' : ''}`}
                    >
                      <ChevronRight size={14} className="shrink-0 text-slate-400" aria-hidden />
                      {i < productDrillPath.length - 1 ? (
                        (() => {
                          const navPair = splitPipePair(crumb.label);
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setProductDrillPath(productDrillPath.slice(0, i + 1));
                                setRegionsDrillBreadcrumb(null);
                                setLocationTypeSubDrillBreadcrumb(null);
                                setRegionsBreadcrumbHeaders(null);
                                restoreRegionsSnapshot();
                              }}
                              className={navPair ? crumbHierarchyFlat : crumbCompact}
                            >
                              {navPair ? (
                                <BreadcrumbHierarchyPair
                                  left={navPair[0]}
                                  right={navPair[1]}
                                />
                              ) : (
                                <span className="truncate">{crumb.label}</span>
                              )}
                            </button>
                          );
                        })()
                      ) : lastCrumbAsRegionsPair && regionsDrillBreadcrumb ? (
                        <>
                          {(() => {
                            const grayPair = splitPipePair(crumb.label);
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (grayBreadcrumbHeaders) {
                                    setProductColumnGrouping(
                                      grayBreadcrumbHeaders.productGrouping
                                    );
                                    setLocationColumnGrouping(
                                      grayBreadcrumbHeaders.locationGrouping
                                    );
                                  }
                                  setRegionsDrillBreadcrumb(null);
                                  setRegionsTableSnapshot(null);
                                  setRegionsBreadcrumbHeaders(null);
                                }}
                                className={grayPair ? crumbHierarchyFlat : crumbCompact}
                                title={
                                  grayBreadcrumbHeaders
                                    ? `Stored headers: ${grayBreadcrumbHeaders.productGrouping}, ${grayBreadcrumbHeaders.locationGrouping}. Click to leave Region view.`
                                    : undefined
                                }
                                data-stored-product-header={grayBreadcrumbHeaders?.productGrouping}
                                data-stored-location-header={grayBreadcrumbHeaders?.locationGrouping}
                              >
                                {grayPair ? (
                                  <BreadcrumbHierarchyPair
                                    left={grayPair[0]}
                                    right={grayPair[1]}
                                  />
                                ) : (
                                  <span className="truncate">{crumb.label}</span>
                                )}
                              </button>
                            );
                          })()}
                          <ChevronRight
                            size={14}
                            className="shrink-0 text-slate-400"
                            aria-hidden
                          />
                          {(() => {
                            const regionLabel = `${regionsDrillBreadcrumb.productHeaderLabel}: ${regionsDrillBreadcrumb.productValue} | ${regionsDrillBreadcrumb.locationHeaderLabel}: ${regionsDrillBreadcrumb.locationValue}`;
                            const regionPair = splitPipePair(regionLabel);
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setRegionsDrillBreadcrumb(null);
                                  setLocationTypeSubDrillBreadcrumb(null);
                                  setRegionsBreadcrumbHeaders(null);
                                  restoreRegionsSnapshot();
                                }}
                                className={
                                  regionPair
                                    ? crumbHierarchyFlatCurrent
                                    : `${crumbActive} transition-colors hover:bg-slate-100`
                                }
                                title={
                                  regionsTableSnapshot && regionsBreadcrumbHeaders
                                    ? `Stored: ${regionsBreadcrumbHeaders.productGrouping} + ${regionsBreadcrumbHeaders.locationGrouping}. Back to ${regionsTableSnapshot.productGrouping} + ${regionsTableSnapshot.locationGrouping}.`
                                    : regionsTableSnapshot
                                      ? `Back to ${regionsTableSnapshot.productGrouping} + ${regionsTableSnapshot.locationGrouping}`
                                      : 'Back — restore column headers before Region'
                                }
                                data-stored-product-header={regionsBreadcrumbHeaders?.productGrouping}
                                data-stored-location-header={regionsBreadcrumbHeaders?.locationGrouping}
                                aria-current="page"
                              >
                                {regionPair ? (
                                  <BreadcrumbHierarchyPair
                                    left={regionPair[0]}
                                    right={regionPair[1]}
                                  />
                                ) : (
                                  <span className="line-clamp-2 leading-snug">{regionLabel}</span>
                                )}
                              </button>
                            );
                          })()}
                        </>
                      ) : hasLocationTypeSubTail ? (
                        (() => {
                          const tailPair = splitPipePair(crumb.label);
                          if (tailPair) {
                            return (
                              <span className="flex min-h-[26px] max-w-[min(100vw-4rem,36rem)] min-w-0 items-center py-0.5">
                                <BreadcrumbHierarchyPair
                                  left={tailPair[0]}
                                  right={tailPair[1]}
                                />
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex min-h-[26px] max-w-[min(100vw-4rem,20rem)] min-w-0 items-center rounded-[1000px] border border-[#e9eaeb] bg-white px-4 py-1 text-xs font-normal text-[#00050a]">
                              <span className="truncate">{crumb.label}</span>
                            </span>
                          );
                        })()
                      ) : (() => {
                          const pair = splitPipePair(crumb.label);
                          if (pair) {
                            return (
                              <span
                                className="flex min-h-[26px] max-w-[min(100vw-4rem,36rem)] min-w-0 items-center py-0.5"
                                aria-current="page"
                              >
                                <BreadcrumbHierarchyPair left={pair[0]} right={pair[1]} />
                              </span>
                            );
                          }
                          return (
                            <span className={`${crumbActive}`} aria-current="page">
                              <span className="line-clamp-2 text-left leading-snug">
                                {crumb.label}
                              </span>
                            </span>
                          );
                        })()}
                    </span>
                  );
                });
              })()}
              {locationTypeSubDrillBreadcrumb && productDrillPath.length > 0 && (
                <span className="flex items-center gap-2">
                  <ChevronRight size={14} className="shrink-0 text-slate-400" aria-hidden />
                  {(() => {
                    const subPair = splitPipePair(locationTypeSubDrillBreadcrumb.label);
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setLocationColumnGrouping('Location Type');
                          setLocationTypeSubDrillBreadcrumb(null);
                        }}
                        className={
                          subPair
                            ? 'inline-flex min-h-[26px] max-w-[min(100vw-4rem,36rem)] min-w-0 items-center rounded-md px-1 py-0.5 text-left transition-colors hover:bg-slate-100'
                            : 'inline-flex min-h-[26px] max-w-[min(100vw-4rem,36rem)] min-w-0 items-center rounded-[1000px] border border-[#e9eaeb] bg-[#f8f8f8] px-4 py-2 text-left text-xs font-normal leading-normal text-[#00050a] transition-colors hover:bg-slate-100'
                        }
                        title="Back to Location Type grouping"
                        aria-current="page"
                      >
                        {subPair ? (
                          <BreadcrumbHierarchyPair left={subPair[0]} right={subPair[1]} />
                        ) : (
                          <span className="line-clamp-2 leading-snug">
                            {locationTypeSubDrillBreadcrumb.label}
                          </span>
                        )}
                      </button>
                    );
                  })()}
                </span>
              )}
                </>
              )}
          </nav>
        </div>

        <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
          <div className="min-w-0 flex-1">
            <AssortmentTable
              rows={tableRows}
              productGrouping={productColumnGrouping}
              onProductGroupingChange={setProductColumnGrouping}
              locationGrouping={locationColumnGrouping}
              onLocationGroupingChange={setLocationColumnGrouping}
              productDrillDownActive={productDrillPath.length > 0}
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
              onProductDrillDimensionSelect={(dimensionId, ctx) => {
                setRegionsDrillBreadcrumb(null);
                setRegionsTableSnapshot(null);
                setRegionsBreadcrumbHeaders(null);
                setLocationTypeSubDrillBreadcrumb(null);
                const nextProduct = getProductDimensionLabel(dimensionId);
                if (ctx) {
                  setGrayBreadcrumbHeaders({
                    productGrouping: nextProduct,
                    locationGrouping: locationColumnGrouping,
                  });
                }
                setProductColumnGrouping(nextProduct);
                setProductDrillPath((prev) => [
                  ...prev,
                  {
                    id: dimensionId,
                    label: ctx
                      ? `product group: ${ctx.productGroupName} | location group: ${ctx.locationClusterName}`
                      : getProductDimensionLabel(dimensionId),
                  },
                ]);
              }}
              onLocationRegionsDrill={({
                productGroupingBefore,
                locationGroupingBefore,
                productHeaderLabel,
                productValue,
                locationHeaderLabel,
                locationValue,
              }) => {
                setLocationTypeSubDrillBreadcrumb(null);
                setRegionsTableSnapshot({
                  productGrouping: productGroupingBefore,
                  locationGrouping: locationGroupingBefore,
                });
                setRegionsBreadcrumbHeaders({
                  productGrouping: productGroupingBefore,
                  locationGrouping: 'Region',
                });
                setRegionsDrillBreadcrumb({
                  productHeaderLabel,
                  productValue,
                  locationHeaderLabel,
                  locationValue,
                });
              }}
              onLocationTypeSubDrill={({
                choiceLabel,
                productValue,
                locationTypeValue,
              }) => {
                setRegionsDrillBreadcrumb(null);
                setRegionsTableSnapshot(null);
                setLocationTypeSubDrillBreadcrumb({
                  label: `product: ${productValue} | location type: ${locationTypeValue} → ${choiceLabel}`,
                });
              }}
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
          onScheduledAssortmentScheduleChange={(rowId, field, value) =>
            setRows((prev) =>
              prev.map((r) =>
                r.id === rowId
                  ? {
                      ...r,
                      ...(field === 'start'
                        ? { scheduledAssortmentStart: value || undefined }
                        : { scheduledAssortmentFinish: value || undefined }),
                    }
                  : r
              )
            )
          }
          onAssortmentCancelDraft={() => {
            if (!editAllocation || editAllocation.openFrom !== 'assortment') return;
            editAllocation.rows.forEach((r) => onRevert(r.id));
            setEditAllocation(null);
          }}
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

      <GenerateRecommendationsModal
        open={generateRecModalOpen}
        onClose={() => setGenerateRecModalOpen(false)}
        onGenerate={runGenerateRecommendations}
        assortmentProducts={generateModalStats.assortmentProducts}
        assortmentLocations={generateModalStats.assortmentLocations}
        iaOnlyProducts={generateModalStats.iaOnlyProducts}
        iaOnlyLocations={generateModalStats.iaOnlyLocations}
      />

      <SelectionActionBar
        selectedRows={rows.filter((r) => r.selected) ?? []}
        onClearSelection={() => setRows((prev) => prev.map((r) => ({ ...r, selected: false })))}
        onGenerateRecommendations={() => setGenerateRecModalOpen(true)}
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

      {advancedFiltersAnchor && (
        <AdvancedFiltersPopover
          anchorRect={advancedFiltersAnchor.rect}
          triggerRefs={[advancedFiltersBtnRef, advancedFiltersToolbarRef]}
          variant={advancedFiltersAnchor.source === 'tag' ? 'values' : 'dimensions'}
          valueDimensionId={
            advancedFiltersAnchor.source === 'tag'
              ? advancedFiltersAnchor.tagDimensionId ?? null
              : null
          }
          selectedIds={activeAdvancedFilterIds}
          selectedValueIds={
            advancedFiltersAnchor.source === 'tag' &&
            advancedFiltersAnchor.tagDimensionId != null
              ? advancedFilterValuesByScope[advancedFilterScopeKey]?.[
                  advancedFiltersAnchor.tagDimensionId
                ] ?? []
              : []
          }
          onToggle={toggleAdvancedFilter}
          onToggleValue={(valueId) => {
            const dim = advancedFiltersAnchor.tagDimensionId;
            if (advancedFiltersAnchor.source === 'tag' && dim) {
              toggleAdvancedFilterValue(dim, valueId);
            }
          }}
          onSelectAllFilteredValues={(ids) => {
            const dim = advancedFiltersAnchor.tagDimensionId;
            if (advancedFiltersAnchor.source === 'tag' && dim) {
              selectAllFilteredAdvancedFilterValues(dim, ids);
            }
          }}
          onClearAll={clearActiveAdvancedFilters}
          onClose={() => setAdvancedFiltersAnchor(null)}
        />
      )}
    </main>
  );
}
