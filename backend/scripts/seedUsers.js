const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

// Dados dos usuários de exemplo
const sampleUsers = [
  {
    full_name: 'João Silva',
    email: 'joao@email.com',
    phone: '11999999999',
    cpf: '12345678901',
    rg: '123456789',
    password: '$2b$10$dummyhash123456789012345678901234567890123456789012345678901234567890',
    is_piscineiro: false,
    status: 'active',
    emailVerified: true,
    phoneVerified: true,
    isAvailable: null,
    addresses: [
      {
        street: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      }
    ],
    kyc_status: 'approved',
    loginAttempts: 0
  },
  {
    full_name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '11888888888',
    cpf: '98765432100',
    rg: '987654321',
    password: '$2b$10$dummyhash123456789012345678901234567890123456789012345678901234567890',
    is_piscineiro: true,
    status: 'active',
    emailVerified: true,
    phoneVerified: true,
    isAvailable: true,
    addresses: [
      {
        street: 'Av. Principal, 456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04567-890'
      }
    ],
    kyc_status: 'approved',
    loginAttempts: 0
  },
  {
    full_name: 'Pedro Costa',
    email: 'pedro@email.com',
    phone: '11777777777',
    cpf: '11122233344',
    rg: '111222333',
    password: '$2b$10$dummyhash123456789012345678901234567890123456789012345678901234567890',
    is_piscineiro: false,
    status: 'pending',
    emailVerified: false,
    phoneVerified: false,
    isAvailable: null,
    addresses: [
      {
        street: 'Rua Nova, 789',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '07890-123'
      }
    ],
    kyc_status: 'pending',
    loginAttempts: 2
  },
  {
    full_name: 'Ana Oliveira',
    email: 'ana@email.com',
    phone: '11666666666',
    cpf: '55566677788',
    rg: '555666777',
    password: '$2b$10$dummyhash123456789012345678901234567890123456789012345678901234567890',
    is_piscineiro: true,
    status: 'inactive',
    emailVerified: true,
    phoneVerified: true,
    isAvailable: false,
    addresses: [
      {
        street: 'Rua Antiga, 321',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '03210-987'
      }
    ],
    kyc_status: 'approved',
    loginAttempts: 0
  }
];

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'piscinou_db'
    });
    console.log('✅ MongoDB conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Função para popular o banco
const seedUsers = async () => {
  try {
    console.log('🌱 Iniciando seed dos usuários...');
    
    // Limpar usuários existentes
    await User.deleteMany({});
    console.log('🧹 Usuários existentes removidos');
    
    // Inserir novos usuários
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`✅ ${createdUsers.length} usuários criados com sucesso!`);
    
    // Mostrar usuários criados
    createdUsers.forEach(user => {
      console.log(`👤 ${user.full_name} (${user.email}) - ${user.is_piscineiro ? 'piscineiro' : 'cliente'} - ${user.status}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  }
};

// Função principal
const main = async () => {
  try {
    await connectDB();
    await seedUsers();
    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
    process.exit(0);
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { seedUsers };
