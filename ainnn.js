const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Importar o modelo User
const User = require('./backend/src/models/User');

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

// Função para listar todos os usuários
const listUsers = async () => {
  try {
    console.log('\n📋 LISTANDO TODOS OS USUÁRIOS:\n');
    
    // Buscar todos os usuários
    const users = await User.find({}).sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados.');
      return [];
    }

    console.log(`📊 Total de usuários: ${users.length}\n`);
    
    // Listar usuários numerados
    users.forEach((user, index) => {
      const status = user.status === 'active' ? '🟢' : 
                    user.status === 'pending' ? '🟡' : 
                    user.status === 'inactive' ? '🔴' : '⚫';
      
      const emailStatus = user.emailVerified ? '✅' : '❌';
      
      console.log(`${index + 1}. ${status} ${user.full_name || user.name || 'Nome não informado'}`);
      console.log(`   📧 Email: ${user.email} ${emailStatus}`);
      console.log(`   📱 Telefone: ${user.phone || 'Não informado'}`);
      console.log(`   🆔 CPF: ${user.cpf || 'Não informado'}`);
      console.log(`   🆔 RG: ${user.rg || 'Não informado'}`);
      console.log(`   📍 Status: ${user.status}`);
      console.log(`   🏷️ Tipo: ${user.is_piscineiro ? 'Piscineiro' : 'Cliente'}`);
      
      if (user.location?.latitude && user.location?.longitude) {
        console.log(`   📍 Localização: ${user.location.latitude.toFixed(6)}, ${user.location.longitude.toFixed(6)}`);
      }
      
      if (user.is_piscineiro) {
        console.log(`   🚦 Disponibilidade: ${user.isAvailable === true ? 'Disponível' : user.isAvailable === false ? 'Indisponível' : 'Não definido'}`);
      }
      
      if (user.addresses && user.addresses.length > 0) {
        console.log(`   🏠 Endereço: ${user.addresses[0]}`);
      }
      
      if (user.kyc_status) {
        console.log(`   🔐 KYC: ${user.kyc_status === 'approved' ? '✅ Aprovado' : '⏳ Pendente'}`);
      }
      
      if (user.loginAttempts > 0) {
        console.log(`   🚨 Tentativas de login: ${user.loginAttempts}`);
      }
      
      console.log(`   📅 Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
      console.log(`   🔑 ID: ${user._id}`);
      console.log('');
    });

    // Mostrar resposta bruta do MongoDB
    console.log('\n🔍 RESPOSTA BRUTA DO MONGODB:');
    console.log('='.repeat(80));
    users.forEach((user, index) => {
      console.log(`\n👤 USUÁRIO ${index + 1} - RESPOSTA BRUTA:`);
      console.log(JSON.stringify(user, null, 2));
      console.log('-'.repeat(80));
    });

    return users;
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
    return [];
  }
};

// Função para deletar usuário por índice
const deleteUserByIndex = async (users, index) => {
  try {
    if (index < 1 || index > users.length) {
      console.log('❌ Número inválido!');
      return false;
    }

    const userToDelete = users[index - 1];
    
    console.log(`\n⚠️  ATENÇÃO: Você está prestes a deletar o usuário:`);
    console.log(`   Nome: ${userToDelete.full_name || userToDelete.name || 'Nome não informado'}`);
    console.log(`   Email: ${userToDelete.email}`);
    console.log(`   Telefone: ${userToDelete.phone || 'Não informado'}`);
    console.log(`   CPF: ${userToDelete.cpf || 'Não informado'}`);
    console.log(`   RG: ${userToDelete.rg || 'Não informado'}`);
    console.log(`   Status: ${userToDelete.status}`);
    console.log(`   ID: ${userToDelete._id}`);
    
    console.log('\n❓ Tem certeza que deseja deletar este usuário? (s/N)');
    
    return new Promise((resolve) => {
      process.stdin.once('data', async (data) => {
        const input = data.toString().trim().toLowerCase();
        
        if (input === 's' || input === 'sim' || input === 'y' || input === 'yes') {
          try {
            await User.findByIdAndDelete(userToDelete._id);
            console.log('✅ Usuário deletado com sucesso!');
            resolve(true);
          } catch (error) {
            console.error('❌ Erro ao deletar usuário:', error.message);
            resolve(false);
          }
        } else {
          console.log('❌ Operação cancelada pelo usuário.');
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error.message);
    return false;
  }
};

// Função para deletar múltiplos usuários
const deleteMultipleUsers = async (users) => {
  try {
    console.log('\n🔢 DELETAR MÚLTIPLOS USUÁRIOS:');
    console.log('Digite os números dos usuários que deseja deletar (separados por vírgula)');
    console.log('Exemplo: 1,3,5 ou "todos" para deletar todos');
    console.log('Digite "sair" para cancelar');
    
    return new Promise((resolve) => {
      process.stdin.once('data', async (data) => {
        const input = data.toString().trim();
        
        if (input.toLowerCase() === 'sair') {
          console.log('❌ Operação cancelada pelo usuário.');
          resolve(false);
          return;
        }
        
        if (input.toLowerCase() === 'todos') {
          console.log('\n⚠️  ATENÇÃO: Você está prestes a deletar TODOS os usuários!');
          console.log('❓ Tem certeza absoluta? Digite "CONFIRMO" para continuar:');
          
          process.stdin.once('data', async (confirmData) => {
            const confirm = confirmData.toString().trim();
            
            if (confirm === 'CONFIRMO') {
              try {
                const result = await User.deleteMany({});
                console.log(`✅ ${result.deletedCount} usuários deletados com sucesso!`);
                resolve(true);
              } catch (error) {
                console.error('❌ Erro ao deletar usuários:', error.message);
                resolve(false);
              }
            } else {
              console.log('❌ Operação cancelada pelo usuário.');
              resolve(false);
            }
          });
          return;
        }
        
        // Deletar usuários específicos
        const indices = input.split(',').map(i => parseInt(i.trim())).filter(i => !isNaN(i));
        
        if (indices.length === 0) {
          console.log('❌ Nenhum número válido fornecido.');
          resolve(false);
          return;
        }
        
        console.log(`\n⚠️  Você está prestes a deletar ${indices.length} usuário(s):`);
        
        for (const index of indices) {
          if (index >= 1 && index <= users.length) {
            const user = users[index - 1];
            console.log(`   ${index}. ${user.full_name || user.name || 'Nome não informado'} (${user.email})`);
          }
        }
        
        console.log('\n❓ Confirma a exclusão? (s/N)');
        
        process.stdin.once('data', async (confirmData) => {
          const confirm = confirmData.toString().trim().toLowerCase();
          
          if (confirm === 's' || confirm === 'sim' || confirm === 'y' || confirm === 'yes') {
            try {
              let deletedCount = 0;
              
              for (const index of indices) {
                if (index >= 1 && index <= users.length) {
                  const user = users[index - 1];
                  await User.findByIdAndDelete(user._id);
                  deletedCount++;
                  console.log(`✅ Usuário ${index} deletado: ${user.full_name || user.name || 'Nome não informado'}`);
                }
              }
              
              console.log(`\n✅ ${deletedCount} usuário(s) deletado(s) com sucesso!`);
              resolve(true);
            } catch (error) {
              console.error('❌ Erro ao deletar usuários:', error.message);
              resolve(false);
            }
          } else {
            console.log('❌ Operação cancelada pelo usuário.');
            resolve(false);
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao deletar múltiplos usuários:', error.message);
    return false;
  }
};

// Função para mostrar estatísticas
const showStats = async () => {
  try {
    console.log('\n📊 ESTATÍSTICAS DO BANCO:');
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const piscineiros = await User.countDocuments({ is_piscineiro: true });
    const clientes = await User.countDocuments({ is_piscineiro: false });
    const emailVerified = await User.countDocuments({ emailVerified: true });
    const phoneVerified = await User.countDocuments({ phoneVerified: true });
    
    console.log(`👥 Total de usuários: ${totalUsers}`);
    console.log(`🟢 Usuários ativos: ${activeUsers}`);
    console.log(`🟡 Usuários pendentes: ${pendingUsers}`);
    console.log(`🔴 Usuários inativos: ${inactiveUsers}`);
    console.log(`⚫ Usuários suspensos: ${suspendedUsers}`);
    console.log(`🏊 Piscineiros: ${piscineiros}`);
    console.log(`👤 Clientes: ${clientes}`);
    console.log(`📧 Emails verificados: ${emailVerified}`);
    console.log(`📱 Telefones verificados: ${phoneVerified}`);
    
  } catch (error) {
    console.error('❌ Erro ao mostrar estatísticas:', error.message);
  }
};

// Função principal
const main = async () => {
  console.log('🗑️  Gerenciador de Usuários - Piscinou\n');
  
  try {
    // Conectar ao banco
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Não foi possível conectar ao banco. Encerrando...');
      process.exit(1);
    }

    let users = [];
    let running = true;

    while (running) {
      console.log('\n' + '='.repeat(60));
      console.log('🎯 OPÇÕES DISPONÍVEIS:');
      console.log('1. 📋 Listar todos os usuários');
      console.log('2. 🗑️  Deletar usuário específico');
      console.log('3. 🔢 Deletar múltiplos usuários');
      console.log('4. 📊 Mostrar estatísticas');
      console.log('5. ❌ Sair');
      console.log('='.repeat(60));
      console.log('\nEscolha uma opção (1-5):');

      const choice = await new Promise((resolve) => {
        process.stdin.once('data', (data) => {
          resolve(data.toString().trim());
        });
      });

      switch (choice) {
        case '1':
          users = await listUsers();
          break;
          
        case '2':
          if (users.length === 0) {
            console.log('❌ Primeiro liste os usuários (opção 1)');
          } else {
            console.log('\n🔢 Digite o número do usuário que deseja deletar:');
            const userIndex = await new Promise((resolve) => {
              process.stdin.once('data', (data) => {
                resolve(parseInt(data.toString().trim()));
              });
            });
            await deleteUserByIndex(users, userIndex);
          }
          break;
          
        case '3':
          if (users.length === 0) {
            console.log('❌ Primeiro liste os usuários (opção 1)');
          } else {
            await deleteMultipleUsers(users);
          }
          break;
          
        case '4':
          await showStats();
          break;
          
        case '5':
          console.log('👋 Encerrando...');
          running = false;
          break;
          
        default:
          console.log('❌ Opção inválida! Escolha de 1 a 5.');
      }
    }
    
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