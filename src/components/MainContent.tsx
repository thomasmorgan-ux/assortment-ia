import { useState } from 'react';
import { Zap, Sparkles, Layers, ChevronDown } from 'lucide-react';
import { AssortmentTable } from './AssortmentTable';
import { EditModal } from './EditModal';
import { mockRows } from '../data/mockAssortment';
import type { AssortmentRow } from '../types';
import type { ModalKind } from '../types';

const tabs = [
  { id: 'groups', label: 'Groups' },
  { id: 'sku-location', label: 'SKU-Location' },
];

const filterPills = [
  { id: 'can-ia', label: 'Can IA', icon: Zap, active: true },
  { id: 'ia-rec', label: 'IA Recommendations', icon: Sparkles },
  { id: 'assort-rec', label: 'Assortment Recommendations', icon: Sparkles },
  { id: 'drafts', label: 'Drafts', icon: Layers },
];

export function MainContent() {
  const [activeTab, setActiveTab] = useState('groups');
  const [activePill, setActivePill] = useState('can-ia');
  const [rows, setRows] = useState<AssortmentRow[]>(
    mockRows.map((r) => ({ ...r, selected: false }))
  );
  const [modal, setModal] = useState<{
    kind: ModalKind;
    title: string;
    row?: AssortmentRow;
  }>({ kind: null, title: '' });

  const openModal = (kind: ModalKind, row?: AssortmentRow) => {
    const titles: Record<NonNullable<ModalKind>, string> = {
      'edit-allocation': 'Edit Initial Allocation',
      'product-group': 'Product Group',
      'location-cluster': 'Location Cluster',
      assort: 'Assort',
    };
    setModal({
      kind,
      title: kind ? titles[kind] : '',
      row,
    });
  };

  const closeModal = () =>
    setModal((m) => ({ ...m, kind: null, title: '' }));

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
    updateRow(id, { sumIa: value });
  };

  const onAvgIaChange = (id: string, value: number) => {
    updateRow(id, { avgIa: value });
  };

  const onCommit = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, committed: !r.committed } : r))
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

      <div className="px-6 py-4 space-y-4">
        <div
          className="inline-flex flex-wrap items-center gap-2 rounded border border-[#e9eaeb] bg-white p-1"
          data-name="segment-control"
          data-node-id="12289:45260"
        >
          {filterPills.map((pill) => {
            const Icon = pill.icon;
            const isSelected = activePill === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActivePill(pill.id)}
                className={`inline-flex max-h-8 items-center justify-center gap-1.5 rounded-[2px] px-2 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#f8f8f8] font-medium text-[#00050a]'
                    : 'font-normal text-[#4b535c] hover:bg-slate-50'
                }`}
                data-node-id={isSelected ? '12288:41829' : '12288:41826'}
              >
                <Icon className="size-4 shrink-0" />
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-normal text-[#00050a] whitespace-nowrap"
            data-node-id="15048:312135"
          >
            Grouping
          </span>
          <div
            className="flex min-w-[160px] items-center gap-2 rounded border border-[#e9eaeb] bg-white px-4 py-3"
            data-name="Button"
            data-node-id="15048:312125"
          >
            <select className="flex-1 min-w-0 cursor-pointer appearance-none border-0 bg-transparent pr-2 text-sm font-medium text-[#00050a] focus:outline-none">
              <option>Product group</option>
            </select>
            <ChevronDown className="size-4 shrink-0 text-[#00050a]" aria-hidden />
          </div>
          <div
            className="flex min-w-[160px] items-center gap-2 rounded border border-[#e9eaeb] bg-white px-4 py-3"
            data-name="Button"
            data-node-id="15048:312125"
          >
            <select className="flex-1 min-w-0 cursor-pointer appearance-none border-0 bg-transparent pr-2 text-sm font-medium text-[#00050a] focus:outline-none">
              <option>Location cluster</option>
            </select>
            <ChevronDown className="size-4 shrink-0 text-[#00050a]" aria-hidden />
          </div>
        </div>

        <AssortmentTable
          rows={rows}
          onSelectRow={onSelectRow}
          onSelectAll={onSelectAll}
          onAssort={(row) => openModal('assort', row)}
          onUnassort={() => {}}
          onSumIaChange={onSumIaChange}
          onAvgIaChange={onAvgIaChange}
          onOpenModal={openModal}
          onCommit={onCommit}
        />
      </div>

      <EditModal
        kind={modal.kind}
        title={modal.title}
        onClose={closeModal}
      >
        {modal.row && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              Row: {modal.row.productGroup.name} × {modal.row.locationCluster.name}
            </p>
            <p className="text-slate-500">
              Add form fields, validation, and submit logic here.
            </p>
          </div>
        )}
      </EditModal>
    </main>
  );
}
