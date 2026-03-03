import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(initialSeconds, onExpire, isActive = true) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(isActive);
  const startTimeRef = useRef(null);
  const initialRef = useRef(initialSeconds);
  const onExpireRef = useRef(onExpire);

  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    startTimeRef.current = Date.now();
    const baseRemaining = remaining;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newRemaining = Math.max(0, baseRemaining - elapsed);
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(interval);
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);
  const elapsed = initialRef.current - remaining;

  return { remaining, elapsed, isRunning, pause, resume };
}
