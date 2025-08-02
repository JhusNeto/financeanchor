// Configuração avançada do Service Worker para PWA
const SW_CONFIG = {
  // Cache names
  CACHE_NAMES: {
    STATIC: 'static-resources-v1',
    DYNAMIC: 'dynamic-resources-v1',
    API: 'api-cache-v1',
    IMAGES: 'images-cache-v1',
    FONTS: 'fonts-cache-v1',
  },

  // URLs para cache
  STATIC_URLS: [
    '/',
    '/dashboard',
    '/expenses',
    '/budget',
    '/goal',
    '/debts',
    '/manifest.json',
    '/sw.js',
    '/icon-192.png',
    '/icon-512.png',
    '/apple-touch-icon.png',
  ],

  // Estratégias de cache
  STRATEGIES: {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
  },

  // Configurações de notificação
  NOTIFICATION_CONFIG: {
    DEFAULT_ICON: '/icon-192.png',
    DEFAULT_BADGE: '/icon-192.png',
    VIBRATE_PATTERN: [200, 100, 200],
    ACTIONS: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icon-192.png',
      },
      {
        action: 'dismiss',
        title: 'Fechar',
        icon: '/icon-192.png',
      },
    ],
  },

  // Configurações de sincronização em background
  BACKGROUND_SYNC: {
    SYNC_TAG: 'financeanchor-sync',
    SYNC_EVENTS: ['expense-sync', 'goal-sync', 'budget-sync'],
  },

  // Configurações de atualização
  UPDATE_CONFIG: {
    CHECK_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
    SHOW_UPDATE_PROMPT: true,
    AUTO_UPDATE: false,
  },
};

// Função para limpar caches antigos
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(SW_CONFIG.CACHE_NAMES);
  
  for (const cacheName of cacheNames) {
    if (!currentCaches.includes(cacheName)) {
      await caches.delete(cacheName);
      console.log('Cache antigo removido:', cacheName);
    }
  }
}

// Função para verificar atualizações
async function checkForUpdates() {
  try {
    const response = await fetch('/manifest.json', { cache: 'no-cache' });
    const manifest = await response.json();
    
    // Comparar versões ou timestamps
    const currentVersion = await getCurrentVersion();
    const newVersion = manifest.version || Date.now();
    
    if (newVersion > currentVersion) {
      // Nova versão disponível
      self.postMessage({ type: 'UPDATE_AVAILABLE' });
    }
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
  }
}

// Função para obter versão atual
async function getCurrentVersion() {
  try {
    const cache = await caches.open(SW_CONFIG.CACHE_NAMES.STATIC);
    const response = await cache.match('/manifest.json');
    if (response) {
      const manifest = await response.json();
      return manifest.version || 0;
    }
  } catch (error) {
    console.error('Erro ao obter versão atual:', error);
  }
  return 0;
}

// Função para sincronização em background
async function handleBackgroundSync(syncEvent) {
  console.log('Sincronização em background:', syncEvent.tag);
  
  try {
    // Implementar lógica de sincronização específica
    switch (syncEvent.tag) {
      case 'expense-sync':
        await syncExpenses();
        break;
      case 'goal-sync':
        await syncGoals();
        break;
      case 'budget-sync':
        await syncBudgets();
        break;
      default:
        console.log('Tag de sincronização não reconhecida:', syncEvent.tag);
    }
  } catch (error) {
    console.error('Erro na sincronização em background:', error);
  }
}

// Funções de sincronização específicas
async function syncExpenses() {
  // Implementar sincronização de despesas
  console.log('Sincronizando despesas...');
}

async function syncGoals() {
  // Implementar sincronização de metas
  console.log('Sincronizando metas...');
}

async function syncBudgets() {
  // Implementar sincronização de orçamentos
  console.log('Sincronizando orçamentos...');
}

// Função para mostrar notificação
function showNotification(title, options = {}) {
  const notificationOptions = {
    ...SW_CONFIG.NOTIFICATION_CONFIG,
    ...options,
  };

  return self.registration.showNotification(title, notificationOptions);
}

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SW_CONFIG;
} else {
  self.SW_CONFIG = SW_CONFIG;
  self.cleanOldCaches = cleanOldCaches;
  self.checkForUpdates = checkForUpdates;
  self.handleBackgroundSync = handleBackgroundSync;
  self.showNotification = showNotification;
} 