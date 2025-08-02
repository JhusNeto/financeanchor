-- =====================================================
-- SISTEMA DE INSIGHTS FINANCEIROS - FINANCEANCHOR
-- =====================================================

-- 1. Criar tabela daily_insights
CREATE TABLE IF NOT EXISTS daily_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_id ON daily_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_insights_date ON daily_insights(date);
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_date ON daily_insights(user_id, date);

-- 3. Trigger para atualizar created_at
CREATE OR REPLACE FUNCTION update_daily_insights_created_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_insights_created_at 
    BEFORE UPDATE ON daily_insights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_daily_insights_created_at();

-- 4. Políticas RLS (Row Level Security)
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios insights
CREATE POLICY "Users can view their own insights" ON daily_insights
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários inserirem seus próprios insights
CREATE POLICY "Users can insert their own insights" ON daily_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários deletarem seus próprios insights
CREATE POLICY "Users can delete their own insights" ON daily_insights
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Função para gerar insights financeiros
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

-- 6. Função para obter insights do usuário
CREATE OR REPLACE FUNCTION get_user_insights(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    id UUID,
    message TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        di.id,
        di.message,
        di.date,
        di.created_at
    FROM daily_insights di
    WHERE di.user_id = p_user_id 
    AND di.date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    ORDER BY di.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para obter insight do dia atual
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

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir insights de exemplo
-- INSERT INTO daily_insights (user_id, date, message) VALUES
--     ('YOUR_USER_ID_HERE', CURRENT_DATE - INTERVAL '1 day', 'Você economizou R$150 essa semana! 👏'),
--     ('YOUR_USER_ID_HERE', CURRENT_DATE - INTERVAL '2 days', 'Continue assim! Cada dia importa. 💪'),
--     ('YOUR_USER_ID_HERE', CURRENT_DATE - INTERVAL '3 days', 'Você tem R$800 sobrando esse mês. 💰');

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 'Verificando tabela daily_insights:' as status;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_insights' 
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 'Verificando políticas RLS:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'daily_insights'
ORDER BY policyname;

-- Verificar funções
SELECT 'Verificando funções:' as status;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('generate_insights', 'get_user_insights', 'get_today_insight')
ORDER BY routine_name;

-- Testar função get_today_insight (substitua pelo user_id real)
-- SELECT * FROM get_today_insight('YOUR_USER_ID_HERE');

-- Status final
SELECT 
    'Sistema de insights financeiros criado com sucesso!' as resultado,
    NOW() as timestamp; 