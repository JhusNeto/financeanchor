-- =====================================================
-- CORREÇÃO DA FUNÇÃO GET_GOAL_SUMMARY - FINANCEANCHOR
-- =====================================================

-- Corrigir a função get_goal_summary com tipos corretos
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
                CURRENT_DATE::DATE
            WHEN g.current_amount > 0 AND g.target_amount > g.current_amount THEN
                (CURRENT_DATE + INTERVAL '1 day' * CEIL((g.target_amount - g.current_amount) / (g.current_amount / GREATEST(EXTRACT(DAY FROM AGE(CURRENT_DATE, g.created_at)), 1))))::DATE
            ELSE 
                g.deadline
        END as estimated_completion_date
    FROM goals g
    WHERE g.user_id = p_user_id
    ORDER BY g.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corrigir também a função get_user_goals para garantir consistência
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

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Testar a função corrigida
SELECT 'Testando função get_goal_summary:' as status;
SELECT * FROM get_goal_summary('00000000-0000-0000-0000-000000000000');

-- Testar a função get_user_goals
SELECT 'Testando função get_user_goals:' as status;
SELECT * FROM get_user_goals('00000000-0000-0000-0000-000000000000');

-- Verificar se as funções foram atualizadas
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('get_goal_summary', 'get_user_goals')
ORDER BY routine_name;

-- Status final
SELECT 
    'Funções de metas corrigidas com sucesso!' as resultado,
    NOW() as timestamp; 