import { X, ChevronLeft } from 'lucide-react';

const editLogEntriesMock = [
  { id: '1', date: 'Mar 12, 2016 2:45 PM', user: 'Lewis Smith - Power User', action: 'Total IA set to 8', previous: 'Total IA 0' },
  { id: '2', date: 'Mar 11, 2016 1:30 PM', user: 'Lewis Smith - Power User', action: 'Average IA set to 4', previous: 'Avg IA 2' },
  { id: '3', date: 'Mar 10, 2016 6:20 PM', user: 'Ben Dean - Admin', action: 'Rec Generated', previous: 'Total IA 2' },
  { id: '4', date: 'Mar 10, 2016 4:20 PM', user: 'Lewis Smith - Power User', action: 'Avg IA set to 1', previous: 'Avg IA 3' },
];

interface EditLogDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function EditLogDrawer({ open, onClose }: EditLogDrawerProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-lg flex-col rounded-l-xl bg-white shadow-2xl transition-transform duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-log-drawer-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e9eaeb] px-5 py-4">
          <h2
            id="edit-log-drawer-title"
            className="text-lg font-semibold leading-tight text-[#000000]"
          >
            Edit Log
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          <div className="overflow-hidden rounded-lg border border-[#e9eaeb]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#f8f8f8]">
                  <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">Change Date & Time</th>
                  <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">User</th>
                  <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">Action</th>
                  <th className="px-3 py-2.5 text-left font-medium text-[#00050a]">Previous</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {editLogEntriesMock.map((entry) => (
                  <tr key={entry.id} className="border-t border-[#e9eaeb]">
                    <td className="px-3 py-2.5 text-[#000000]">{entry.date}</td>
                    <td className="px-3 py-2.5 text-[#000000]">{entry.user}</td>
                    <td className="px-3 py-2.5 text-[#000000]">{entry.action}</td>
                    <td className="px-3 py-2.5 text-[#000000]">{entry.previous}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-start">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center gap-1.5 rounded border border-[#e9eaeb] bg-white px-3 text-sm font-medium text-[#000000] hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
              Back to Assortment Groups
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
