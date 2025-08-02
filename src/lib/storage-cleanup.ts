// =====================================================
// LIMPEZA DE STORAGE E CACHE - FINANCEANCHOR
// =====================================================

export interface StorageInfo {
  localStorage: number;
  sessionStorage: number;
  cookies: number;
  cacheStorage: number;
  indexedDB: number;
}

// Função para limpar todo o storage do navegador
export function clearAllStorage() {
  try {
    // Limpar localStorage
    localStorage.clear();
    console.log('✅ localStorage limpo');

    // Limpar sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage limpo');

    // Limpar cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('✅ Cookies limpos');

    // Limpar cache do Service Worker
    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (const name of names) {
          caches.delete(name);
        }
      });
      console.log('✅ Cache do Service Worker limpo');
    }

    // Limpar IndexedDB
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          indexedDB.deleteDatabase(db.name);
        });
      });
      console.log('✅ IndexedDB limpo');
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar storage:', error);
    return false;
  }
}

// Função para obter informações do storage
export function getStorageInfo(): StorageInfo {
  const info: StorageInfo = {
    localStorage: 0,
    sessionStorage: 0,
    cookies: 0,
    cacheStorage: 0,
    indexedDB: 0
  };

  try {
    // Calcular tamanho do localStorage
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        info.localStorage += localStorage[key].length + key.length;
      }
    }

    // Calcular tamanho do sessionStorage
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        info.sessionStorage += sessionStorage[key].length + key.length;
      }
    }

    // Calcular tamanho dos cookies
    info.cookies = document.cookie.length;

    // Verificar cache do Service Worker
    if ('caches' in window) {
      caches.keys().then(names => {
        info.cacheStorage = names.length;
      });
    }

    // Verificar IndexedDB
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        info.indexedDB = databases.length;
      });
    }

  } catch (error) {
    console.error('Erro ao obter informações do storage:', error);
  }

  return info;
}

// Função para limpar cache específico da aplicação
export function clearAppCache() {
  try {
    // Limpar cache do nosso sistema
    if (typeof window !== 'undefined' && window.cache) {
      window.cache.clear();
      console.log('✅ Cache da aplicação limpo');
    }

    // Limpar dados do Supabase
    const supabaseKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase')) {
        supabaseKeys.push(key);
      }
    }
    
    supabaseKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log(`✅ ${supabaseKeys.length} chaves do Supabase removidas`);

    // Limpar dados de autenticação
    const authKeys = ['auth', 'user', 'session', 'token'];
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    console.log('✅ Dados de autenticação limpos');

    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache da aplicação:', error);
    return false;
  }
}

// Função para verificar se há vazamento de memória
export function checkMemoryLeak(): boolean {
  try {
    const info = getStorageInfo();
    const totalSize = info.localStorage + info.sessionStorage + info.cookies;
    
    // Se o storage estiver muito grande (> 1MB), pode ser vazamento
    if (totalSize > 1024 * 1024) {
      console.warn('⚠️ Possível vazamento de memória detectado:', {
        localStorage: `${(info.localStorage / 1024).toFixed(2)}KB`,
        sessionStorage: `${(info.sessionStorage / 1024).toFixed(2)}KB`,
        cookies: `${(info.cookies / 1024).toFixed(2)}KB`,
        total: `${(totalSize / 1024 / 1024).toFixed(2)}MB`
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar vazamento de memória:', error);
    return false;
  }
}

// Função para forçar reload limpo
export function forceCleanReload() {
  try {
    // Limpar cache da aplicação
    clearAppCache();
    
    // Aguardar um pouco
    setTimeout(() => {
      // Forçar reload sem cache
      window.location.reload();
    }, 100);
  } catch (error) {
    console.error('Erro ao forçar reload limpo:', error);
  }
}

// Função para monitorar uso de memória
export function startMemoryMonitoring() {
  if (typeof window === 'undefined') return;

  const checkMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      
      // Alertar se uso de memória estiver alto
      if (usedMB > 100) {
        console.warn(`⚠️ Uso de memória alto: ${usedMB}MB / ${totalMB}MB`);
        
        // Se estiver muito alto, sugerir limpeza
        if (usedMB > 200) {
          console.error(`🚨 Uso de memória crítico: ${usedMB}MB - Considere recarregar a página`);
        }
      }
    }
  };

  // Verificar a cada 30 segundos
  setInterval(checkMemory, 30000);
  
  // Verificar imediatamente
  checkMemory();
} 