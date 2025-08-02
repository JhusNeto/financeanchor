-- =====================================================
-- CRIAÇÃO DA TABELA BUDGETS - FINANCEANCHOR
-- =====================================================

-- 1. Criar tabela budgets
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'), -- Formato: YYYY-MM
    category TEXT NOT NULL,
    limit_amount NUMERIC(10,2) NOT NULL CHECK (limit_amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que um usuário só tenha um orçamento por categoria por mês
    UNIQUE(user_id, month, category)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança
-- Usuário pode ver apenas seus próprios orçamentos
CREATE POLICY "Users can view own budgets" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

-- Usuário pode inserir apenas seus próprios orçamentos
CREATE POLICY "Users can insert own budgets" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuário pode atualizar apenas seus próprios orçamentos
CREATE POLICY "Users can update own budgets" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuário pode deletar apenas seus próprios orçamentos
CREATE POLICY "Users can delete own budgets" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_budgets_updated_at();

-- 7. Função para obter status do orçamento
CREATE OR REPLACE FUNCTION get_budget_status(
    p_user_id UUID,
    p_month TEXT
)
RETURNS TABLE (
    category TEXT,
    budget_limit NUMERIC,
    total_spent NUMERIC,
    percentage_used NUMERIC,
    status_color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.category,
        b.limit_amount as budget_limit,
        COALESCE(SUM(e.amount), 0) as total_spent,
        CASE 
            WHEN b.limit_amount > 0 THEN 
                (COALESCE(SUM(e.amount), 0) / b.limit_amount) * 100
            ELSE 0 
        END as percentage_used,
        CASE 
            WHEN COALESCE(SUM(e.amount), 0) / b.limit_amount < 0.7 THEN 'green'
            WHEN COALESCE(SUM(e.amount), 0) / b.limit_amount < 1.0 THEN 'yellow'
            ELSE 'red'
        END as status_color
    FROM budgets b
    LEFT JOIN expenses e ON 
        e.user_id = b.user_id 
        AND e.category = b.category 
        AND e.date >= (p_month || '-01')::date
        AND e.date <= (p_month || '-31')::date
    WHERE b.user_id = p_user_id AND b.month = p_month
    GROUP BY b.category, b.limit_amount
    ORDER BY b.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para obter resumo do orçamento total
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
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir alguns orçamentos de exemplo
-- INSERT INTO budgets (user_id, month, category, limit_amount) VALUES
--     ('YOUR_USER_ID_HERE', '2025-01', 'Alimentação', 800.00),
--     ('YOUR_USER_ID_HERE', '2025-01', 'Transporte', 400.00),
--     ('YOUR_USER_ID_HERE', '2025-01', 'Moradia', 1200.00),
--     ('YOUR_USER_ID_HERE', '2025-01', 'Lazer', 300.00),
--     ('YOUR_USER_ID_HERE', '2025-01', 'Saúde', 200.00);

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
WHERE table_name = 'budgets' 
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'budgets';

-- Testar função get_budget_status (substitua pelo user_id real)
-- SELECT * FROM get_budget_status('YOUR_USER_ID_HERE', '2025-01');

-- Testar função get_budget_summary (substitua pelo user_id real)
-- SELECT * FROM get_budget_summary('YOUR_USER_ID_HERE', '2025-01'); 