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
  Clock,
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
                    {item.id === 'home' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
                        <path d="M2.08333 7.91681V14.3752C2.08333 14.9558 2.08333 15.2461 2.11941 15.4893C2.33484 16.9417 3.47521 18.082 4.92756 18.2975C5.17078 18.3335 5.46107 18.3335 6.04166 18.3335L7.65984 18.3335M0.833328 9.16681L6.22876 3.77138C7.54882 2.45133 8.20884 1.7913 8.96994 1.544C9.63942 1.32648 10.3606 1.32648 11.0301 1.544C11.7911 1.7913 12.4512 2.45133 13.7712 3.77138L19.1667 9.16681" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16.266 9.96219L14.2515 8.75349C13.7653 8.46178 13.5222 8.31592 13.2627 8.25894C13.0332 8.20853 12.7955 8.20853 12.5659 8.25894C12.3064 8.31592 12.0633 8.46178 11.5771 8.75349L9.66364 9.90159L9.66364 9.90159C9.2035 10.1777 8.97343 10.3157 8.80632 10.5058C8.65843 10.674 8.54692 10.8709 8.47878 11.0842C8.40179 11.3253 8.40179 11.5936 8.40179 12.1302V13.6997C8.40179 14.2363 8.40179 14.5046 8.47878 14.7457C8.54692 14.959 8.65843 15.156 8.80632 15.3242C8.97343 15.5142 9.2035 15.6522 9.66364 15.9283L9.90597 16.0737L11.4101 16.9762L11.5422 17.0555L11.5422 17.0555C12.0404 17.3544 12.2895 17.5038 12.555 17.5602C12.7898 17.6101 13.0327 17.6073 13.2663 17.5521C13.5304 17.4896 13.776 17.3345 14.2673 17.0243L17.1637 15.195C17.187 15.1802 17.2083 15.1691 17.2324 15.1566L17.2376 15.1539C17.3745 15.0827 17.4269 14.9137 17.4269 14.7594V12.0125C17.4269 11.5908 17.4269 11.38 17.3791 11.1873C17.3077 10.8996 17.159 10.6369 16.949 10.4277C16.8084 10.2876 16.6276 10.1791 16.266 9.96219Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10.8834 11.7869L13.4687 10.207" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.9141 13.1406L16.9754 10.6587M12.9141 13.1406L8.8528 10.6587M12.9141 13.1406V17.6531" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : item.id === 'cube' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
                        <path d="M17.5006 8.3335C17.5006 7.55493 17.5006 7.16564 17.4124 6.80999C17.2806 6.27849 17.0059 5.7932 16.6179 5.40672C16.3583 5.14811 16.0245 4.94783 15.3569 4.54726L11.6369 2.31524C10.739 1.7765 10.29 1.50713 9.81075 1.40189C9.38683 1.30879 8.94775 1.30879 8.52382 1.40189C8.04456 1.50713 7.59561 1.7765 6.69771 2.31524L3.16437 4.43524C2.31458 4.94512 1.88968 5.20006 1.58104 5.55106C1.30791 5.86168 1.10197 6.22541 0.976143 6.61943C0.833954 7.06467 0.833954 7.56018 0.833954 8.55121V11.4491C0.833954 12.4401 0.833954 12.9357 0.976143 13.3809C1.10197 13.7749 1.30791 14.1386 1.58104 14.4493C1.88968 14.8003 2.31458 15.0552 3.16437 15.5651L6.38951 17.5002L7.9325 18.426C8.38145 18.6953 8.60592 18.83 8.84555 18.8826C9.05752 18.9292 9.27706 18.9292 9.48902 18.8826C9.72865 18.83 9.95313 18.6953 10.4021 18.426L11.5978 17.7085" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5.41739 7.91667L10.1902 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9.16739 10.4168L16.6674 5.8335M9.16739 10.4168L1.66739 5.8335M9.16739 10.4168V18.7502" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.9153 12.7432V11.5279M12.9153 12.7432C12.9153 12.7432 14.0727 10.8335 16.3875 10.8335C17.0216 10.8335 17.614 11.0015 18.1236 11.2951M12.9153 12.7432H14.1305M18.6791 15.0349C18.6791 15.0349 17.4718 16.9446 15.5541 16.9446C14.9217 16.9446 14.3287 16.7755 13.818 16.4801M18.6791 15.0349H17.4639M18.6791 15.0349V16.2502" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : item.id === 'eye' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
                        <path d="M2.74411 8.19227C2.85978 7.10365 2.91761 6.55934 3.04186 6.09996C3.65854 3.81995 5.55551 2.11386 7.88791 1.74152C8.35785 1.6665 8.90523 1.6665 9.99997 1.6665C11.0947 1.6665 11.6421 1.6665 12.112 1.74152C14.4444 2.11386 16.3414 3.81995 16.9581 6.09996C17.0823 6.55934 17.1402 7.10365 17.2558 8.19227L17.4528 10.0465C17.6142 11.5652 17.6949 12.3246 17.6302 12.9501C17.3624 15.5407 15.4539 17.6628 12.9061 18.2028C12.2909 18.3332 11.5273 18.3332 9.99997 18.3332C8.47269 18.3332 7.70905 18.3332 7.09386 18.2028C4.54602 17.6628 2.63751 15.5407 2.36972 12.9501C2.30505 12.3246 2.38574 11.5652 2.5471 10.0465L2.74411 8.19227Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7.50008 5.83333V7.5C7.50008 8.88071 8.61936 10 10.0001 10C11.3808 10 12.5001 8.88071 12.5001 7.5V5.83333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : item.id === 'bulb' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="19" viewBox="0 0 15 19" fill="none" className="size-5" aria-hidden>
                        <path d="M7.41699 0C11.513 0.000176008 14.833 3.32099 14.833 7.41699C14.8328 10.2676 12.751 12.4014 11.4883 13.4463C10.9735 13.8722 10.667 14.451 10.667 15.0225C10.6669 16.7589 9.25892 18.1669 7.52246 18.167H7.32324C5.58017 18.167 4.16725 16.7538 4.16699 15.0107C4.16699 14.4418 3.86548 13.8666 3.3584 13.4424C2.10186 12.3911 0.000161918 10.235 0 7.41699C0 3.32088 3.32088 0 7.41699 0ZM9.16309 15.0859C8.716 15.1755 8.13412 15.25 7.41699 15.25C6.70006 15.25 6.11797 15.1755 5.6709 15.0859C5.7105 15.9656 6.43383 16.667 7.32324 16.667H7.52246C8.40921 16.6669 9.1296 15.9645 9.16309 15.0859ZM7.41699 1.5C4.14931 1.5 1.5 4.14931 1.5 7.41699C1.50017 9.51224 3.10879 11.2776 4.32129 12.292C4.6875 12.5984 5.00759 12.9776 5.24414 13.4082C5.24606 13.4091 5.24809 13.4102 5.25 13.4111L5.24902 13.4102C5.24811 13.4097 5.24676 13.4094 5.24609 13.4092L5.24512 13.4082C5.24609 13.4087 5.25016 13.4111 5.25684 13.4141C5.27097 13.4202 5.29802 13.4317 5.33691 13.4463C5.41541 13.4757 5.5445 13.5187 5.72363 13.5635C6.08266 13.6532 6.64701 13.75 7.41699 13.75C8.18697 13.75 8.75139 13.6532 9.11035 13.5635C9.28942 13.5187 9.41865 13.4757 9.49707 13.4463C9.53589 13.4317 9.56311 13.4202 9.57715 13.4141C9.58392 13.4111 9.58817 13.4085 9.58887 13.4082L9.58789 13.4092C9.58736 13.4094 9.58589 13.4098 9.58496 13.4102L9.58398 13.4111C9.58921 13.4085 9.59435 13.4058 9.59961 13.4033C9.83969 12.9731 10.1641 12.5956 10.5322 12.291C11.7384 11.293 13.3328 9.54807 13.333 7.41699C13.333 4.14942 10.6845 1.50018 7.41699 1.5Z" fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <Icon size={20} strokeWidth={1.5} className="size-5" />
                    )}
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
                  {item.id === 'assortment' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
                      <path d="M5.00063 3.33317C5.00063 4.25365 4.25444 4.99984 3.33396 4.99984C2.41349 4.99984 1.6673 4.25365 1.6673 3.33317C1.6673 2.4127 2.41349 1.6665 3.33396 1.6665C4.25444 1.6665 5.00063 2.4127 5.00063 3.33317Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="3.33396" cy="16.6662" r="1.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10.0007" cy="3.33317" r="1.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10.0007" cy="9.99967" r="1.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="3.33396" cy="9.99967" r="1.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10.0007" cy="16.6662" r="1.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="16.6673" cy="9.99967" r="1.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="16.6673" cy="3.33317" r="1.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="16.6673" cy="16.6662" r="1.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : item.id === 'list' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
                      <g clipPath="url(#sidebar-list-clip)">
                        <rect x="1.66667" y="1.6665" width="16.6667" height="16.6667" rx="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6.66667 0.833496L6.66667 3.3335" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M13.3333 0.833496L13.3333 3.3335" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14.1667 6.6665H5.83333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="6.66666" cy="10.8333" r="0.833333" fill="currentColor" />
                        <circle cx="6.66666" cy="14.1668" r="0.833333" fill="currentColor" />
                        <circle cx="10" cy="14.1668" r="0.833333" fill="currentColor" />
                        <circle cx="13.3333" cy="14.1668" r="0.833333" fill="currentColor" />
                        <circle cx="10" cy="10.8333" r="0.833333" fill="currentColor" />
                        <circle cx="13.3333" cy="10.8333" r="0.833333" fill="currentColor" />
                      </g>
                      <defs>
                        <clipPath id="sidebar-list-clip">
                          <rect width="20" height="20" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  ) : item.id === 'settings' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
                      <g clipPath="url(#sidebar-settings-clip)">
                        <path d="M15.8333 15.8335L18.3333 15.8335" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M1.66667 10L4.16667 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M15.8333 4.1665L18.3333 4.1665" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M1.66667 15.8335L8.33334 15.8335" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M11.6667 10L18.3333 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M1.66667 4.1665L8.33334 4.1665" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <rect x="10.8333" y="1.6665" width="5" height="5" rx="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <rect x="10.8333" y="13.3335" width="5" height="5" rx="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <rect x="4.16667" y="7.5" width="5" height="5" rx="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </g>
                      <defs>
                        <clipPath id="sidebar-settings-clip">
                          <rect width="20" height="20" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  ) : (
                    <item.icon size={20} strokeWidth={1.5} className="size-5" />
                  )}
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
          data-name="Sidebar element"
          data-node-id="12350:172509"
        >
          <span className="inline-flex shrink-0 size-5 items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none" className="size-5" aria-hidden>
              <path d="M9.08301 0C14.0993 0.000175944 18.1668 4.06668 18.167 9.08301C18.1668 14.0993 14.0993 18.1668 9.08301 18.167C8.05918 18.167 7.15758 18.0197 6.31055 17.7168C5.95237 17.5887 5.68849 17.4942 5.49707 17.4277C5.40163 17.3946 5.32718 17.3704 5.27148 17.3525C5.24426 17.3438 5.22298 17.3367 5.20703 17.332C5.19935 17.3298 5.19273 17.3283 5.18848 17.3271C5.18557 17.3264 5.18336 17.3255 5.18262 17.3252C4.77707 17.2299 4.51065 17.3073 4.1709 17.4688C3.84936 17.6216 3.2802 17.9722 2.59766 18.0859C1.58046 18.2552 0.675542 17.4223 0.759766 16.3945C0.790682 16.0188 0.932497 15.6867 1.03809 15.4531C1.16184 15.1794 1.2377 15.0323 1.2832 14.874C1.46423 14.2437 1.25147 13.7914 0.836914 12.8965C0.299457 11.7363 4.77694e-05 10.4432 0 9.08301C0.000175748 4.06668 4.06668 0.000175744 9.08301 0ZM5.75 8.25C5.28976 8.25 4.91602 8.62277 4.91602 9.08301C4.91602 9.54325 5.28976 9.91602 5.75 9.91602C6.21009 9.91584 6.58301 9.54314 6.58301 9.08301C6.58301 8.62288 6.21009 8.25018 5.75 8.25ZM9.08301 8.25C8.62277 8.25 8.25 8.62277 8.25 9.08301C8.25 9.54325 8.62277 9.91602 9.08301 9.91602C9.54325 9.91602 9.91602 9.54325 9.91602 9.08301C9.91602 8.62277 9.54325 8.25 9.08301 8.25ZM12.416 8.25C11.9559 8.25018 11.583 8.62288 11.583 9.08301C11.583 9.54314 11.9559 9.91584 12.416 9.91602C12.8763 9.91602 13.25 9.54325 13.25 9.08301C13.25 8.62277 12.8763 8.25 12.416 8.25Z" fill="currentColor" />
          </svg>
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
              className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[0.676px] shadow-[0px_0px_0.055px_0px_rgba(66,71,76,0.32),0px_0.442px_0.662px_0px_rgba(66,71,76,0.08)]"
              data-name="uk"
              data-node-id="I12350:172510;12203:35386;10027:30852"
            >
              <img
                src="https://www.figma.com/api/mcp/asset/29be2af1-4c9f-4971-b66b-0e0f531bb86f"
                alt="UK"
                className="h-[15px] w-full object-contain object-center"
                data-name="Element"
                data-node-id="I12350:172510;12203:35386;10027:30853"
              />
            </div>
          </div>
        </button>
        {/* User avatar – Design System 2.0 (Figma node 12299-63385) */}
        <div
          className="flex items-center justify-center rounded-[8px] p-0 shadow-[0px_20px_40px_0px_rgba(145,158,171,0.12)] shrink-0"
          data-name="user-avatar"
        >
          <div className="flex items-center justify-center rounded-[1000px] shrink-0" data-name="Avatar">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full" data-name="Image">
              <img
                src="https://www.figma.com/api/mcp/asset/ef3bec39-e618-4a8f-ab83-e590b6341767"
                alt="User avatar"
                className="absolute inset-0 h-full w-full max-w-none object-cover pointer-events-none rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
