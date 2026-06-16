interface PyramidMarkProps {
  size?: number;
}

/**
 * The logo: a clean three-tier stepped pyramid (the scoring pyramid motif).
 */
export function PyramidMark({ size = 22 }: PyramidMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="var(--accent)"
      aria-hidden="true"
      className="pyramid-mark shrink-0"
    >
      {/* apex */}
      <polygon points="12,3 9.4,7.9 14.6,7.9" />
      {/* middle tier */}
      <polygon points="8.9,8.9 15.1,8.9 17.1,13.6 6.9,13.6" />
      {/* base tier */}
      <polygon points="6.4,14.6 17.6,14.6 20,19.6 4,19.6" />
    </svg>
  );
}
