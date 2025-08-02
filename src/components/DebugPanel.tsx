'use client';

import { useState, useEffect } from 'react';
import { clearAppCache, getStorageInfo, checkMemoryLeak, forceCleanReload, startMemoryMonitoring } from '@/lib/storage-cleanup';
import { cache } from '@/lib/cache';
import { clearSupabaseData, checkSupabaseHealth } from '@/lib/supabase';

export default function DebugPanel() {
  const [showPanel, setShowPanel] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  const [supabaseHealth, setSupabaseHealth] = useState<any>(null);

  useEffect(() => {
    // Atalho de teclado para mostrar/ocultar painel (Ctrl+Shift+D)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowPanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Iniciar monitoramento de memória
    startMemoryMonitoring();
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateStorageInfo = () => {
    const info = getStorageInfo();
    setStorageInfo(info);
    
    // Verificar vazamento de memória
    const hasLeak = checkMemoryLeak();
    if (hasLeak) {
      console.warn('⚠️ Vazamento de memória detectado!');
    }
  };

  const updateMemoryInfo = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryInfo({
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      });
    }
  };

  const updateSupabaseHealth = async () => {
    try {
      const health = await checkSupabaseHealth();
      setSupabaseHealth(health);
    } catch (error) {
      console.error('Erro ao verificar saúde do Supabase:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      // Limpar cache da aplicação
      clearAppCache();
      
      // Limpar cache do nosso sistema
      cache.clear();
      
      // Limpar dados do Supabase
      clearSupabaseData();
      
      // Atualizar informações
      updateStorageInfo();
      updateMemoryInfo();
      
      alert('✅ Cache limpo com sucesso!');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      alert('❌ Erro ao limpar cache');
    }
  };

  const handleForceReload = () => {
    if (confirm('Tem certeza que deseja recarregar a página? Isso limpará todo o cache.')) {
      forceCleanReload();
    }
  };

  useEffect(() => {
    if (showPanel) {
      updateStorageInfo();
      updateMemoryInfo();
      
      // Atualizar a cada 5 segundos quando painel estiver aberto
      const interval = setInterval(() => {
        updateStorageInfo();
        updateMemoryInfo();
        updateSupabaseHealth();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [showPanel]);

  if (!showPanel) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg z-50 min-w-80 max-w-96">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">Debug Panel</h3>
        <button
          onClick={() => setShowPanel(false)}
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 text-xs">
        {/* Informações de Storage */}
        <div className="border-b border-gray-600 pb-2">
          <h4 className="font-semibold mb-2">Storage</h4>
          {storageInfo && (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>localStorage:</span>
                <span className="font-mono">{(storageInfo.localStorage / 1024).toFixed(2)}KB</span>
              </div>
              <div className="flex justify-between">
                <span>sessionStorage:</span>
                <span className="font-mono">{(storageInfo.sessionStorage / 1024).toFixed(2)}KB</span>
              </div>
              <div className="flex justify-between">
                <span>Cookies:</span>
                <span className="font-mono">{(storageInfo.cookies / 1024).toFixed(2)}KB</span>
              </div>
            </div>
          )}
        </div>

        {/* Informações de Memória */}
        <div className="border-b border-gray-600 pb-2">
          <h4 className="font-semibold mb-2">Memória</h4>
          {memoryInfo && (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Usada:</span>
                <span className={`font-mono ${memoryInfo.used > 100 ? 'text-red-400' : 'text-green-400'}`}>
                  {memoryInfo.used}MB
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-mono">{memoryInfo.total}MB</span>
              </div>
              <div className="flex justify-between">
                <span>Limite:</span>
                <span className="font-mono">{memoryInfo.limit}MB</span>
              </div>
            </div>
          )}
        </div>

        {/* Cache da Aplicação */}
        <div className="border-b border-gray-600 pb-2">
          <h4 className="font-semibold mb-2">Cache da App</h4>
          <div className="flex justify-between">
            <span>Itens em cache:</span>
            <span className="font-mono">{cache ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>

        {/* Saúde do Supabase */}
        <div className="border-b border-gray-600 pb-2">
          <h4 className="font-semibold mb-2">Supabase</h4>
          {supabaseHealth && (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-mono ${supabaseHealth.healthy ? 'text-green-400' : 'text-red-400'}`}>
                  {supabaseHealth.healthy ? '✅ OK' : '❌ Erro'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tempo resposta:</span>
                <span className="font-mono">{supabaseHealth.responseTime?.toFixed(0)}ms</span>
              </div>
              {supabaseHealth.error && (
                <div className="text-red-400 text-xs">
                  Erro: {supabaseHealth.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="space-y-2">
          <button
            onClick={handleClearCache}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
          >
            🧹 Limpar Cache
          </button>
          
          <button
            onClick={handleForceReload}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
          >
            🔄 Recarregar Limpo
          </button>
          
          <button
            onClick={() => {
              updateStorageInfo();
              updateMemoryInfo();
            }}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium"
          >
            📊 Atualizar Dados
          </button>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        Pressione Ctrl+Shift+D para ocultar
      </div>
    </div>
  );
} 