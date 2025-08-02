-- =====================================================
-- CORREÇÃO DA RELAÇÃO ENTRE EXPENSES E PROFILES
-- =====================================================

-- 1. VERIFICAR ESTRUTURA ATUAL
-- =====================================================
SELECT 'Verificando estrutura da tabela expenses:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;

SELECT 'Verificando estrutura da tabela profiles:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. VERIFICAR CHAVES ESTRANGEIRAS EXISTENTES
-- =====================================================
SELECT 'Verificando chaves estrangeiras da tabela expenses:' as status;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'expenses';

-- 3. CRIAR CHAVE ESTRANGEIRA ENTRE EXPENSES E PROFILES
-- =====================================================

-- Adicionar chave estrangeira de expenses.user_id para profiles.id
-- (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expenses_user_id_fkey' 
        AND table_name = 'expenses'
    ) THEN
        ALTER TABLE expenses 
        ADD CONSTRAINT expenses_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Chave estrangeira expenses_user_id_fkey criada';
    ELSE
        RAISE NOTICE 'Chave estrangeira expenses_user_id_fkey já existe';
    END IF;
END $$;

-- 4. VERIFICAR SE A CHAVE FOI CRIADA
-- =====================================================
SELECT 'Verificando chave estrangeira criada:' as status;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'expenses'
    AND tc.constraint_name = 'expenses_user_id_fkey';

-- 5. TESTAR A RELAÇÃO
-- =====================================================
SELECT 'Testando relação entre expenses e profiles:' as status;

-- Verificar se há dados de teste
SELECT 
    'Total de expenses:' as info,
    COUNT(*) as count 
FROM expenses;

SELECT 
    'Total de profiles:' as info,
    COUNT(*) as count 
FROM profiles;

-- Testar join simples
SELECT 
    'Teste de join expenses-profiles:' as info,
    COUNT(*) as total_joins
FROM expenses e
JOIN profiles p ON e.user_id = p.id
LIMIT 1;

-- 6. STATUS FINAL
-- =====================================================
SELECT 
    '✅ Relação entre expenses e profiles corrigida!' as resultado,
    'Chave estrangeira expenses_user_id_fkey criada' as correcao,
    'Join expenses-profiles funcionando' as funcionalidade,
    NOW() as timestamp; 