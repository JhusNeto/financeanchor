-- =====================================================
-- VERIFICAÇÃO DO SISTEMA DE PARCEIROS - FINANCEANCHOR
-- =====================================================

-- 1. Verificar se a coluna partner_id existe na tabela profiles
SELECT 
    'Verificando coluna partner_id em profiles:' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'partner_id';

-- 2. Verificar se a coluna is_shared existe na tabela expenses
SELECT 
    'Verificando coluna is_shared em expenses:' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' AND column_name = 'is_shared';

-- 3. Verificar se as funções existem
SELECT 
    'Verificando funções do sistema de parceiros:' as status;

SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('invite_partner', 'remove_partner', 'get_partner_data', 'get_shared_expenses')
ORDER BY routine_name;

-- 4. Verificar índices
SELECT 
    'Verificando índices:' as status;

SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('profiles', 'expenses') 
AND indexname LIKE '%partner%' OR indexname LIKE '%shared%';

-- 5. Verificar políticas RLS
SELECT 
    'Verificando políticas RLS:' as status;

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

-- 6. Testar função get_partner_data com um usuário específico
-- (Substitua 'USER_ID_AQUI' pelo ID de um usuário real)
SELECT 
    'Testando função get_partner_data:' as status;

-- Exemplo de uso da função (comentado para não executar automaticamente)
-- SELECT * FROM get_partner_data('USER_ID_AQUI');

-- 7. Verificar dados de exemplo
SELECT 
    'Verificando dados de exemplo:' as status;

-- Contar perfis com parceiros
SELECT 
    'Perfis com parceiros:' as info,
    COUNT(*) as total
FROM profiles 
WHERE partner_id IS NOT NULL;

-- Contar despesas compartilhadas
SELECT 
    'Despesas compartilhadas:' as info,
    COUNT(*) as total
FROM expenses 
WHERE is_shared = TRUE;

-- 8. Verificar estrutura completa da tabela profiles
SELECT 
    'Estrutura completa da tabela profiles:' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 9. Status final
SELECT 
    'Verificação do sistema de parceiros concluída!' as resultado,
    NOW() as timestamp; 