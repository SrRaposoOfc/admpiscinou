const mongoose = require('mongoose');

// MongoDB connection configuration
const connectDB = async () => {
  try {
    console.log('🔗 Conectando ao MongoDB ...');
    console.log(process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: String(process.env.DB_NAME),
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB conexão fechada devido ao encerramento da aplicação');
      process.exit(0);
    });

    return true;

  } catch (error) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message + ' ' + error.stack);
    return false;
  }
};

const checkDBHealth = async () => {
  try {
    const state = mongoose.connection?.readyState || 0;
    return {
      status: state === 1 ? 'healthy' : 'unhealthy',
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      message: 'Erro ao verificar status do MongoDB'
    };
  }
};

module.exports = {
  connectDB,
  checkDBHealth
};
