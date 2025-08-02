-- =====================================================
-- CORREÇÃO DAS FUNÇÕES DE INSIGHTS - FINANCEANCHOR
-- =====================================================

-- 1. Corrigir função generate_insights
CREATE OR REPLACE FUNCTION generate_insights(
    p_user_id UUID
)
RETURNS TABLE (
    insight_id UUID,
    message TEXT,
    date DATE
) AS $$
DECLARE
    current_week_total NUMERIC := 0;
    previous_week_total NUMERIC := 0;
    current_month_income NUMERIC := 0;
    current_month_expenses NUMERIC := 0;
    goal_remaining NUMERIC := 0;
    goal_percentage NUMERIC := 0;
    insight_message TEXT;
    new_insight_id UUID;
BEGIN
    -- Verificar se já existe insight para hoje
    IF EXISTS (SELECT 1 FROM daily_insights WHERE user_id = p_user_id AND date = CURRENT_DATE) THEN
        RETURN QUERY
        SELECT 
            di.id as insight_id,
            di.message,
            di.date
        FROM daily_insights di
        WHERE di.user_id = p_user_id AND di.date = CURRENT_DATE
        LIMIT 1;
        RETURN;
    END IF;

    -- Calcular gastos da semana atual (últimos 7 dias)
    SELECT COALESCE(SUM(amount), 0) INTO current_week_total
    FROM expenses 
    WHERE user_id = p_user_id 
    AND date >= CURRENT_DATE - INTERVAL '7 days'
    AND date < CURRENT_DATE;

    -- Calcular gastos da semana anterior (7 dias antes)
    SELECT COALESCE(SUM(amount), 0) INTO previous_week_total
    FROM expenses 
    WHERE user_id = p_user_id 
    AND date >= CURRENT_DATE - INTERVAL '14 days'
    AND date < CURRENT_DATE - INTERVAL '7 days';

    -- Calcular receitas do mês atual (mockado por enquanto)
    current_month_income := 5000.00; -- Valor mockado

    -- Calcular despesas do mês atual
    SELECT COALESCE(SUM(amount), 0) INTO current_month_expenses
    FROM expenses 
    WHERE user_id = p_user_id 
    AND date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

    -- Verificar meta mais próxima
    SELECT 
        COALESCE(amount_remaining, 0),
        COALESCE(percentage_completed, 0)
    INTO goal_remaining, goal_percentage
    FROM get_goal_summary(p_user_id)
    LIMIT 1;

    -- Gerar mensagem baseada nos dados
    insight_message := 'Continue assim! Cada dia importa. 💪';

    -- Regra A: Comparação semanal
    IF current_week_total < previous_week_total AND previous_week_total > 0 THEN
        insight_message := 'Você gastou R$' || 
                         (previous_week_total - current_week_total)::TEXT || 
                         ' a menos essa semana! Ótimo progresso 👏';
    END IF;

    -- Regra B: Dinheiro parado (sobra > R$500)
    IF (current_month_income - current_month_expenses) > 500 THEN
        insight_message := 'Você tem R$' || 
                         (current_month_income - current_month_expenses)::TEXT || 
                         ' sobrando esse mês. Já pensou em investir ou acelerar sua meta? 💰';
    END IF;

    -- Regra C: Rumo à meta (faltam menos de 20%)
    IF goal_percentage >= 80 AND goal_remaining > 0 THEN
        insight_message := 'Você está muito perto de conquistar seu sonho! Só faltam R$' || 
                         goal_remaining::TEXT || '! 🎯';
    END IF;

    -- Inserir o insight gerado
    INSERT INTO daily_insights (user_id, date, message)
    VALUES (p_user_id, CURRENT_DATE, insight_message)
    RETURNING id INTO new_insight_id;

    -- Retornar o insight criado
    RETURN QUERY
    SELECT 
        di.id as insight_id,
        di.message,
        di.date
    FROM daily_insights di
    WHERE di.id = new_insight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corrigir função get_today_insight
CREATE OR REPLACE FUNCTION get_today_insight(
    p_user_id UUID
)
RETURNS TABLE (
    insight_id UUID,
    message TEXT,
    date DATE
) AS $$
DECLARE
    existing_insight RECORD;
BEGIN
    -- Primeiro, verificar se já existe insight para hoje
    SELECT id, message, date INTO existing_insight
    FROM daily_insights 
    WHERE user_id = p_user_id AND date = CURRENT_DATE
    LIMIT 1;

    -- Se já existe, retornar
    IF existing_insight.id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            existing_insight.id as insight_id,
            existing_insight.message,
            existing_insight.date;
        RETURN;
    END IF;

    -- Se não existe, tentar gerar um novo insight
    BEGIN
        PERFORM generate_insights(p_user_id);
    EXCEPTION
        WHEN OTHERS THEN
            -- Se falhar ao gerar, criar um insight padrão
            INSERT INTO daily_insights (user_id, date, message)
            VALUES (p_user_id, CURRENT_DATE, 'Continue assim! Cada dia importa. 💪');
    END;

    -- Retornar o insight (gerado ou padrão)
    RETURN QUERY
    SELECT 
        di.id as insight_id,
        di.message,
        di.date
    FROM daily_insights di
    WHERE di.user_id = p_user_id AND di.date = CURRENT_DATE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificar se as funções foram criadas corretamente
SELECT 'Verificando funções corrigidas:' as status;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('generate_insights', 'get_today_insight')
ORDER BY routine_name;

-- 4. Testar função (substitua pelo user_id real)
-- SELECT * FROM get_today_insight('YOUR_USER_ID_HERE');

-- Status final
SELECT 
    'Funções de insights corrigidas com sucesso!' as resultado,
    NOW() as timestamp; 