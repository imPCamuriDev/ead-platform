import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  PlayCircle, 
  Edit, 
  Trash2, 
  Download,
  Clock,
  FileText,
  Eye,
  Star,
  Users,
  MessageCircle,
  UserCheck,
  UserX,
  CheckCircle,
  X,
  Globe,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCourseById, getLessonsByCourse, deleteLesson } from '../../utils/storage';
import { getCourseAverageRating } from '../../utils/comments';
import { 
  getPendingEnrollmentsByCourse, 
  approveEnrollment, 
  rejectEnrollment,
  getApprovedEnrollmentsByCourse 
} from '../../utils/enrollment';
import { getChatByCourse, createCourseChat } from '../../utils/chat';
import CourseRatingComponent from './CourseRating';
import CourseChat from './CourseChat';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState(getLessonsByCourse(id!));
  const [activeTab, setActiveTab] = useState('lessons');
  const [pendingEnrollments, setPendingEnrollments] = useState(getPendingEnrollmentsByCourse(id!));
  const [approvedEnrollments, setApprovedEnrollments] = useState(getApprovedEnrollmentsByCourse(id!));
  
  const course = getCourseById(id!);
  const averageRating = getCourseAverageRating(id!);
  const courseChat = getChatByCourse(id!);

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Curso não encontrado</h2>
        <button
          onClick={() => navigate('/courses')}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Voltar aos Cursos
        </button>
      </div>
    );
  }

  const isOwner = user?.id === course.professorId || user?.tipo === 'administrador';

  const handleDeleteLesson = (lessonId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta aula?')) {
      deleteLesson(lessonId);
      setLessons(getLessonsByCourse(id!));
    }
  };

  const handleWatchLesson = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
  };

  const handleApproveEnrollment = (enrollmentId: string) => {
    try {
      approveEnrollment(enrollmentId, user!.id);
      setPendingEnrollments(getPendingEnrollmentsByCourse(id!));
      setApprovedEnrollments(getApprovedEnrollmentsByCourse(id!));
      
      // Create or update course chat
      if (!courseChat) {
        createCourseChat(course.id, course.titulo);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRejectEnrollment = (enrollmentId: string) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    try {
      rejectEnrollment(enrollmentId, user!.id, reason || undefined);
      setPendingEnrollments(getPendingEnrollmentsByCourse(id!));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const tabs = [
    { id: 'lessons', label: 'Aulas', icon: PlayCircle, count: lessons.length },
    { id: 'ratings', label: 'Avaliações', icon: Star, count: averageRating.total },
    ...(isOwner && !course.publico ? [{ id: 'enrollments', label: 'Matrículas', icon: Users, count: pendingEnrollments.length }] : []),
    ...(approvedEnrollments.length > 0 ? [{ id: 'chat', label: 'Chat', icon: MessageCircle, count: 0 }] : [])
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-800">{course.titulo}</h1>
            <div className={`p-1 rounded-full ${course.publico ? 'bg-green-100' : 'bg-orange-100'}`}>
              {course.publico ? (
                <Globe className="w-5 h-5 text-green-600" title="Curso Público" />
              ) : (
                <Lock className="w-5 h-5 text-orange-600" title="Curso Privado" />
              )}
            </div>
          </div>
          <p className="text-gray-600 mt-1">Por: {course.professorNome}</p>
        </div>
        {isOwner && (
          <button
            onClick={() => navigate(`/create-lesson/${course.id}`)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Aula</span>
          </button>
        )}
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm">
        <div className="flex items-start space-x-6 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sobre o Curso</h2>
            <p className="text-gray-600 leading-relaxed mb-6">{course.descricao}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <PlayCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Aulas</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{lessons.length}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Duração</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {course.duracaoEstimada ? Math.round(course.duracaoEstimada / 60) : lessons.length * 15}min
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Alunos</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{approvedEnrollments.length}</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Avaliação</span>
                </div>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold text-orange-600">
                    {averageRating.average > 0 ? averageRating.average.toFixed(1) : '—'}
                  </p>
                  {averageRating.average > 0 && (
                    <Star className="w-4 h-4 text-orange-400 fill-current" />
                  )}
                </div>
                <p className="text-xs text-orange-700">
                  {averageRating.total} {averageRating.total === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
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
                {tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'lessons' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Aulas do Curso</h3>
            
            {lessons.length === 0 ? (
              <div className="text-center py-12">
                <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-800 mb-2">Nenhuma aula criada</h4>
                <p className="text-gray-600 mb-4">Adicione a primeira aula para começar</p>
                {isOwner && (
                  <button
                    onClick={() => navigate(`/create-lesson/${course.id}`)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Criar Primeira Aula
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => handleWatchLesson(lesson.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold">{lesson.ordem}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">{lesson.titulo}</h4>
                          <p className="text-gray-600 mb-3 line-clamp-2">{lesson.descricao}</p>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <PlayCircle className="w-4 h-4" />
                              <span>{lesson.videoFileId ? 'Com vídeo' : 'Sem vídeo'}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FileText className="w-4 h-4" />
                              <span>{lesson.materiais.length} materiais</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{lesson.duracaoMinutos || 15} min</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleWatchLesson(lesson.id)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Assistir aula"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/edit-lesson/${lesson.id}`)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar aula"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir aula"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ratings' && (
          <CourseRatingComponent courseId={course.id} courseName={course.titulo} />
        )}

        {activeTab === 'enrollments' && isOwner && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Gerenciar Matrículas ({pendingEnrollments.length} pendentes)
            </h3>
            
            {pendingEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-800 mb-2">Nenhuma solicitação pendente</h4>
                <p className="text-gray-600">Todas as solicitações de matrícula foram processadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {enrollment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{enrollment.userName}</h4>
                          <p className="text-gray-600 text-sm">{enrollment.userEmail}</p>
                          <p className="text-gray-500 text-xs">
                            Solicitado em: {new Date(enrollment.dataMatricula).toLocaleDateString('pt-BR')}
                          </p>
                          {enrollment.observacoes && (
                            <p className="text-gray-600 text-sm mt-1">
                              <strong>Observações:</strong> {enrollment.observacoes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveEnrollment(enrollment.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Aprovar</span>
                        </button>
                        <button
                          onClick={() => handleRejectEnrollment(enrollment.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <UserX className="w-4 h-4" />
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <CourseChat courseId={course.id} courseName={course.titulo} />
        )}
      </div>
    </div>
  );
};

export default CourseDetail;