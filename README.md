# FinanceAnchor - Sistema de Finanças Pessoais

Um sistema completo de gerenciamento financeiro pessoal desenvolvido com Next.js, TypeScript e Supabase.

## 🚀 Funcionalidades

- **Dashboard Financeiro**: Visão geral das finanças com gráficos e métricas
- **Gestão de Despesas**: Cadastro e acompanhamento de gastos
- **Controle de Dívidas**: Gerenciamento de empréstimos e financiamentos
- **Metas Financeiras**: Definição e acompanhamento de objetivos
- **Orçamento**: Planejamento e controle de gastos por categoria
- **Sistema de Parceiros**: Compartilhamento de despesas
- **Insights**: Análises e relatórios financeiros
- **Autenticação**: Sistema seguro de login e cadastro

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Gráficos**: Highcharts
- **Deploy**: Vercel (recomendado)

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/financeanchor.git
cd financeanchor
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Configure o banco de dados**
Execute os scripts SQL disponíveis na pasta `docs/` no seu projeto Supabase:
- `supabase-setup.sql` - Estrutura básica
- `supabase-expenses.sql` - Tabelas de despesas
- `supabase-debts.sql` - Tabelas de dívidas
- `supabase-goals.sql` - Tabelas de metas
- `supabase-budgets.sql` - Tabelas de orçamento
- `supabase-insights.sql` - Tabelas de insights
- `supabase-partner-system.sql` - Sistema de parceiros

5. **Execute o projeto**
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
financeanchor/
├── src/
│   ├── app/                 # Páginas Next.js (App Router)
│   ├── components/          # Componentes React
│   ├── lib/                # Bibliotecas e configurações
│   ├── types/              # Definições TypeScript
│   └── middleware.ts       # Middleware de autenticação
├── docs/                   # Documentação e scripts SQL
├── public/                 # Arquivos estáticos
└── package.json
```

## 🔐 Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as tabelas usando os scripts SQL em `docs/`
3. Configure as políticas RLS (Row Level Security)
4. Configure o sistema de autenticação
5. Adicione as variáveis de ambiente

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras plataformas
O projeto pode ser deployado em qualquer plataforma que suporte Next.js.

## 📚 Documentação

Consulte a pasta `docs/` para documentação detalhada sobre:
- Configuração de cada módulo
- Correções e otimizações
- Scripts SQL
- Soluções para problemas comuns

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub ou entre em contato.

---

Desenvolvido com ❤️ para ajudar no controle financeiro pessoal. 