import React from 'react';
import { 
  BookOpen, 
  Users, 
  PlayCircle, 
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Target,
  Activity,
  Star,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCourses, getLessons, getUserStats, getCourseStats, getUserCourseProgress } from '../../utils/storage';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const courses = getCourses();
  const lessons = getLessons();
  const userStats = getUserStats(user?.id || '');
  const courseStats = getCourseStats();
  const userProgress = getUserCourseProgress(user?.id || '');
  
  // Filtrar cursos baseado no tipo de usuário
  const userCourses = user?.tipo === 'administrador' 
    ? courses 
    : user?.tipo === 'professor'
    ? courses.filter(course => course.professorId === user?.id)
    : courses; // Alunos podem ver todos os cursos
  
  const userLessons = lessons.filter(lesson => 
    userCourses.some(course => course.id === lesson.cursoId)
  );

  const recentProgress = userProgress
    .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
    .slice(0, 5);

  const getStatsForUserType = () => {
    if (user?.tipo === 'administrador') {
      return [
        {
          icon: BookOpen,
          label: 'Total de Cursos',
          value: courseStats.totalCursos,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600'
        },
        {
          icon: Users,
          label: 'Total de Alunos',
          value: courseStats.totalAlunos,
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-600'
        },
        {
          icon: PlayCircle,
          label: 'Total de Aulas',
          value: courseStats.totalAulas,
          color: 'bg-purple-500',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600'
        },
        {
          icon: Clock,
          label: 'Horas de Conteúdo',
          value: `${courseStats.horasConteudo}h`,
          color: 'bg-orange-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600'
        }
      ];
    } else if (user?.tipo === 'professor') {
      return [
        {
          icon: BookOpen,
          label: 'Meus Cursos',
          value: userCourses.length,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600'
        },
        {
          icon: PlayCircle,
          label: 'Minhas Aulas',
          value: userLessons.length,
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-600'
        },
        {
          icon: Users,
          label: 'Total Alunos',
          value: userCourses.reduce((total, course) => total + (course.totalAlunos || 0), 0),
          color: 'bg-purple-500',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600'
        },
        {
          icon: Star,
          label: 'Avaliação Média',
          value: userCourses.length > 0 
            ? (userCourses.reduce((sum, course) => sum + (course.avaliacaoMedia || 0), 0) / userCourses.length).toFixed(1)
            : '0.0',
          color: 'bg-orange-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600'
        }
      ];
    } else {
      return [
        {
          icon: BookOpen,
          label: 'Cursos Disponíveis',
          value: courses.length,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600'
        },
        {
          icon: TrendingUp,
          label: 'Em Andamento',
          value: userStats.cursosEmAndamento,
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-600'
        },
        {
          icon: Clock,
          label: 'Horas de Estudo',
          value: `${userStats.totalHorasEstudo}h`,
          color: 'bg-purple-500',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600'
        },
        {
          icon: Award,
          label: 'Cursos Completos',
          value: userStats.cursosCompletos,
          color: 'bg-orange-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600'
        }
      ];
    }
  };

  const stats = getStatsForUserType();

  const getActionButtons = () => {
    if (user?.tipo === 'professor' || user?.tipo === 'administrador') {
      return (
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/create-course')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Curso</span>
          </button>
          <button 
            onClick={() => navigate('/courses')}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Ver Todos
          </button>
        </div>
      );
    } else {
      return (
        <button 
          onClick={() => navigate('/courses')}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
        >
          Explorar Cursos
        </button>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Olá, {user?.nickname || user?.nome}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.tipo === 'administrador' 
              ? 'Painel administrativo do sistema'
              : user?.tipo === 'professor'
              ? 'Gerencie seus cursos e aulas'
              : 'Continue sua jornada de aprendizado'
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {getActionButtons()}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} p-6 rounded-xl border border-gray-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cursos Recentes ou Progresso */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {user?.tipo === 'aluno' ? 'Meu Progresso' : 'Cursos Recentes'}
            </h3>
            <button 
              onClick={() => navigate('/courses')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-3">
            {user?.tipo === 'aluno' ? (
              recentProgress.length > 0 ? (
                recentProgress.map((progress) => {
                  const course = courses.find(c => c.id === progress.cursoId);
                  return (
                    <div key={progress.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                         onClick={() => navigate(`/course/${progress.cursoId}`)}>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{course?.titulo}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.percentualConcluido}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{Math.round(progress.percentualConcluido)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Comece um curso para ver seu progresso</p>
                  <button 
                    onClick={() => navigate('/courses')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Explorar Cursos
                  </button>
                </div>
              )
            ) : (
              userCourses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                     onClick={() => navigate(`/course/${course.id}`)}>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{course.titulo}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{course.totalAlunos || 0} alunos</span>
                      <span>{new Date(course.dataCriacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            {userCourses.length === 0 && user?.tipo !== 'aluno' && (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum curso encontrado</p>
                <button 
                  onClick={() => navigate('/create-course')}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Criar Primeiro Curso
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Atividade Recente</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {userLessons.slice(0, 5).map((lesson) => {
              const course = courses.find(c => c.id === lesson.cursoId);
              return (
                <div key={lesson.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{lesson.titulo}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{course?.titulo}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{new Date(lesson.dataCriacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {userLessons.length === 0 && (
              <div className="text-center py-8">
                <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progresso Semanal - apenas para alunos */}
      {user?.tipo === 'aluno' && userStats.streakDias > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Sequência de Estudos</h3>
              <p className="text-blue-100">
                Você está em uma sequência de {userStats.streakDias} dias! Continue assim! 🔥
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{userStats.streakDias}</div>
              <div className="text-blue-100">dias</div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de boas-vindas para alunos */}
      {user?.tipo === 'aluno' && userStats.cursosCompletos === 0 && userStats.cursosEmAndamento === 0 && (
        <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Bem-vindo à nossa plataforma! 🎓</h3>
              <p className="text-green-100 mb-4">
                Comece sua jornada de aprendizado explorando nossos cursos disponíveis.
              </p>
              <button 
                onClick={() => navigate('/courses')}
                className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Explorar Cursos
              </button>
            </div>
            <div className="text-6xl opacity-20">
              📚
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;