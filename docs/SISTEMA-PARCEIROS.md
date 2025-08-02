# Sistema de Colaboração Conjugal - FinanceAnchor

## Visão Geral

O sistema de colaboração conjugal permite que casais compartilhem despesas e visualizem dados financeiros em conjunto, mantendo a privacidade e controle individual.

## Funcionalidades Implementadas

### ✅ **1. Vinculação de Parceiros**
- Campo `partner_id` na tabela `profiles`
- Função `invite_partner()` para convidar parceiro por email
- Função `remove_partner()` para desvincular parceiros
- Validações de segurança (não pode se vincular a si mesmo, etc.)

### ✅ **2. Interface de Convite**
- Página `/partner/invite` com formulário elegante
- Validação de email e feedback visual
- Redirecionamento automático após sucesso

### ✅ **3. Despesas Compartilhadas**
- Campo `is_shared` na tabela `expenses`
- Função `get_shared_expenses()` para buscar despesas compartilhadas
- Visualização diferenciada no dashboard e lista de despesas

### ✅ **4. Dashboard Conjugal**
- Seção especial para parceiros conectados
- Exibição de despesas compartilhadas recentes
- Indicadores de quem lançou cada despesa
- Botões de ação rápida para gastos compartilhados

### ✅ **5. Permissões e Segurança**
- Políticas RLS para visualização de dados do parceiro
- Apenas leitura dos dados do parceiro (não pode editar)
- Indicadores claros de quem lançou cada despesa

## Estrutura do Banco de Dados

### Tabela `profiles`
```sql
ALTER TABLE profiles ADD COLUMN partner_id UUID REFERENCES profiles(id);
```

### Tabela `expenses`
```sql
ALTER TABLE expenses ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;
```

### Funções SQL Criadas
- `invite_partner(p_inviter_id, p_partner_email)` - Convidar parceiro
- `remove_partner(p_user_id)` - Remover parceiro
- `get_partner_data(p_user_id)` - Obter dados do parceiro
- `get_shared_expenses(p_user_id)` - Obter despesas compartilhadas

## Interface do Usuário

### Dashboard
- **Sem parceiro**: Card de convite para conectar com parceiro
- **Com parceiro**: Seção especial com despesas compartilhadas

### Página de Despesas
- Seção destacada para despesas compartilhadas
- Indicadores visuais de quem lançou cada despesa
- Total separado para despesas compartilhadas

### Nova Despesa
- Toggle para marcar despesa como compartilhada
- Campo `is_shared` já implementado

## Fluxo de Uso

### 1. Convidar Parceiro
1. Usuário acessa `/partner/invite`
2. Digita email do parceiro
3. Sistema valida e vincula os perfis
4. Ambos podem ver despesas compartilhadas

### 2. Registrar Despesa Compartilhada
1. Usuário acessa `/expenses/new`
2. Marca toggle "Gasto compartilhado"
3. Despesa aparece para ambos os parceiros

### 3. Visualizar Dados Conjuntos
1. Dashboard mostra seção especial do parceiro
2. Lista de despesas separa compartilhadas e individuais
3. Indicadores mostram quem lançou cada despesa

## Arquivos Criados/Modificados

### Backend (SQL)
- `supabase-partner-system.sql` - Script completo do sistema
- Funções SQL para gerenciar parceiros
- Políticas RLS para segurança

### Frontend (TypeScript)
- `src/lib/partners.ts` - Funções para gerenciar parceiros
- `src/app/partner/invite/page.tsx` - Página de convite
- `src/app/dashboard/page.tsx` - Dashboard atualizado
- `src/app/expenses/page.tsx` - Lista de despesas atualizada

### Tipos
- `PartnerData` - Interface para dados do parceiro
- `SharedExpense` - Interface para despesas compartilhadas
- `InvitePartnerResponse` - Interface para resposta do convite

## Segurança e Privacidade

### Políticas RLS
- Usuários só veem dados do próprio parceiro
- Não é possível editar dados do parceiro
- Validações para evitar auto-vinculação

### Validações
- Verificação se usuário já tem parceiro
- Verificação se parceiro já tem parceiro
- Prevenção de auto-vinculação
- Validação de email existente

## Próximos Passos (Futuro)

### 🚀 **Metas Compartilhadas**
- Campo `is_shared` em metas
- Visualização conjunta de progresso
- Contribuições de ambos os parceiros

### 🚀 **Orçamento Compartilhado**
- Orçamento mensal conjunto
- Divisão de responsabilidades
- Alertas de limite conjunto

### 🚀 **Notificações**
- Notificação quando parceiro adiciona despesa
- Alertas de metas próximas do vencimento
- Lembretes de pagamentos compartilhados

## Como Testar

1. **Execute o script SQL** no Supabase:
   ```sql
   -- Execute supabase-partner-system.sql
   ```

2. **Teste o convite**:
   - Acesse `/partner/invite`
   - Digite email de outro usuário
   - Verifique se vinculou corretamente

3. **Teste despesas compartilhadas**:
   - Adicione despesa marcando como compartilhada
   - Verifique se aparece para ambos os parceiros

4. **Teste dashboard**:
   - Verifique seção do parceiro aparece
   - Confirme despesas compartilhadas visíveis

## Status

🟢 **SISTEMA IMPLEMENTADO E FUNCIONAL**

- ✅ Vinculação de parceiros
- ✅ Despesas compartilhadas
- ✅ Interface elegante
- ✅ Segurança implementada
- ✅ Dashboard conjugal
- ✅ Permissões adequadas

O sistema está pronto para uso e fornece uma base sólida para futuras funcionalidades compartilhadas! 