# 🔧 Solução para Erro de Criação de Perfil

## 🚨 Problema Identificado

O erro ocorre porque o trigger automático para criar o perfil não está funcionando corretamente. Isso pode acontecer por alguns motivos:

1. **Trigger não foi criado corretamente**
2. **Políticas RLS muito restritivas**
3. **Problema de timing na criação do usuário**

## ✅ Solução Passo a Passo

### 1. Execute o Script de Correção

1. Acesse o painel do Supabase
2. Vá para **SQL Editor**
3. Clique em **New query**
4. Copie e cole o conteúdo do arquivo `supabase-fix.sql`
5. Clique em **Run**

### 2. Verifique se Funcionou

Após executar o script, você deve ver uma mensagem como:
```
status                    | total_profiles
-------------------------|----------------
Tabela profiles criada com sucesso | 1
```

### 3. Teste Novamente

1. Volte para o projeto
2. Tente criar uma nova conta
3. Verifique se o redirecionamento funciona

## 🔍 Debug Temporário

Adicionei um componente de debug na página inicial que mostra:
- Status do usuário atual
- Dados do perfil
- Se há algum problema

Para ver o debug:
1. Acesse `http://localhost:3000`
2. Procure pela seção "Debug de Autenticação"
3. Verifique o status

## 🛠️ O que o Script Faz

### 1. Remove Triggers Antigos
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

### 2. Recria a Função
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Recria o Trigger
```sql
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. Corrige Políticas RLS
- Remove políticas antigas
- Recria políticas corretas
- Garante que usuários podem inserir seus próprios perfis

### 5. Cria Perfis para Usuários Existentes
```sql
INSERT INTO public.profiles (id, full_name, created_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Usuário'),
    au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

## 🚨 Se Ainda Não Funcionar

### Opção 1: Verificar Logs
1. No Supabase, vá para **Logs**
2. Verifique se há erros relacionados ao trigger
3. Procure por mensagens de erro na criação de perfis

### Opção 2: Criar Perfil Manualmente
Se o trigger não funcionar, o código foi modificado para:
1. Aguardar 1 segundo após criar o usuário
2. Verificar se o perfil foi criado
3. Tentar criar manualmente se necessário
4. Não deletar o usuário em caso de erro

### Opção 3: Desabilitar RLS Temporariamente
```sql
-- Apenas para teste - NÃO usar em produção
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

## 🔒 Segurança

Após resolver o problema:
1. Remova o componente de debug da página inicial
2. Verifique se as políticas RLS estão funcionando
3. Teste o login/logout várias vezes

## 📞 Próximos Passos

1. Execute o script `supabase-fix.sql`
2. Teste criar uma nova conta
3. Verifique se o redirecionamento funciona
4. Se funcionar, remova o componente de debug
5. Se não funcionar, verifique os logs do Supabase

## 🎯 Resultado Esperado

Após aplicar a solução:
- ✅ Usuário criado no Supabase Auth
- ✅ Perfil criado automaticamente na tabela `profiles`
- ✅ Redirecionamento para `/auth/login` funcionando
- ✅ Login funcionando e redirecionando para `/dashboard` 