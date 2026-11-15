import { useId } from "react";

export function BrandMark({ size = 48, className }: { size?: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Semillas de Bondad"
    >
      <defs>
        <linearGradient id={`bm-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A9248" />
          <stop offset="1" stopColor="#14532D" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#bm-${id})`} />
      <path d="M24 36V22" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M24 24c0-6 4-10 11-10 0 7-4 11-11 10Z" fill="#fff" />
      <path d="M24 27c0-5-3.4-8.4-9.6-8.4 0 6 3.4 9.2 9.6 8.4Z" fill="#BBF7D0" />
      <ellipse cx="24" cy="37" rx="7" ry="1.6" fill="#fff" opacity=".35" />
    </svg>
  );
}

export function GithubMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
