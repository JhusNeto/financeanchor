# CONFIGURAÇÃO DO SISTEMA DE METAS - FINANCEANCHOR

## 📋 Passos para Configurar o Supabase

### 1. Executar Script SQL

Execute o script `supabase-goals.sql` no SQL Editor do Supabase:

1. Acesse o **Dashboard do Supabase**
2. Vá para **SQL Editor**
3. Cole o conteúdo do arquivo `supabase-goals.sql`
4. Clique em **Run** para executar

**Se aparecer erro "function not found", execute também o script `verificar-metas.sql`**

**Se aparecer erro de tipo "structure of query does not match function result type", execute o script `corrigir-funcao-metas.sql`**

### 2. Configurar Storage Bucket

Crie um bucket para armazenar as imagens das metas:

1. No Dashboard do Supabase, vá para **Storage**
2. Clique em **Create a new bucket**
3. Configure:
   - **Name**: `goals`
   - **Public bucket**: ✅ Marque como público
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/*`

### 3. Configurar Políticas RLS do Storage

No **SQL Editor**, execute:

```sql
-- Política para usuários fazerem upload de imagens
CREATE POLICY "Users can upload goal images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'goals' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para usuários visualizarem suas imagens
CREATE POLICY "Users can view their goal images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'goals' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para usuários deletarem suas imagens
CREATE POLICY "Users can delete their goal images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'goals' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

### 4. Verificar Configuração

Execute estas queries para verificar se tudo está funcionando:

```sql
-- Verificar se a tabela foi criada
SELECT * FROM information_schema.tables WHERE table_name = 'goals';

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'goals';

-- Verificar funções
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('get_goal_summary', 'get_user_goals');
```

## 🎯 Funcionalidades Implementadas

### ✅ Página Principal (`/goal`)
- Visualização da meta principal
- Barra de progresso animada
- Cálculo automático de economia diária
- Mensagens motivacionais personalizadas
- Upload e preview de imagens
- Atualização de progresso em tempo real

### ✅ Criação de Meta (`/goal/new`)
- Formulário completo com validação
- Upload de imagem com preview
- Cálculo automático de economia diária
- Integração com Supabase Storage

### ✅ Dashboard Integrado
- Card da meta principal no dashboard
- Progresso visual motivacional
- Link direto para detalhes da meta
- Estado vazio com call-to-action

### ✅ Sistema de Storage
- Bucket `goals` configurado
- Políticas RLS para segurança
- Upload de imagens com validação
- URLs públicas para exibição

## 🔧 Estrutura do Banco

### Tabela `goals`
```sql
- id (UUID, Primary Key)
- user_id (UUID, FK para auth.users)
- title (TEXT, Nome da meta)
- target_amount (NUMERIC, Valor alvo)
- current_amount (NUMERIC, Valor atual, default 0)
- deadline (DATE, Prazo final)
- image_url (TEXT, URL da imagem, opcional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Funções SQL
- `get_goal_summary()`: Resumo da meta principal
- `get_user_goals()`: Lista todas as metas do usuário

## 🎨 Interface

### Design Responsivo
- Mobile-first design
- Gradientes e animações suaves
- Cores baseadas no progresso
- Emojis contextuais

### Estados Visuais
- **0-25%**: Vermelho (início)
- **25-50%**: Laranja (progresso)
- **50-75%**: Amarelo (metade)
- **75-100%**: Azul (quase lá)
- **100%**: Verde (conquistado!)

## 🚀 Próximos Passos

1. **Execute o script SQL** no Supabase
2. **Configure o bucket de storage**
3. **Teste a criação de uma meta**
4. **Verifique a integração no dashboard**

## ✅ Checklist de Verificação

- [ ] Script SQL executado com sucesso
- [ ] **Se erro "function not found": Execute `verificar-metas.sql`**
- [ ] **Se erro de tipo "structure of query does not match": Execute `corrigir-funcao-metas.sql`**
- [ ] Bucket `goals` criado no Storage
- [ ] Políticas RLS configuradas
- [ ] Página `/goal` acessível
- [ ] Criação de meta funcionando
- [ ] Upload de imagem funcionando
- [ ] Dashboard mostrando meta
- [ ] Atualização de progresso funcionando

## 🎯 Resultado Esperado

- Sistema completo de metas financeiras
- Interface motivacional e intuitiva
- Integração perfeita com o dashboard
- Upload de imagens funcionando
- Cálculos automáticos de economia diária
- Mensagens personalizadas baseadas no progresso

**O sistema de metas está pronto para uso!** 🚀 