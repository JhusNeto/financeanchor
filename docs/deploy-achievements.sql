-- Script para implementar sistema de gamificação no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(type);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON achievements(earned_at);

-- 3. Habilitar RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança
CREATE POLICY "Users can view own achievements" ON achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON achievements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements" ON achievements
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Função para verificar se usuário já tem uma conquista
CREATE OR REPLACE FUNCTION check_achievement_exists(
    p_user_id UUID,
    p_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM achievements 
        WHERE user_id = p_user_id AND type = p_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para adicionar conquista se não existir
CREATE OR REPLACE FUNCTION add_achievement_if_not_exists(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_description TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Verifica se a conquista já existe
    IF NOT check_achievement_exists(p_user_id, p_type) THEN
        INSERT INTO achievements (user_id, type, title, description)
        VALUES (p_user_id, p_type, p_title, p_description);
        RETURN TRUE; -- Nova conquista adicionada
    ELSE
        RETURN FALSE; -- Conquista já existe
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para obter conquistas do usuário ordenadas por data
CREATE OR REPLACE FUNCTION get_user_achievements(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.type,
        a.title,
        a.description,
        a.earned_at
    FROM achievements a
    WHERE a.user_id = p_user_id
    ORDER BY a.earned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para contar conquistas do usuário
CREATE OR REPLACE FUNCTION count_user_achievements(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM achievements 
        WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Comentários para documentação
COMMENT ON TABLE achievements IS 'Sistema de gamificação - conquistas dos usuários';
COMMENT ON COLUMN achievements.type IS 'Tipo da conquista: primeiro_gasto, semana_orcamento, meta_atingida, mil_economizados, divida_zerada, 30_dias_app';
COMMENT ON COLUMN achievements.title IS 'Título da conquista para exibição';
COMMENT ON COLUMN achievements.description IS 'Descrição detalhada da conquista';

-- 10. Verificar se tudo foi criado corretamente
SELECT 
    'Tabela achievements criada' as status,
    COUNT(*) as total_achievements
FROM achievements;

SELECT 
    'Funções criadas' as status,
    routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'check_achievement_exists',
    'add_achievement_if_not_exists',
    'get_user_achievements',
    'count_user_achievements'
); 