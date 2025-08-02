-- =====================================================
-- CRIAR PERFIL DO USUÁRIO - FINANCEANCHOR
-- =====================================================

-- 1. Criar perfil para o usuário específico
-- (Substitua o UUID pelo ID real do usuário)
INSERT INTO profiles (
    id, 
    full_name, 
    created_at,
    updated_at
) VALUES (
    '11b643c6-b927-4ecd-90ff-deb1b0426712',  -- ID do usuário
    'Iasmim',  -- Nome do usuário
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- 2. Verificar se o perfil foi criado
SELECT 'Verificando perfil criado:' as status;

SELECT 
    id,
    full_name,
    partner_id,
    created_at,
    updated_at
FROM profiles 
WHERE id = '11b643c6-b927-4ecd-90ff-deb1b0426712';

-- 3. Verificar total de perfis
SELECT 'Total de perfis na tabela:' as info;
SELECT COUNT(*) as total_profiles FROM profiles;

-- 4. Status final
SELECT 
    'Perfil do usuário criado/atualizado com sucesso!' as resultado,
    NOW() as timestamp; 