"use client";
import { useState, useEffect, useRef } from "react";
import { dataAPI } from "@/lib/api";

interface UnsplashImage {
  imageUrl: string;
  photographer: string;
  cached: boolean;
}

const memoryCache = new Map<string, UnsplashImage>();

/**
 * Fetches an Unsplash image through the backend proxy (with MongoDB 24hr cache).
 * Also keeps an in-memory cache per session to avoid redundant network calls.
 */
export function useUnsplash(query: string) {
  const [data, setData] = useState<UnsplashImage | null>(memoryCache.get(query) ?? null);
  const [loading, setLoading] = useState(!memoryCache.has(query));
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query) return;

    // Serve from memory cache immediately
    if (memoryCache.has(query)) {
      setData(memoryCache.get(query)!);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dataAPI.getUnsplashImage(query);
        if (!controller.signal.aborted) {
          memoryCache.set(query, result);
          setData(result);
        }
      } catch (e: AnyValue) {
        if (!controller.signal.aborted) {
          setError(e?.message ?? "Failed to load background");
          console.warn("[useUnsplash] Failed:", query, e?.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      controller.abort();
    };
  }, [query]);

  return { data, loading, error };
}
