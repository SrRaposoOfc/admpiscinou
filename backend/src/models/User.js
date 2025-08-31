const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Campos principais
  full_name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  passwordChangedAt: Date,
  
  // Campos de identificação
  is_piscineiro: {
    type: Boolean,
    required: true
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 11,
    maxlength: 14
  },
  rg: {
    type: String,
    trim: true
  },
  
  // Status e verificação
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive', 'suspended'],
    default: 'pending'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Verificação de email
  email_code_verification: String,
  email_verification_attempts: {
    type: Number,
    default: 0
  },
  email_verification_locked_until: Date,
  last_email_code_sent: Date,
  
  // Segurança
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  // KYC
  kyc_session_id: String,
  kyc_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Endereços
  addresses: [{
    street: String,
    city: String,
    state: String,
    zipCode: String
  }],
  
  // Disponibilidade (para piscineiros)
  isAvailable: {
    type: Boolean,
    default: null
  },
  
  // Atividade
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para melhorar performance das consultas
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ cpf: 1 });
userSchema.index({ is_piscineiro: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Método para obter dados públicos do usuário
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  // Remove campos sensíveis se necessário
  return user;
};

// Método para verificar se o usuário está ativo
userSchema.methods.isActive = function() {
  return this.status === 'active';
};

module.exports = mongoose.model('User', userSchema);
