-- =====================================================
-- SISTEMA DE COLABORAÇÃO CONJUGAL - FINANCEANCHOR
-- =====================================================

-- 1. Atualizar tabela profiles para incluir partner_id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES profiles(id);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON profiles(partner_id);

-- 3. Garantir que o campo is_shared existe em expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- 4. Criar índice para expenses compartilhadas
CREATE INDEX IF NOT EXISTS idx_expenses_shared ON expenses(is_shared) WHERE is_shared = TRUE;

-- 5. Função para convidar parceiro
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

-- 6. Função para desvincular parceiro
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

-- 7. Função para obter dados do parceiro
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

-- 8. Função para obter despesas compartilhadas
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

-- 9. Políticas RLS para visualização de dados do parceiro
-- Permitir que usuários vejam dados do parceiro (apenas leitura)
CREATE POLICY "Users can view partner data" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.uid() IN (
            SELECT id FROM profiles WHERE partner_id = auth.uid()
        )
    );

-- 10. Verificar se tudo foi criado corretamente
SELECT 'Verificando sistema de parceiros:' as status;

-- Verificar se a coluna partner_id foi adicionada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'partner_id';

-- Verificar se a coluna is_shared foi adicionada em expenses
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' AND column_name = 'is_shared';

-- Verificar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('invite_partner', 'remove_partner', 'get_partner_data', 'get_shared_expenses')
ORDER BY routine_name;

-- Status final
SELECT 
    'Sistema de colaboração conjugal criado com sucesso!' as resultado,
    NOW() as timestamp; 