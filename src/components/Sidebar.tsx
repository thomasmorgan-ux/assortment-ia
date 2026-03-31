import { useId, useState, type ComponentType } from 'react';
import { ChevronsLeft, ChevronsRight, ChevronDown, ChevronRight } from 'lucide-react';

/** Autone logo mark — Monotone / Icon 24px (Figma 12210:36296 → 12207:7487) */
const AUTONE_LOGO_MARK =
  'https://www.figma.com/api/mcp/asset/ff47c49a-32d3-41ef-a4af-b982250d71dc';
/** Full wordmark pieces (Figma 12212:42693 AutoneLogo 12207:7492) */
const AUTONE_LOGO_MARK_EXPANDED =
  'https://www.figma.com/api/mcp/asset/9d650bdc-ecde-415f-bea2-d2cc21816d2e';
const AUTONE_LOGO_WORDMARK =
  'https://www.figma.com/api/mcp/asset/8aef8dab-0f24-41a5-ad3c-1b0b8fbe7f1e';

const SIDEBAR_EXPANDED_WIDTH = 252; /* 220px content + px-4 × 2 (Figma 12212:42693) */
const USER_AVATAR_SRC =
  'https://www.figma.com/api/mcp/asset/3c4254ce-40aa-4ed2-af75-f53137e845d4';
const UK_FLAG_SRC =
  'https://www.figma.com/api/mcp/asset/43899dcc-1578-4ed4-becc-ee0a3c834ab5';
/** Chat — Sidebar element (Figma 12350:172509, Icon=chat 12350:172283) */
const SIDEBAR_CHAT_ICON_SRC =
  'https://www.figma.com/api/mcp/asset/dd77240e-5765-49a2-a5af-94eafc295af6';
/** Currency — Icon=circle-dollar (Figma 12718:7365 → 4605:27967) */
const SIDEBAR_CURRENCY_ICON_VECTOR =
  'https://www.figma.com/api/mcp/asset/6f7604c6-8bad-46e4-a81d-2903fe0890cd';
const SIDEBAR_CURRENCY_ICON_ELLIPSE =
  'https://www.figma.com/api/mcp/asset/bfcc53c8-3349-47f2-984c-eb2ad1d268ac';

const SIDEBAR_INACTIVE_ICON = 'text-[#9AA4B2]';

type NavIconProps = { size?: number; strokeWidth?: number; className?: string };
type LucideLike = ComponentType<NavIconProps>;

function ElementsGridIcon({ className }: Pick<NavIconProps, 'className'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 20 20"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <rect
        x="1.66669"
        y="1.66663"
        width="6.66667"
        height="6.66667"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="11.6667"
        y="1.66663"
        width="6.66667"
        height="6.66667"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="1.66669"
        y="11.6666"
        width="6.66667"
        height="6.66667"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="11.6667"
        y="11.6666"
        width="6.66667"
        height="6.66667"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReorderCubeIcon({ className }: Pick<NavIconProps, 'className'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 20 20"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <path
        d="M17.5006 8.3335C17.5006 7.55493 17.5006 7.16564 17.4124 6.80999C17.2806 6.27849 17.0058 5.7932 16.6179 5.40672C16.3583 5.14811 16.0245 4.94783 15.3569 4.54726L11.6368 2.31524C10.7389 1.7765 10.29 1.50713 9.81072 1.40189C9.38679 1.30879 8.94772 1.30879 8.52379 1.40189C8.04453 1.50713 7.59558 1.7765 6.69768 2.31524L3.16434 4.43524C2.31455 4.94512 1.88965 5.20006 1.58101 5.55106C1.30788 5.86168 1.10194 6.22541 0.976112 6.61943C0.833923 7.06467 0.833923 7.56018 0.833923 8.55121V11.4491C0.833923 12.4401 0.833923 12.9357 0.976112 13.3809C1.10194 13.7749 1.30788 14.1386 1.58101 14.4493C1.88965 14.8003 2.31455 15.0552 3.16434 15.5651L6.38948 17.5002L7.93247 18.426C8.38142 18.6953 8.60589 18.83 8.84552 18.8826C9.05749 18.9292 9.27703 18.9292 9.48899 18.8826C9.72862 18.83 9.9531 18.6953 10.402 18.426L11.5978 17.7085"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.41736 7.91691L10.1901 5.00024"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.16736 10.4168L16.6674 5.8335M9.16736 10.4168L1.66736 5.8335M9.16736 10.4168V18.7502"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.9152 12.7435V11.5282M12.9152 12.7435C12.9152 12.7435 14.0726 10.8337 16.3874 10.8337C17.0215 10.8337 17.6139 11.0017 18.1236 11.2953M12.9152 12.7435H14.1305M18.6791 15.0351C18.6791 15.0351 17.4718 16.9449 15.5541 16.9449C14.9217 16.9449 14.3287 16.7758 13.818 16.4803M18.6791 15.0351H17.4638M18.6791 15.0351V16.2504"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeAssortIcon({ className }: Pick<NavIconProps, 'className'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 20 20"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <path
        d="M2.08331 7.91669V14.3751C2.08331 14.9557 2.08331 15.246 2.11939 15.4892C2.33483 16.9415 3.47519 18.0819 4.92755 18.2973C5.17077 18.3334 5.46106 18.3334 6.04165 18.3334L7.65983 18.3334M0.833313 9.16669L6.22874 3.77126C7.5488 2.45121 8.20883 1.79118 8.96992 1.54388C9.6394 1.32636 10.3606 1.32636 11.03 1.54388C11.7911 1.79118 12.4512 2.45121 13.7712 3.77126L19.1666 9.16669"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.266 9.96206L14.2515 8.75337C13.7653 8.46166 13.5222 8.3158 13.2627 8.25881C13.0332 8.20841 12.7955 8.20841 12.5659 8.25881C12.3064 8.3158 12.0633 8.46166 11.5771 8.75337L9.66364 9.90146L9.66364 9.90146C9.2035 10.1775 8.97343 10.3156 8.80632 10.5056C8.65843 10.6738 8.54692 10.8708 8.47878 11.0841C8.40179 11.3252 8.40179 11.5935 8.40179 12.1301V13.6996C8.40179 14.2362 8.40179 14.5045 8.47878 14.7455C8.54692 14.9589 8.65843 15.1558 8.80632 15.324C8.97343 15.5141 9.2035 15.6521 9.66364 15.9282L9.90597 16.0736L11.4101 16.9761L11.5422 17.0553L11.5422 17.0553C12.0404 17.3543 12.2895 17.5037 12.555 17.5601C12.7898 17.61 13.0327 17.6072 13.2663 17.552C13.5304 17.4895 13.776 17.3344 14.2673 17.0241L17.1637 15.1948C17.187 15.1801 17.2083 15.169 17.2324 15.1565L17.2376 15.1538C17.3745 15.0825 17.4269 14.9136 17.4269 14.7593V12.0123C17.4269 11.5907 17.4269 11.3798 17.3791 11.1872C17.3077 10.8995 17.159 10.6368 16.949 10.4275C16.8084 10.2875 16.6276 10.179 16.266 9.96206Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.8834 11.787L13.4687 10.2072"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.9141 13.1405L16.9753 10.6586M12.9141 13.1405L8.85278 10.6586M12.9141 13.1405V17.653"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshSyncIcon({ className }: Pick<NavIconProps, 'className'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 19 19"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <path
        d="M0.75 9.08333C0.75 13.6857 4.48096 17.4167 9.08333 17.4167C13.6857 17.4167 16.5833 12.8333 16.5833 12.8333M17.4167 9.08333C17.4167 4.48096 13.713 0.75 9.08333 0.75C3.52778 0.75 0.75 5.33333 0.75 5.33333M0.75 5.33333V2.41667M0.75 5.33333H3.66667M16.5833 12.8333H13.6667M16.5833 12.8333V15.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuyBagIcon({ className }: Pick<NavIconProps, 'className'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 20 20"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <path
        d="M2.7441 8.19252C2.85976 7.1039 2.9176 6.55959 3.04185 6.1002C3.65853 3.82019 5.55549 2.1141 7.88789 1.74177C8.35784 1.66675 8.90521 1.66675 9.99996 1.66675C11.0947 1.66675 11.6421 1.66675 12.112 1.74177C14.4444 2.1141 16.3414 3.82019 16.9581 6.1002C17.0823 6.55959 17.1402 7.1039 17.2558 8.19252L17.4528 10.0467C17.6142 11.5655 17.6949 12.3248 17.6302 12.9504C17.3624 15.541 15.4539 17.663 12.9061 18.203C12.2909 18.3334 11.5272 18.3334 9.99996 18.3334C8.47268 18.3334 7.70904 18.3334 7.09384 18.203C4.546 17.663 2.6375 15.541 2.3697 12.9504C2.30504 12.3248 2.38572 11.5655 2.54709 10.0467L2.7441 8.19252Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.50006 5.83333V7.5C7.50006 8.88071 8.61935 10 10.0001 10C11.3808 10 12.5001 8.88071 12.5001 7.5V5.83333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IdeaBulbIcon({ className }: Pick<NavIconProps, 'className'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 15 19"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <path
        d="M7.41699 0C11.513 0.000176008 14.833 3.32099 14.833 7.41699C14.8328 10.2676 12.751 12.4014 11.4883 13.4463C10.9735 13.8722 10.667 14.451 10.667 15.0225C10.6669 16.7589 9.25892 18.1669 7.52246 18.167H7.32324C5.58017 18.167 4.16725 16.7538 4.16699 15.0107C4.16699 14.4418 3.86548 13.8666 3.3584 13.4424C2.10186 12.3911 0.000161918 10.235 0 7.41699C0 3.32088 3.32088 0 7.41699 0ZM9.16309 15.0859C8.716 15.1755 8.13411 15.25 7.41699 15.25C6.70006 15.25 6.11797 15.1755 5.6709 15.0859C5.7105 15.9656 6.43383 16.667 7.32324 16.667H7.52246C8.40921 16.6669 9.1296 15.9645 9.16309 15.0859ZM7.41699 1.5C4.14931 1.5 1.5 4.14931 1.5 7.41699C1.50017 9.51224 3.10879 11.2776 4.32129 12.292C4.6875 12.5984 5.00759 12.9776 5.24414 13.4082C5.24606 13.4091 5.24809 13.4102 5.25 13.4111L5.24902 13.4102C5.24811 13.4097 5.24676 13.4094 5.24609 13.4092L5.24512 13.4082C5.24609 13.4087 5.25016 13.4111 5.25684 13.4141C5.27096 13.4202 5.29802 13.4317 5.33691 13.4463C5.41541 13.4757 5.5445 13.5187 5.72363 13.5635C6.08266 13.6532 6.64701 13.75 7.41699 13.75C8.18697 13.75 8.75139 13.6532 9.11035 13.5635C9.28942 13.5187 9.41865 13.4757 9.49707 13.4463C9.53589 13.4317 9.56311 13.4202 9.57715 13.4141C9.58392 13.4111 9.58817 13.4085 9.58887 13.4082L9.58789 13.4092C9.58736 13.4094 9.58589 13.4098 9.58496 13.4102L9.58398 13.4111C9.58921 13.4085 9.59435 13.4058 9.59961 13.4033C9.83969 12.9731 10.1641 12.5956 10.5322 12.291C11.7384 11.293 13.3328 9.54807 13.333 7.41699C13.333 4.14942 10.6845 1.50018 7.41699 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AssortmentDotsIcon({ className }: Pick<NavIconProps, 'className'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 20 20"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <path
        d="M5.00063 3.33293C5.00063 4.2534 4.25444 4.99959 3.33396 4.99959C2.41349 4.99959 1.6673 4.2534 1.6673 3.33293C1.6673 2.41245 2.41349 1.66626 3.33396 1.66626C4.25444 1.66626 5.00063 2.41245 5.00063 3.33293Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="3.33396"
        cy="16.6664"
        r="1.66667"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="10.0007"
        cy="3.33293"
        r="1.66667"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="10.0007"
        cy="9.99967"
        r="1.66667"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="3.33396"
        cy="9.99967"
        r="1.66667"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="10.0007"
        cy="16.6664"
        r="1.66667"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="16.6673"
        cy="9.99967"
        r="1.66667"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="16.6673"
        cy="3.33293"
        r="1.66667"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="16.6673"
        cy="16.6664"
        r="1.66667"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarCalendarIcon({ className }: Pick<NavIconProps, 'className'>) {
  const clipId = 'sidebar-calendar-clip';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 20 20"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <g clipPath={`url(#${clipId})`}>
        <rect
          x="1.66669"
          y="1.66675"
          width="16.6667"
          height="16.6667"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.66669 0.833252L6.66669 3.33325"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.3333 0.833252L13.3333 3.33325"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.1666 6.66675H5.83331"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6.66665" cy="10.8333" r="0.833333" fill="currentColor" />
        <circle cx="6.66665" cy="14.1666" r="0.833333" fill="currentColor" />
        <circle cx="10" cy="14.1666" r="0.833333" fill="currentColor" />
        <circle cx="13.3333" cy="14.1666" r="0.833333" fill="currentColor" />
        <circle cx="10" cy="10.8333" r="0.833333" fill="currentColor" />
        <circle cx="13.3333" cy="10.8333" r="0.833333" fill="currentColor" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function SidebarHistoryIcon({ className }: Pick<NavIconProps, 'className'>) {
  const clipId = `sidebar-timeline-${useId().replace(/\W/g, '')}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 20 20"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M15.8333 15.8333L18.3333 15.8333"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M1.66669 10L4.16669 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M15.8333 4.16675L18.3333 4.16675"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M1.66669 15.8333L8.33335 15.8333"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M11.6667 10L18.3334 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M1.66669 4.16675L8.33335 4.16675"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect
          x="10.8333"
          y="1.66675"
          width="5"
          height="5"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect
          x="10.8333"
          y="13.3333"
          width="5"
          height="5"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect
          x="4.16669"
          y="7.5"
          width="5"
          height="5"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function SidebarHistoryClockIcon({ className }: Pick<NavIconProps, 'className'>) {
  const clipId = `sidebar-history-clock-${useId().replace(/\W/g, '')}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 20 20"
      fill="none"
      className={['shrink-0', className ?? 'text-[#08A16A]'].join(' ')}
      aria-hidden
    >
      <g clipPath={`url(#${clipId})`}>
        <rect
          x="1.66669"
          y="1.66675"
          width="16.6667"
          height="16.6667"
          rx="8.33333"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10 6.66675V10.0001L12.5 11.6667"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function SidebarChatIcon() {
  return (
    <div className="relative shrink-0 size-6" aria-hidden>
      <div className="absolute inset-[4.58%]">
        <img
          src={SIDEBAR_CHAT_ICON_SRC}
          alt=""
          className="absolute block size-full max-w-none object-contain brightness-0 invert"
        />
      </div>
    </div>
  );
}

function SidebarCurrencyIcon() {
  return (
    <div className="relative size-6 shrink-0" aria-hidden>
      <div className="absolute inset-[8.33%]">
        <div className="absolute -inset-[4.5%]">
          <img
            src={SIDEBAR_CURRENCY_ICON_VECTOR}
            alt=""
            className="block size-full max-w-none object-contain brightness-0 invert"
          />
        </div>
      </div>
      <div className="absolute inset-[8.33%]">
        <div className="absolute -inset-[4.5%]">
          <img
            src={SIDEBAR_CURRENCY_ICON_ELLIPSE}
            alt=""
            className="block size-full max-w-none object-contain brightness-0 invert"
          />
        </div>
      </div>
    </div>
  );
}

function SidebarUsersIcon({ className }: Pick<NavIconProps, 'className'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 20 20"
      fill="none"
      className={['shrink-0', className ?? 'text-white'].join(' ')}
      aria-hidden
    >
      <path
        d="M12.5 8.33341C14.3409 8.33341 15.8333 6.84103 15.8333 5.00008C15.8333 3.15913 14.3409 1.66675 12.5 1.66675"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6.66665"
        cy="5.00008"
        r="3.33333"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.833313 15.0001C0.833313 13.1591 2.3257 11.6667 4.16665 11.6667H9.16664C11.0076 11.6667 12.5 13.1591 12.5 15.0001V15.0001C12.5 16.841 11.0076 18.3334 9.16665 18.3334H4.16665C2.3257 18.3334 0.833313 16.841 0.833313 15.0001V15.0001Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.1667 18.3334H16.5C17.9728 18.3334 19.1667 17.1395 19.1667 15.6667C19.1667 13.4576 17.3758 11.6667 15.1667 11.6667H14.1667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MAIN_NAV: {
  id: string;
  label: string;
  icon: LucideLike | null;
  active?: boolean;
  submenu?: boolean;
}[] = [
  { id: 'elements', label: 'Dashboard', icon: null },
  { id: 'home', label: 'Replenishment', icon: null },
  { id: 'reorder', label: 'Reorder', icon: null },
  { id: 'refresh', label: 'Rebalancing', icon: null },
  { id: 'buy', label: 'Buying', icon: null },
  { id: 'bulb', label: 'Insights', icon: null, submenu: true },
];

const SECOND_NAV: {
  id: string;
  label: string;
  icon: LucideLike | null;
  active?: boolean;
}[] = [
  { id: 'assortment', label: 'Assortment', icon: null, active: true },
  { id: 'calendar', label: 'Events', icon: null },
  { id: 'settings', label: 'Parameters', icon: null },
  { id: 'users', label: 'Team', icon: null },
];

type SidebarProps = {
  className?: string;
};

function navRowClasses(active: boolean, expanded: boolean, alignExpanded: boolean) {
  const base = [
    'flex h-10 w-full shrink-0 gap-3 rounded px-4 py-2 text-sm transition-colors',
    active ? null : 'hover:bg-white/[0.08]',
  ]
    .filter(Boolean)
    .join(' ');
  const layout = expanded && alignExpanded ? 'items-center justify-start text-left' : 'items-center justify-center';
  if (active) {
    return `${base} ${layout} bg-[#2EB8C2] text-white`;
  }
  if (expanded) {
    return `${base} ${layout} text-white`;
  }
  return `${base} ${layout} ${SIDEBAR_INACTIVE_ICON}`;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      style={{ width: expanded ? SIDEBAR_EXPANDED_WIDTH : 72 }}
      className={`relative flex h-full shrink-0 flex-col bg-[#12171e] px-4 py-8 transition-[width] duration-200 ease-out ${
        expanded ? 'items-stretch gap-[72px]' : 'items-center gap-[72px]'
      } ${className}`.trim()}
      data-name="Sidebar"
      data-node-id={expanded ? '12212:42693' : '12212:42694'}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={`absolute top-[42px] z-10 flex size-5 items-center justify-center rounded ${SIDEBAR_INACTIVE_ICON} transition-colors hover:bg-white/[0.08] ${
          expanded ? 'right-1' : 'left-[60px]'
        }`}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        data-node-id="12203:5655"
      >
        {expanded ? (
          <ChevronsLeft size={20} strokeWidth={1.5} aria-hidden />
        ) : (
          <ChevronsRight size={20} strokeWidth={1.5} aria-hidden />
        )}
      </button>

      <div
        className={`flex min-h-0 min-w-0 w-full flex-1 flex-col ${expanded ? 'items-start gap-8' : 'items-center gap-8'}`}
      >
        <div
          className={`flex shrink-0 items-center ${expanded ? 'w-full justify-start px-4 py-2' : 'size-10 justify-center py-[7.44px]'}`}
          data-node-id="12203:5564"
        >
          {expanded ? (
            <div className="flex h-6 items-center gap-[5.924px]" data-node-id="12207:7492">
              <div className="relative size-6 shrink-0">
                <img
                  src={AUTONE_LOGO_MARK_EXPANDED}
                  alt=""
                  className="absolute inset-0 size-full max-w-none object-contain brightness-0 invert"
                  width={24}
                  height={24}
                />
              </div>
              <div className="relative h-[23.971px] w-[112px] max-w-full shrink-0">
                <img
                  src={AUTONE_LOGO_WORDMARK}
                  alt="Autone"
                  className="absolute inset-0 size-full max-w-none object-contain object-left brightness-0 invert"
                  width={112}
                  height={24}
                />
              </div>
            </div>
          ) : (
            <div className="relative size-6 shrink-0" data-name="Vector" data-node-id="12207:7487">
              <img
                src={AUTONE_LOGO_MARK}
                alt="Autone"
                className="absolute inset-0 size-full max-w-none object-contain brightness-0 invert"
                width={24}
                height={24}
              />
            </div>
          )}
        </div>

        <nav
          className={`flex w-full shrink-0 flex-col gap-1.5 ${expanded ? 'max-w-[220px]' : ''}`}
          data-name="Container"
          data-node-id="12210:36322"
        >
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = Boolean(item.active);
            return (
              <button
                key={item.id}
                type="button"
                className={navRowClasses(active, expanded, true)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                {item.id === 'elements' ? (
                  <ElementsGridIcon className="text-white" />
                ) : item.id === 'home' ? (
                  <HomeAssortIcon className="text-white" />
                ) : item.id === 'reorder' ? (
                  <ReorderCubeIcon className="text-white" />
                ) : item.id === 'refresh' ? (
                  <RefreshSyncIcon className="text-white" />
                ) : item.id === 'buy' ? (
                  <BuyBagIcon className="text-white" />
                ) : item.id === 'bulb' ? (
                  <IdeaBulbIcon className="text-white" />
                ) : Icon ? (
                  <Icon size={24} strokeWidth={1.5} className="shrink-0 text-white" aria-hidden />
                ) : null}
                {expanded && (
                  <>
                    <span className="min-w-0 flex-1 truncate font-medium leading-none">{item.label}</span>
                    {item.submenu ? (
                      <ChevronDown size={20} strokeWidth={1.5} className="shrink-0 opacity-80" aria-hidden />
                    ) : null}
                  </>
                )}
              </button>
            );
          })}

          <div className="my-2 h-px w-full shrink-0 bg-[#22272F]" data-name="divider" aria-hidden />

          {SECOND_NAV.map((item) => {
            const Icon = item.icon;
            const active = Boolean(item.active);
            return (
              <button
                key={item.id}
                type="button"
                className={navRowClasses(active, expanded, true)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                {item.id === 'assortment' ? (
                  <AssortmentDotsIcon className="text-white" />
                ) : item.id === 'calendar' ? (
                  <SidebarCalendarIcon className="text-white" />
                ) : item.id === 'settings' ? (
                  <SidebarHistoryIcon className="text-white" />
                ) : item.id === 'users' ? (
                  <SidebarUsersIcon className="text-white" />
                ) : Icon ? (
                  <Icon size={24} strokeWidth={1.5} className="shrink-0 text-white" aria-hidden />
                ) : null}
                {expanded && <span className="min-w-0 flex-1 truncate font-medium leading-none">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className={`flex w-full shrink-0 flex-col gap-1.5 ${expanded ? 'max-w-[220px] items-stretch' : 'items-center'}`}
        data-name="Container"
        data-node-id="12350:172771"
      >
        {expanded ? (
          <>
            <button
              type="button"
              className={`flex h-10 w-full items-center gap-3 rounded px-4 py-2 text-sm transition-colors hover:bg-white/[0.08] ${SIDEBAR_INACTIVE_ICON}`}
              aria-label="Data age"
              data-node-id="13296:17707"
            >
              <SidebarHistoryClockIcon />
              <span className="min-w-0 flex-1 truncate font-normal leading-none text-white">Data age</span>
              <span className="shrink-0 font-medium text-[#08A16A]">12h</span>
              <ChevronRight size={20} strokeWidth={1.5} className="shrink-0" aria-hidden />
            </button>
            <div className="h-px w-full shrink-0 bg-[#22272F]" aria-hidden />
          </>
        ) : (
          <button
            type="button"
            className={`flex h-10 w-full items-center justify-center gap-3 rounded px-4 py-2 transition-colors hover:bg-white/[0.08] ${SIDEBAR_INACTIVE_ICON}`}
            aria-label="History"
            data-node-id="13296:16152"
          >
            <SidebarHistoryClockIcon />
          </button>
        )}

        {!expanded && <div className="h-px w-full shrink-0 bg-[#22272F]" data-name="divider" aria-hidden />}

        <button
          type="button"
          className={`flex h-10 w-full shrink-0 items-center gap-3 rounded-[4px] px-4 py-2 text-sm transition-colors hover:bg-white/[0.08] ${SIDEBAR_INACTIVE_ICON} ${
            expanded ? 'justify-start text-left' : 'justify-center'
          }`}
          aria-label="Chat"
          data-name="Sidebar element"
          data-node-id="12350:172509"
        >
          <SidebarChatIcon />
          {expanded && <span className="truncate font-normal leading-none text-white">Chat with us</span>}
        </button>

        <button
          type="button"
          className={`flex h-10 w-full shrink-0 items-center gap-3 rounded px-4 py-2 text-sm transition-colors hover:bg-white/[0.08] ${SIDEBAR_INACTIVE_ICON} ${
            expanded ? 'justify-start text-left' : 'justify-center'
          }`}
          aria-label="Currency"
          data-node-id="12718:7365"
        >
          <SidebarCurrencyIcon />
          {expanded && <span className="truncate font-normal leading-none text-white">Currency</span>}
        </button>

        <button
          type="button"
          className={`flex h-10 w-full shrink-0 items-center gap-3 rounded px-4 py-2 text-sm transition-colors hover:bg-white/[0.08] ${SIDEBAR_INACTIVE_ICON} ${
            expanded ? 'justify-start text-left' : 'justify-center'
          }`}
          aria-label="Language (UK)"
          data-name="Sidebar element"
          data-node-id="12350:172510"
        >
          <div className="relative size-6 shrink-0 overflow-hidden">
            <div
              className="absolute inset-[20.83%_4.17%_16.67%_4.17%] flex flex-col items-center justify-center overflow-hidden rounded-[0.676px] bg-[#1a47b8] shadow-[0px_0px_0.055px_0px_rgba(66,71,76,0.32),0px_0.442px_0.662px_0px_rgba(66,71,76,0.08)]"
              data-name="uk"
            >
              <div className="relative h-[15px] w-full shrink-0">
                <img
                  src={UK_FLAG_SRC}
                  alt=""
                  className="absolute inset-0 size-full max-w-none object-cover"
                />
              </div>
            </div>
          </div>
          {expanded && <span className="truncate font-normal leading-none text-white">English</span>}
        </button>

        {expanded ? (
          <button
            type="button"
            className="flex h-auto w-full min-h-10 items-center gap-2 rounded-lg py-1 pr-4 text-left shadow-[0px_8px_25px_0px_rgba(0,0,0,0.03)] transition-colors hover:bg-white/[0.06]"
            data-name="user-avatar"
            data-node-id="12212:42592"
          >
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
              <img
                src={USER_AVATAR_SRC}
                alt=""
                className="pointer-events-none absolute inset-0 size-full max-w-none rounded-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium leading-tight text-white">Charles Morenno</p>
              <p className="mt-0.5 truncate text-[10px] leading-tight text-[#878d94]">charlesmorenno@gmail.com</p>
            </div>
            <ChevronRight size={20} strokeWidth={1.5} className="shrink-0 text-[#9AA4B2]" aria-hidden />
          </button>
        ) : (
          <div
            className="flex shrink-0 items-center justify-center rounded-lg shadow-[0px_20px_40px_0px_rgba(145,158,171,0.12)]"
            data-name="user-avatar"
            data-node-id="12203:35406"
          >
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
              <img
                src={USER_AVATAR_SRC}
                alt="User avatar"
                className="pointer-events-none absolute inset-0 size-full max-w-none rounded-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
