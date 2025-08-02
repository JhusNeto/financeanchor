-- =====================================================
-- CORREÇÃO RÁPIDA DA RECURSÃO INFINITA - PROFILES
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "Users can view partner data" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- 2. DESABILITAR RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. REABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS BÁSICAS E SEGURAS
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. VERIFICAR RESULTADO
SELECT '✅ Recursão infinita corrigida!' as status;
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'profiles'; 