import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function extractBatch(batchStr: string): number {
  if (!batchStr || typeof batchStr !== "string") return 1;
  const s = batchStr.trim();
  // Handle "2/1" format shown in user screenshot
  if (s.includes("/")) {
    const parts = s.split("/");
    const b = parseInt(parts[parts.length - 1].trim());
    if (!isNaN(b)) return b;
  }
  // Fallback: look for any digit in the string (e.g. "Batch 2", "B1")
  const match = s.match(/\d+/);
  if (match) return parseInt(match[0]);
  return 1;
}
