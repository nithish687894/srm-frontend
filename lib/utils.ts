import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function extractBatch(batchStr: string): number {
  if (!batchStr || typeof batchStr !== "string") return 1;
  const s = batchStr.trim().toUpperCase();
  
  // Look for explicit "BATCH 1" / "BATCH 2" or "B1" / "B2" or "BATCH-1" / "BATCH-2"
  const batchMatch = s.match(/BATCH[\s-_]*([12])\b/i) || s.match(/\bB([12])\b/i);
  if (batchMatch) return parseInt(batchMatch[1]);
  
  // If it's a "1/2" or "2/1" format (e.g. Section/Batch or Batch/Section)
  if (s.includes("/")) {
    const parts = s.split("/");
    const lastPart = parts[parts.length - 1].trim();
    const b = parseInt(lastPart);
    if (b === 1 || b === 2) return b;
    const firstPart = parts[0].trim();
    const b1 = parseInt(firstPart);
    if (b1 === 1 || b1 === 2) return b1;
  }
  
  // Look for standalone digit 1 or 2 ONLY (do not match years like 2023, 2024, 2027)
  const digitMatch = s.match(/\b([12])\b/);
  if (digitMatch) return parseInt(digitMatch[1]);
  
  return 1;
}
