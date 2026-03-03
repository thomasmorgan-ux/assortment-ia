import { Filter, MapPin, Info, CircleCheck } from 'lucide-react';
import type { AssortmentRow, ModalKind } from '../types';

interface AssortmentTableProps {
  rows: AssortmentRow[];
  onSelectRow: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onAssort: (row: AssortmentRow) => void;
  onUnassort: (row: AssortmentRow) => void;
  onSumIaChange: (id: string, value: number) => void;
  onAvgIaChange: (id: string, value: number) => void;
  onOpenModal: (kind: ModalKind, row?: AssortmentRow) => void;
  onCommit: (id: string) => void;
}

export function AssortmentTable({
  rows,
  onSelectRow,
  onSelectAll,
  onAssort,
  onUnassort,
  onSumIaChange,
  onAvgIaChange,
  onOpenModal,
  onCommit,
}: AssortmentTableProps) {
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);

  return (
    <div
      className="rounded-lg overflow-hidden bg-white border border-[#e9eaeb]"
      data-name="Table container"
      data-node-id="14764:268974"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse">
          <thead>
            <tr className="bg-[#f8f8f8]">
              <th className="h-12 min-h-[48px] px-4 py-3 text-left">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-[#e9eaeb] bg-white text-sky-600 focus:ring-sky-500"
                  />
                </label>
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-sm font-medium text-[#00050a]">
                Product Group
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-sm font-medium text-[#00050a]">
                Location Cluster
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-sm font-medium text-[#00050a]">
                WH Units
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-sm font-medium text-[#00050a]">
                Store OH
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-sm font-medium text-[#00050a]">
                Sales
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-sm font-medium text-[#00050a]">
                Sell Thru
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-sm font-medium text-[#00050a]">
                Forecast
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-sm font-medium text-[#00050a]">
                Assortment
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-left text-sm font-medium text-[#00050a]">
                Initial Allocation
              </th>
              <th className="h-12 min-h-[48px] px-4 py-3 text-center text-sm font-medium text-[#00050a]">
                Commit
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="bg-white border-b border-[#e9eaeb] hover:bg-[#f8f8f8]/50 transition-colors"
                data-name="table-cell"
              >
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <input
                    type="checkbox"
                    checked={!!row.selected}
                    onChange={(e) => onSelectRow(row.id, e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-[#e9eaeb] bg-white text-sky-600 focus:ring-sky-500"
                  />
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-sky-600 transition-colors shrink-0"
                      onClick={() => onOpenModal('product-group', row)}
                      aria-label="Filter product group"
                    >
                      <Filter size={14} />
                    </button>
                    <div>
                      <div className="font-medium text-slate-900">
                        {row.productGroup.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        {row.productGroup.productCount} Products
                        <button
                          type="button"
                          className="p-0.5 rounded text-slate-400 hover:text-slate-600"
                          aria-label="Info"
                        >
                          <Info size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-slate-400 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900">
                        {row.locationCluster.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        {row.locationCluster.locationCount} Locations
                        <button
                          type="button"
                          className="p-0.5 rounded text-slate-400 hover:text-slate-600"
                          aria-label="Info"
                        >
                          <Info size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div>
                    <div className="font-medium text-slate-900">
                      {row.whUnits.value}
                    </div>
                    <div className="text-xs text-slate-500">{row.whUnits.sub}</div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle text-slate-900 font-medium">
                  {row.storeOh}
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div>
                    <div className="font-medium text-slate-900">
                      {row.sales.value}
                    </div>
                    <div className="text-xs text-slate-500">{row.sales.sub}</div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div>
                    <div className="font-medium text-slate-900">
                      {row.sellThru.percent}%
                    </div>
                    <div className="mt-1 w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${Math.min(row.sellThru.percent, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div>
                    <div className="font-medium text-slate-900">
                      {row.forecast.value}
                    </div>
                    <div className="text-xs text-slate-500">
                      {row.forecast.sub}
                    </div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div>
                    <div className="text-sm text-slate-900 mb-2">
                      {row.assortment.assorted}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onAssort(row)}
                        className="px-2 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Assort
                      </button>
                      <button
                        type="button"
                        onClick={() => onUnassort(row)}
                        className="px-2 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Unassort
                      </button>
                    </div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 align-middle">
                  <div
                    className="space-y-2 cursor-pointer"
                    onClick={() => onOpenModal('edit-allocation', row)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && onOpenModal('edit-allocation', row)
                    }
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 w-10 shrink-0">
                        Sum IA
                      </span>
                      <input
                        type="number"
                        value={row.sumIa || ''}
                        onChange={(e) =>
                          onSumIaChange(row.id, Number(e.target.value) || 0)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-14 h-5 text-sm border border-slate-200 rounded px-1.5"
                      />
                      <span className="text-xs text-slate-500">MQ: {row.mq}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-10 shrink-0">
                        Avg IA
                      </span>
                      <input
                        type="number"
                        value={row.avgIa || ''}
                        onChange={(e) =>
                          onAvgIaChange(row.id, Number(e.target.value) || 0)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-14 h-5 text-sm border border-slate-200 rounded px-1.5"
                      />
                    </div>
                  </div>
                </td>
                <td className="min-h-[72px] py-3 px-4 text-center align-middle">
                  <button
                    type="button"
                    onClick={() => onCommit(row.id)}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                      row.committed
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                    }`}
                    aria-label={row.committed ? 'Committed' : 'Commit'}
                  >
                    <CircleCheck size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
