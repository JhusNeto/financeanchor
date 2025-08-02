-- =====================================================
-- CORREÇÃO DAS FUNÇÕES DE PARCEIROS - FINANCEANCHOR
-- =====================================================

-- 1. Garantir que a coluna partner_id existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES profiles(id);

-- 2. Garantir que a coluna is_shared existe em expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- 3. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shared ON expenses(is_shared) WHERE is_shared = TRUE;

-- 4. Corrigir função get_partner_data
CREATE OR REPLACE FUNCTION get_partner_data(
    p_user_id UUID
)
RETURNS TABLE (
    partner_id UUID,
    partner_name TEXT,
    partner_email TEXT,
    has_partner BOOLEAN
) AS $$
DECLARE
    user_partner_id UUID;
    partner_profile RECORD;
BEGIN
    -- Buscar partner_id do usuário
    SELECT partner_id INTO user_partner_id
    FROM profiles 
    WHERE id = p_user_id;

    -- Se não tem parceiro
    IF user_partner_id IS NULL THEN
        RETURN QUERY
        SELECT 
            NULL::UUID as partner_id,
            NULL::TEXT as partner_name,
            NULL::TEXT as partner_email,
            FALSE as has_partner;
        RETURN;
    END IF;

    -- Buscar dados do parceiro
    SELECT 
        p.id,
        p.full_name,
        u.email
    INTO partner_profile
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = user_partner_id;

    -- Retornar dados do parceiro
    RETURN QUERY
    SELECT 
        partner_profile.id as partner_id,
        partner_profile.full_name as partner_name,
        partner_profile.email as partner_email,
        TRUE as has_partner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Corrigir função get_shared_expenses
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
DECLARE
    user_partner_id UUID;
BEGIN
    -- Buscar partner_id do usuário
    SELECT partner_id INTO user_partner_id
    FROM profiles 
    WHERE id = p_user_id;

    -- Se não tem parceiro, retornar vazio
    IF user_partner_id IS NULL THEN
        RETURN;
    END IF;

    -- Retornar despesas compartilhadas
    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.description,
        e.amount,
        e.date,
        e.category,
        e.is_shared,
        p.full_name as created_by_name,
        u.email as created_by_email
    FROM expenses e
    JOIN profiles p ON e.user_id = p.id
    JOIN auth.users u ON p.id = u.id
    WHERE (e.user_id = p_user_id OR e.user_id = user_partner_id)
    AND e.is_shared = TRUE
    ORDER BY e.date DESC, e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Corrigir função invite_partner
CREATE OR REPLACE FUNCTION invite_partner(
    p_inviter_id UUID,
    p_partner_email TEXT
)
RETURNS JSON AS $$
DECLARE
    partner_profile RECORD;
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

-- 7. Corrigir função remove_partner
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
        'message', 'Parceiro desvinculado com sucesso!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Verificar se as funções foram criadas corretamente
SELECT 'Verificando funções corrigidas:' as status;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_partner_data', 'get_shared_expenses', 'invite_partner', 'remove_partner')
ORDER BY routine_name;

-- 9. Verificar se as colunas existem
SELECT 'Verificando colunas:' as status;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE (table_name = 'profiles' AND column_name = 'partner_id')
   OR (table_name = 'expenses' AND column_name = 'is_shared')
ORDER BY table_name, column_name;

-- Status final
SELECT 
    'Funções de parceiros corrigidas com sucesso!' as resultado,
    NOW() as timestamp; 