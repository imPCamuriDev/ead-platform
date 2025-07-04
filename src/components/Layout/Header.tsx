import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserNotifications, markNotificationAsRead, getUnreadNotificationsCount } from '../../utils/auth';
import { searchContent, saveSearchHistory, getSearchHistory } from '../../utils/search';
import { formatDateTime } from '../../utils/storage';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const notifications = getUserNotifications(user?.id || '');
  const unreadCount = getUnreadNotificationsCount(user?.id || '');

  useEffect(() => {
    if (user) {
      setSearchHistory(getSearchHistory(user.id));
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const results = searchContent(searchTerm);
      setSearchResults(results.slice(0, 8)); // Limit to 8 results
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchTerm]);

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markNotificationAsRead(notificationId);
    if (link) {
      navigate(link);
    }
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (query: string) => {
    if (query.trim() && user) {
      saveSearchHistory(query.trim(), user.id);
      setSearchHistory(getSearchHistory(user.id));
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchTerm('');
      setShowSearchResults(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const handleResultClick = (result: any) => {
    if (result.type === 'course') {
      navigate(`/course/${result.id}`);
    } else if (result.type === 'lesson') {
      navigate(`/lesson/${result.id}`);
    }
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleHistoryClick = (query: string) => {
    setSearchTerm(query);
    handleSearch(query);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar cursos, aulas, professores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchTerm.trim()) {
                    setShowSearchResults(true);
                  }
                }}
                className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div>
                    <div className="p-3 border-b border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700">Resultados da busca</h4>
                    </div>
                    {searchResults.map((result) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold ${
                            result.type === 'course' ? 'bg-blue-500' :
                            result.type === 'lesson' ? 'bg-green-500' :
                            'bg-purple-500'
                          }`}>
                            {result.type === 'course' ? 'C' :
                             result.type === 'lesson' ? 'A' : 'M'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-gray-800 truncate">{result.title}</h5>
                            <p className="text-xs text-gray-600 truncate">{result.description}</p>
                            {result.courseName && (
                              <p className="text-xs text-gray-500">Curso: {result.courseName}</p>
                            )}
                            {result.professorName && (
                              <p className="text-xs text-gray-500">Professor: {result.professorName}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.type === 'course' ? 'bg-blue-100 text-blue-700' :
                            result.type === 'lesson' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {result.type === 'course' ? 'Curso' :
                             result.type === 'lesson' ? 'Aula' : 'Material'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchTerm.trim() ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>Nenhum resultado encontrado para "{searchTerm}"</p>
                  </div>
                ) : searchHistory.length > 0 ? (
                  <div>
                    <div className="p-3 border-b border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700">Buscas recentes</h4>
                    </div>
                    {searchHistory.slice(0, 5).map((query, index) => (
                      <div
                        key={index}
                        onClick={() => handleHistoryClick(query)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 flex items-center space-x-3"
                      >
                        <Search className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{query}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notificações */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id, notification.link)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !notification.lida ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.tipo === 'success' ? 'bg-green-500' :
                            notification.tipo === 'warning' ? 'bg-yellow-500' :
                            notification.tipo === 'error' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-800">{notification.titulo}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.mensagem}</p>
                            <p className="text-xs text-gray-400 mt-2">{formatDateTime(notification.dataCriacao)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 10 && (
                  <div className="p-4 border-t border-gray-200 text-center">
                    <button 
                      onClick={() => navigate('/notifications')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Ver todas as notificações
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Menu do Usuário */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.nickname || user?.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.tipo}</p>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                {user?.fotoPerfil ? (
                  <img 
                    src={user.fotoPerfil} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {(user?.nickname || user?.nome || '').charAt(0)}
                  </span>
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Meu Perfil</span>
                  </button>
                  {user?.tipo === 'administrador' && (
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configurações</span>
                    </button>
                  )}
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;