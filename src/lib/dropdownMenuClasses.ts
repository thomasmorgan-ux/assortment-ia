/**
 * Open menu / listbox **option row**: blue wash + blue semibold text (design reference).
 * Pair with `rounded-md` on the control where appropriate.
 */
export const dropdownMenuItemHover = 'dropdown-menu-item-hover';

/** Product / location drill popover rows: `rgb(242, 247, 255)` wash; label stays default. */
export const drillDropdownMenuItemHover = 'hover:bg-[rgb(242,247,255)]';

/**
 * **Triggers** (toolbar, table header chevrons, drill/⋯ icons): wash only, no label styling.
 */
export const dropdownTriggerHoverBg = 'dropdown-row-hover-bg';

/**
 * Fixed / anchored menu panel body — matches row actions `role="menu"` in AssortmentTable
 * (`rounded-[6px]`, `p-2`, `gap-1`, soft shadow).
 */
export const rowActionsMenuPanelChromeClass =
  'flex max-h-[min(320px,85vh)] flex-col gap-1 overflow-y-auto rounded-[6px] bg-white p-2 shadow-[0px_8px_25px_0px_rgba(0,0,0,0.12)]';
