export interface AssortmentRow {
  id: string;
  productGroup: { name: string; productCount: number };
  locationCluster: { name: string; locationCount: number };
  whUnits: { value: number; sub: string };
  storeOh: number;
  sales: { value: number; sub: string };
  sellThru: { percent: number };
  forecast: { value: number; sub: string };
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
  /** Recommendation value shown below Sum IA after generating recommendations */
  sumIaRecommendation?: number;
  /** Recommendation value shown below Avg IA after generating recommendations */
  avgIaRecommendation?: number;
  /** Optional schedule window (YYYY-MM-DD) for when assortment change applies. Set from EditAllocationPanel. */
  scheduledAssortmentStart?: string;
  scheduledAssortmentFinish?: string;
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
