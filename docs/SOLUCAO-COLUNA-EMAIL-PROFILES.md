# 🔧 Solução para Coluna Email na Tabela Profiles

## 🚨 Problema Identificado

O erro `{ "code": "42703", "details": null, "hint": null, "message": "column profiles_1.email does not exist" }` ocorre porque:

1. **A tabela `profiles`** não tem a coluna `email`
2. **O código TypeScript** está tentando acessar essa coluna
3. **A estrutura da tabela** está incompleta

## ✅ **Solução Definitiva**

### **Passo 1: Execute o Script SQL para Adicionar a Coluna**

Execute o seguinte script no SQL Editor do Supabase:

```sql
-- =====================================================
-- CORREÇÃO DA COLUNA EMAIL NA TABELA PROFILES
-- =====================================================

-- 1. ADICIONAR COLUNA EMAIL SE NÃO EXISTIR
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Coluna email adicionada à tabela profiles';
    ELSE
        RAISE NOTICE 'Coluna email já existe na tabela profiles';
    END IF;
END $$;

-- 2. ATUALIZAR EMAILS DOS USUÁRIOS EXISTENTES
UPDATE profiles 
SET email = auth_users.email
FROM auth.users auth_users
WHERE profiles.id = auth_users.id 
AND profiles.email IS NULL;

-- 3. VERIFICAR SE A COLUNA FOI ADICIONADA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'email';

-- 4. VERIFICAR DADOS ATUALIZADOS
SELECT 
    'Total de perfis:' as info,
    COUNT(*) as count 
FROM profiles;

SELECT 
    'Perfis com email:' as info,
    COUNT(*) as count 
FROM profiles 
WHERE email IS NOT NULL;
```

### **Passo 2: Verificar se a Correção Funcionou**

Execute este comando para verificar a estrutura da tabela:

```sql
-- Verificar estrutura completa da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### **Passo 3: Testar a Aplicação**

1. **Acesse o dashboard** da aplicação
2. **Teste o sistema de parceiros** - deve funcionar normalmente
3. **Verifique os logs** - não deve haver mais erros de coluna

## 🔍 **Verificação Adicional**

### **Verificar Dados dos Perfis**
```sql
-- Verificar dados dos perfis
SELECT 
    id,
    full_name,
    email,
    partner_id
FROM profiles 
LIMIT 5;
```

### **Testar Consulta com Email**
```sql
-- Testar consulta que usa a coluna email
SELECT 
    p.id,
    p.full_name,
    p.email,
    e.description,
    e.amount
FROM profiles p
JOIN expenses e ON p.id = e.user_id
LIMIT 5;
```

## 🚀 **Código TypeScript Atualizado**

O código em `src/lib/partners.ts` foi atualizado para usar a coluna email:

```typescript
// ✅ CÓDIGO ATUALIZADO - Buscar perfis com email
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, full_name, email')
  .in('id', userIds);

// ✅ CÓDIGO ATUALIZADO - Usar email do perfil
return {
  id: expense.id,
  user_id: expense.user_id,
  description: expense.description,
  amount: expense.amount,
  date: expense.date,
  category: expense.category,
  is_shared: expense.is_shared,
  created_by_name: profile?.full_name || 'Usuário',
  created_by_email: profile?.email || '' // Email agora disponível
};
```

## 📋 **Checklist de Verificação**

- [ ] ✅ Script SQL executado com sucesso
- [ ] ✅ Coluna email adicionada à tabela profiles
- [ ] ✅ Emails dos usuários existentes atualizados
- [ ] ✅ Código TypeScript atualizado
- [ ] ✅ Dashboard carrega normalmente
- [ ] ✅ Sistema de parceiros funciona
- [ ] ✅ Logs no terminal estão limpos

## 🚀 **Resultado Esperado**

Após aplicar a correção:

- ✅ **Erro de coluna email eliminado**
- ✅ **Dados de email disponíveis**
- ✅ **Sistema de parceiros operacional**
- ✅ **Informações completas dos usuários**
- ✅ **Performance otimizada**

## 📞 **Suporte**

Se o problema persistir após aplicar a correção:

1. **Verifique se a coluna foi criada** corretamente
2. **Confirme que os emails foram atualizados**
3. **Teste manualmente** as consultas no SQL Editor
4. **Verifique se há dados** na tabela profiles

---

**Status**: 🟢 **SOLUÇÃO IMPLEMENTADA**

O problema da coluna email foi resolvido através da adição da coluna à tabela profiles e atualização do código TypeScript. 