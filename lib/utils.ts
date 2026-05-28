import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function extractBatch(batchStr: string): number {
  if (!batchStr || typeof batchStr !== "string") return 1;
  const s = batchStr.trim().toUpperCase();
  
  // If it's a "2/1" or "1/2" format
  if (s.includes("/")) {
    const parts = s.split("/");
    // Usually Batch is the second number
    const lastPart = parts[parts.length - 1].trim();
    const b = parseInt(lastPart);
    if (!isNaN(b)) return b;
  }
  
  // Look for "BATCH X" or "B X"
  const batchMatch = s.match(/BATCH\s*(\d+)/i) || s.match(/B\s*(\d+)/i);
  if (batchMatch) return parseInt(batchMatch[1]);
  
  // Fallback: search for AnyValue standalone digit
  const digitMatch = s.match(/\b(\d+)\b/);
  if (digitMatch) return parseInt(digitMatch[1]);
  
  return 1;
}
