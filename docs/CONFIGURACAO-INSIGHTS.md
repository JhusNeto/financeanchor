# CONFIGURAÇÃO DO SISTEMA DE INSIGHTS - FINANCEANCHOR

## 📋 Passos para Configurar o Supabase

### 1. Executar Script SQL

Execute o script `supabase-insights.sql` no SQL Editor do Supabase:

1. Acesse o **Dashboard do Supabase**
2. Vá para **SQL Editor**
3. Cole o conteúdo do arquivo `supabase-insights.sql`
4. Clique em **Run** para executar

### 2. Verificar Configuração

Execute estas queries para verificar se tudo está funcionando:

```sql
-- Verificar se a tabela foi criada
SELECT * FROM information_schema.tables WHERE table_name = 'daily_insights';

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'daily_insights';

-- Verificar funções
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('generate_insights', 'get_user_insights', 'get_today_insight');
```

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Geração Automática
- **Função `generate_insights()`**: Gera insights baseados em dados reais
- **Função `get_today_insight()`**: Busca ou gera insight do dia
- **Função `get_user_insights()`**: Lista insights dos últimos dias

### ✅ Regras de Geração
- **Comparação semanal**: Se gastou menos que semana anterior
- **Dinheiro parado**: Se sobra > R$500 no mês
- **Rumo à meta**: Se faltam < 20% para conquistar meta
- **Mensagem padrão**: Se nenhuma regra se aplica

### ✅ Dashboard Integrado
- **Card de insight** no topo do dashboard
- **Design motivacional** com gradientes
- **Data formatada** em português
- **Emoji contextual** baseado no tipo

### ✅ Estrutura do Banco
- **Tabela `daily_insights`**: Armazena insights por usuário
- **Políticas RLS**: Segurança por usuário
- **Índices otimizados**: Performance de consultas
- **Triggers**: Atualização automática de timestamps

## 🔧 Estrutura do Banco

### Tabela `daily_insights`
```sql
- id (UUID, Primary Key)
- user_id (UUID, FK para auth.users)
- date (DATE, Data do insight)
- message (TEXT, Mensagem do insight)
- created_at (TIMESTAMP)
```

### Funções SQL
- `generate_insights()`: Gera insight baseado em dados
- `get_today_insight()`: Busca/gera insight do dia
- `get_user_insights()`: Lista insights dos últimos dias

## 🎨 Interface

### Design Responsivo
- **Card destacado** no topo do dashboard
- **Gradiente roxo-azul** para destaque
- **Ícone de lâmpada** para representar insight
- **Texto motivacional** e data formatada

### Estados Visuais
- **Insight disponível**: Card com mensagem personalizada
- **Sem insight**: Card não aparece (opcional)
- **Loading**: Durante geração automática

## 🚀 Como Funciona

### 1. Geração Automática
- **Ao acessar dashboard**: Verifica se existe insight para hoje
- **Se não existe**: Gera automaticamente baseado em dados
- **Se existe**: Retorna insight já gerado

### 2. Regras de Geração
```sql
-- Regra A: Comparação semanal
IF current_week_total < previous_week_total THEN
  "Você gastou R$X a menos essa semana! 👏"

-- Regra B: Dinheiro parado
IF (income - expenses) > 500 THEN
  "Você tem R$Y sobrando. Já pensou em investir? 💰"

-- Regra C: Rumo à meta
IF goal_percentage >= 80 THEN
  "Você está muito perto! Só faltam R$Z! 🎯"
```

### 3. Dados Utilizados
- **Gastos semanais**: Comparação com semana anterior
- **Receitas/Despesas**: Cálculo de sobra mensal
- **Metas**: Progresso e valor restante
- **Dados mockados**: Receita mensal (R$5.000)

## 📊 Exemplos de Insights

### Economia Semanal
```
"Você gastou R$150 a menos essa semana! Ótimo progresso 👏"
```

### Dinheiro Sobrando
```
"Você tem R$800 sobrando esse mês. Já pensou em investir ou acelerar sua meta? 💰"
```

### Próximo da Meta
```
"Você está muito perto de conquistar seu sonho! Só faltam R$500! 🎯"
```

### Mensagem Padrão
```
"Continue assim! Cada dia importa. 💪"
```

## 🔮 Próximos Passos

### Melhorias Futuras
1. **Sistema de receitas**: Capturar receitas reais
2. **Mais regras**: Insights baseados em categorias
3. **IA/LLM**: Integração com inteligência artificial
4. **Personalização**: Configurações por usuário
5. **Histórico**: Visualização de insights passados

### Preparação para IA
- ✅ **Estrutura base** pronta
- ✅ **Dados estruturados** para treinamento
- ✅ **Interface preparada** para expansão
- ✅ **Sistema escalável** para novas regras

## 🚀 Próximos Passos

1. **Execute o script SQL** no Supabase
2. **Verifique as funções** foram criadas
3. **Teste o dashboard** - insight deve aparecer
4. **Adicione gastos** para testar regras
5. **Configure metas** para testar insights de progresso

## ✅ Checklist de Verificação

- [ ] Script SQL executado com sucesso
- [ ] Tabela `daily_insights` criada
- [ ] Funções SQL criadas
- [ ] Políticas RLS configuradas
- [ ] Dashboard mostrando insight
- [ ] Geração automática funcionando
- [ ] Regras aplicando corretamente

## 🎯 Resultado Esperado

- Sistema de insights financeiros funcionando
- Geração automática baseada em dados reais
- Interface motivacional no dashboard
- Base sólida para futuras expansões com IA

**O sistema de insights está pronto para uso!** 🚀

Agora você receberá feedback diário personalizado baseado em seus dados financeiros reais! 