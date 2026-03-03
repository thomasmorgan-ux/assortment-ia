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
}

export type ModalKind = 'edit-allocation' | 'product-group' | 'location-cluster' | 'assort' | null;
