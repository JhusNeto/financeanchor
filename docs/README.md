# FinanceAnchor

Um aplicativo moderno de finanças pessoais construído com Next.js 14, TypeScript, Tailwind CSS e Supabase.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Supabase** - Backend como serviço (BaaS) com autenticação
- **PWA** - Progressive Web App para instalação mobile

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase (gratuita)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd financeanchor
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.local.example .env.local
```

Edite o arquivo `.env.local` e adicione suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

## 🔐 Configuração do Supabase

### 1. Configurar Autenticação

1. Acesse o painel do Supabase
2. Vá para **Authentication > Settings**
3. Habilite o método **Email** (desabilite magic link por enquanto)
4. Em **Auth > Users**, configure o redirecionamento após login para `/dashboard`

### 2. Criar Tabela Profiles

1. Vá para **SQL Editor** no Supabase
2. Execute o script `supabase-setup.sql` que está na raiz do projeto
3. Este script irá:
   - Criar a tabela `profiles`
   - Configurar RLS (Row Level Security)
   - Criar triggers para criação automática de perfis
   - Configurar políticas de segurança

### 3. Estrutura da Tabela Profiles

```sql
profiles (
  id UUID PRIMARY KEY,           -- Mesmo ID do auth.users
  full_name TEXT NOT NULL,       -- Nome completo do usuário
  partner_id UUID,               -- ID do parceiro (para uso em casal)
  created_at TIMESTAMP,          -- Data de criação
  updated_at TIMESTAMP           -- Data da última atualização
)
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
financeanchor/
├── src/
│   ├── app/                     # App Router (Next.js 14)
│   │   ├── auth/                # Páginas de autenticação
│   │   │   ├── login/           # Página de login
│   │   │   └── signup/          # Página de cadastro
│   │   ├── dashboard/           # Dashboard protegido
│   │   ├── globals.css          # Estilos globais
│   │   ├── layout.tsx           # Layout principal
│   │   └── page.tsx             # Página inicial
│   ├── components/              # Componentes reutilizáveis
│   │   └── Header.tsx           # Componente de navegação
│   ├── lib/                     # Utilitários e configurações
│   │   ├── auth.ts              # Funções de autenticação
│   │   └── supabase.ts          # Cliente Supabase
│   └── middleware.ts            # Middleware para proteção de rotas
├── public/                      # Arquivos estáticos
│   └── manifest.json            # Manifesto PWA
├── supabase-setup.sql           # Script SQL para configuração
├── tailwind.config.js           # Configuração Tailwind
├── next.config.ts               # Configuração Next.js + PWA
├── .env.local                   # Variáveis de ambiente
└── README.md                    # Documentação
```

## 🔧 Funcionalidades de Autenticação

### Páginas Disponíveis

- **`/`** - Página inicial com links para login/cadastro
- **`/auth/login`** - Página de login
- **`/auth/signup`** - Página de cadastro
- **`/dashboard`** - Dashboard protegido (requer autenticação)

### Funções de Autenticação

```typescript
// Cadastro de usuário
signUp(email: string, password: string, fullName: string)

// Login
signIn(email: string, password: string)

// Logout
signOut()

// Obter usuário atual
getCurrentUser()

// Obter perfil do usuário
getProfile(userId: string)

// Atualizar perfil
updateProfile(userId: string, updates: Partial<Profile>)

// Verificar se está autenticado
isAuthenticated()
```

### Proteção de Rotas

O middleware (`src/middleware.ts`) protege automaticamente:
- Rotas `/dashboard/*` - Redireciona para login se não autenticado
- Rotas `/auth/*` - Redireciona para dashboard se já autenticado

## 🎨 Interface

- Design moderno com gradiente azul
- Formulários responsivos com validação
- Loading states e feedback visual
- Mensagens de erro e sucesso
- Dashboard com cards de estatísticas
- Ações rápidas para funcionalidades futuras

## 📱 PWA Features

- Service worker automático
- Manifesto para instalação
- Meta tags para iOS/Android
- Ícones configurados

## 🚀 Deploy

O projeto está pronto para deploy em:
- Vercel (recomendado)
- Netlify
- Railway
- Qualquer plataforma que suporte Next.js

### Variáveis de Ambiente para Produção

Certifique-se de configurar as mesmas variáveis de ambiente no seu provedor de deploy:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔒 Segurança

- Row Level Security (RLS) habilitado no Supabase
- Políticas de acesso configuradas
- Middleware de proteção de rotas
- Validação de formulários no frontend
- Sanitização de dados

## 🤝 Uso em Casal

O sistema está preparado para suporte a casais através do campo `partner_id`:
- Cada usuário pode ter um parceiro associado
- Permite compartilhamento de dados financeiros
- Estrutura flexível para futuras funcionalidades

## 📞 Suporte

Para suporte, envie um email para [seu-email@exemplo.com] ou abra uma issue no repositório.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
