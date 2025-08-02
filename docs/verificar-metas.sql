-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DAS FUNÇÕES DE METAS - FINANCEANCHOR
-- =====================================================

-- 1. Verificar se a tabela goals existe
SELECT 'Verificando tabela goals:' as status;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;

-- 2. Verificar se as funções existem
SELECT 'Verificando funções:' as status;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_goal_summary', 'get_user_goals')
ORDER BY routine_name;

-- 3. Recriar a função get_goal_summary se não existir
CREATE OR REPLACE FUNCTION get_goal_summary(
    p_user_id UUID
)
RETURNS TABLE (
    goal_id UUID,
    title TEXT,
    target_amount NUMERIC,
    current_amount NUMERIC,
    deadline DATE,
    image_url TEXT,
    days_remaining INTEGER,
    percentage_completed NUMERIC,
    amount_remaining NUMERIC,
    daily_savings_needed NUMERIC,
    estimated_completion_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as goal_id,
        g.title,
        g.target_amount,
        g.current_amount,
        g.deadline,
        g.image_url,
        GREATEST(g.deadline - CURRENT_DATE, 0)::INTEGER as days_remaining,
        CASE 
            WHEN g.target_amount > 0 THEN 
                (g.current_amount / g.target_amount) * 100
            ELSE 0 
        END as percentage_completed,
        GREATEST(g.target_amount - g.current_amount, 0) as amount_remaining,
        CASE 
            WHEN GREATEST(g.deadline - CURRENT_DATE, 0) > 0 THEN 
                (g.target_amount - g.current_amount) / GREATEST(g.deadline - CURRENT_DATE, 1)
            ELSE 0 
        END as daily_savings_needed,
        CASE 
            WHEN g.current_amount >= g.target_amount THEN 
                CURRENT_DATE
            WHEN g.current_amount > 0 AND g.target_amount > g.current_amount THEN
                CURRENT_DATE + INTERVAL '1 day' * CEIL((g.target_amount - g.current_amount) / (g.current_amount / GREATEST(EXTRACT(DAY FROM AGE(CURRENT_DATE, g.created_at)), 1)))
            ELSE 
                g.deadline
        END as estimated_completion_date
    FROM goals g
    WHERE g.user_id = p_user_id
    ORDER BY g.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar a função get_user_goals se não existir
CREATE OR REPLACE FUNCTION get_user_goals(
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    target_amount NUMERIC,
    current_amount NUMERIC,
    deadline DATE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER,
    percentage_completed NUMERIC,
    amount_remaining NUMERIC,
    daily_savings_needed NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.target_amount,
        g.current_amount,
        g.deadline,
        g.image_url,
        g.created_at,
        g.updated_at,
        GREATEST(g.deadline - CURRENT_DATE, 0)::INTEGER as days_remaining,
        CASE 
            WHEN g.target_amount > 0 THEN 
                (g.current_amount / g.target_amount) * 100
            ELSE 0 
        END as percentage_completed,
        GREATEST(g.target_amount - g.current_amount, 0) as amount_remaining,
        CASE 
            WHEN GREATEST(g.deadline - CURRENT_DATE, 0) > 0 THEN 
                (g.target_amount - g.current_amount) / GREATEST(g.deadline - CURRENT_DATE, 1)
            ELSE 0 
        END as daily_savings_needed
    FROM goals g
    WHERE g.user_id = p_user_id
    ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar políticas RLS
SELECT 'Verificando políticas RLS:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'goals'
ORDER BY policyname;

-- 6. Recriar políticas RLS se necessário
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
CREATE POLICY "Users can view their own goals" ON goals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
CREATE POLICY "Users can insert their own goals" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
CREATE POLICY "Users can update their own goals" ON goals
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;
CREATE POLICY "Users can delete their own goals" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Testar as funções
SELECT 'Testando função get_goal_summary:' as status;
SELECT * FROM get_goal_summary('00000000-0000-0000-0000-000000000000');

SELECT 'Testando função get_user_goals:' as status;
SELECT * FROM get_user_goals('00000000-0000-0000-0000-000000000000');

-- 8. Verificar se as funções foram criadas corretamente
SELECT 'Verificação final das funções:' as status;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('get_goal_summary', 'get_user_goals')
ORDER BY routine_name;

-- 9. Status final
SELECT 
    'Funções de metas verificadas e corrigidas com sucesso!' as resultado,
    NOW() as timestamp; 