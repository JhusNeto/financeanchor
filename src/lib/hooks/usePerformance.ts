// =====================================================
// HOOKS DE PERFORMANCE - FINANCEANCHOR
// =====================================================

import { useEffect, useRef, useCallback, useState } from 'react';

// Hook para debounce de funções
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  // `useRef` requires an initial value. Initialize with `null` and allow it to
  // store the timer when one is scheduled.
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}

// Hook para throttle de funções
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  // Same as above, initialize the timer reference to `null` so it can be
  // safely cleared and reassigned.
  const lastCallTimer = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        lastCallTimer.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [callback, delay]
  );
}

// Hook para limpeza automática de timers
export function useCleanup() {
  const timers = useRef<NodeJS.Timeout[]>([]);
  const listeners = useRef<Array<{ element: EventTarget; event: string; handler: EventListener }>>([]);

  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    timers.current.push(timer);
  }, []);

  const addListener = useCallback((element: EventTarget, event: string, handler: EventListener) => {
    element.addEventListener(event, handler);
    listeners.current.push({ element, event, handler });
  }, []);

  useEffect(() => {
    return () => {
      // Limpar todos os timers
      timers.current.forEach(timer => clearTimeout(timer));
      timers.current = [];

      // Remover todos os listeners
      listeners.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      listeners.current = [];
    };
  }, []);

  return { addTimer, addListener };
}

// Hook para detectar mudanças de performance
export function usePerformanceMonitor() {
  const performanceRef = useRef<{
    renderCount: number;
    lastRenderTime: number;
    averageRenderTime: number;
  }>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  });

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      performanceRef.current.renderCount++;
      performanceRef.current.lastRenderTime = renderTime;
      
      // Calcular tempo médio de renderização
      const { renderCount, averageRenderTime } = performanceRef.current;
      performanceRef.current.averageRenderTime = 
        (averageRenderTime * (renderCount - 1) + renderTime) / renderCount;

      // Alertar se o tempo de renderização estiver alto
      if (renderTime > 100) {
        console.warn(`Renderização lenta detectada: ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  return performanceRef.current;
}

// Hook para lazy loading de componentes
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  deps: any[] = []
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    loadData();
  }, deps);

  return { data, loading, error };
} 