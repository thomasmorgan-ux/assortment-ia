export interface AssortmentRow {
  id: string;
  productGroup: { name: string; productCount: number };
  locationCluster: { name: string; locationCount: number };
  whUnits: { value: number; sub: string };
  storeOh: number;
  /** Last 7 days / last 30 days sales counts (table shows with L7D / L30D labels). */
  sales: { l7d: number; l30d: number };
  /** Assorted SKU × location pairs: `now` drives the progress pill; `rec` retained for data/API parity. */
  assortedSkuLocs: {
    now: { count: number; total: number };
    rec: { count: number; total: number };
    /** Subtext under the pill (“Managed by you” vs “Some managed by autone”). */
    managementKind?: 'you' | 'autone';
  };
  sellThru: { percent: number };
  forecast: { value: number; sub: string };
  /** Weekly forecast total (“Forecast /wk” column, thousands separator in UI). */
  forecastPerWeek: number;
  /** Target coverage horizon (shown as “N week(s)”, right-aligned in table). */
  targetCoverageWeeks: number;
  /** Main-table inventory total (thousands separator in UI). */
  inventoryCount: number;
  /** WH stock: primary total + PFP sub-line. */
  whStock: { value: number; pfp: number };
  /** % WH stock for IA (one decimal in UI). */
  whStockPctForIa: number;
  assortment: { assorted: string; assortedCount: number; totalCount: number };
  sumIa: number;
  avgIa: number;
  mq: number;
  committed: boolean;
  selected?: boolean;
  /** True when row has uncommitted Assort/Unassort or IA edits */
  hasPendingChanges?: boolean;
  /** Snapshot at last commit; used to revert */
  lastCommittedSnapshot?: {
    assortment: { assortedCount: number; totalCount: number };
    sumIa: number;
    avgIa: number;
  };
  /** Suggested assortment label after generating recommendations (e.g. "3/5 Assorted") */
  assortmentRecommendationLabel?: string;
  /** Recommendation value shown below Sum IA after generating recommendations */
  sumIaRecommendation?: number;
  /** Recommendation value shown below Avg IA after generating recommendations */
  avgIaRecommendation?: number;
  /** Optional schedule window (YYYY-MM-DD) for when assortment change applies. Set from EditAllocationPanel. */
  scheduledAssortmentStart?: string;
  scheduledAssortmentFinish?: string;
  /** Service level table: “Next scheduled event” column (deadline + schedule name). */
  nextScheduledEvent?: { deadlineLabel: string; scheduleName: string };
  /** Extra columns when product drill-down breadcrumb is active */
  productDrillMetrics?: {
    skuLocations: number;
    minQty: number;
    inventory: number;
    targetCoverageWk: number;
    forecastSalesPerWk: number;
  };
}

export type ModalKind = 'edit-allocation' | 'product-group' | 'location-cluster' | 'assort' | null;
