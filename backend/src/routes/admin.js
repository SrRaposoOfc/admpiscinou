const express = require('express');
const path = require('path');
const router = express.Router();
const adminConfig = require(path.join(__dirname, '../../config/admins.json'));

// Sistema de bloqueio por IP e dispositivo
const loginAttempts = new Map(); // IP -> { attempts: number, blockedUntil: timestamp, deviceId: string }
const BLOCK_DURATION = 60 * 60 * 1000; // 1 hora em millisegundos
const MAX_ATTEMPTS = 3;

// Função para verificar se IP está bloqueado
const isIPBlocked = (ip) => {
  const attempt = loginAttempts.get(ip);
  if (!attempt) return false;
  
  if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
    return true;
  }
  
  // Se já passou do tempo de bloqueio, resetar
  if (attempt.blockedUntil && Date.now() >= attempt.blockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return false;
};

// Função para registrar tentativa falhada
const recordFailedAttempt = (ip, deviceId) => {
  const attempt = loginAttempts.get(ip) || { attempts: 0, blockedUntil: null, deviceId: null };
  
  attempt.attempts += 1;
  attempt.deviceId = deviceId;
  
  if (attempt.attempts >= MAX_ATTEMPTS) {
    attempt.blockedUntil = Date.now() + BLOCK_DURATION;
    console.log(`🚫 IP ${ip} bloqueado por 1 hora após ${MAX_ATTEMPTS} tentativas falhadas`);
  }
  
  loginAttempts.set(ip, attempt);
};

// Função para registrar tentativa bem-sucedida
const recordSuccessfulAttempt = (ip) => {
  loginAttempts.delete(ip);
  console.log(`✅ Login bem-sucedido para IP ${ip}, tentativas resetadas`);
};

// Função para obter IP real (considerando proxy)
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip ||
         'unknown';
};

// Função para gerar ID único do dispositivo
const getDeviceId = (req) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const acceptLanguage = req.headers['accept-language'] || 'unknown';
  const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
  
  // Hash simples baseado em headers do dispositivo
  return Buffer.from(`${userAgent}-${acceptLanguage}-${acceptEncoding}`).toString('base64').substring(0, 16);
};

// Log para debug
console.log('📁 ADMIN ROUTE LOADED:');
console.log('📂 Path do arquivo:', path.join(__dirname, '../../config/admins.json'));
console.log('👥 Admins carregados:', adminConfig);
console.log('🔢 Total de admins:', adminConfig.length);
console.log('🚫 Sistema de bloqueio ativado: 3 tentativas = 1 hora de bloqueio');

// Login de admin
router.post('/login', async (req, res) => {
  const clientIP = getClientIP(req);
  const deviceId = getDeviceId(req);
  
  console.log('🚀 ROTA /login CHAMADA!');
  console.log('📨 Body recebido:', req.body);
  console.log('🌐 IP do cliente:', clientIP);
  console.log('📱 ID do dispositivo:', deviceId);
  
  // Verificar se IP está bloqueado
  if (isIPBlocked(clientIP)) {
    const attempt = loginAttempts.get(clientIP);
    const remainingTime = Math.ceil((attempt.blockedUntil - Date.now()) / 1000 / 60);
    
    console.log(`🚫 IP ${clientIP} está bloqueado. Tempo restante: ${remainingTime} minutos`);
    
    return res.status(429).json({
      success: false,
      message: `Muitas tentativas falhadas. Tente novamente em ${remainingTime} minutos.`,
      blocked: true,
      remainingTime: remainingTime
    });
  }
  
  try {
    const { username, password } = req.body;
    
    console.log('🔍 LOGIN ATTEMPT:');
    console.log('📧 Username recebido:', username);
    console.log('🔑 Password recebido:', password);
    
    if (!username || !password) {
      console.log('❌ Campos vazios');
      return res.status(400).json({
        success: false,
        message: 'Usuário e senha são obrigatórios'
      });
    }

    // Buscar admin no arquivo de configuração
    const admin = adminConfig.find(admin => admin.username === username);
    
    console.log('🔍 Admin encontrado:', admin);
    
    if (!admin) {
      console.log('❌ Admin não encontrado');
      recordFailedAttempt(clientIP, deviceId);
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    console.log('🔐 Senha armazenada:', admin.password);
    console.log('🔍 Comparando senhas...');
    
    // Verificar senha
    if (password !== admin.password) {
      console.log('❌ Senha incorreta');
      recordFailedAttempt(clientIP, deviceId);
      
      const attempt = loginAttempts.get(clientIP);
      const remainingAttempts = MAX_ATTEMPTS - attempt.attempts;
      
      return res.status(401).json({
        success: false,
        message: `Senha incorreta. Tentativas restantes: ${remainingAttempts}`,
        remainingAttempts: remainingAttempts
      });
    }

    console.log('✅ Senha correta! Gerando token...');
    
    // Registrar login bem-sucedido
    recordSuccessfulAttempt(clientIP);

    // Gerar token simples (em produção usar JWT)
    const token = Buffer.from(JSON.stringify({
      username: admin.username,
      role: admin.role,
      timestamp: Date.now()
    })).toString('base64');

    // Retornar dados do admin (sem senha)
    const adminData = {
      username: admin.username,
      name: admin.profile?.fullName || admin.username,
      email: admin.profile?.email || '',
      role: admin.role,
      permissions: admin.permissions
    };

    console.log('✅ Login realizado com sucesso para:', admin.username);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        admin: adminData,
        token
      }
    });

  } catch (error) {
    console.error('❌ Erro no login de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota para verificar status do bloqueio
router.get('/login-status/:ip', (req, res) => {
  const clientIP = req.params.ip;
  const attempt = loginAttempts.get(clientIP);
  
  if (!attempt) {
    return res.json({
      blocked: false,
      attempts: 0,
      remainingAttempts: MAX_ATTEMPTS
    });
  }
  
  if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
    const remainingTime = Math.ceil((attempt.blockedUntil - Date.now()) / 1000 / 60);
    return res.json({
      blocked: true,
      attempts: attempt.attempts,
      remainingTime: remainingTime,
      blockedUntil: attempt.blockedUntil
    });
  }
  
  return res.json({
    blocked: false,
    attempts: attempt.attempts,
    remainingAttempts: MAX_ATTEMPTS - attempt.attempts
  });
});

// Rota para desbloquear IP (apenas para admins)
router.post('/unblock/:ip', (req, res) => {
  const clientIP = req.params.ip;
  
  if (loginAttempts.has(clientIP)) {
    loginAttempts.delete(clientIP);
    console.log(`🔓 IP ${clientIP} desbloqueado manualmente`);
    
    res.json({
      success: true,
      message: `IP ${clientIP} desbloqueado com sucesso`
    });
  } else {
    res.json({
      success: false,
      message: `IP ${clientIP} não estava bloqueado`
    });
  }
});

// Rota para listar IPs bloqueados (apenas para admins)
router.get('/blocked-ips', (req, res) => {
  const blockedIPs = [];
  
  for (const [ip, attempt] of loginAttempts.entries()) {
    if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
      const remainingTime = Math.ceil((attempt.blockedUntil - Date.now()) / 1000 / 60);
      blockedIPs.push({
        ip,
        attempts: attempt.attempts,
        blockedUntil: attempt.blockedUntil,
        remainingTime,
        deviceId: attempt.deviceId
      });
    }
  }
  
  res.json({
    success: true,
    data: {
      blockedIPs,
      totalBlocked: blockedIPs.length
    }
  });
});

// Verificar token de admin
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    // Decodificar token
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Verificar se o admin ainda existe
    const admin = adminConfig.find(a => a.username === payload.username);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin não encontrado'
      });
    }

    // Verificar se o token não expirou (24 horas)
    const tokenAge = Date.now() - payload.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    if (tokenAge > maxAge) {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    const adminData = {
      username: admin.username,
      name: admin.profile?.fullName || admin.username,
      email: admin.profile?.email || '',
      role: admin.role,
      permissions: admin.permissions
    };

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        admin: adminData
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

module.exports = router;
