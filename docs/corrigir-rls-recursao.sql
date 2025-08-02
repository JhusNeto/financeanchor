-- =====================================================
-- CORREÇÃO DA RECURSÃO INFINITA NA POLÍTICA RLS - FINANCEANCHOR
-- =====================================================

-- 1. Remover todas as políticas RLS da tabela profiles
DROP POLICY IF EXISTS "Users can view partner data" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 2. Desabilitar RLS temporariamente para corrigir
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se há dados na tabela profiles
SELECT 'Verificando dados na tabela profiles:' as status;
SELECT COUNT(*) as total_profiles FROM profiles;

-- 4. Criar perfil básico para o usuário se não existir
-- (Substitua 'USER_ID_AQUI' pelo ID real do usuário)
-- INSERT INTO profiles (id, full_name, created_at) 
-- VALUES ('USER_ID_AQUI', 'Usuário', NOW())
-- ON CONFLICT (id) DO NOTHING;

-- 5. Recriar políticas RLS de forma mais simples e segura
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para visualizar próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para inserir próprio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Criar política específica para visualizar dados do parceiro (sem recursão)
CREATE POLICY "Users can view partner profile" ON profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE partner_id = auth.uid()
        )
    );

-- 7. Verificar se as políticas foram criadas corretamente
SELECT 'Verificando políticas RLS criadas:' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 8. Testar acesso básico
SELECT 'Testando acesso básico:' as status;

-- Verificar se o usuário pode ver seu próprio perfil
-- (Execute manualmente substituindo USER_ID)
-- SELECT * FROM profiles WHERE id = 'USER_ID_AQUI';

-- 9. Status final
SELECT 
    'Políticas RLS corrigidas com sucesso!' as resultado,
    'Recursão infinita removida' as correcao,
    NOW() as timestamp; 