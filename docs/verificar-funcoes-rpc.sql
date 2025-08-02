-- VERIFICAR FUNÇÕES RPC - FINANCEANCHOR
-- =============================================

-- Verificar se as funções RPC estão instaladas
SELECT 
    routine_name,
    routine_type,
    data_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'generate_insights',
    'get_user_insights', 
    'get_budget_summary',
    'get_budget_status',
    'get_debt_summary',
    'get_goal_summary',
    'get_partner_data',
    'get_shared_expenses'
)
ORDER BY routine_name;

-- Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles',
    'budgets',
    'expenses',
    'debts',
    'goals',
    'daily_insights',
    'partners',
    'shared_expenses'
)
ORDER BY table_name;

-- Verificar RLS (Row Level Security)
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
WHERE schemaname = 'public'
AND tablename IN (
    'profiles',
    'budgets', 
    'expenses',
    'debts',
    'goals',
    'daily_insights',
    'partners',
    'shared_expenses'
)
ORDER BY tablename, policyname;

-- Testar função get_budget_summary
-- (substitua 'YOUR_USER_ID' pelo ID real de um usuário)
-- SELECT * FROM get_budget_summary('YOUR_USER_ID', '2025-01');

-- Testar função generate_insights  
-- (substitua 'YOUR_USER_ID' pelo ID real de um usuário)
-- SELECT * FROM generate_insights('YOUR_USER_ID'); 