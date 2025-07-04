import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  getChatByCourse, 
  createCourseChat, 
  getMessagesByChat, 
  sendChatMessage, 
  editChatMessage, 
  deleteChatMessage,
  canUserAccessChat,
  formatMessageTime 
} from '../../utils/chat';
import { ChatMessage } from '../../types';

interface CourseChatProps {
  courseId: string;
  courseName: string;
}

const CourseChat: React.FC<CourseChatProps> = ({ courseId, courseName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChat();
  }, [courseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChat = () => {
    if (!user) return;

    // Verificar se o usuário pode acessar o chat
    if (!canUserAccessChat(user.id, courseId)) {
      return;
    }

    let chat = getChatByCourse(courseId);
    
    // Criar chat se não existir
    if (!chat) {
      chat = createCourseChat(courseId, courseName);
    }

    // Carregar mensagens
    const chatMessages = getMessagesByChat(chat.id);
    setMessages(chatMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!user || !newMessage.trim()) return;

    setLoading(true);
    
    try {
      const chat = getChatByCourse(courseId);
      if (!chat) return;

      sendChatMessage(
        chat.id,
        user.id,
        user.nickname || user.nome,
        user.tipo,
        newMessage.trim(),
        user.fotoPerfil
      );

      setNewMessage('');
      loadChat();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessage(messageId);
    setEditText(currentText);
  };

  const handleSaveEdit = () => {
    if (!editText.trim() || !editingMessage) return;

    editChatMessage(editingMessage, editText.trim());
    setEditingMessage(null);
    setEditText('');
    loadChat();
  };

  const handleDeleteMessage = (messageId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta mensagem?')) {
      deleteChatMessage(messageId);
      loadChat();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleSaveEdit();
      } else {
        handleSendMessage();
      }
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'administrador':
        return 'bg-red-500';
      case 'professor':
        return 'bg-blue-500';
      case 'aluno':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'administrador':
        return 'Admin';
      case 'professor':
        return 'Prof';
      case 'aluno':
        return 'Aluno';
      default:
        return '';
    }
  };

  if (!user || !canUserAccessChat(user.id, courseId)) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Chat não disponível</h3>
        <p className="text-gray-600">
          Você precisa estar matriculado no curso para acessar o chat.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-96 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <h3 className="text-lg font-semibold text-gray-800">Chat do Curso</h3>
        <p className="text-sm text-gray-600">{courseName}</p>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getUserTypeColor(message.userType)}`}>
                {message.userName.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-800 text-sm">{message.userName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    message.userType === 'administrador' ? 'bg-red-100 text-red-700' :
                    message.userType === 'professor' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {getUserTypeBadge(message.userType)}
                  </span>
                  <span className="text-xs text-gray-500">{formatMessageTime(message.dataCriacao)}</span>
                  {message.editado && (
                    <span className="text-xs text-gray-400 italic">(editado)</span>
                  )}
                </div>
                
                {editingMessage === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessage(null);
                          setEditText('');
                        }}
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-3 relative group">
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{message.mensagem}</p>
                    
                    {message.userId === user.id && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditMessage(message.id, message.mensagem)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar mensagem"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir mensagem"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
          <span>{newMessage.length}/500</span>
        </div>
      </div>
    </div>
  );
};

export default CourseChat;