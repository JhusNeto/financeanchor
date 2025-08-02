-- =====================================================
-- CORREÇÃO DA FUNÇÃO GET_BUDGET_SUMMARY - FINANCEANCHOR
-- =====================================================

-- Corrigir a função get_budget_summary para evitar duplicação de valores
CREATE OR REPLACE FUNCTION get_budget_summary(
    p_user_id UUID,
    p_month TEXT
)
RETURNS TABLE (
    total_budget NUMERIC,
    total_spent NUMERIC,
    percentage_used NUMERIC,
    status_color TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH budget_totals AS (
        SELECT 
            SUM(limit_amount) as total_budget
        FROM budgets 
        WHERE user_id = p_user_id AND month = p_month
    ),
    expense_totals AS (
        SELECT 
            SUM(e.amount) as total_spent
        FROM expenses e
        INNER JOIN budgets b ON 
            e.user_id = b.user_id 
            AND e.category = b.category
        WHERE e.user_id = p_user_id 
            AND e.date >= (p_month || '-01')::date
            AND e.date <= (p_month || '-31')::date
            AND b.month = p_month
    )
    SELECT 
        COALESCE(bt.total_budget, 0) as total_budget,
        COALESCE(et.total_spent, 0) as total_spent,
        CASE 
            WHEN COALESCE(bt.total_budget, 0) > 0 THEN 
                (COALESCE(et.total_spent, 0) / bt.total_budget) * 100
            ELSE 0 
        END as percentage_used,
        CASE 
            WHEN COALESCE(et.total_spent, 0) / COALESCE(bt.total_budget, 1) < 0.7 THEN 'green'
            WHEN COALESCE(et.total_spent, 0) / COALESCE(bt.total_budget, 1) < 1.0 THEN 'yellow'
            ELSE 'red'
        END as status_color
    FROM budget_totals bt
    CROSS JOIN expense_totals et;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Testar a função corrigida (substitua pelo user_id real)
-- SELECT * FROM get_budget_summary('YOUR_USER_ID_HERE', '2025-01');

-- Verificar se a função foi atualizada
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_budget_summary'; 