-- =====================================================
-- CORREÇÃO DA FUNÇÃO GET_DEBTS_SUMMARY - FINANCEANCHOR
-- =====================================================

-- Corrigir a função get_debts_summary com tipos corretos
CREATE OR REPLACE FUNCTION get_debts_summary(
    p_user_id UUID
)
RETURNS TABLE (
    total_debt NUMERIC,
    total_monthly_payment NUMERIC,
    estimated_months INTEGER,
    next_due_debt TEXT,
    next_due_amount NUMERIC,
    days_until_next_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH debt_totals AS (
        SELECT 
            SUM(total_amount) as total_debt,
            SUM(monthly_payment) as total_monthly_payment
        FROM debts 
        WHERE user_id = p_user_id
    ),
    next_due AS (
        SELECT 
            name,
            monthly_payment,
            due_day,
            CASE 
                WHEN due_day >= EXTRACT(DAY FROM CURRENT_DATE) THEN 
                    due_day - EXTRACT(DAY FROM CURRENT_DATE)
                ELSE 
                    (EXTRACT(DAY FROM (CURRENT_DATE + INTERVAL '1 month')) - EXTRACT(DAY FROM CURRENT_DATE)) + due_day
            END as days_until
        FROM debts 
        WHERE user_id = p_user_id
        ORDER BY 
            CASE 
                WHEN due_day >= EXTRACT(DAY FROM CURRENT_DATE) THEN 
                    due_day - EXTRACT(DAY FROM CURRENT_DATE)
                ELSE 
                    (EXTRACT(DAY FROM (CURRENT_DATE + INTERVAL '1 month')) - EXTRACT(DAY FROM CURRENT_DATE)) + due_day
            END
        LIMIT 1
    )
    SELECT 
        COALESCE(dt.total_debt, 0) as total_debt,
        COALESCE(dt.total_monthly_payment, 0) as total_monthly_payment,
        CASE 
            WHEN COALESCE(dt.total_monthly_payment, 0) > 0 THEN 
                CEIL(COALESCE(dt.total_debt, 0) / dt.total_monthly_payment)::INTEGER
            ELSE 0 
        END as estimated_months,
        COALESCE(nd.name, 'Nenhuma dívida') as next_due_debt,
        COALESCE(nd.monthly_payment, 0) as next_due_amount,
        COALESCE(nd.days_until, 0)::INTEGER as days_until_next_due
    FROM debt_totals dt
    CROSS JOIN next_due nd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corrigir também a função get_user_debts para garantir consistência
CREATE OR REPLACE FUNCTION get_user_debts(
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    total_amount NUMERIC,
    monthly_payment NUMERIC,
    due_day INTEGER,
    start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    remaining_amount NUMERIC,
    months_paid INTEGER,
    months_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.total_amount,
        d.monthly_payment,
        d.due_day,
        d.start_date,
        d.created_at,
        d.updated_at,
        GREATEST(d.total_amount - (d.monthly_payment * 
            EXTRACT(MONTH FROM AGE(CURRENT_DATE, d.start_date))), 0) as remaining_amount,
        EXTRACT(MONTH FROM AGE(CURRENT_DATE, d.start_date))::INTEGER as months_paid,
        CASE 
            WHEN d.monthly_payment > 0 THEN 
                CEIL((d.total_amount - (d.monthly_payment * 
                    EXTRACT(MONTH FROM AGE(CURRENT_DATE, d.start_date)))) / d.monthly_payment)::INTEGER
            ELSE 0 
        END as months_remaining
    FROM debts d
    WHERE d.user_id = p_user_id
    ORDER BY d.due_day, d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Testar a função corrigida
SELECT 'Testando função get_debts_summary:' as status;
SELECT * FROM get_debts_summary('00000000-0000-0000-0000-000000000000');

-- Testar a função get_user_debts
SELECT 'Testando função get_user_debts:' as status;
SELECT * FROM get_user_debts('00000000-0000-0000-0000-000000000000');

-- Verificar se as funções foram atualizadas
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('get_debts_summary', 'get_user_debts')
ORDER BY routine_name;

-- Status final
SELECT 
    'Funções corrigidas com sucesso!' as resultado,
    NOW() as timestamp; 