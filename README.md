# 🚀 Stellar Ads - Backend de Gerenciamento

**Plataforma de Anúncios Descentralizada com Blockchain Stellar**

Este é o backend de gerenciamento que permite anunciantes e donos de sites criar campanhas e cadastrar sites para integração com o SDK de anúncios Stellar.

## 📋 Funcionalidades

### Para Anunciantes 🎯
- ✅ Criar e gerenciar campanhas publicitárias
- ✅ Definir orçamento e custo por clique em XLM
- ✅ Acompanhar métricas (impressões, cliques, gastos)
- ✅ Sistema de tags para targeting
- ✅ Pagamentos automáticos via Stellar

### Para Publishers (Donos de Sites) 🌐
- ✅ Cadastrar sites para monetização
- ✅ Gerar código SDK personalizado
- ✅ Configurar revenue share
- ✅ Receber pagamentos automáticos em XLM
- ✅ Dashboard com estatísticas

### Recursos Técnicos ⚡
- ✅ Autenticação com carteiras Stellar
- ✅ Banco de dados SQLite integrado
- ✅ Interface web responsiva
- ✅ API REST completa
- ✅ Sistema anti-fraude
- ✅ Recompensas para usuários finais

## 🔧 Instalação e Uso

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

### 3. Acessar a Plataforma
- **Interface Web**: http://localhost:3000
- **Login**: http://localhost:3000/login.html  
- **Dashboard**: http://localhost:3000/dashboard.html
- **Health Check**: http://localhost:3000/health-check

## 🎯 Como Usar

### 1. Criar Conta
1. Acesse http://localhost:3000
2. Clique em "Criar Nova Conta"
3. Preencha email e senha
4. Uma carteira Stellar será criada automaticamente
5. A conta será financiada no testnet

### 2. Para Anunciantes
1. Faça login no dashboard
2. Vá para aba "Campanhas"
3. Clique em "Nova Campanha"
4. Preencha os dados da campanha:
   - Nome do anunciante
   - Título e descrição
   - URL da imagem (300x250px recomendado)
   - URL de destino
   - Orçamento em XLM
   - Custo por clique
   - Tags para targeting
5. Campanha ficará pendente de aprovação

### 3. Para Publishers
1. Faça login no dashboard
2. Vá para aba "Sites"
3. Clique em "Novo Site"
4. Cadastre seu site:
   - Nome do site
   - Domínio
   - Revenue share (% que você recebe)
5. Copie o código SDK gerado
6. Cole no seu site onde quer os anúncios

## 📊 Estrutura da API

### Autenticação
- `POST /wallet/` - Criar conta e carteira
- `POST /wallet/login` - Fazer login
- `GET /wallet/:email` - Consultar saldo
- `DELETE /wallet/:email` - Deletar conta

### Campanhas (Anunciantes)
- `POST /advertisements` - Criar campanha
- `GET /advertisements/:userId` - Listar campanhas do usuário
- `PUT /advertisements/:campaignId` - Atualizar campanha
- `DELETE /advertisements/:campaignId` - Deletar campanha

### Sites (Publishers)
- `POST /sites` - Cadastrar site
- `GET /sites/:userId` - Listar sites do usuário
- `PUT /sites/:siteId` - Atualizar site
- `GET /sites/:siteId/sdk-code` - Gerar código SDK

### Dashboard
- `GET /dashboard/:userId` - Dados completos do dashboard

### Pagamentos
- `POST /transfer` - Transferir XLM entre contas

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **`users`** - Usuários (anunciantes/publishers)
- **`campaigns`** - Campanhas publicitárias
- **`sites`** - Sites cadastrados para monetização
- **`clicks`** - Registro de cliques nos anúncios
- **`impressions`** - Registro de visualizações
- **`user_rewards`** - Sistema de recompensas para usuários finais

## 🌟 Sistema de Recompensas

### Como Funciona
1. **Usuários visualizam anúncios** → Ganham 0.001 XLM por impressão
2. **Usuários clicam em anúncios** → Ganham % do valor do clique
3. **Publishers recebem revenue share** → 70% padrão dos cliques
4. **Sistema anti-fraude** → Cooldown de 6h por usuário/site

## 🔐 Integração com Stellar

### Contas Automáticas
- Cada usuário recebe uma carteira Stellar única
- Financiamento automático no testnet via Friendbot
- Pagamentos processados automaticamente
- Todas as transações são registradas na blockchain

### Stellar Testnet
- Rede: `https://horizon-testnet.stellar.org`
- Explorador: `https://stellar.expert/explorer/testnet`
- Financiamento: `https://friendbot.stellar.org`

## 🔧 Configuração de Produção

### Variáveis de Ambiente (.env)
```env
PORT=3000
DATABASE_PATH=/path/to/production.sqlite
STELLAR_NETWORK=mainnet  # Para produção
```

### Deploy
1. Alterar configuração para mainnet Stellar
2. Usar base de dados PostgreSQL (recomendado)
3. Configurar SSL e domínio
4. Implementar rate limiting
5. Configurar backup automático

## 🔄 Integração com SDK

Este backend alimenta o SDK de anúncios através das seguintes integrações:

### Dados Fornecidos ao SDK
- **Sites cadastrados** → Validação e configurações
- **Campanhas ativas** → Pool de anúncios disponíveis
- **Métricas em tempo real** → Impressões e cliques
- **Pagamentos automáticos** → Recompensas em XLM

### Fluxo de Dados
```
Backend → [Campanhas/Sites] → SDK → [Usuários] → Métricas → Backend
```

## 📞 Suporte

Para dúvidas ou problemas:

1. **Issues do GitHub**: Para bugs e melhorias
2. **Documentação**: Consulte os arquivos .md no projeto
3. **Logs**: Verifique o console do servidor

## 🚧 Roadmap

### Próximas Funcionalidades
- [ ] Aprovação manual de campanhas
- [ ] Sistema de relatórios avançados
- [ ] Integração com mainnet Stellar
- [ ] Dashboard administrativo
- [ ] Sistema de notificações
- [ ] Backup automático
- [ ] Rate limiting avançado
- [ ] Integração com PostgreSQL

---

**Desenvolvido com ❤️ para o futuro da publicidade descentralizada**

*Última atualização: 15 de setembro de 2025*
Adescentralized Platform
