import { useCallback, useRef } from "react";

export function useDebounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  ) as (...args: Parameters<T>) => void;
}

export function useThrottle<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
) {
  const lastRef = useRef(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRef.current >= delay) {
        lastRef.current = now;
        fn(...args);
      }
    },
    [fn, delay],
  ) as (...args: Parameters<T>) => void;
}

export function useAsyncLock<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
) {
  const lockRef = useRef(false);

  return useCallback(
    async (...args: Parameters<T>) => {
      if (lockRef.current) return;
      lockRef.current = true;
      try {
        await fn(...args);
      } finally {
        lockRef.current = false;
      }
    },
    [fn],
  ) as (...args: Parameters<T>) => Promise<void>;
}
