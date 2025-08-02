-- =====================================================
-- CRIAÇÃO DA TABELA EXPENSES - FINANCEANCHOR
-- =====================================================

-- 1. Criar tabela expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_shared BOOLEAN DEFAULT FALSE,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_shared ON expenses(is_shared);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança
-- Usuário pode ver apenas suas próprias despesas
CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

-- Usuário pode inserir apenas suas próprias despesas
CREATE POLICY "Users can insert own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuário pode atualizar apenas suas próprias despesas
CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuário pode deletar apenas suas próprias despesas
CREATE POLICY "Users can delete own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Criar bucket para comprovantes (se não existir)
-- Nota: Isso deve ser feito via Dashboard do Supabase ou API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- 8. Política para o bucket receipts
-- CREATE POLICY "Users can upload receipts" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own receipts" ON storage.objects
--     FOR SELECT USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir algumas categorias de exemplo
-- INSERT INTO expenses (user_id, amount, category, description, date, is_shared) VALUES
--     ('YOUR_USER_ID_HERE', 25.50, 'Alimentação', 'Almoço no restaurante', CURRENT_DATE, false),
--     ('YOUR_USER_ID_HERE', 45.00, 'Transporte', 'Combustível', CURRENT_DATE, true),
--     ('YOUR_USER_ID_HERE', 120.00, 'Moradia', 'Conta de luz', CURRENT_DATE - INTERVAL '5 days', false);

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
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'expenses'; 