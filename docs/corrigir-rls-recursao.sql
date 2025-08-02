-- =====================================================
-- CORREÇÃO DA RECURSÃO INFINITA NAS POLÍTICAS RLS - FINANCEANCHOR
-- =====================================================

-- 1. Remover todas as políticas RLS existentes na tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner data" ON profiles;

-- 2. Criar políticas RLS simples e seguras
-- Política para usuários verem seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para usuários inserirem seu próprio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Criar função para verificar se usuário tem parceiro (sem recursão)
CREATE OR REPLACE FUNCTION check_user_partner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se o usuário tem partner_id
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND partner_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar função para obter partner_id do usuário (sem recursão)
CREATE OR REPLACE FUNCTION get_user_partner_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
    partner_uuid UUID;
BEGIN
    SELECT partner_id INTO partner_uuid 
    FROM profiles 
    WHERE id = user_id;
    
    RETURN partner_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar política para visualização de parceiros (sem recursão)
CREATE POLICY "Users can view partner profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        id = get_user_partner_id(auth.uid())
    );

-- 6. Verificar se as políticas foram criadas corretamente
SELECT 'Verificando políticas RLS corrigidas:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 7. Testar as funções
SELECT 'Testando funções:' as status;
SELECT 
    'Função check_user_partner criada' as resultado
WHERE EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'check_user_partner'
);

SELECT 
    'Função get_user_partner_id criada' as resultado
WHERE EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_user_partner_id'
);

-- 8. Status final
SELECT 
    'Políticas RLS corrigidas - recursão eliminada!' as resultado,
    NOW() as timestamp; 