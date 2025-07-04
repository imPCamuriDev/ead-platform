import { User, Notification } from '../types';

// Simula hash de senha (em produção, usar bcrypt)
export const hashPassword = (password: string): string => {
  return btoa(password + 'salt_secret_key').slice(0, 32);
};

export const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex !== -1) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem('ead_users', JSON.stringify(users));
};

export const getUsers = (): User[] => {
  const users = localStorage.getItem('ead_users');
  const parsedUsers = users ? JSON.parse(users) : [];
  
  // Normalize user data to ensure required properties exist
  return parsedUsers.map((user: any) => ({
    ...user,
    cursosCompletos: Array.isArray(user.cursosCompletos) ? user.cursosCompletos : [],
    cursosEmAndamento: Array.isArray(user.cursosEmAndamento) ? user.cursosEmAndamento : [],
    totalHorasEstudo: typeof user.totalHorasEstudo === 'number' ? user.totalHorasEstudo : 0,
    pontuacao: typeof user.pontuacao === 'number' ? user.pontuacao : 0,
    nickname: user.nickname || user.nome || '',
    descricao: user.descricao || '',
    ativo: typeof user.ativo === 'boolean' ? user.ativo : true
  }));
};

export const findUserByEmail = (email: string): User | null => {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase() && user.ativo) || null;
};

export const findUserById = (id: string): User | null => {
  const users = getUsers();
  return users.find(user => user.id === id) || null;
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('ead_current_user');
  if (!userStr) return null;
  
  const user = JSON.parse(userStr);
  
  // Normalize current user data to ensure required properties exist
  return {
    ...user,
    cursosCompletos: Array.isArray(user.cursosCompletos) ? user.cursosCompletos : [],
    cursosEmAndamento: Array.isArray(user.cursosEmAndamento) ? user.cursosEmAndamento : [],
    totalHorasEstudo: typeof user.totalHorasEstudo === 'number' ? user.totalHorasEstudo : 0,
    pontuacao: typeof user.pontuacao === 'number' ? user.pontuacao : 0,
    nickname: user.nickname || user.nome || '',
    descricao: user.descricao || '',
    ativo: typeof user.ativo === 'boolean' ? user.ativo : true
  };
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    // Atualiza último login
    user.ultimoLogin = new Date().toISOString();
    saveUser(user);
    localStorage.setItem('ead_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ead_current_user');
  }
};

export const createUser = (userData: Partial<User>): User => {
  // Verificar se email já existe
  const existingUser = findUserByEmail(userData.email || '');
  if (existingUser) {
    throw new Error('Este email já está cadastrado');
  }

  const newUser: User = {
    id: generateId(),
    nome: userData.nome || '',
    email: (userData.email || '').toLowerCase().trim(),
    senha: hashPassword(userData.senha || ''),
    tipo: userData.tipo || 'aluno',
    dataCriacao: new Date().toISOString(),
    ativo: true,
    cursosCompletos: [],
    cursosEmAndamento: [],
    totalHorasEstudo: 0,
    pontuacao: 0,
    nickname: userData.nickname || userData.nome || '',
    descricao: userData.descricao || `${userData.tipo || 'aluno'} no EAD System`,
    telefone: userData.telefone || '',
    endereco: userData.endereco || '',
    dataNascimento: userData.dataNascimento || undefined
  };
  
  saveUser(newUser);
  
  // Cria notificação de boas-vindas
  createNotification(newUser.id, {
    titulo: 'Bem-vindo ao EAD System!',
    mensagem: 'Sua conta foi criada com sucesso. Explore nossos cursos e comece a aprender!',
    tipo: 'success'
  });
  
  return newUser;
};

export const updateUserProfile = (userId: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) return null;
  
  const updatedUser = { ...users[userIndex], ...updates };
  users[userIndex] = updatedUser;
  
  localStorage.setItem('ead_users', JSON.stringify(users));
  
  // Atualiza usuário atual se for o mesmo
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(updatedUser);
  }
  
  return updatedUser;
};

export const deleteUser = (userId: string): boolean => {
  const users = getUsers();
  const filteredUsers = users.filter(user => user.id !== userId);
  
  if (filteredUsers.length === users.length) return false;
  
  localStorage.setItem('ead_users', JSON.stringify(filteredUsers));
  return true;
};

// Gestão de Notificações
export const createNotification = (userId: string, notificationData: Partial<Notification>): void => {
  const notifications = getNotifications();
  const newNotification: Notification = {
    id: generateId(),
    userId,
    titulo: notificationData.titulo || '',
    mensagem: notificationData.mensagem || '',
    tipo: notificationData.tipo || 'info',
    lida: false,
    dataCriacao: new Date().toISOString(),
    link: notificationData.link,
    ...notificationData
  };
  
  notifications.push(newNotification);
  localStorage.setItem('ead_notifications', JSON.stringify(notifications));
};

export const getNotifications = (): Notification[] => {
  const notifications = localStorage.getItem('ead_notifications');
  return notifications ? JSON.parse(notifications) : [];
};

export const getUserNotifications = (userId: string): Notification[] => {
  const notifications = getNotifications();
  return notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
};

export const markNotificationAsRead = (notificationId: string): void => {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.lida = true;
    localStorage.setItem('ead_notifications', JSON.stringify(notifications));
  }
};

export const getUnreadNotificationsCount = (userId: string): number => {
  const notifications = getUserNotifications(userId);
  return notifications.filter(n => !n.lida).length;
};

// Inicializa dados de exemplo
export const initializeDefaultData = (): void => {
  const users = getUsers();
  
  if (users.length === 0) {
    // Cria usuário administrador padrão
    const adminUser: User = {
      id: generateId(),
      nome: 'Administrador',
      email: 'admin@ead.com',
      senha: hashPassword('admin123'),
      tipo: 'administrador',
      dataCriacao: new Date().toISOString(),
      ativo: true,
      cursosCompletos: [],
      cursosEmAndamento: [],
      totalHorasEstudo: 0,
      pontuacao: 0,
      nickname: 'Admin',
      descricao: 'Administrador do sistema EAD'
    };
    
    saveUser(adminUser);
    
    // Cria notificação de sistema inicializado
    createNotification(adminUser.id, {
      titulo: 'Sistema Inicializado',
      mensagem: 'O sistema EAD foi inicializado com sucesso!',
      tipo: 'success'
    });
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres' };
  }
  
  return { valid: true, message: '' };
};