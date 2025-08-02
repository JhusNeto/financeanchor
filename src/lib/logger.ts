// =====================================================
// SISTEMA DE LOGGING - FINANCEANCHOR
// =====================================================

interface LogData {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: any;
  context?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

// Configuração de logging
const LOG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  maxLogs: 100, // Limite de logs em memória
  flushInterval: 5000, // Intervalo para enviar logs (5s)
};

// Buffer de logs para evitar spam
let logBuffer: LogData[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

// Função para enviar log para o servidor (otimizada)
async function sendLogToServer(logData: LogData) {
  // Em produção, desabilitar logs para melhor performance
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // Adicionar ao buffer
  logBuffer.push(logData);
  
  // Limitar tamanho do buffer
  if (logBuffer.length > LOG_CONFIG.maxLogs) {
    logBuffer = logBuffer.slice(-LOG_CONFIG.maxLogs);
  }

  // Agendar flush se não estiver agendado
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushLogs();
    }, LOG_CONFIG.flushInterval);
  }
}

// Função para enviar logs em lote
async function flushLogs() {
  if (logBuffer.length === 0) return;
  
  try {
    // Em desenvolvimento, apenas console.log
    if (process.env.NODE_ENV === 'development') {
      logBuffer.forEach(log => {
        console.log(`[${log.context || 'APP'}] ${log.message}`, log.error);
      });
    }
    
    // Limpar buffer
    logBuffer = [];
  } catch (error) {
    console.error('Erro ao enviar logs:', error);
  } finally {
    flushTimeout = null;
  }
}

// Logger principal otimizado
export const logger = {
  error: (message: string, error?: any, context?: string) => {
    if (!LOG_CONFIG.enabled) return;
    
    const logData: LogData = {
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      } : undefined,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Log imediato para erros críticos
    console.error(`[${context || 'APP'}] ${message}`, error);
    sendLogToServer(logData);
  },

  warn: (message: string, error?: any, context?: string) => {
    if (!LOG_CONFIG.enabled) return;
    
    const logData: LogData = {
      level: 'warn',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      } : undefined,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    console.warn(`[${context || 'APP'}] ${message}`, error);
    sendLogToServer(logData);
  },

  info: (message: string, data?: any, context?: string) => {
    if (!LOG_CONFIG.enabled) return;
    
    const logData: LogData = {
      level: 'info',
      message,
      error: data,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    console.info(`[${context || 'APP'}] ${message}`, data);
    sendLogToServer(logData);
  },

  debug: (message: string, data?: any, context?: string) => {
    if (!LOG_CONFIG.enabled) return;
    
    const logData: LogData = {
      level: 'debug',
      message,
      error: data,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    console.debug(`[${context || 'APP'}] ${message}`, data);
    sendLogToServer(logData);
  }
};

// Hook para capturar erros globais (otimizado)
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined' && LOG_CONFIG.enabled) {
    // Capturar erros não tratados
    window.addEventListener('error', (event) => {
      logger.error('Erro global não tratado', event.error, 'GLOBAL_ERROR');
    });

    // Capturar promessas rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Promise rejeitada não tratada', event.reason, 'UNHANDLED_PROMISE');
    });

    // Capturar erros de console (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.error = (...args) => {
        originalConsoleError.apply(console, args);
        logger.error(args.join(' '), undefined, 'CONSOLE_ERROR');
      };

      console.warn = (...args) => {
        originalConsoleWarn.apply(console, args);
        logger.warn(args.join(' '), undefined, 'CONSOLE_WARN');
      };
    }
  }
}

// Função para limpar logs ao sair da página
export function cleanupLogger() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  flushLogs();
} 