interface PyramidMarkProps {
  size?: number;
}

/** The pyramid logo motif. */
export function PyramidMark({ size = 22 }: PyramidMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12 3l9 17H3L12 3z"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8.2 13h7.6M6 17h12" stroke="var(--accent)" strokeWidth="1.5" />
    </svg>
  );
}
