import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  AlertCircle,
  Users,
  Star,
  Clock,
  Lock,
  Globe,
  UserPlus,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCourses, deleteCourse } from '../../utils/storage';
import { getCategories, getCategoryIcon, getCategoryColor } from '../../utils/categories';
import { searchContent } from '../../utils/search';
import { 
  isUserEnrolledInCourse, 
  requestEnrollment, 
  autoApproveEnrollment,
  getUserCourseEnrollment 
} from '../../utils/enrollment';

const CourseList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [courses, setCourses] = useState(getCourses());
  const [showFilters, setShowFilters] = useState(false);
  const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null);

  const categories = getCategories();

  const filteredCourses = searchTerm || selectedCategory || selectedType || selectedLevel
    ? searchContent(searchTerm, {
        categoria: selectedCategory || undefined,
        tipo: selectedType as 'publico' | 'privado' || undefined,
        nivel: selectedLevel as 'iniciante' | 'intermediario' | 'avancado' || undefined
      }).filter(result => result.type === 'course').map(result => 
        courses.find(course => course.id === result.id)!
      ).filter(Boolean)
    : courses;

  const handleDelete = (courseId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este curso?')) {
      deleteCourse(courseId);
      setCourses(getCourses());
    }
  };

  const handleEnroll = async (course: any) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setEnrollingCourse(course.id);

    try {
      if (course.publico) {
        // Matrícula automática para cursos públicos
        await autoApproveEnrollment(
          course.id,
          user.id,
          user.nome,
          user.email
        );
        alert('Matrícula realizada com sucesso!');
      } else {
        // Solicitar matrícula para cursos privados
        await requestEnrollment(
          course.id,
          user.id,
          user.nome,
          user.email
        );
        alert('Solicitação de matrícula enviada! Aguarde a aprovação do professor.');
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao processar matrícula');
    } finally {
      setEnrollingCourse(null);
    }
  };

  const getEnrollmentStatus = (courseId: string) => {
    if (!user) return null;
    
    const enrollment = getUserCourseEnrollment(user.id, courseId);
    if (!enrollment) return null;
    
    return enrollment.status;
  };

  const canCreateCourse = user?.tipo === 'professor' || user?.tipo === 'administrador';
  const canEditCourse = (course: any) => {
    return user?.tipo === 'administrador' || course.professorId === user?.id;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedLevel('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cursos</h1>
          <p className="text-gray-600 mt-1">
            {user?.tipo === 'aluno' 
              ? 'Explore todos os cursos disponíveis na plataforma'
              : 'Gerencie todos os cursos da plataforma'
            }
          </p>
        </div>
        {canCreateCourse && (
          <button
            onClick={() => navigate('/create-course')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Curso</span>
          </button>
        )}
      </div>

      {/* Mensagem informativa para alunos */}
      {user?.tipo === 'aluno' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-800 font-medium">Bem-vindo à nossa plataforma!</h3>
            <p className="text-blue-700 text-sm mt-1">
              Aqui você pode visualizar todos os cursos disponíveis. Clique em "Matricular-se" para começar a aprender.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar cursos, professores, categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {getCategoryIcon(category)} {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os tipos</option>
                  <option value="publico">Público</option>
                  <option value="privado">Privado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nível</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os níveis</option>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Limpar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const enrollmentStatus = getEnrollmentStatus(course.id);
            const isEnrolled = isUserEnrolledInCourse(user?.id || '', course.id);
            
            return (
              <div 
                key={course.id} 
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Course Type Indicator */}
                    <div className={`p-1 rounded-full ${course.publico ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {course.publico ? (
                        <Globe className="w-4 h-4 text-green-600" title="Curso Público" />
                      ) : (
                        <Lock className="w-4 h-4 text-orange-600" title="Curso Privado" />
                      )}
                    </div>
                    
                    {/* Action Buttons for Owners */}
                    {canEditCourse(course) && (
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/course/${course.id}`)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver curso"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/edit-course/${course.id}`)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Editar curso"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir curso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Category Badge */}
                <div className="mb-3">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(course.categoria)}`}>
                    <span>{getCategoryIcon(course.categoria)}</span>
                    <span>{course.categoria}</span>
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.titulo}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.descricao}</p>
                
                {/* Course Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{course.totalAlunos || 0}</span>
                    </div>
                    {course.avaliacaoMedia && course.avaliacaoMedia > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{course.avaliacaoMedia.toFixed(1)}</span>
                      </div>
                    )}
                    {course.duracaoEstimada && course.duracaoEstimada > 0 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{Math.round(course.duracaoEstimada / 60)}h</span>
                      </div>
                    )}
                  </div>
                  <span className="capitalize text-xs bg-gray-100 px-2 py-1 rounded">
                    {course.nivel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Por: {course.professorNome}</span>
                  <span>{new Date(course.dataCriacao).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Enrollment Section for Students */}
                {user?.tipo === 'aluno' && (
                  <div className="border-t pt-4" onClick={(e) => e.stopPropagation()}>
                    {isEnrolled ? (
                      <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-2 px-4 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Matriculado</span>
                      </div>
                    ) : enrollmentStatus === 'pendente' ? (
                      <div className="flex items-center justify-center space-x-2 text-orange-600 bg-orange-50 py-2 px-4 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Aguardando Aprovação</span>
                      </div>
                    ) : enrollmentStatus === 'rejeitado' ? (
                      <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 py-2 px-4 rounded-lg">
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Matrícula Rejeitada</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course)}
                        disabled={enrollingCourse === course.id}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        {enrollingCourse === course.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processando...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>
                              {course.publico ? 'Matricular-se' : 'Solicitar Matrícula'}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {course.tags.length > 3 && (
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          +{course.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Indicador de permissões para professores/admins */}
                {(user?.tipo === 'professor' || user?.tipo === 'administrador') && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        course.professorId === user?.id 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {course.professorId === user?.id ? 'Meu curso' : 'Outro professor'}
                      </span>
                      <span className="text-gray-500">
                        {course.totalAlunos || 0} alunos
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum curso encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory || selectedType || selectedLevel
                ? 'Tente ajustar os filtros de pesquisa'
                : 'Ainda não há cursos disponíveis'
              }
            </p>
            {canCreateCourse && !searchTerm && !selectedCategory && !selectedType && !selectedLevel && (
              <button
                onClick={() => navigate('/create-course')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Criar Primeiro Curso
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;