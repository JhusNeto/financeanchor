-- =====================================================
-- CORREÇÃO RÁPIDA DA RELAÇÃO EXPENSES-PROFILES
-- =====================================================

-- 1. CRIAR CHAVE ESTRANGEIRA ENTRE EXPENSES E PROFILES
-- =====================================================

-- Remover chave estrangeira existente para auth.users (se existir)
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;

-- Adicionar chave estrangeira para profiles
ALTER TABLE expenses 
ADD CONSTRAINT expenses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. VERIFICAR SE FOI CRIADA
-- =====================================================
SELECT 'Verificando chave estrangeira:' as status;
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

-- 3. TESTAR RELAÇÃO
-- =====================================================
SELECT 'Testando join expenses-profiles:' as status;
SELECT COUNT(*) as total_joins
FROM expenses e
JOIN profiles p ON e.user_id = p.id
LIMIT 1;

-- 4. STATUS FINAL
-- =====================================================
SELECT '✅ Relação expenses-profiles corrigida!' as resultado; 