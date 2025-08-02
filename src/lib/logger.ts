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

// Função para enviar log para o servidor
async function sendLogToServer(logData: LogData) {
  // Removido - apenas console logs para performance
  return;
}

// Logger principal
export const logger = {
  error: (message: string, error?: any, context?: string) => {
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

    // Log no console do cliente
    console.error(`[${context || 'APP'}] ${message}`, error);

    // Enviar para servidor
    sendLogToServer(logData);
  },

  warn: (message: string, error?: any, context?: string) => {
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

// Hook para capturar erros globais
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    // Capturar erros não tratados
    window.addEventListener('error', (event) => {
      logger.error('Erro global não tratado', event.error, 'GLOBAL_ERROR');
    });

    // Capturar promessas rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Promise rejeitada não tratada', event.reason, 'UNHANDLED_PROMISE');
    });

    // Capturar erros de console
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