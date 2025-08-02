-- =====================================================
-- CORREÇÃO DA COLUNA EMAIL NA TABELA PROFILES
-- =====================================================

-- 1. VERIFICAR ESTRUTURA ATUAL
-- =====================================================
SELECT '=== VERIFICANDO ESTRUTURA ATUAL ===' as status;

SELECT 'Colunas da tabela profiles:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. ADICIONAR COLUNA EMAIL SE NÃO EXISTIR
-- =====================================================
SELECT '=== ADICIONANDO COLUNA EMAIL ===' as status;

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

-- 3. ATUALIZAR EMAILS DOS USUÁRIOS EXISTENTES
-- =====================================================
SELECT '=== ATUALIZANDO EMAILS ===' as status;

-- Atualizar emails dos perfis existentes com base nos dados do auth.users
UPDATE profiles 
SET email = auth_users.email
FROM auth.users auth_users
WHERE profiles.id = auth_users.id 
AND profiles.email IS NULL;

-- 4. VERIFICAR SE A COLUNA FOI ADICIONADA
-- =====================================================
SELECT '=== VERIFICANDO COLUNA ADICIONADA ===' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'email';

-- 5. VERIFICAR DADOS ATUALIZADOS
-- =====================================================
SELECT '=== VERIFICANDO DADOS ===' as status;

SELECT 
    'Total de perfis:' as info,
    COUNT(*) as count 
FROM profiles;

SELECT 
    'Perfis com email:' as info,
    COUNT(*) as count 
FROM profiles 
WHERE email IS NOT NULL;

SELECT 
    'Perfis sem email:' as info,
    COUNT(*) as count 
FROM profiles 
WHERE email IS NULL;

-- 6. ATUALIZAR FUNÇÃO ensure_user_profile
-- =====================================================
SELECT '=== ATUALIZANDO FUNÇÃO ===' as status;

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

-- 7. STATUS FINAL
-- =====================================================
SELECT '=== STATUS FINAL ===' as status;

SELECT 
    '✅ Coluna email adicionada à tabela profiles!' as resultado,
    'Emails atualizados dos usuários existentes' as correcao,
    'Função ensure_user_profile atualizada' as funcionalidade,
    NOW() as timestamp;

-- 8. INSTRUÇÕES PARA TESTE
-- =====================================================
SELECT 
    'Para testar:' as instrucao,
    '1. Acesse o dashboard da aplicação' as passo1,
    '2. Teste o sistema de parceiros' as passo2,
    '3. Verifique se não há mais erros de coluna email' as passo3,
    '4. Confirme que os emails aparecem corretamente' as passo4; 