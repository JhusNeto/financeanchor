-- =====================================================
-- SISTEMA DE DÍVIDAS PESSOAIS - FINANCEANCHOR
-- =====================================================

-- 1. Criar tabela debts
CREATE TABLE IF NOT EXISTS debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
    monthly_payment NUMERIC(10,2) NOT NULL CHECK (monthly_payment > 0),
    due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_day ON debts(due_day);
CREATE INDEX IF NOT EXISTS idx_debts_start_date ON debts(start_date);
CREATE INDEX IF NOT EXISTS idx_debts_user_due ON debts(user_id, due_day);

-- 3. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_debts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_debts_updated_at 
    BEFORE UPDATE ON debts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_debts_updated_at();

-- 4. Políticas RLS (Row Level Security)
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

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

-- 5. Função para calcular resumo das dívidas
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

-- 6. Função para obter todas as dívidas do usuário
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
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir algumas dívidas de exemplo
-- INSERT INTO debts (user_id, name, total_amount, monthly_payment, due_day, start_date) VALUES
--     ('YOUR_USER_ID_HERE', 'Cartão Nubank', 5000.00, 500.00, 15, '2024-01-01'),
--     ('YOUR_USER_ID_HERE', 'Financiamento Carro', 25000.00, 800.00, 5, '2023-06-01'),
--     ('YOUR_USER_ID_HERE', 'Empréstimo Pessoal', 8000.00, 600.00, 20, '2024-03-01');

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
WHERE table_name = 'debts' 
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'debts';

-- Testar função get_debts_summary (substitua pelo user_id real)
-- SELECT * FROM get_debts_summary('YOUR_USER_ID_HERE');

-- Testar função get_user_debts (substitua pelo user_id real)
-- SELECT * FROM get_user_debts('YOUR_USER_ID_HERE'); 