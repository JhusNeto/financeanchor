# Sistema de Gamificação - FinanceAnchor

## Visão Geral

O sistema de gamificação do FinanceAnchor foi implementado para motivar os usuários a manterem hábitos financeiros saudáveis através de conquistas, feedbacks positivos e progresso visual.

## Estrutura do Banco de Dados

### Tabela `achievements`

```sql
CREATE TABLE achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Funções RPC

- `check_achievement_exists(user_id, type)` - Verifica se usuário já tem uma conquista
- `add_achievement_if_not_exists(user_id, type, title, description)` - Adiciona conquista se não existir
- `get_user_achievements(user_id)` - Retorna conquistas do usuário
- `count_user_achievements(user_id)` - Conta total de conquistas

## Tipos de Conquistas

### 1. 🧠 Primeiro Gasto (`primeiro_gasto`)
- **Condição**: Usuário registra seu primeiro gasto
- **Título**: "Primeiro Passo"
- **Descrição**: "Você registrou seu primeiro gasto!"

### 2. 🔥 Controle Total (`semana_orcamento`)
- **Condição**: Uma semana inteira abaixo do orçamento
- **Título**: "Controle Total"
- **Descrição**: "Uma semana inteira abaixo do orçamento!"

### 3. 🎯 Meta Conquistada (`meta_atingida`)
- **Condição**: Usuário atinge 100% de uma meta
- **Título**: "Meta Conquistada"
- **Descrição**: "Você atingiu uma meta financeira!"

### 4. 💸 Mil Reais Economizados (`mil_economizados`)
- **Condição**: Usuário economiza R$1.000
- **Título**: "Mil Reais Economizados"
- **Descrição**: "Você economizou R$1.000!"

### 5. ✅ Dívida Zerada (`divida_zerada`)
- **Condição**: Usuário quita uma dívida completamente
- **Título**: "Dívida Zerada"
- **Descrição**: "Você quitou uma dívida completamente!"

### 6. 💪 30 Dias de Dedicação (`30_dias_app`)
- **Condição**: 30 dias seguidos usando o app
- **Título**: "30 Dias de Dedicação"
- **Descrição**: "30 dias seguidos usando o app!"

### 7. 🎯 Primeira Meta (`primeira_meta`)
- **Condição**: Usuário cria sua primeira meta
- **Título**: "Primeira Meta"
- **Descrição**: "Você criou sua primeira meta financeira!"

### 8. 📊 Orçamento Mensal (`orcamento_mensal`)
- **Condição**: Usuário cria um orçamento mensal
- **Título**: "Orçamento Mensal"
- **Descrição**: "Você criou um orçamento mensal!"

### 9. 🆓 Mês Sem Dívidas (`sem_dividas_mes`)
- **Condição**: Um mês inteiro sem novas dívidas
- **Título**: "Mês Sem Dívidas"
- **Descrição**: "Um mês inteiro sem novas dívidas!"

### 10. 💰 Economia Consistente (`economia_consistente`)
- **Condição**: 3 meses seguidos economizando
- **Título**: "Economia Consistente"
- **Descrição**: "3 meses seguidos economizando!"

## Componentes Implementados

### 1. AchievementNotification
- Modal animado com confetes
- Som de celebração (opcional)
- Vibração do dispositivo (se disponível)
- Auto-close após 5 segundos

### 2. AchievementsSection
- Exibe conquistas recentes no dashboard
- Mostra progresso das próximas conquistas
- Estado vazio quando não há conquistas

### 3. AchievementProgress
- Componente dedicado para progresso
- Barras de progresso animadas
- Informações detalhadas de cada conquista

### 4. Página de Conquistas (/settings/achievements)
- Lista completa de todas as conquistas
- Estatísticas do usuário
- Progresso detalhado
- Estado vazio com preview das conquistas

## Integração no Dashboard

### Seção de Conquistas
- Posicionada após o insight do dia
- Mostra 3 conquistas mais recentes
- Exibe progresso das próximas conquistas
- Link para página completa

### Notificações
- Aparecem automaticamente quando conquista é desbloqueada
- Sistema de fila para múltiplas notificações
- Animações suaves e feedback visual

## Hook useAchievementChecker

```typescript
const { checkForAchievements } = useAchievementChecker({
  expenses: userExpenses,
  goals: userGoals,
  debts: userDebts,
  budgets: userBudgets,
  onNewAchievement: (type) => {
    // Adicionar notificação
    addNotification(achievement);
  }
});
```

## Configurações de UX

### Animações
- Confetes animados (20 partículas)
- Modal com entrada suave
- Barras de progresso com transições
- Hover effects nos cards

### Feedback Sensorial
- Vibração do dispositivo (100ms, 50ms, 100ms)
- Som de celebração (volume 30%)
- Cores gradientes para destaque

### Privacidade
- Conquistas são privadas por padrão
- RLS (Row Level Security) implementado
- Usuário só vê suas próprias conquistas

## Fluxo de Verificação

1. **Carregamento de Dados**: Dashboard carrega dados do usuário
2. **Verificação Automática**: Sistema verifica condições das conquistas
3. **Adição de Conquista**: Se condição atendida, adiciona à tabela
4. **Notificação**: Modal aparece com animação e som
5. **Atualização UI**: Dashboard atualiza seção de conquistas

## Próximas Melhorias

### Funcionalidades Futuras
- [ ] Sistema de níveis (bronze, prata, ouro, diamante)
- [ ] Ranking entre usuários
- [ ] Streaks (sequências de dias)
- [ ] Conquistas sazonais
- [ ] Badges especiais
- [ ] Compartilhamento de conquistas

### Melhorias Técnicas
- [ ] Cache de conquistas no localStorage
- [ ] Sincronização offline
- [ ] Push notifications para conquistas
- [ ] Analytics de engajamento
- [ ] A/B testing de conquistas

## Arquivos Principais

```
src/
├── types/achievement.ts          # Tipos TypeScript
├── lib/achievements.ts           # Lógica de conquistas
├── components/
│   ├── AchievementNotification.tsx
│   ├── AchievementsSection.tsx
│   └── AchievementProgress.tsx
├── app/settings/achievements/    # Página de conquistas
└── lib/hooks/useAchievementChecker.ts
```

## Scripts SQL

- `docs/supabase-achievements.sql` - Script completo para criar tabela e funções

## Resultado Esperado

✅ **Sistema Funcional**
- Conquistas são desbloqueadas automaticamente
- Notificações aparecem nos momentos certos
- Dashboard mostra progresso visual
- Usuário sente motivação contínua

✅ **Feedback Emocional**
- Microcelebrações em cada marco
- Progresso visual claro
- Mensagens motivacionais
- Histórico de conquistas

✅ **Fundamento Escalável**
- Arquitetura pronta para expansão
- Sistema de tipos bem definido
- Componentes reutilizáveis
- Documentação completa 