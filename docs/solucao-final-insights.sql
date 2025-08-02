-- =====================================================
-- SOLUÇÃO FINAL PARA INSIGHTS - FINANCEANCHOR
-- =====================================================

-- 1. Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS daily_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_id ON daily_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_insights_date ON daily_insights(date);
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_date ON daily_insights(user_id, date);

-- 3. Habilitar RLS
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS se não existirem
DROP POLICY IF EXISTS "Users can view their own insights" ON daily_insights;
CREATE POLICY "Users can view their own insights" ON daily_insights
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own insights" ON daily_insights;
CREATE POLICY "Users can insert their own insights" ON daily_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own insights" ON daily_insights;
CREATE POLICY "Users can delete their own insights" ON daily_insights
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Função simplificada para gerar insights
CREATE OR REPLACE FUNCTION generate_insights(
    p_user_id UUID
)
RETURNS TABLE (
    insight_id UUID,
    message TEXT,
    date DATE
) AS $$
DECLARE
    new_insight_id UUID;
    insight_message TEXT := 'Continue assim! Cada dia importa. 💪';
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

    -- Inserir insight padrão
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

-- 6. Função simplificada para obter insight do dia
CREATE OR REPLACE FUNCTION get_today_insight(
    p_user_id UUID
)
RETURNS TABLE (
    insight_id UUID,
    message TEXT,
    date DATE
) AS $$
BEGIN
    -- Tentar gerar insight se não existir
    PERFORM generate_insights(p_user_id);
    
    -- Retornar insight do dia
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

-- 7. Função para obter insights do usuário
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

-- 8. Verificar se tudo foi criado corretamente
SELECT 'Verificando tabela daily_insights:' as status;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_insights' 
ORDER BY ordinal_position;

SELECT 'Verificando políticas RLS:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'daily_insights'
ORDER BY policyname;

SELECT 'Verificando funções:' as status;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('generate_insights', 'get_user_insights', 'get_today_insight')
ORDER BY routine_name;

-- 9. Status final
SELECT 
    'Sistema de insights corrigido com sucesso!' as resultado,
    NOW() as timestamp; 