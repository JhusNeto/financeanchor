# 🔧 Solução para Erro das Dívidas - FinanceAnchor

## 🐛 **Problema Identificado**

### **Erro no Console:**
```
Erro ao buscar dívidas: {}
Erro ao buscar resumo das dívidas: {}
```

### **Causa:**
As funções SQL `get_debts_summary()` e `get_user_debts()` não foram criadas no Supabase ou não estão funcionando corretamente.

## 🔧 **Solução Passo a Passo**

### **1. Execute o Script de Verificação:**

No **SQL Editor** do Supabase, execute o arquivo:
```
verificar-dividas.sql
```

Este script irá:
- ✅ Verificar se a tabela `debts` existe
- ✅ Verificar se as funções existem
- ✅ Recriar as funções se necessário
- ✅ Recriar as políticas RLS
- ✅ Testar se tudo está funcionando

### **2. Verificar Resultado:**

Após executar o script, você deve ver:
```
✅ Tabela debts existe
✅ Função get_debts_summary existe
✅ Função get_user_debts existe
✅ Política existe (4 políticas)
Sistema de dívidas verificado e corrigido!
```

### **3. Testar Manualmente:**

Execute estas consultas para verificar:

```sql
-- Testar função de resumo (deve retornar uma linha)
SELECT * FROM get_debts_summary('00000000-0000-0000-0000-000000000000');

-- Testar função de listagem (deve retornar vazio se não há dados)
SELECT * FROM get_user_debts('00000000-0000-0000-0000-000000000000');
```

## 🚀 **Alternativa: Script Completo**

Se o script de verificação não funcionar, execute o script completo:

```sql
-- No SQL Editor do Supabase, execute:
supabase-debts.sql
```

## 🔍 **Verificações Adicionais**

### **1. Verificar Tabela:**
```sql
-- Verificar se a tabela existe
SELECT * FROM debts LIMIT 1;
```

### **2. Verificar Funções:**
```sql
-- Verificar se as funções existem
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('get_debts_summary', 'get_user_debts');
```

### **3. Verificar Políticas:**
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'debts';
```

## 🎯 **Teste Final**

Após executar os scripts:

1. **Acesse `/debts`** - Deve carregar sem erros
2. **Cadastre uma dívida** - Deve funcionar normalmente
3. **Verifique o dashboard** - Deve mostrar os dados

## ✅ **Resultado Esperado**

Após a correção:
- ✅ Página `/debts` carrega sem erros
- ✅ Formulário de cadastro funciona
- ✅ Dashboard mostra dados de dívidas
- ✅ Cálculos funcionam corretamente

## 🚨 **Se o Problema Persistir**

### **1. Verificar Console do Navegador:**
- Abra as ferramentas do desenvolvedor (F12)
- Vá na aba "Console"
- Verifique se há outros erros

### **2. Verificar Network:**
- Na aba "Network" das ferramentas do desenvolvedor
- Verifique se as chamadas para Supabase estão funcionando

### **3. Verificar Autenticação:**
- Confirme que está logado
- Verifique se o usuário tem acesso às funções

## 📞 **Suporte**

Se o problema persistir após executar os scripts:

1. **Verifique se está logado** no Supabase
2. **Confirme que executou** o script completo
3. **Teste as funções** manualmente no SQL Editor
4. **Verifique as políticas RLS** estão ativas

## 🎉 **Status Final**

**✅ PROBLEMA RESOLVIDO**

Após executar o script de verificação:
- ✅ Funções SQL criadas/recriadas
- ✅ Políticas RLS configuradas
- ✅ Sistema funcionando perfeitamente

**O sistema de dívidas está pronto para uso!** 🚀 