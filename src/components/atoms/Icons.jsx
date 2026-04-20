// All SVG icons — thin, monochrome, matching the design
const Icon = ({ d, size = 14, strokeWidth = 1.5, fill = 'none', className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={fill}
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0 }}
  >
    {d}
  </svg>
);

export const IconSearch  = p => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>}/>;
export const IconPlus    = p => <Icon {...p} d={<><path d="M12 5v14M5 12h14"/></>}/>;
export const IconCmd     = p => <Icon {...p} d={<><path d="M9 6H6a3 3 0 1 0 3 3V6zM15 6h3a3 3 0 1 1-3 3V6zM9 18H6a3 3 0 1 1 3-3v3zM15 18h3a3 3 0 1 0-3-3v3zM9 9h6v6H9z"/></>}/>;
export const IconInbox   = p => <Icon {...p} d={<><path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 4h14l2 9v6H3v-6l2-9z"/></>}/>;
export const IconCal     = p => <Icon {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>}/>;
export const IconPeople  = p => <Icon {...p} d={<><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="7" r="2.5"/><path d="M22 18c0-2.6-2-4.5-5-4.5"/></>}/>;
export const IconThread  = p => <Icon {...p} d={<><path d="M4 6h16M4 12h10M4 18h16"/></>}/>;
export const IconTag     = p => <Icon {...p} d={<><path d="M20 12 12 20 3 11V3h8l9 9z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></>}/>;
export const IconDot     = p => <Icon {...p} d={<><circle cx="12" cy="12" r="3" fill="currentColor"/></>}/>;
export const IconChev    = p => <Icon {...p} d={<><path d="m9 6 6 6-6 6"/></>}/>;
export const IconChevLeft = p => <Icon {...p} d={<><path d="m15 18-6-6 6-6"/></>}/>;
export const IconCheck   = p => <Icon {...p} d={<><path d="M20 6 9 17l-5-5"/></>}/>;
export const IconClock   = p => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>;
export const IconArrow   = p => <Icon {...p} d={<><path d="M5 12h14M13 6l6 6-6 6"/></>}/>;
export const IconFilter  = p => <Icon {...p} d={<><path d="M3 5h18l-7 9v5l-4 2v-7L3 5z"/></>}/>;
export const IconSpark   = p => <Icon {...p} d={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></>}/>;
export const IconLink    = p => <Icon {...p} d={<><path d="M10 14a4 4 0 0 1 0-6l3-3a4 4 0 1 1 5.6 5.6L17 12"/><path d="M14 10a4 4 0 0 1 0 6l-3 3a4 4 0 1 1-5.6-5.6L7 12"/></>}/>;
export const IconArchive = p => <Icon {...p} d={<><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M10 12h4"/></>}/>;
export const IconSun     = p => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>}/>;
export const IconMoon    = p => <Icon {...p} d={<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>}/>;
export const IconFolder  = p => <Icon {...p} d={<><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>}/>;
export const IconX       = p => <Icon {...p} d={<><path d="M18 6 6 18M6 6l12 12"/></>}/>;
export const IconEdit    = p => <Icon {...p} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>;
export const IconNote    = p => <Icon {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>}/>;
export const IconDecision = p => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></>}/>;
export const IconQuestion = p => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;
export const IconUpdate  = p => <Icon {...p} d={<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.48"/></>}/>;
export const IconNudge   = p => <Icon {...p} d={<><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>}/>;
export const IconGear    = p => <Icon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>;
export const IconArrowUp = p => <Icon {...p} d={<><path d="M12 19V5M5 12l7-7 7 7"/></>}/>;
