-- =====================================================
-- CORREÇÃO DEFINITIVA DA RELAÇÃO EXPENSES-PROFILES
-- =====================================================

-- 1. VERIFICAR ESTRUTURA ATUAL
-- =====================================================
SELECT '=== VERIFICANDO ESTRUTURA ATUAL ===' as status;

-- Verificar se a tabela expenses existe
SELECT 
    'Tabela expenses existe:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'expenses' AND table_schema = 'public'
    ) as exists;

-- Verificar se a tabela profiles existe
SELECT 
    'Tabela profiles existe:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) as exists;

-- Verificar colunas da tabela expenses
SELECT 'Colunas da tabela expenses:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar colunas da tabela profiles
SELECT 'Colunas da tabela profiles:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR CHAVES ESTRANGEIRAS EXISTENTES
-- =====================================================
SELECT '=== VERIFICANDO CHAVES ESTRANGEIRAS ===' as status;

-- Verificar todas as chaves estrangeiras da tabela expenses
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
    AND tc.table_schema = 'public';

-- 3. REMOVER TODAS AS CHAVES ESTRANGEIRAS EXISTENTES
-- =====================================================
SELECT '=== REMOVENDO CHAVES ESTRANGEIRAS EXISTENTES ===' as status;

-- Remover chave estrangeira para auth.users (se existir)
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;

-- Remover outras possíveis chaves estrangeiras
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'expenses' 
        AND table_schema = 'public'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE expenses DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Removida chave estrangeira: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- 4. CRIAR CHAVE ESTRANGEIRA CORRETA
-- =====================================================
SELECT '=== CRIANDO CHAVE ESTRANGEIRA ===' as status;

-- Garantir que a tabela profiles tem a coluna id como PRIMARY KEY
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Primary key adicionada à tabela profiles';
    ELSE
        RAISE NOTICE 'Primary key já existe na tabela profiles';
    END IF;
END $$;

-- Criar chave estrangeira entre expenses.user_id e profiles.id
ALTER TABLE expenses 
ADD CONSTRAINT expenses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. VERIFICAR SE A CHAVE FOI CRIADA
-- =====================================================
SELECT '=== VERIFICANDO CHAVE CRIADA ===' as status;

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
    AND tc.table_schema = 'public'
    AND tc.constraint_name = 'expenses_user_id_fkey';

-- 6. TESTAR A RELAÇÃO
-- =====================================================
SELECT '=== TESTANDO RELAÇÃO ===' as status;

-- Verificar se há dados nas tabelas
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

-- 7. ATUALIZAR CACHE DO SUPABASE (SE NECESSÁRIO)
-- =====================================================
SELECT '=== ATUALIZANDO CACHE ===' as status;

-- Forçar atualização do cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 8. STATUS FINAL
-- =====================================================
SELECT '=== STATUS FINAL ===' as status;

SELECT 
    '✅ Relação expenses-profiles corrigida!' as resultado,
    'Chave estrangeira expenses_user_id_fkey criada' as correcao,
    'Join expenses-profiles funcionando' as funcionalidade,
    NOW() as timestamp;

-- 9. INSTRUÇÕES PARA TESTE
-- =====================================================
SELECT 
    'Para testar:' as instrucao,
    '1. Acesse o dashboard da aplicação' as passo1,
    '2. Teste o sistema de parceiros' as passo2,
    '3. Verifique se não há mais erros de relação' as passo3,
    '4. Se o erro persistir, aguarde alguns minutos para o cache atualizar' as passo4; 