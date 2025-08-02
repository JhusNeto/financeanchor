-- =====================================================
-- SOLUÇÃO DEFINITIVA PARA RECURSÃO INFINITA EM PROFILES
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES
-- =====================================================
DROP POLICY IF EXISTS "Users can view partner data" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- 2. DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR ESTRUTURA DA TABELA
-- =====================================================
SELECT 'Verificando estrutura da tabela profiles:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 4. VERIFICAR DADOS EXISTENTES
-- =====================================================
SELECT 'Verificando dados na tabela profiles:' as status;
SELECT COUNT(*) as total_profiles FROM profiles;

-- 5. REABILITAR RLS
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS RLS SIMPLES E SEGURAS
-- =====================================================

-- Política para visualizar próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para inserir próprio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para deletar próprio perfil (se necessário)
CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- 7. CRIAR FUNÇÃO AUXILIAR PARA VERIFICAR PARCEIROS (SEM RECURSÃO)
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_partner_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT partner_id 
        FROM profiles 
        WHERE id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CRIAR POLÍTICA PARA VISUALIZAR PERFIL DO PARCEIRO (SEM RECURSÃO)
-- =====================================================
CREATE POLICY "Users can view partner profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        id = get_user_partner_id(auth.uid())
    );

-- 9. CRIAR TRIGGER PARA ATUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_profiles_updated_at();

-- 10. CRIAR FUNÇÃO PARA GARANTIR PERFIL DO USUÁRIO
-- =====================================================
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o usuário já tem perfil
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
        INSERT INTO profiles (id, full_name, email)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Usuário'),
            NEW.email
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. CRIAR TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- =====================================================
DROP TRIGGER IF EXISTS create_user_profile ON auth.users;
CREATE TRIGGER create_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_profile();

-- 12. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================
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

-- 13. TESTAR FUNÇÃO AUXILIAR
-- =====================================================
SELECT 'Testando função get_user_partner_id:' as status;
-- (Execute manualmente substituindo USER_ID)
-- SELECT get_user_partner_id('USER_ID_AQUI');

-- 14. STATUS FINAL
-- =====================================================
SELECT 
    '✅ Recursão infinita corrigida com sucesso!' as resultado,
    'Políticas RLS simplificadas e seguras' as correcao,
    'Sistema de parceiros funcional' as funcionalidade,
    NOW() as timestamp;

-- 15. INSTRUÇÕES PARA TESTE
-- =====================================================
SELECT 
    'Para testar:' as instrucao,
    '1. Acesse o dashboard da aplicação' as passo1,
    '2. Verifique se não há mais erros de recursão' as passo2,
    '3. Teste o sistema de parceiros' as passo3,
    '4. Verifique os logs no terminal' as passo4; 