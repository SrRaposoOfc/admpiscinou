const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
require('dotenv').config();

const createInitialAdmin = async () => {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: String(process.env.DB_NAME)
    });

    console.log('🔗 Conectado ao MongoDB');

    // Verificar se já existe um admin
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️ Admin já existe no sistema');
      process.exit(0);
    }

    // Criar admin padrão
    const adminData = {
      username: 'admin',
      password: 'raposofoda', // Será hasheada automaticamente
      email: 'admin@piscinou.com',
      role: 'super_admin',
      permissions: {
        users: true,
        reports: true,
        settings: true,
        analytics: true
      }
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ Admin criado com sucesso!');
    console.log('👤 Username: admin');
    console.log('🔑 Password: raposofoda');
    console.log('📧 Email: admin@piscinou.com');
    console.log('👑 Role: super_admin');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  }
};

// Executar script
createInitialAdmin();
