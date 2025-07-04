import { CourseChat, ChatMessage } from '../types';
import { generateId } from './auth';
import { getApprovedEnrollmentsByCourse } from './enrollment';

// Gestão de Chat dos Cursos
export const saveCourseChat = (chat: CourseChat): void => {
  const chats = getCourseChats();
  const existingIndex = chats.findIndex(c => c.id === chat.id);
  
  if (existingIndex !== -1) {
    chats[existingIndex] = chat;
  } else {
    chats.push(chat);
  }
  
  localStorage.setItem('ead_course_chats', JSON.stringify(chats));
};

export const getCourseChats = (): CourseChat[] => {
  const chats = localStorage.getItem('ead_course_chats');
  return chats ? JSON.parse(chats) : [];
};

export const getChatByCourse = (cursoId: string): CourseChat | null => {
  const chats = getCourseChats();
  return chats.find(c => c.cursoId === cursoId) || null;
};

export const createCourseChat = (cursoId: string, curseName: string): CourseChat => {
  // Verificar se já existe chat para este curso
  const existingChat = getChatByCourse(cursoId);
  if (existingChat) {
    return existingChat;
  }

  // Obter participantes (usuários matriculados)
  const enrollments = getApprovedEnrollmentsByCourse(cursoId);
  const participantes = enrollments.map(e => e.userId);

  const newChat: CourseChat = {
    id: generateId(),
    cursoId,
    curseName,
    participantes,
    dataCriacao: new Date().toISOString(),
    ativo: true
  };

  saveCourseChat(newChat);
  return newChat;
};

export const addParticipantToChat = (cursoId: string, userId: string): void => {
  const chat = getChatByCourse(cursoId);
  if (chat && !chat.participantes.includes(userId)) {
    chat.participantes.push(userId);
    saveCourseChat(chat);
  }
};

export const removeParticipantFromChat = (cursoId: string, userId: string): void => {
  const chat = getChatByCourse(cursoId);
  if (chat) {
    chat.participantes = chat.participantes.filter(p => p !== userId);
    saveCourseChat(chat);
  }
};

// Gestão de Mensagens do Chat
export const saveChatMessage = (message: ChatMessage): void => {
  const messages = getChatMessages();
  const existingIndex = messages.findIndex(m => m.id === message.id);
  
  if (existingIndex !== -1) {
    messages[existingIndex] = message;
  } else {
    messages.push(message);
  }
  
  localStorage.setItem('ead_chat_messages', JSON.stringify(messages));
};

export const getChatMessages = (): ChatMessage[] => {
  const messages = localStorage.getItem('ead_chat_messages');
  return messages ? JSON.parse(messages) : [];
};

export const getMessagesByChat = (chatId: string): ChatMessage[] => {
  const messages = getChatMessages();
  return messages
    .filter(m => m.chatId === chatId)
    .sort((a, b) => new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime());
};

export const sendChatMessage = (
  chatId: string,
  userId: string,
  userName: string,
  userType: 'professor' | 'administrador' | 'aluno',
  mensagem: string,
  userAvatar?: string
): ChatMessage => {
  const newMessage: ChatMessage = {
    id: generateId(),
    chatId,
    userId,
    userName,
    userAvatar,
    userType,
    mensagem: mensagem.trim(),
    dataCriacao: new Date().toISOString(),
    tipo: 'texto'
  };

  saveChatMessage(newMessage);
  return newMessage;
};

export const editChatMessage = (messageId: string, newContent: string): void => {
  const messages = getChatMessages();
  const message = messages.find(m => m.id === messageId);
  
  if (message) {
    message.mensagem = newContent.trim();
    message.editado = true;
    message.dataEdicao = new Date().toISOString();
    saveChatMessage(message);
  }
};

export const deleteChatMessage = (messageId: string): void => {
  const messages = getChatMessages();
  const filteredMessages = messages.filter(m => m.id !== messageId);
  localStorage.setItem('ead_chat_messages', JSON.stringify(filteredMessages));
};

export const canUserAccessChat = (userId: string, cursoId: string): boolean => {
  const chat = getChatByCourse(cursoId);
  return chat ? chat.participantes.includes(userId) : false;
};

export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
};