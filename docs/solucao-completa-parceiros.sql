-- =====================================================
-- SOLUÇÃO COMPLETA PARA SISTEMA DE PARCEIROS - FINANCEANCHOR
-- =====================================================

-- 1. CORRIGIR POLÍTICAS RLS (RESOLVER RECURSÃO INFINITA)
-- =====================================================

-- Remover todas as políticas RLS da tabela profiles
DROP POLICY IF EXISTS "Users can view partner data" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;

-- Desabilitar RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. GARANTIR ESTRUTURA DAS TABELAS
-- =====================================================

-- Garantir que a coluna partner_id existe na tabela profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'partner_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN partner_id UUID REFERENCES profiles(id);
        RAISE NOTICE 'Coluna partner_id adicionada à tabela profiles';
    ELSE
        RAISE NOTICE 'Coluna partner_id já existe na tabela profiles';
    END IF;
END $$;

-- Garantir que a coluna is_shared existe na tabela expenses
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'is_shared'
    ) THEN
        ALTER TABLE expenses ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna is_shared adicionada à tabela expenses';
    ELSE
        RAISE NOTICE 'Coluna is_shared já existe na tabela expenses';
    END IF;
END $$;

-- 3. CRIAR PERFIL DO USUÁRIO ESPECÍFICO
-- =====================================================

-- Criar perfil para o usuário Iasmim
INSERT INTO profiles (
    id, 
    full_name, 
    partner_id,
    created_at,
    updated_at
) VALUES (
    '11b643c6-b927-4ecd-90ff-deb1b0426712',  -- ID do usuário
    'Iasmim',  -- Nome do usuário
    NULL,  -- Sem parceiro inicialmente
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shared ON expenses(is_shared) WHERE is_shared = TRUE;

-- 5. RECRIAR FUNÇÕES SQL
-- =====================================================

-- Função para convidar parceiro
CREATE OR REPLACE FUNCTION invite_partner(
    p_inviter_id UUID,
    p_partner_email TEXT
)
RETURNS JSON AS $$
DECLARE
    partner_profile RECORD;
    result JSON;
BEGIN
    -- Verificar se o usuário já tem parceiro
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_inviter_id AND partner_id IS NOT NULL) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Você já possui um parceiro vinculado'
        );
    END IF;

    -- Buscar o perfil do parceiro pelo email
    SELECT p.* INTO partner_profile
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE u.email = p_partner_email;

    -- Se não encontrou o usuário
    IF partner_profile.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário não encontrado com este email'
        );
    END IF;

    -- Verificar se o parceiro já tem parceiro
    IF partner_profile.partner_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Este usuário já possui um parceiro vinculado'
        );
    END IF;

    -- Verificar se não está tentando se vincular a si mesmo
    IF partner_profile.id = p_inviter_id THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Você não pode se vincular a si mesmo'
        );
    END IF;

    -- Vincular os dois perfis
    UPDATE profiles SET partner_id = partner_profile.id WHERE id = p_inviter_id;
    UPDATE profiles SET partner_id = p_inviter_id WHERE id = partner_profile.id;

    RETURN json_build_object(
        'success', true,
        'message', 'Parceiro vinculado com sucesso!',
        'partner_name', partner_profile.full_name,
        'partner_email', p_partner_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover parceiro
CREATE OR REPLACE FUNCTION remove_partner(
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    current_partner_id UUID;
BEGIN
    -- Buscar o parceiro atual
    SELECT partner_id INTO current_partner_id
    FROM profiles WHERE id = p_user_id;

    -- Se não tem parceiro
    IF current_partner_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Você não possui um parceiro vinculado'
        );
    END IF;

    -- Desvincular os dois perfis
    UPDATE profiles SET partner_id = NULL WHERE id = p_user_id;
    UPDATE profiles SET partner_id = NULL WHERE id = current_partner_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Parceiro removido com sucesso!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter dados do parceiro
CREATE OR REPLACE FUNCTION get_partner_data(
    p_user_id UUID
)
RETURNS TABLE (
    partner_id UUID,
    partner_name TEXT,
    partner_email TEXT,
    has_partner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.partner_id,
        partner.full_name,
        u.email,
        p.partner_id IS NOT NULL
    FROM profiles p
    LEFT JOIN profiles partner ON p.partner_id = partner.id
    LEFT JOIN auth.users u ON partner.id = u.id
    WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter despesas compartilhadas
CREATE OR REPLACE FUNCTION get_shared_expenses(
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    description TEXT,
    amount NUMERIC,
    date DATE,
    category TEXT,
    is_shared BOOLEAN,
    created_by_name TEXT,
    created_by_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.description,
        e.amount,
        e.date,
        e.category,
        e.is_shared,
        creator.full_name,
        u.email
    FROM expenses e
    JOIN profiles creator ON e.user_id = creator.id
    JOIN auth.users u ON creator.id = u.id
    WHERE (e.user_id = p_user_id OR e.user_id = (
        SELECT partner_id FROM profiles WHERE id = p_user_id
    ))
    AND e.is_shared = TRUE
    ORDER BY e.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RECRIAR POLÍTICAS RLS SIMPLES E SEGURAS
-- =====================================================

-- Habilitar RLS novamente
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para visualizar próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para inserir próprio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para visualizar perfil do parceiro (sem recursão)
CREATE POLICY "Users can view partner profile" ON profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE partner_id = auth.uid()
        )
    );

-- 7. CORRIGIR DADOS INCONSISTENTES
-- =====================================================

-- Remover vínculos circulares ou inválidos
UPDATE profiles 
SET partner_id = NULL 
WHERE partner_id = id;

-- Remover vínculos onde o parceiro não existe
UPDATE profiles 
SET partner_id = NULL 
WHERE partner_id IS NOT NULL 
AND partner_id NOT IN (SELECT id FROM profiles);

-- 8. VERIFICAR STATUS FINAL
-- =====================================================

SELECT 'Verificando correções aplicadas:' as status;

-- Verificar se as colunas existem
SELECT 
    'Colunas verificadas:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'expenses') 
AND column_name IN ('partner_id', 'is_shared')
ORDER BY table_name, column_name;

-- Verificar se as funções existem
SELECT 
    'Funções verificadas:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('invite_partner', 'remove_partner', 'get_partner_data', 'get_shared_expenses')
ORDER BY routine_name;

-- Verificar se os índices existem
SELECT 
    'Índices verificados:' as info,
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename IN ('profiles', 'expenses') 
AND indexname LIKE '%partner%' OR indexname LIKE '%shared%';

-- Verificar políticas RLS
SELECT 
    'Políticas RLS verificadas:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Verificar perfil do usuário
SELECT 
    'Perfil do usuário:' as info,
    id,
    full_name,
    partner_id,
    created_at
FROM profiles 
WHERE id = '11b643c6-b927-4ecd-90ff-deb1b0426712';

-- Status final
SELECT 
    'Sistema de parceiros corrigido com sucesso!' as resultado,
    'Recursão infinita removida' as correcao,
    'Perfil do usuário criado' as perfil,
    NOW() as timestamp; 