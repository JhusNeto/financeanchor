-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO PARA EXPORTAÇÃO DE PROFILES
-- =====================================================

-- 1. VERIFICAR SE A TABELA PROFILES EXISTE
SELECT 
    'Tabela profiles existe:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
    ) as exists;

-- 2. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE EXISTEM PERFIS
SELECT 
    'Total de perfis:' as info,
    COUNT(*) as count 
FROM profiles;

-- 4. VERIFICAR PERFIS SEM EMAIL
SELECT 
    'Perfis sem email:' as info,
    COUNT(*) as count 
FROM profiles 
WHERE email IS NULL OR email = '';

-- 5. VERIFICAR PERFIS SEM NOME
SELECT 
    'Perfis sem nome:' as info,
    COUNT(*) as count 
FROM profiles 
WHERE full_name IS NULL OR full_name = '';

-- 6. ATUALIZAR EMAILS DOS PERFIS EXISTENTES
UPDATE profiles 
SET email = auth_users.email
FROM auth.users auth_users
WHERE profiles.id = auth_users.id 
AND (profiles.email IS NULL OR profiles.email = '');

-- 7. ATUALIZAR NOMES DOS PERFIS EXISTENTES
UPDATE profiles 
SET full_name = COALESCE(
    auth_users.raw_user_meta_data->>'full_name',
    'Usuário'
)
FROM auth.users auth_users
WHERE profiles.id = auth_users.id 
AND (profiles.full_name IS NULL OR profiles.full_name = '');

-- 8. CRIAR PERFIS PARA USUÁRIOS SEM PERFIL
INSERT INTO profiles (id, full_name, email, created_at, updated_at)
SELECT 
    auth_users.id,
    COALESCE(auth_users.raw_user_meta_data->>'full_name', 'Usuário'),
    auth_users.email,
    auth_users.created_at,
    NOW()
FROM auth.users auth_users
WHERE NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth_users.id
);

-- 9. VERIFICAR RESULTADO FINAL
SELECT 
    'Perfis após correção:' as info,
    COUNT(*) as total_perfis,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as com_nome
FROM profiles;

-- 10. VERIFICAR POLÍTICAS RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 11. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles'; 