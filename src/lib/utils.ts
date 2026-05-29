import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Human-readable byte size for storage/usage UI (e.g. "500 GB", "2 TB", "4.3 MB").
 * Uses binary units (1024) to match the byte accounting in `storage_cap_bytes` /
 * `storage_used_bytes` so displayed numbers reconcile with enforcement.
 */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** i;
  // Whole numbers read cleaner without a trailing ".0".
  const rounded = Number.isInteger(value)
    ? value
    : value.toFixed(fractionDigits);
  return `${rounded} ${units[i]}`;
}

/**
 * Formats an `events.event_date` ("YYYY-MM-DD", a date-only column) for display.
 * WHY split-and-construct instead of `new Date(str)`: `new Date("2026-06-01")`
 * parses as UTC midnight, which renders as the *previous* day for anyone west of
 * UTC. Building the Date from local Y/M/D parts pins it to the host's own day.
 */
export function formatEventDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
