type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/** Schedule non-critical client work without competing with initial rendering. */
export function scheduleIdleTask(callback: () => void, timeout = 2500): () => void {
  if (typeof window === "undefined") return () => {};

  const idleWindow = window as IdleCapableWindow;
  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, timeout);
  return () => window.clearTimeout(handle);
}
