import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut,
  GraduationCap,
  PlusCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Definir itens do menu baseado no tipo de usuário
  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: BookOpen, label: 'Cursos', path: '/courses' }
    ];

    // Apenas professores e administradores podem criar cursos
    if (user?.tipo === 'professor' || user?.tipo === 'administrador') {
      baseItems.push({ icon: PlusCircle, label: 'Criar Curso', path: '/create-course' });
    }

    // Apenas administradores têm acesso a usuários e relatórios
    if (user?.tipo === 'administrador') {
      baseItems.push(
        { icon: Users, label: 'Usuários', path: '/users' },
        { icon: BarChart3, label: 'Relatórios', path: '/reports' }
      );
    }

    // Configurações apenas para administradores
    if (user?.tipo === 'administrador') {
      baseItems.push({ icon: Settings, label: 'Configurações', path: '/settings' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white shadow-xl h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">EAD System</h1>
            <p className="text-sm text-gray-500">Plataforma de Ensino</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="mb-6">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.nome.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-800">{user?.nome}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.tipo}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Informação sobre configurações para não-administradores */}
        {user?.tipo !== 'administrador' && (
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-xs">
              <strong>Configurações:</strong> Disponível apenas para administradores
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;