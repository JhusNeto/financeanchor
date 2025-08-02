-- =====================================================
-- VERIFICAÇÃO DA ESTRUTURA DA TABELA PROFILES - FINANCEANCHOR
-- =====================================================

-- 1. Verificar estrutura da tabela profiles
SELECT 'Estrutura da tabela profiles:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Verificar dados existentes
SELECT 'Dados existentes na tabela profiles:' as status;
SELECT 
    id,
    full_name,
    partner_id,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- 3. Verificar usuários sem perfil
SELECT 'Usuários sem perfil:' as status;
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 4. Criar perfis para usuários que não têm (versão simplificada)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT 
            u.id,
            u.email,
            u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        INSERT INTO profiles (id, full_name, partner_id)
        VALUES (
            user_record.id,
            COALESCE(user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1), 'Usuário'),
            NULL
        );
        
        RAISE NOTICE 'Perfil criado para usuário: %', user_record.email;
    END LOOP;
END $$;

-- 5. Atualizar perfis com nomes vazios ou "Usuário"
UPDATE profiles 
SET full_name = COALESCE(
    NULLIF(full_name, ''),
    NULLIF(full_name, 'Usuário'),
    'Usuário'
)
WHERE full_name IS NULL OR full_name = '' OR full_name = 'Usuário';

-- 6. Verificar resultado final
SELECT 'Resultado final:' as status;
SELECT 
    id,
    full_name,
    partner_id,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- 7. Estatísticas
SELECT 
    'Estatísticas:' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' AND full_name != 'Usuário' THEN 1 END) as profiles_with_names,
    COUNT(CASE WHEN full_name IS NULL OR full_name = '' OR full_name = 'Usuário' THEN 1 END) as profiles_without_names
FROM profiles;

-- 8. Status final
SELECT 
    'Verificação da estrutura concluída!' as resultado,
    NOW() as timestamp; 