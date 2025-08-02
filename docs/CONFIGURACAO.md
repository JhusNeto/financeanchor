# 🚀 Configuração do FinanceAnchor

## 📋 Passos para Configurar o Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Digite um nome para o projeto (ex: "financeanchor")
6. Escolha uma senha forte para o banco de dados
7. Escolha uma região próxima
8. Clique em "Create new project"

### 2. Configurar Autenticação

1. No painel do Supabase, vá para **Authentication > Settings**
2. Na seção **Auth Providers**, certifique-se que **Email** está habilitado
3. Desabilite **Enable email confirmations** (para desenvolvimento)
4. Em **Site URL**, adicione: `http://localhost:3000`
5. Em **Redirect URLs**, adicione:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/callback`
6. Clique em **Save**

### 3. Configurar Banco de Dados

1. Vá para **SQL Editor** no painel do Supabase
2. Clique em **New query**
3. Copie e cole o conteúdo do arquivo `supabase-setup.sql`
4. Clique em **Run** para executar o script

### 4. Obter Credenciais

1. Vá para **Settings > API**
2. Copie a **URL** do projeto
3. Copie a **anon public** key
4. Cole essas informações no arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 5. Testar a Configuração

1. Execute o projeto:
```bash
npm run dev
```

2. Acesse [http://localhost:3000](http://localhost:3000)
3. Clique em "Criar Conta"
4. Preencha o formulário e teste o cadastro
5. Faça login e verifique se redireciona para o dashboard

## 🔧 Estrutura Criada no Supabase

### Tabela `profiles`
```sql
profiles (
  id UUID PRIMARY KEY,           -- Mesmo ID do auth.users
  full_name TEXT NOT NULL,       -- Nome completo do usuário
  partner_id UUID,               -- ID do parceiro (para uso em casal)
  created_at TIMESTAMP,          -- Data de criação
  updated_at TIMESTAMP           -- Data da última atualização
)
```

### Políticas de Segurança (RLS)
- Usuários podem ver apenas seu próprio perfil
- Usuários podem atualizar apenas seu próprio perfil
- Usuários podem inserir apenas seu próprio perfil

### Triggers Automáticos
- Criação automática de perfil quando usuário se registra
- Atualização automática do campo `updated_at`

## 🚨 Solução de Problemas

### Erro: "Invalid login credentials"
- Verifique se o email e senha estão corretos
- Certifique-se que a autenticação por email está habilitada

### Erro: "Failed to fetch"
- Verifique se as variáveis de ambiente estão configuradas
- Confirme se a URL e chave do Supabase estão corretas

### Erro: "Table 'profiles' does not exist"
- Execute o script SQL no Supabase SQL Editor
- Verifique se o script foi executado com sucesso

### Erro: "RLS policy violation"
- Verifique se as políticas de segurança foram criadas
- Confirme se o usuário está autenticado

## 📱 Configuração para Produção

### 1. Variáveis de Ambiente
Configure as mesmas variáveis no seu provedor de deploy:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. URLs de Redirecionamento
No Supabase, adicione as URLs de produção:
- `https://seu-dominio.com/dashboard`
- `https://seu-dominio.com/auth/callback`

### 3. Configurações de Segurança
- Habilite confirmação de email em produção
- Configure HTTPS obrigatório
- Revise as políticas de segurança

## 🔒 Segurança

### Row Level Security (RLS)
- Todas as tabelas têm RLS habilitado
- Políticas restringem acesso apenas aos dados do usuário
- Triggers garantem integridade dos dados

### Autenticação
- Sessões seguras com cookies
- Middleware protege rotas sensíveis
- Logout limpa sessão completamente

### Validação
- Validação no frontend para melhor UX
- Validação no backend para segurança
- Sanitização de dados de entrada

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase
3. Confirme se todas as configurações estão corretas
4. Abra uma issue no repositório com detalhes do erro 