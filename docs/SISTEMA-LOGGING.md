# Sistema de Logging - FinanceAnchor

## Visão Geral

O sistema de logging permite que erros e logs do lado do cliente sejam exibidos no terminal do servidor, facilitando o debug e monitoramento da aplicação.

## Funcionalidades Implementadas

### ✅ **1. Logger Centralizado**
- Função `logger` com métodos `error`, `warn`, `info`, `debug`
- Captura automática de contexto, timestamp e informações do usuário
- Envio automático para o servidor via API route

### ✅ **2. API Route para Logs**
- Endpoint `/api/log` para receber logs do cliente
- Exibição formatada no terminal do servidor
- Captura de informações adicionais (User Agent, URL, etc.)

### ✅ **3. Captura de Erros Globais**
- Erros não tratados (`window.addEventListener('error')`)
- Promessas rejeitadas (`window.addEventListener('unhandledrejection')`)
- Interceptação de `console.error` e `console.warn`

### ✅ **4. Componente de Setup**
- `LoggerSetup` configura automaticamente o sistema
- Inicialização automática na aplicação
- Log de informações do ambiente

## Como Usar

### 1. Logs Básicos

```typescript
import { logger } from '@/lib/logger';

// Log de erro
logger.error('Mensagem de erro', error, 'CONTEXT');

// Log de aviso
logger.warn('Mensagem de aviso', data, 'CONTEXT');

// Log informativo
logger.info('Mensagem informativa', data, 'CONTEXT');

// Log de debug
logger.debug('Mensagem de debug', data, 'CONTEXT');
```

### 2. Logs Automáticos

O sistema captura automaticamente:
- Erros não tratados
- Promessas rejeitadas
- Console errors e warnings
- Informações do ambiente

### 3. Visualização no Terminal

Os logs aparecem no terminal do servidor com formato:
```
[2024-01-15T10:30:00.000Z] [ERROR] [AUTH] Erro ao buscar perfil
[2024-01-15T10:30:01.000Z] [INFO] [DASHBOARD] Perfil carregado com sucesso
[2024-01-15T10:30:02.000Z] [WARN] [CONSOLE_WARN] Warning message
```

## Estrutura dos Logs

### Interface LogData
```typescript
interface LogData {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: any;
  context?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
}
```

### Informações Capturadas
- ✅ **Timestamp**: Hora exata do log
- ✅ **Level**: Tipo do log (error, warn, info, debug)
- ✅ **Context**: Contexto da aplicação (AUTH, DASHBOARD, etc.)
- ✅ **Message**: Mensagem do log
- ✅ **Error**: Detalhes do erro (se aplicável)
- ✅ **User Agent**: Informações do navegador
- ✅ **URL**: Página atual

## Arquivos Criados/Modificados

### Backend
- `src/lib/logger.ts` - Sistema de logging principal
- `src/app/api/log/route.ts` - API route para receber logs
- `src/components/LoggerSetup.tsx` - Componente de configuração

### Frontend
- `src/app/layout.tsx` - Inclui LoggerSetup
- `src/lib/auth.ts` - Usa logger ao invés de console
- `src/app/dashboard/page.tsx` - Usa logger ao invés de console

## Vantagens do Sistema

- ✅ **Debug Facilitado**: Logs aparecem no terminal do servidor
- ✅ **Contexto Rico**: Informações detalhadas sobre cada log
- ✅ **Captura Automática**: Erros globais são capturados automaticamente
- ✅ **Formato Padronizado**: Logs consistentes e organizados
- ✅ **Fallback Seguro**: Funciona mesmo se a API falhar

## Exemplos de Uso

### Log de Erro
```typescript
try {
  // código que pode falhar
} catch (error) {
  logger.error('Erro ao processar dados', error, 'DATA_PROCESSING');
}
```

### Log Informativo
```typescript
logger.info('Usuário logado com sucesso', { userId: user.id }, 'AUTH');
```

### Log de Debug
```typescript
logger.debug('Dados do formulário', formData, 'FORM');
```

## Monitoramento

Para monitorar os logs em produção:

1. **Terminal do Servidor**: Logs aparecem automaticamente
2. **Console do Cliente**: Logs também aparecem no console do navegador
3. **API Route**: Pode ser estendida para salvar logs em banco de dados

## Configuração

O sistema é configurado automaticamente através do componente `LoggerSetup` que é incluído no layout principal da aplicação.

## Status

🟢 **SISTEMA IMPLEMENTADO E FUNCIONAL**

O sistema de logging está pronto para uso e captura automaticamente erros e logs do cliente para exibição no terminal do servidor. 