import {
  LayoutGrid,
  Home,
  Box,
  RefreshCw,
  Eye,
  Lightbulb,
  Grid3x3,
  List,
  Settings,
  Users,
  Clock,
  MessageCircle,
  CirclePlus,
} from 'lucide-react';

const MAIN_NAV = [
  { id: 'grid', icon: LayoutGrid, active: false },
  { id: 'home', icon: Home, active: false },
  { id: 'cube', icon: Box },
  { id: 'refresh', icon: RefreshCw },
  { id: 'eye', icon: Eye },
  { id: 'bulb', icon: Lightbulb },
];

const SECOND_NAV = [
  { id: 'assortment', icon: Grid3x3, active: true },
  { id: 'list', icon: List, active: false },
  { id: 'settings', icon: Settings, active: false },
  { id: 'users', icon: Users, active: false },
];

type SidebarProps = {
  className?: string;
};

export function Sidebar({ className = '' }: SidebarProps) {
  return (
    <aside
      className={`relative w-[72px] flex flex-col bg-[#12171e] items-center px-4 py-8 gap-[72px] shrink-0 h-full ${className}`.trim()}
      data-name="Sidebar"
    >
      {/* Top: document + notification dot + expand arrow */}
      <div className="flex flex-1 flex-col gap-6 items-center w-full min-h-0 min-w-0">
        <div className="flex flex-col gap-1.5 items-center w-full shrink-0">
          <nav className="flex flex-col gap-1.5 w-full" data-name="Container">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex h-10 w-full min-w-[40px] items-center justify-center rounded-md px-3 py-2 transition-colors ${
                    item.active
                      ? 'bg-[#0267ff] text-white'
                      : 'text-white hover:bg-white/10'
                  } ${item.active ? 'rounded-md' : ''}`}
                  aria-label={item.id}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <span className="inline-flex shrink-0 size-5 items-center justify-center">
                    <Icon size={20} strokeWidth={1.5} className="size-5" />
                  </span>
                </button>
              );
            })}

            <div
              className="my-2 h-px w-full bg-white/20"
              data-name="divider"
              aria-hidden
            />

            {SECOND_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`flex h-10 w-full items-center justify-center rounded-md px-4 py-2 transition-colors ${
                  item.active
                    ? 'bg-[#0267ff] text-white'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label={item.id}
                aria-current={item.active ? 'page' : undefined}
              >
                <span className="inline-flex shrink-0 size-5 items-center justify-center">
                  <item.icon size={20} strokeWidth={1.5} className="size-5" />
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom: clock (green), separator, chat, circle plus, UK, avatar */}
      <div className="flex flex-col gap-1.5 items-center w-full shrink-0">
        <button
          type="button"
          className="flex h-10 w-full items-center justify-center rounded-md text-emerald-400 transition-colors hover:bg-white/10"
          aria-label="History"
        >
          <span className="inline-flex shrink-0 size-5 items-center justify-center">
            <Clock size={20} strokeWidth={1.5} className="size-5" />
          </span>
        </button>

        <div className="h-px w-full bg-white/20" data-name="divider" aria-hidden />

        <button
          type="button"
          className="flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-white transition-colors hover:bg-white/10"
          aria-label="Chat"
        >
          <span className="inline-flex shrink-0 size-5 items-center justify-center">
            <MessageCircle size={20} strokeWidth={1.5} className="size-5" />
          </span>
        </button>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-white transition-colors hover:bg-white/10"
          aria-label="Add"
        >
          <span className="inline-flex shrink-0 size-5 items-center justify-center">
            <CirclePlus size={20} strokeWidth={1.5} className="size-5" />
          </span>
        </button>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-3 rounded px-4 py-2 transition-colors hover:bg-white/10"
          aria-label="Language (UK)"
          data-name="Sidebar element"
          data-node-id="12350:172510"
        >
          <div className="relative h-6 w-6 shrink-0 overflow-hidden" data-name="Icon=uk" data-node-id="I12350:172510;12203:35386">
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-sm bg-[#1a47b8] shadow-[0px_0px_0.055px_0px_rgba(66,71,76,0.32),0px_0.442px_0.662px_0px_rgba(66,71,76,0.08)]"
              data-name="uk"
              data-node-id="I12350:172510;12203:35386;10027:30852"
            >
              <img
                src="https://www.figma.com/api/mcp/asset/9bdcfb00-d6f2-41fd-9665-03aaac6d452d"
                alt="UK"
                className="h-[15px] w-full object-contain object-center"
                data-name="Element"
                data-node-id="I12350:172510;12203:35386;10027:30853"
              />
            </div>
          </div>
        </button>
        <div
          className="flex items-center justify-center rounded-[8px] shadow-[0px_20px_40px_0px_rgba(145,158,171,0.12)] shrink-0"
          data-name="user-avatar"
          data-node-id="12212:42666"
        >
          <div className="flex items-center justify-center rounded-full shrink-0" data-name="Avatar" data-node-id="12206:42172">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full" data-name="Image" data-node-id="I12206:42172;12134:33222">
              <img
                src="https://www.figma.com/api/mcp/asset/653953ff-3682-4210-b9ae-60caf869bf12"
                alt="User avatar"
                className="absolute inset-0 h-full w-full object-cover rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
