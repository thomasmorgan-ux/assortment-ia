import { useState, useRef, useEffect, useMemo, useCallback, type SetStateAction } from 'react';
import {
  Sparkles,
  X,
  Filter,
  MapPin,
  Info,
  ChevronDown,
  ArrowDown,
  Check,
} from 'lucide-react';
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
import {
  drillDropdownMenuItemHover,
  dropdownTriggerHoverBg,
} from '../lib/dropdownMenuClasses';
import type { AssortmentRow } from '../types';

type AdvancedFiltersAnchorState = {
  rect: DOMRect;
  source: 'button' | 'tag';
  /** Set when `source === 'tag'` — which dimension’s value picker is open. */
  tagDimensionId?: AdvancedFilterId;
};

type FocusView = 'all' | 'pre-season-ia' | 'in-season-ia' | 'service-level';

/** Options in the toolbar metric split-dropdown (matches design). */
type ToolbarMetricOptionId =
  | 'product'
  | 'location'
  | 'sales-l7d'
  | 'sales-l30d'
  | 'inventory'
  | 'forecast-wk'
  | 'target-coverage'
  | 'wh-units'
  | 'wh-pfp'
  | 'ia'
  | 'recommended-ia'
  | 'wh-stock-pct-ia';

const TOOLBAR_METRIC_OPTIONS: readonly { id: ToolbarMetricOptionId; label: string }[] = [
  { id: 'product', label: 'Product' },
  { id: 'location', label: 'Location' },
  { id: 'sales-l7d', label: 'Sales L7D' },
  { id: 'sales-l30d', label: 'Sales L30D' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'forecast-wk', label: 'Forecast /wk' },
  { id: 'target-coverage', label: 'Target Coverage' },
  { id: 'wh-units', label: 'WH Units' },
  { id: 'wh-pfp', label: 'WH PFP' },
  { id: 'ia', label: 'IA' },
  { id: 'recommended-ia', label: 'Recommended IA' },
  { id: 'wh-stock-pct-ia', label: '%WH stock for IA' },
];

function toolbarMetricLabel(id: ToolbarMetricOptionId): string {
  const row = TOOLBAR_METRIC_OPTIONS.find((o) => o.id === id);
  return row?.label ?? 'Sales L7D';
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
    case 'service-level':
      /** Placeholder until rows expose service-level fields to filter on. */
      return rows;
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
  const [productDrillPath, setProductDrillPath] = useState<{ id: string; label: string }[]>([]);
  const [regionsDrillBreadcrumb, setRegionsDrillBreadcrumb] = useState<{
    productHeaderLabel: string;
    productValue: string;
    locationHeaderLabel: string;
    locationValue: string;
  } | null>(null);
  /** Contextual drill after picking countries/locations from Location Type. */
  const [locationTypeSubDrillBreadcrumb, setLocationTypeSubDrillBreadcrumb] =
    useState<{ label: string } | null>(null);
  /** Product / Location grouping — non–service-level tabs (e.g. All) default to group-level headers. */
  const [allTabProductGrouping, setAllTabProductGrouping] = useState('Product Group');
  const [allTabLocationGrouping, setAllTabLocationGrouping] = useState('Location Group');
  /** Service level tab uses Product / Location headers and SKU-style cells (see design). */
  const [serviceTabProductGrouping, setServiceTabProductGrouping] = useState('Product');
  const [serviceTabLocationGrouping, setServiceTabLocationGrouping] = useState('Location');
  const isServiceLevelTab = focusView === 'service-level';
  const productColumnGrouping = isServiceLevelTab
    ? serviceTabProductGrouping
    : allTabProductGrouping;
  const locationColumnGrouping = isServiceLevelTab
    ? serviceTabLocationGrouping
    : allTabLocationGrouping;
  const setProductColumnGrouping = useCallback(
    (value: SetStateAction<string>) => {
      if (focusView === 'service-level') setServiceTabProductGrouping(value);
      else setAllTabProductGrouping(value);
    },
    [focusView]
  );
  const setLocationColumnGrouping = useCallback(
    (value: SetStateAction<string>) => {
      if (focusView === 'service-level') setServiceTabLocationGrouping(value);
      else setAllTabLocationGrouping(value);
    },
    [focusView]
  );
  const [optimisingBannerVisible, setOptimisingBannerVisible] = useState(false);
  const [optimisingBannerDismissed, setOptimisingBannerDismissed] = useState(false);
  const [hasGeneratedRecommendations, setHasGeneratedRecommendations] = useState(false);
  const [assortmentScheduleColumnVisible, setAssortmentScheduleColumnVisible] = useState(false);
  const [newRecsAvailableBannerDismissed, setNewRecsAvailableBannerDismissed] = useState(false);
  const [recSuccessBanner, setRecSuccessBanner] = useState<{ groupsCount: number } | null>(null);
  const [commitSuccessBannerVisible, setCommitSuccessBannerVisible] = useState(false);
  const [generateRecModalOpen, setGenerateRecModalOpen] = useState(false);
  const [advancedFiltersAnchor, setAdvancedFiltersAnchor] =
    useState<AdvancedFiltersAnchorState | null>(null);
  /** Advanced filter selections per drill scope (button always visible). */
  const [advancedFiltersByScope, setAdvancedFiltersByScope] = useState<
    Record<string, AdvancedFilterId[]>
  >({});
  /** Per-dimension multi-select values (e.g. countries) keyed like advancedFiltersByScope. */
  const [advancedFilterValuesByScope, setAdvancedFilterValuesByScope] = useState<
    Record<string, Partial<Record<AdvancedFilterId, string[]>>>
  >({});
  const advancedFiltersBtnRef = useRef<HTMLButtonElement>(null);
  const advancedFiltersToolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarMetricOpen, setToolbarMetricOpen] = useState(false);
  const [toolbarMetric, setToolbarMetric] = useState<ToolbarMetricOptionId>('sales-l7d');
  const toolbarMetricDropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!toolbarMetricOpen) return;
    const handle = (e: MouseEvent) => {
      if (toolbarMetricDropdownRef.current?.contains(e.target as Node)) return;
      setToolbarMetricOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [toolbarMetricOpen]);

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

  const filteredRows = filterRowsByFocusView(rows, focusView);
  const tableRows = filteredRows;

  const updateRow = (id: string, patch: Partial<AssortmentRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const handleScheduledAssortmentScheduleChange = useCallback(
    (rowId: string, field: 'start' | 'finish', value: string) => {
      if (String(value ?? '').trim() !== '') {
        setAssortmentScheduleColumnVisible(true);
      }
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
      );
    },
    []
  );

  const onSelectRow = (id: string, checked: boolean) => {
    updateRow(id, { selected: checked });
  };

  const onSelectAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const onSumIaChange = (id: string, value: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const lc = r.locationCluster.locationCount;
        const nextAvg = lc > 0 ? value / lc : r.avgIa;
        return { ...r, sumIa: value, avgIa: nextAvg, hasPendingChanges: true };
      })
    );
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

  const handleAssortmentCountChange = useCallback((rowId: string, rawCount: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const { totalCount } = r.assortment;
        const next = Math.max(0, Math.min(Math.trunc(rawCount), totalCount));
        if (next === r.assortment.assortedCount) return r;
        const assorted = `${next}/${totalCount} Assorted`;
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
  }, []);

  const snapshotForRow = (r: AssortmentRow) =>
    r.lastCommittedSnapshot ?? {
      assortment: { assortedCount: r.assortment.assortedCount, totalCount: r.assortment.totalCount },
      sumIa: r.sumIa,
      avgIa: r.avgIa,
    };

  const onAssortedSkuLocsAll = useCallback((row: AssortmentRow) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== row.id) return r;
        const { totalCount } = r.assortment;
        const assorted = `${totalCount}/${totalCount} Assorted`;
        const skuTotal = r.assortedSkuLocs.now.total;
        return {
          ...r,
          assortment: { ...r.assortment, assortedCount: totalCount, assorted },
          assortedSkuLocs: {
            ...r.assortedSkuLocs,
            now: { count: skuTotal, total: skuTotal },
          },
          hasPendingChanges: true,
          lastCommittedSnapshot: snapshotForRow(r),
        };
      })
    );
  }, []);

  const onAssortedSkuLocsNone = useCallback((row: AssortmentRow) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== row.id) return r;
        const { totalCount } = r.assortment;
        const assorted = `0/${totalCount} Assorted`;
        return {
          ...r,
          assortment: { ...r.assortment, assortedCount: 0, assorted },
          assortedSkuLocs: {
            ...r.assortedSkuLocs,
            now: { ...r.assortedSkuLocs.now, count: 0 },
          },
          scheduledAssortmentStart: undefined,
          scheduledAssortmentFinish: undefined,
          hasPendingChanges: true,
          lastCommittedSnapshot: snapshotForRow(r),
        };
      })
    );
  }, []);

  const onAssortedSkuLocsRec = useCallback((row: AssortmentRow) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== row.id) return r;
        const { rec, now } = r.assortedSkuLocs;
        const { totalCount } = r.assortment;
        const targetSku = Math.max(0, Math.min(rec.count, now.total));
        const nextAssortedCount =
          now.total > 0
            ? Math.max(0, Math.min(Math.round((targetSku / now.total) * totalCount), totalCount))
            : r.assortment.assortedCount;
        const assorted = `${nextAssortedCount}/${totalCount} Assorted`;
        return {
          ...r,
          assortment: { ...r.assortment, assortedCount: nextAssortedCount, assorted },
          assortedSkuLocs: {
            ...r.assortedSkuLocs,
            now: { ...now, count: targetSku },
          },
          hasPendingChanges: true,
          lastCommittedSnapshot: snapshotForRow(r),
        };
      })
    );
  }, []);

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
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
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
          className="fixed left-1/2 top-[116px] z-[60] w-full max-w-2xl -translate-x-1/2 flex items-center gap-3 rounded-[6px] border-[0.5px] border-solid border-[#6864E6] bg-[#fbf4ff] p-4"
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain bg-white px-6 py-4">
        {/* Focus tabs — outside bordered toolbar card */}
        <div className="flex w-full min-w-0 flex-col gap-3">
          {focusView !== 'service-level' && !newRecsAvailableBannerDismissed && (
            <div
              className="flex w-full min-w-0 flex-wrap items-start gap-3 rounded-[6px] border-[0.5px] border-solid border-[#6864E6] bg-[#6864E6]/10 p-4 sm:items-center sm:gap-4"
              role="region"
              aria-label="New recommendations available"
            >
              <Info
                className="mt-0.5 h-6 w-6 shrink-0 text-[#6864E6] sm:mt-0"
                strokeWidth={2}
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="font-['Inter',sans-serif] text-[18px] font-medium leading-normal text-[#00050a]">
                  New recommendations available
                </p>
                <p className="font-['Inter',sans-serif] text-sm font-normal leading-normal text-[#4b535c]">
                  They apply to sku-locations in your current view. Would you like to accept them?
                </p>
              </div>
              <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-4 sm:ml-auto sm:w-auto sm:shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewRecsAvailableBannerDismissed(true);
                      setGenerateRecModalOpen(true);
                    }}
                    className="inline-flex h-[34px] min-h-[34px] max-h-[34px] shrink-0 items-center justify-center gap-2 rounded border-[0.5px] border-solid border-[#e9eaeb] bg-white px-4 py-0 font-['Inter',sans-serif] text-[14px] font-medium leading-normal text-[#00050a] transition-colors hover:bg-slate-50 hover:text-[#0267FF]"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRecsAvailableBannerDismissed(true)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-[#00050a] transition-colors hover:bg-black/[0.06]"
                    aria-label="Dismiss"
                  >
                    <X size={16} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          )}
          <div
            className="flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-2"
            data-node-id="14764:268954"
          >
          <div
            className="flex min-w-0 flex-wrap items-center gap-2"
            role="tablist"
            aria-label="Table focus"
          >
            <button
              type="button"
              id="tab-focus-all"
              onClick={() => setFocusView('all')}
              className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                focusView === 'all'
                  ? 'border-[#2EB8C2] text-[#00050a]'
                  : 'border-transparent text-[#4b535c] hover:text-[#00050a]'
              }`}
              data-name="tabs"
              role="tab"
              aria-selected={focusView === 'all'}
              aria-controls="assortment-focus-panel"
            >
              All
            </button>
            <button
              type="button"
              id="tab-focus-pre-season-ia"
              onClick={() => setFocusView('pre-season-ia')}
              className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                focusView === 'pre-season-ia'
                  ? 'border-[#2EB8C2] text-[#00050a]'
                  : 'border-transparent text-[#4b535c] hover:text-[#00050a]'
              }`}
              data-name="tabs"
              role="tab"
              aria-selected={focusView === 'pre-season-ia'}
              aria-controls="assortment-focus-panel"
            >
              Pre-season
            </button>
            <button
              type="button"
              id="tab-focus-in-season-ia"
              onClick={() => setFocusView('in-season-ia')}
              className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                focusView === 'in-season-ia'
                  ? 'border-[#2EB8C2] text-[#00050a]'
                  : 'border-transparent text-[#4b535c] hover:text-[#00050a]'
              }`}
              data-name="tabs"
              role="tab"
              aria-selected={focusView === 'in-season-ia'}
              aria-controls="assortment-focus-panel"
            >
              In-season
            </button>
            <button
              type="button"
              id="tab-focus-service-level"
              onClick={() => setFocusView('service-level')}
              className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                focusView === 'service-level'
                  ? 'border-[#2EB8C2] text-[#00050a]'
                  : 'border-transparent text-[#4b535c] hover:text-[#00050a]'
              }`}
              data-name="tabs"
              role="tab"
              aria-selected={focusView === 'service-level'}
              aria-controls="assortment-focus-panel"
            >
              Service level
            </button>
          </div>
          </div>
        </div>

        {/* IA toolbar — omitted on Service level; main content is only the assortment table panel */}
        {focusView !== 'service-level' && (
        <div className="flex flex-col gap-[18px] bg-white">
          <div className="flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <div
              ref={advancedFiltersToolbarRef}
              className="flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-start gap-2"
            >
              <div
                ref={toolbarMetricDropdownRef}
                className="relative flex h-[34px] min-h-[34px] max-h-[34px] shrink-0 overflow-visible rounded-[4px] border-[0.5px] border-solid border-[#e9eaeb] bg-white"
              >
                <button
                  type="button"
                  onClick={() => setToolbarMetricOpen((o) => !o)}
                  aria-expanded={toolbarMetricOpen}
                  aria-haspopup="listbox"
                  aria-controls="toolbar-metric-listbox"
                  className="flex min-w-[148px] max-w-[min(220px,50vw)] items-center justify-between gap-2 border-0 bg-transparent px-3 py-0 text-left font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828]"
                >
                  <span className="truncate">{toolbarMetricLabel(toolbarMetric)}</span>
                  <ChevronDown size={14} className="shrink-0 text-[#6A7282]" aria-hidden />
                </button>
                <div className="w-[0.5px] shrink-0 self-stretch bg-[#e9eaeb]" aria-hidden />
                <button
                  type="button"
                  className="flex w-10 shrink-0 items-center justify-center border-0 bg-transparent text-[#101828]"
                  aria-label={`Sort by ${toolbarMetricLabel(toolbarMetric)}`}
                >
                  <ArrowDown size={16} strokeWidth={2} aria-hidden />
                </button>
                {toolbarMetricOpen && (
                  <div
                    id="toolbar-metric-listbox"
                    role="listbox"
                    aria-label="Table metric"
                    className="absolute left-0 top-full z-[210] mt-0.5 flex min-w-full w-max max-w-[min(280px,calc(100vw-2rem))] max-h-[min(320px,85vh)] flex-col gap-1 overflow-y-auto rounded-[4px] bg-white p-2 shadow-[0px_8px_25px_0px_rgba(0,0,0,0.12)]"
                  >
                    {TOOLBAR_METRIC_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={toolbarMetric === opt.id}
                        onClick={() => {
                          setToolbarMetric(opt.id);
                          setToolbarMetricOpen(false);
                        }}
                        className={`flex h-9 w-full shrink-0 cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-[4px] bg-white px-3 py-0 text-left font-['Inter',sans-serif] text-[12px] font-medium leading-normal text-[#00050a] transition-colors ${drillDropdownMenuItemHover} ${
                          toolbarMetric === opt.id ? 'bg-slate-100' : ''
                        }`}
                      >
                        {opt.label}
                        {toolbarMetric === opt.id && (
                          <Check size={14} className="shrink-0 text-[#00050a]" strokeWidth={2} aria-hidden />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                ref={advancedFiltersBtnRef}
                type="button"
                onClick={() => {
                  setAdvancedFiltersAnchor((prev) => {
                    const r = advancedFiltersBtnRef.current?.getBoundingClientRect();
                    if (!r) return null;
                    if (prev?.source === 'button') return null;
                    return { rect: r, source: 'button' as const };
                  });
                }}
                aria-expanded={Boolean(advancedFiltersAnchor?.source === 'button')}
                aria-haspopup="menu"
                className="flex h-[34px] min-h-[34px] max-h-[34px] shrink-0 items-center justify-center gap-2 rounded-[4px] border-[0.5px] border-solid border-[#e9eaeb] bg-white px-4 whitespace-nowrap text-[#101828] transition-colors hover:border-[#d1d5db]"
                aria-label="Filters"
              >
                <Filter size={16} className="shrink-0" strokeWidth={2} aria-hidden />
                <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-normal text-[#101828]">
                  Filters
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
          </div>
        </div>
        )}

        <div className="flex flex-col gap-0">
          <div
            id="assortment-focus-panel"
            role="tabpanel"
            aria-labelledby={
              focusView === 'all'
                ? 'tab-focus-all'
                : focusView === 'pre-season-ia'
                  ? 'tab-focus-pre-season-ia'
                  : focusView === 'in-season-ia'
                    ? 'tab-focus-in-season-ia'
                    : 'tab-focus-service-level'
            }
            className="flex min-w-0 flex-col"
          >
            <AssortmentTable
              rows={tableRows}
              serviceLevelView={focusView === 'service-level'}
              showAssortmentRecommendationsColumn={hasGeneratedRecommendations}
              showAssortmentScheduleColumn={assortmentScheduleColumnVisible}
              productGrouping={productColumnGrouping}
              onProductGroupingChange={setProductColumnGrouping}
              locationGrouping={locationColumnGrouping}
              onLocationGroupingChange={setLocationColumnGrouping}
              productDrillDownActive={productDrillPath.length > 0}
              onSelectRow={onSelectRow}
              onSelectAll={onSelectAll}
              onAssort={onAssort}
              onUnassort={onUnassort}
              onAssortToMax={(row) => onAssortSelection([row])}
              onUnassortToZero={(row) => onUnassortSelection([row])}
              onSumIaChange={onSumIaChange}
              onAvgIaChange={onAvgIaChange}
              onCommit={onCommit}
              onRevert={onRevert}
              onScheduledAssortmentScheduleChange={handleScheduledAssortmentScheduleChange}
              onAssortmentCountChange={handleAssortmentCountChange}
              onAssortedSkuLocsAll={onAssortedSkuLocsAll}
              onAssortedSkuLocsNone={onAssortedSkuLocsNone}
              onAssortedSkuLocsRec={onAssortedSkuLocsRec}
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
                setLocationTypeSubDrillBreadcrumb(null);
                const nextProduct = getProductDimensionLabel(dimensionId);
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
                productHeaderLabel,
                productValue,
                locationHeaderLabel,
                locationValue,
              }) => {
                setLocationTypeSubDrillBreadcrumb(null);
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
                setLocationTypeSubDrillBreadcrumb({
                  label: `product: ${productValue} | location type: ${locationTypeValue} → ${choiceLabel}`,
                });
              }}
            />
          </div>
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
          onScheduledAssortmentScheduleChange={handleScheduledAssortmentScheduleChange}
          onAssortmentCountChange={handleAssortmentCountChange}
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
