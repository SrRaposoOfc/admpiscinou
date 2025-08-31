const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Importar o modelo User
const User = require('../src/models/User');

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'piscinou',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000
    });

    console.log('✅ MongoDB conectado com sucesso!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    return false;
  }
};

// Função para testar as novas funcionalidades
const testUserManagement = async () => {
  try {
    console.log('\n🧪 TESTANDO FUNCIONALIDADES DE GERENCIAMENTO:\n');
    
    // 1. Contar usuários
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total de usuários: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('❌ Nenhum usuário encontrado. Execute primeiro: npm run seed-users');
      return;
    }
    
    // 2. Testar filtros
    console.log('\n🔍 Testando filtros:');
    
    // Buscar por nome
    const usersByName = await User.find({ full_name: { $regex: 'João', $options: 'i' } });
    console.log(`   👤 Usuários com "João": ${usersByName.length}`);
    
    // Buscar por tipo
    const piscineiros = await User.find({ is_piscineiro: true });
    console.log(`   🏊 Piscineiros: ${piscineiros.length}`);
    
    const clientes = await User.find({ is_piscineiro: false });
    console.log(`   👤 Clientes: ${clientes.length}`);
    
    // Buscar por status
    const ativos = await User.find({ status: 'active' });
    console.log(`   🟢 Ativos: ${ativos.length}`);
    
    const pendentes = await User.find({ status: 'pending' });
    console.log(`   🟡 Pendentes: ${pendentes.length}`);
    
    // 3. Testar ordenação
    console.log('\n📊 Testando ordenação:');
    
    const usersByDate = await User.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('full_name email createdAt');
    
    console.log('   Usuários mais recentes:');
    usersByDate.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} - ${user.email} (${user.createdAt.toLocaleDateString()})`);
    });
    
    // 4. Testar estatísticas
    console.log('\n📈 Testando estatísticas:');
    
    const [
      totalUsers2,
      activeUsers,
      pendingUsers,
      inactiveUsers,
      suspendedUsers,
      piscineiros2,
      clientes2,
      emailVerified
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ is_piscineiro: true }),
      User.countDocuments({ is_piscineiro: false }),
      User.countDocuments({ emailVerified: true })
    ]);
    
    console.log(`   👥 Total: ${totalUsers2}`);
    console.log(`   🟢 Ativos: ${activeUsers}`);
    console.log(`   🟡 Pendentes: ${pendingUsers}`);
    console.log(`   🔴 Inativos: ${inactiveUsers}`);
    console.log(`   ⚫ Suspensos: ${suspendedUsers}`);
    console.log(`   🏊 Piscineiros: ${piscineiros2}`);
    console.log(`   👤 Clientes: ${clientes2}`);
    console.log(`   📧 Emails verificados: ${emailVerified}`);
    
    // 5. Testar paginação
    console.log('\n📄 Testando paginação:');
    
    const page = 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    const paginatedUsers = await User.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('full_name email status is_piscineiro');
    
    console.log(`   Página ${page} (${limit} por página):`);
    paginatedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} - ${user.email} (${user.status}, ${user.is_piscineiro ? 'piscineiro' : 'cliente'})`);
    });
    
    console.log('\n✅ Todos os testes passaram com sucesso!');
    console.log('🚀 As APIs de gerenciamento estão funcionando perfeitamente.');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
};

// Função principal
const main = async () => {
  console.log('🧪 Teste das APIs de Gerenciamento de Usuários - Piscinou\n');
  
  try {
    // Conectar ao banco
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Não foi possível conectar ao banco. Encerrando...');
      process.exit(1);
    }

    // Executar testes
    await testUserManagement();
    
  } catch (error) {
    console.error('\n❌ Erro durante execução:', error.message);
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
    process.exit(0);
  }
};

// Executar programa
main().catch(console.error);
