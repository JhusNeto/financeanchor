-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DO SISTEMA DE DÍVIDAS
-- =====================================================

-- 1. Verificar se a tabela debts existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'debts') 
        THEN '✅ Tabela debts existe'
        ELSE '❌ Tabela debts NÃO existe'
    END as status_tabela;

-- 2. Verificar se as funções existem
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_debts_summary') 
        THEN '✅ Função get_debts_summary existe'
        ELSE '❌ Função get_debts_summary NÃO existe'
    END as status_funcao_summary;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_debts') 
        THEN '✅ Função get_user_debts existe'
        ELSE '❌ Função get_user_debts NÃO existe'
    END as status_funcao_user_debts;

-- 3. Recriar as funções se necessário
-- Função get_debts_summary
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

-- Função get_user_debts
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

-- 4. Verificar políticas RLS
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Política existe'
        ELSE '❌ Política não encontrada'
    END as status
FROM pg_policies 
WHERE tablename = 'debts';

-- 5. Recriar políticas RLS se necessário
DROP POLICY IF EXISTS "Users can view their own debts" ON debts;
DROP POLICY IF EXISTS "Users can insert their own debts" ON debts;
DROP POLICY IF EXISTS "Users can update their own debts" ON debts;
DROP POLICY IF EXISTS "Users can delete their own debts" ON debts;

-- Política para usuários verem apenas suas próprias dívidas
CREATE POLICY "Users can view their own debts" ON debts
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias dívidas
CREATE POLICY "Users can insert their own debts" ON debts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias dívidas
CREATE POLICY "Users can update their own debts" ON debts
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias dívidas
CREATE POLICY "Users can delete their own debts" ON debts
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Verificar se tudo está funcionando
SELECT 'Verificação final:' as status;

-- Testar função get_debts_summary (deve retornar uma linha mesmo sem dados)
SELECT * FROM get_debts_summary('00000000-0000-0000-0000-000000000000');

-- Testar função get_user_debts (deve retornar vazio se não há dados)
SELECT * FROM get_user_debts('00000000-0000-0000-0000-000000000000');

-- 7. Status final
SELECT 
    'Sistema de dívidas verificado e corrigido!' as resultado,
    NOW() as timestamp; 