const UNITS: [number, string][] = [
  [60 * 60 * 24 * 365, "y"],
  [60 * 60 * 24 * 7, "w"],
  [60 * 60 * 24, "d"],
  [60 * 60, "h"],
  [60, "m"],
];

// Threads-style short relative time: "now", "5m", "3h", "2d", "1w", "1y".
export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  for (const [size, label] of UNITS) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label}`;
  }
  return "now";
}
