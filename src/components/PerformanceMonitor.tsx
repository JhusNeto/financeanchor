'use client';

import { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/lib/hooks/usePerformance';

interface PerformanceStats {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export default function PerformanceMonitor() {
  const [showMonitor, setShowMonitor] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  });

  const performanceData = usePerformanceMonitor();

  useEffect(() => {
    setStats(performanceData);
  }, [performanceData]);

  // Atalho de teclado para mostrar/ocultar monitor (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowMonitor(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!showMonitor) {
    return null;
  }

  const getPerformanceColor = (time: number) => {
    if (time < 50) return 'text-green-600';
    if (time < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  };

  const memory = getMemoryUsage();

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg z-50 min-w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">Performance Monitor</h3>
        <button
          onClick={() => setShowMonitor(false)}
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Renderizações:</span>
          <span className="font-mono">{stats.renderCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Última renderização:</span>
          <span className={`font-mono ${getPerformanceColor(stats.lastRenderTime)}`}>
            {stats.lastRenderTime.toFixed(1)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Tempo médio:</span>
          <span className={`font-mono ${getPerformanceColor(stats.averageRenderTime)}`}>
            {stats.averageRenderTime.toFixed(1)}ms
          </span>
        </div>

        {memory && (
          <>
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="flex justify-between">
                <span>Memória usada:</span>
                <span className="font-mono">{memory.used}MB</span>
              </div>
              <div className="flex justify-between">
                <span>Memória total:</span>
                <span className="font-mono">{memory.total}MB</span>
              </div>
              <div className="flex justify-between">
                <span>Limite:</span>
                <span className="font-mono">{memory.limit}MB</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        Pressione Ctrl+Shift+P para ocultar
      </div>
    </div>
  );
} 