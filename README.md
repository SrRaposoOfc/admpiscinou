# 🏊‍♂️ Piscinou - Sistema de Gerenciamento de Piscinas

Sistema híbrido para gerenciamento de usuários e administração de serviços de piscina:
- **🔐 Admin**: Autenticação local via JSON (sem MongoDB)
- **👥 Usuários**: Gerenciamento via MongoDB real

## 🚀 Funcionalidades

### ✅ **Sistema de Administração (Local - JSON)**
- **Login de Administradores** - Autenticação local via JSON
- **Dashboard Administrativo** - Estatísticas detalhadas e gerenciamento
- **Gerenciamento Avançado de Usuários** - CRUD completo via MongoDB
- **Controle de Status** - Ativar/desativar/suspender usuários
- **Filtros e Paginação** - Busca avançada com ordenação
- **Deleção em Massa** - Deletar múltiplos usuários
- **Relatórios** - Geração de relatórios de usuários
- **Auditoria** - Log de todas as ações administrativas

### 🔄 **Sistema de Usuários (MongoDB Real)**
- **Modelo completo** com validações
- **Tipos**: Cliente e Piscineiro
- **Status**: Ativo, Pendente, Inativo, Suspenso
- **Verificação**: Email e telefone
- **Endereços** e perfis completos
- **Localização** (latitude/longitude para piscineiros)

## 🏗️ Arquitetura

### **Frontend (React + Vite)**
```
src/
├── components/          # Componentes reutilizáveis
├── contexts/           # Contextos React (Auth)
├── pages/              # Páginas da aplicação
├── services/           # Serviços híbridos
└── config/             # Configurações (admins.json)
```

### **Backend (Node.js + Express + MongoDB)**
```
backend/
├── src/
│   ├── models/         # Modelos MongoDB (User, Admin)
│   ├── controllers/    # Controladores da API
│   ├── routes/         # Rotas da API
│   └── config/         # Configuração do banco
├── scripts/            # Scripts de seed e admin
└── server.js           # Servidor principal
```

## 🔐 **Sistema de Autenticação Híbrido**

### **Administradores (Local - JSON)**
- **Autenticação via JSON** - Sem dependência do MongoDB
- **Credenciais armazenadas** em `src/config/admins.json`
- **Tokens locais** com expiração de 24 horas
- **Permissões granulares** por tipo de admin
- **✅ Funciona offline** para desenvolvimento

### **Usuários (MongoDB Real)**
- **Modelo completo** com validações
- **Tipos**: Cliente e Piscineiro
- **Status**: Ativo, Pendente, Inativo, Suspenso
- **Verificação**: Email e telefone
- **🔄 Dados persistentes** no MongoDB

## 🚀 **APIs de Gerenciamento de Usuários**

### **Endpoint Base**: `/api/user-management`

#### **📋 Listar Usuários**
```http
GET /api/user-management/users?page=1&limit=50&search=joao&status=ativo&userType=cliente&sortBy=createdAt&sortOrder=desc
```

#### **📊 Estatísticas**
```http
GET /api/user-management/stats
```

#### **🗑️ Deletar Usuário**
```http
DELETE /api/user-management/users/:userId
```

#### **🔢 Deletar Múltiplos**
```http
DELETE /api/user-management/users
Body: { "userIds": ["id1", "id2", "id3"] }
```

#### **🔄 Atualizar Status**
```http
PATCH /api/user-management/users/:userId/status
Body: { "status": "ativo" }
```

#### **👤 Buscar Usuário**
```http
GET /api/user-management/users/:userId
```

### **🔒 Segurança**
- **Autenticação obrigatória** via JWT
- **Verificação de permissões** (manageUsers)
- **Logs de auditoria** para todas as ações
- **Validação de dados** em todas as operações
- **Rate limiting** e proteção contra ataques

## 🚀 **Como Executar**

### **1. Configurar Variáveis de Ambiente (Opcional)**
Se quiser usar MongoDB para usuários, crie um arquivo `.env`:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://marcos:o2aBIkBf1H6toRQ4@amongus.udrc6wp.mongodb.net/
DB_NAME=piscinou_db
JWT_SECRET=piscinou_super_secret_key_2024
CORS_ORIGINS=http://localhost:3000,http://localhost:3002
CORS_CREDENTIALS=true
```

### **2. Instalar Dependências**
```bash
npm install
```

### **3. Executar Frontend (Funciona imediatamente)**
```bash
npm run dev
```
- ✅ **Admin funciona 100% offline**
- 🔐 **Login**: admin/raposofoda ou gerente/gerente123
- 📊 **Dashboard básico** com dados mockados

### **4. Executar Backend (Opcional - Para MongoDB)**
```bash
# Criar admin no MongoDB (se quiser)
npm run create-admin

# Popular com usuários de exemplo
npm run seed-users

# Executar backend
npm run backend
```

## 🌐 **URLs de Acesso**

- **Frontend:** http://localhost:3002
- **Backend:** http://localhost:3001 (opcional)
- **Login Admin:** http://localhost:3002/admin/login
- **Dashboard:** http://localhost:3002/admin/dashboard

## 🔑 **Credenciais de Teste**

### **Administrador (Local - JSON)**
- **Usuário**: `admin`
- **Senha**: `raposofoda`
- **Permissões**: Total acesso

### **Gerente (Local - JSON)**
- **Usuário**: `gerente`
- **Senha**: `gerente123`
- **Permissões**: Gerenciar usuários e relatórios

### **Usuários (MongoDB - Se configurado)**
- **João Silva** - Cliente Ativo
- **Maria Santos** - Piscineiro Ativo
- **Pedro Costa** - Cliente Pendente
- **Ana Oliveira** - Piscineiro Inativo

## 📊 **Modo de Funcionamento**

### **Modo Offline (Padrão)**
- ✅ **Admin login** funciona imediatamente
- ✅ **Dashboard básico** com estatísticas zeradas
- ✅ **Interface responsiva** completa
- ❌ **Lista de usuários vazia** (sem dados fake)

### **Modo Online (Com MongoDB)**
- ✅ **Admin login** continua local
- ✅ **Dashboard completo** com dados reais
- ✅ **CRUD funcional** de usuários
- ✅ **Dados persistentes** no MongoDB

## 🚨 **Importante: Sem Usuários Fake**

O sistema **NÃO mostra usuários de exemplo** quando offline:
- **Lista vazia** com mensagem explicativa
- **Estatísticas zeradas** (0 usuários)
- **Mensagem clara** sobre conectar ao MongoDB
- **Sem dados mockados** enganosos

## 🛠️ **Tecnologias**

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB (opcional)
- **Autenticação**: JWT (local para admin), JSON (config)
- **Banco de Dados**: MongoDB Atlas (apenas para usuários)
- **Estado**: React Context, LocalStorage
- **UI**: Componentes responsivos, Gradientes, Backdrop blur

## 🔮 **Próximos Passos**

1. **Implementar telas de usuário**
2. **Sistema de registro público**
3. **Dashboard de usuários**
4. **Sistema de notificações**
5. **Relatórios avançados**

## 📝 **Notas Importantes**

- **Admin funciona 100% offline** (JSON local)
- **MongoDB é opcional** para desenvolvimento
- **Sistema híbrido** - melhor dos dois mundos
- **Fallback automático** para dados mockados
- **Interface responsiva** e moderna

## 🚨 **Troubleshooting**

### **Se o admin não conseguir fazer login:**
1. Verifique o arquivo `src/config/admins.json`
2. Confirme as credenciais: admin/raposofoda
3. Sistema funciona offline

### **Se quiser conectar ao MongoDB:**
1. Configure o arquivo `.env`
2. Execute `npm run seed-users`
3. Execute `npm run backend`

---

**Desenvolvido com ❤️ para o Piscinou**
