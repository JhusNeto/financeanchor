-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DE PERFIS - FINANCEANCHOR
-- =====================================================

-- 1. Verificar perfis existentes
SELECT 'Verificando perfis existentes:' as status;
SELECT 
    p.id,
    p.full_name,
    p.partner_id,
    p.created_at,
    u.email as auth_email,
    u.raw_user_meta_data
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 2. Verificar usuários sem perfil
SELECT 'Verificando usuários sem perfil:' as status;
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    CASE WHEN p.id IS NULL THEN 'SEM PERFIL' ELSE 'COM PERFIL' END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 3. Criar perfis para usuários que não têm
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

-- 4. Atualizar perfis com nomes vazios ou "Usuário"
UPDATE profiles 
SET full_name = COALESCE(
    NULLIF(full_name, ''),
    NULLIF(full_name, 'Usuário'),
    'Usuário'
)
WHERE full_name IS NULL OR full_name = '' OR full_name = 'Usuário';

-- 5. Verificar resultado após correções
SELECT 'Verificando perfis após correções:' as status;
SELECT 
    p.id,
    p.full_name,
    p.partner_id,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC;

-- 6. Estatísticas finais
SELECT 
    'Estatísticas finais:' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' AND full_name != 'Usuário' THEN 1 END) as profiles_with_names,
    COUNT(CASE WHEN full_name IS NULL OR full_name = '' OR full_name = 'Usuário' THEN 1 END) as profiles_without_names
FROM profiles;

-- 7. Status final
SELECT 
    'Verificação e correção de perfis concluída!' as resultado,
    NOW() as timestamp; 