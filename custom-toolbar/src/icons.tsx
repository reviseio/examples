// 16px stroke icons, drawn in currentColor.
const props = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const BulletsIcon = () => (
  <svg {...props}>
    <path d="M6 4h8M6 8h8M6 12h8" />
    <circle cx="2.5" cy="4" r=".6" fill="currentColor" />
    <circle cx="2.5" cy="8" r=".6" fill="currentColor" />
    <circle cx="2.5" cy="12" r=".6" fill="currentColor" />
  </svg>
);

export const NumbersIcon = () => (
  <svg {...props}>
    <path d="M7 4h7M7 8h7M7 12h7" />
    <path d="M2 3l1-.5V6M2 10.5c.3-.6 2-.8 2 .2 0 .8-2 1.3-2 2.3h2" strokeWidth={1.1} />
  </svg>
);

export const LinkIcon = () => (
  <svg {...props}>
    <path d="M7 9a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.6.6" />
    <path d="M9 7a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.6-.6" />
  </svg>
);

export const UndoIcon = () => (
  <svg {...props}>
    <path d="M5 3L2 6l3 3" />
    <path d="M2 6h7.5a4 4 0 0 1 0 8H7" />
  </svg>
);

export const RedoIcon = () => (
  <svg {...props}>
    <path d="M11 3l3 3-3 3" />
    <path d="M14 6H6.5a4 4 0 0 0 0 8H9" />
  </svg>
);
