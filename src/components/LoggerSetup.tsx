'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandling } from '@/lib/logger';

export default function LoggerSetup() {
  useEffect(() => {
    // Configurar captura de erros globais apenas uma vez
    setupGlobalErrorHandling();
    
  }, []);

  return null; // Componente não renderiza nada
} 