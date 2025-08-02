-- =====================================================
-- SISTEMA DE METAS FINANCEIRAS - FINANCEANCHOR
-- =====================================================

-- 1. Criar tabela goals
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(10,2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    deadline DATE NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at);

-- 3. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_goals_updated_at();

-- 4. Políticas RLS (Row Level Security)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias metas
CREATE POLICY "Users can view their own goals" ON goals
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias metas
CREATE POLICY "Users can insert their own goals" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias metas
CREATE POLICY "Users can update their own goals" ON goals
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias metas
CREATE POLICY "Users can delete their own goals" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Função para calcular resumo da meta
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

-- 6. Função para obter todas as metas do usuário
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
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir uma meta de exemplo
-- INSERT INTO goals (user_id, title, target_amount, current_amount, deadline) VALUES
--     ('YOUR_USER_ID_HERE', 'Viagem para Europa', 15000.00, 3000.00, '2025-12-31');

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'goals';

-- Testar função get_goal_summary (substitua pelo user_id real)
-- SELECT * FROM get_goal_summary('YOUR_USER_ID_HERE');

-- Testar função get_user_goals (substitua pelo user_id real)
-- SELECT * FROM get_user_goals('YOUR_USER_ID_HERE'); 