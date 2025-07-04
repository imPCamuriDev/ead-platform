import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Download,
  Calendar,
  Filter,
  Eye,
  Clock,
  Award,
  Target,
  Star,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCourseStats, getUserStats, getCourses, getUsers, getAllUserProgress } from '../../utils/storage';
import { getCourseRatings, getLessonComments } from '../../utils/comments';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');

  const courseStats = getCourseStats();
  const courses = getCourses();
  const users = getUsers();
  const allProgress = getAllUserProgress();
  const allRatings = getCourseRatings();
  const allComments = getLessonComments();

  // Estatísticas gerais
  const totalUsers = users.filter(u => u.ativo).length;
  const totalStudents = users.filter(u => u.tipo === 'aluno' && u.ativo).length;
  const totalTeachers = users.filter(u => u.tipo === 'professor' && u.ativo).length;
  const totalAdmins = users.filter(u => u.tipo === 'administrador' && u.ativo).length;

  // Cursos mais populares
  const popularCourses = courses
    .map(course => ({
      ...course,
      enrollments: allProgress.filter(p => p.cursoId === course.id).length,
      ratings: allRatings.filter(r => r.cursoId === course.id),
      averageRating: allRatings.filter(r => r.cursoId === course.id).length > 0 
        ? allRatings.filter(r => r.cursoId === course.id).reduce((sum, r) => sum + r.avaliacao, 0) / allRatings.filter(r => r.cursoId === course.id).length
        : 0
    }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 5);

  // Usuários mais ativos
  const activeUsers = users
    .filter(u => u.tipo === 'aluno')
    .map(user => ({
      ...user,
      coursesCompleted: user.cursosCompletos.length,
      coursesInProgress: user.cursosEmAndamento.length,
      totalHours: user.totalHorasEstudo,
      commentsCount: allComments.filter(c => c.userId === user.id).length
    }))
    .sort((a, b) => b.coursesCompleted - a.coursesCompleted)
    .slice(0, 5);

  // Progresso por mês (simulado)
  const monthlyProgress = [
    { month: 'Jan', completions: 12, enrollments: 45, ratings: 8 },
    { month: 'Fev', completions: 18, enrollments: 52, ratings: 12 },
    { month: 'Mar', completions: 25, enrollments: 38, ratings: 15 },
    { month: 'Abr', completions: 32, enrollments: 67, ratings: 22 },
    { month: 'Mai', completions: 28, enrollments: 43, ratings: 18 },
    { month: 'Jun', completions: 35, enrollments: 58, ratings: 25 }
  ];

  // Estatísticas de engajamento
  const engagementStats = {
    totalRatings: allRatings.length,
    averageRating: allRatings.length > 0 
      ? allRatings.reduce((sum, r) => sum + r.avaliacao, 0) / allRatings.length 
      : 0,
    totalComments: allComments.length,
    totalReplies: allComments.reduce((sum, c) => sum + c.respostas.length, 0)
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'courses', label: 'Cursos', icon: BookOpen },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'engagement', label: 'Engajamento', icon: TrendingUp },
    { id: 'ratings', label: 'Avaliações', icon: Star }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-blue-800">{totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Cursos Ativos</p>
              <p className="text-2xl font-bold text-green-800">{courseStats.totalCursos}</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Aulas Criadas</p>
              <p className="text-2xl font-bold text-purple-800">{courseStats.totalAulas}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Avaliações</p>
              <p className="text-2xl font-bold text-orange-800">{engagementStats.totalRatings}</p>
            </div>
            <Star className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Progresso Mensal</h3>
          <div className="space-y-4">
            {monthlyProgress.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{month.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{month.enrollments} matrículas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{month.completions} conclusões</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{month.ratings} avaliações</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Usuários</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Alunos</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{totalStudents}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Professores</span>
              </div>
              <span className="text-lg font-bold text-green-600">{totalTeachers}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">Administradores</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{totalAdmins}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cursos Mais Populares</h3>
        <div className="space-y-4">
          {popularCourses.map((course, index) => (
            <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{course.titulo}</h4>
                  <p className="text-sm text-gray-600">Por: {course.professorNome}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600">
                        {course.averageRating > 0 ? course.averageRating.toFixed(1) : '—'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {course.ratings.length} avaliações
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{course.enrollments}</p>
                <p className="text-sm text-gray-500">matrículas</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Estatísticas de Cursos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{courseStats.totalCursos}</p>
            <p className="text-sm text-blue-800">Cursos Ativos</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{courseStats.horasConteudo}h</p>
            <p className="text-sm text-green-800">Horas de Conteúdo</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {engagementStats.averageRating.toFixed(1)}
            </p>
            <p className="text-sm text-purple-800">Avaliação Média</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Usuários Mais Ativos</h3>
        <div className="space-y-4">
          {activeUsers.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {(user.nickname || user.nome).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{user.nome}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">
                      {user.commentsCount} comentários
                    </span>
                    <span className="text-xs text-gray-500">
                      {user.totalHours}h de estudo
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{user.coursesCompleted}</p>
                <p className="text-sm text-gray-500">cursos completos</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Estatísticas de Usuários</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
            <p className="text-sm text-blue-800">Total de Usuários</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{totalStudents}</p>
            <p className="text-sm text-green-800">Alunos</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{totalTeachers}</p>
            <p className="text-sm text-purple-800">Professores</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Target className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{totalAdmins}</p>
            <p className="text-sm text-orange-800">Administradores</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEngagement = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Métricas de Engajamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{Math.round((courseStats.cursosCompletos / courseStats.totalAlunos) * 100)}%</p>
            <p className="text-sm text-blue-800">Taxa de Conclusão</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{engagementStats.totalComments}</p>
            <p className="text-sm text-green-800">Comentários</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{engagementStats.totalRatings}</p>
            <p className="text-sm text-purple-800">Avaliações</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{engagementStats.averageRating.toFixed(1)}</p>
            <p className="text-sm text-orange-800">Nota Média</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Atividade Recente</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-800">Novos usuários registrados hoje</span>
            </div>
            <span className="font-bold text-green-600">12</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-800">Cursos iniciados hoje</span>
            </div>
            <span className="font-bold text-blue-600">28</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-800">Comentários feitos hoje</span>
            </div>
            <span className="font-bold text-purple-600">45</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-800">Avaliações feitas hoje</span>
            </div>
            <span className="font-bold text-orange-600">15</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRatings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Avaliações</h3>
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = allRatings.filter(r => r.avaliacao === star).length;
            const percentage = allRatings.length > 0 ? (count / allRatings.length) * 100 : 0;
            
            return (
              <div key={star} className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 w-16">
                  <span className="text-sm font-medium">{star}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cursos Mais Bem Avaliados</h3>
        <div className="space-y-4">
          {popularCourses
            .filter(course => course.ratings.length > 0)
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 5)
            .map((course, index) => (
              <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{course.titulo}</h4>
                    <p className="text-sm text-gray-600">Por: {course.professorNome}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-bold text-yellow-600">
                      {course.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{course.ratings.length} avaliações</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'courses':
        return renderCourses();
      case 'users':
        return renderUsers();
      case 'engagement':
        return renderEngagement();
      case 'ratings':
        return renderRatings();
      default:
        return renderOverview();
    }
  };

  if (user?.tipo !== 'administrador') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Apenas administradores podem acessar os relatórios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada da plataforma</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;