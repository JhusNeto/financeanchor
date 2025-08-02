# 🔧 Solução Alternativa - Modificar Código TypeScript

## 🚨 Problema Persistente

Se o erro de relação entre `expenses` e `profiles` persistir mesmo após criar a chave estrangeira, podemos resolver modificando o código TypeScript para não depender do join automático.

## ✅ **Solução Alternativa**

### **Passo 1: Modificar o Código TypeScript**

Substitua o código problemático em `src/lib/partners.ts`:

```typescript
// ❌ CÓDIGO PROBLEMÁTICO
const { data: expenses, error } = await supabase
  .from('expenses')
  .select(`
    id,
    user_id,
    description,
    amount,
    date,
    category,
    is_shared,
    profiles!expenses_user_id_fkey (
      full_name,
      email
    )
  `)
  .or(`user_id.eq.${user.id},user_id.eq.${userProfile.partner_id}`)
  .eq('is_shared', true)
  .order('date', { ascending: false })
  .order('created_at', { ascending: false });
```

**Por:**

```typescript
// ✅ CÓDIGO CORRIGIDO
// 1. Buscar despesas sem join
const { data: expenses, error } = await supabase
  .from('expenses')
  .select(`
    id,
    user_id,
    description,
    amount,
    date,
    category,
    is_shared
  `)
  .or(`user_id.eq.${user.id},user_id.eq.${userProfile.partner_id}`)
  .eq('is_shared', true)
  .order('date', { ascending: false })
  .order('created_at', { ascending: false });

if (error) {
  logger.error('Erro ao buscar despesas compartilhadas', error, 'PARTNERS');
  return { expenses: null, error };
}

// 2. Buscar dados dos perfis separadamente
const userIds = (expenses || []).map(e => e.user_id);
let profilesData: any[] = [];

if (userIds.length > 0) {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);

  if (profilesError) {
    logger.error('Erro ao buscar perfis', profilesError, 'PARTNERS');
  } else {
    profilesData = profiles || [];
  }
}

// 3. Criar mapa de perfis para acesso rápido
const profilesMap = new Map(
  profilesData.map(profile => [profile.id, profile])
);

// 4. Transformar dados para o formato esperado
const sharedExpenses: SharedExpense[] = (expenses || []).map(expense => {
  const profile = profilesMap.get(expense.user_id);

  return {
    id: expense.id,
    user_id: expense.user_id,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    category: expense.category,
    is_shared: expense.is_shared,
    created_by_name: profile?.full_name || 'Usuário',
    created_by_email: '' // Email não está disponível na tabela profiles
  };
});
```

### **Passo 2: Aplicar a Mesma Correção em `getPartnerIndividualExpenses`**

```typescript
// ❌ CÓDIGO PROBLEMÁTICO
const { data: expenses, error } = await supabase
  .from('expenses')
  .select(`
    id,
    user_id,
    description,
    amount,
    date,
    category,
    is_shared,
    profiles!expenses_user_id_fkey (
      full_name,
      email
    )
  `)
  .eq('user_id', userProfile.partner_id)
  .eq('is_shared', false)
  .order('date', { ascending: false })
  .order('created_at', { ascending: false });
```

**Por:**

```typescript
// ✅ CÓDIGO CORRIGIDO
// 1. Buscar despesas sem join
const { data: expenses, error } = await supabase
  .from('expenses')
  .select(`
    id,
    user_id,
    description,
    amount,
    date,
    category,
    is_shared
  `)
  .eq('user_id', userProfile.partner_id)
  .eq('is_shared', false)
  .order('date', { ascending: false })
  .order('created_at', { ascending: false });

if (error) {
  logger.error('Erro ao buscar despesas do parceiro', error, 'PARTNERS');
  return { expenses: null, error };
}

// 2. Buscar dados do perfil do parceiro
const { data: partnerProfile, error: profileError } = await supabase
  .from('profiles')
  .select('id, full_name')
  .eq('id', userProfile.partner_id)
  .single();

if (profileError) {
  logger.error('Erro ao buscar perfil do parceiro', profileError, 'PARTNERS');
}

// 3. Transformar dados para o formato esperado
const partnerExpenses: SharedExpense[] = (expenses || []).map(expense => {
  return {
    id: expense.id,
    user_id: expense.user_id,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    category: expense.category,
    is_shared: expense.is_shared,
    created_by_name: partnerProfile?.full_name || 'Usuário',
    created_by_email: '' // Email não está disponível na tabela profiles
  };
});
```

## 🚀 **Vantagens da Solução Alternativa**

- ✅ **Não depende de chaves estrangeiras**
- ✅ **Mais flexível e controlável**
- ✅ **Melhor performance** (menos dados transferidos)
- ✅ **Mais fácil de debugar**
- ✅ **Funciona mesmo se a estrutura do banco mudar**

## 📋 **Checklist de Implementação**

- [ ] ✅ Modificar `getSharedExpenses()` em `src/lib/partners.ts`
- [ ] ✅ Modificar `getPartnerIndividualExpenses()` em `src/lib/partners.ts`
- [ ] ✅ Testar o sistema de parceiros
- [ ] ✅ Verificar se não há mais erros de relação
- [ ] ✅ Confirmar que os dados são exibidos corretamente

## 🔍 **Teste da Solução**

Após implementar as mudanças:

1. **Acesse o dashboard**
2. **Teste o sistema de parceiros**
3. **Verifique se as despesas compartilhadas aparecem**
4. **Confirme que os nomes dos usuários são exibidos**

---

**Status**: 🟢 **SOLUÇÃO ALTERNATIVA DISPONÍVEL**

Esta solução resolve o problema sem depender da criação de chaves estrangeiras no banco de dados. 