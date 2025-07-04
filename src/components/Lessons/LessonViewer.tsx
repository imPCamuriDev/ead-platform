import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  PlayCircle, 
  Download, 
  FileText, 
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Heart,
  Send,
  Star,
  ThumbsUp
} from 'lucide-react';
import { getLessonById, getCourseById, formatFileSize } from '../../utils/storage';
import { getStoredFile } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { 
  getCommentsByLesson, 
  createLessonComment, 
  replyToComment, 
  toggleCommentLike,
  toggleReplyLike,
  formatTimeAgo 
} from '../../utils/comments';
import { 
  updateLessonProgress, 
  getUserLessonProgress, 
  markLessonAsCompleted 
} from '../../utils/lessonProgress';

const LessonViewer: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [lesson, setLesson] = useState(getLessonById(lessonId!));
  const [course, setCourse] = useState(lesson ? getCourseById(lesson.cursoId) : null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Comments state
  const [comments, setComments] = useState(getCommentsByLesson(lessonId!));
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // Progress state
  const [progress, setProgress] = useState(getUserLessonProgress(user?.id || '', lessonId!));
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const loadLessonData = async () => {
      if (!lesson) {
        setError('Aula não encontrada');
        setLoading(false);
        return;
      }

      try {
        // Load video if exists
        if (lesson.videoFileId) {
          const videoFile = await getStoredFile(lesson.videoFileId);
          if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            setVideoUrl(url);
          }
        }

        // Load progress
        if (user) {
          const userProgress = getUserLessonProgress(user.id, lesson.id);
          setProgress(userProgress);
          setIsCompleted(userProgress?.concluida || false);
        }
      } catch (err) {
        console.error('Error loading lesson data:', err);
        setError('Erro ao carregar dados da aula');
      } finally {
        setLoading(false);
      }
    };

    loadLessonData();

    // Cleanup video URL on unmount
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [lesson, user]);

  // Video progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !user || !lesson || !course) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration > 0) {
        const newProgress = updateLessonProgress(
          user.id,
          lesson.id,
          course.id,
          currentTime,
          duration
        );
        setProgress(newProgress);
        setIsCompleted(newProgress.concluida);
      }
    };

    const handleEnded = () => {
      if (user && lesson && course) {
        markLessonAsCompleted(user.id, lesson.id, course.id);
        setIsCompleted(true);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl, user, lesson, course]);

  const handleDownloadMaterial = async (material: any) => {
    try {
      if (material.tipo === 'link') {
        window.open(material.conteudo, '_blank');
        return;
      }

      if (material.fileId) {
        const file = await getStoredFile(material.fileId);
        if (file) {
          const url = URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = url;
          a.download = material.nome;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          alert('Arquivo não encontrado');
        }
      }
    } catch (error) {
      console.error('Error downloading material:', error);
      alert('Erro ao baixar material');
    }
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user || !lesson) return;

    createLessonComment(
      lesson.id,
      user.id,
      user.nickname || user.nome,
      newComment.trim(),
      user.fotoPerfil
    );

    setComments(getCommentsByLesson(lesson.id));
    setNewComment('');
  };

  const handleSubmitReply = (commentId: string) => {
    if (!replyText.trim() || !user) return;

    replyToComment(
      commentId,
      user.id,
      user.nickname || user.nome,
      replyText.trim(),
      user.fotoPerfil
    );

    setComments(getCommentsByLesson(lessonId!));
    setReplyingTo(null);
    setReplyText('');
  };

  const handleLikeComment = (commentId: string) => {
    if (!user) return;
    toggleCommentLike(commentId, user.id);
    setComments(getCommentsByLesson(lessonId!));
  };

  const handleLikeReply = (commentId: string, replyId: string) => {
    if (!user) return;
    toggleReplyLike(commentId, replyId, user.id);
    setComments(getCommentsByLesson(lessonId!));
  };

  const handleMarkAsCompleted = () => {
    if (!user || !lesson || !course) return;
    markLessonAsCompleted(user.id, lesson.id, course.id);
    setIsCompleted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando aula...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson || !course) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {error || 'Aula não encontrada'}
        </h2>
        <button
          onClick={() => navigate('/courses')}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Voltar aos Cursos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/course/${course.id}`)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">{lesson.titulo}</h1>
          <p className="text-gray-600 mt-1">
            {course.titulo} • Aula {lesson.ordem}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{lesson.duracaoMinutos || 15} min</span>
          </div>
          {isCompleted && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Concluída</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {videoUrl ? (
              <div className="aspect-video bg-black">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full"
                  poster="/api/placeholder/800/450"
                >
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <PlayCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Vídeo não disponível
                  </h3>
                  <p className="text-gray-600">
                    Esta aula não possui vídeo ou o arquivo não foi encontrado.
                  </p>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Descrição da Aula</h2>
                {!isCompleted && !videoUrl && (
                  <button
                    onClick={handleMarkAsCompleted}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar como Concluída</span>
                  </button>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed">{lesson.descricao}</p>
              
              {progress && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progresso da Aula</span>
                    <span className="text-sm text-gray-600">
                      {Math.round(progress.percentualAssistido)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentualAssistido}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-6">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Comentários ({comments.length})
              </h3>
            </div>

            {/* New Comment */}
            {user && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {(user.nickname || user.nome).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Faça uma pergunta ou compartilhe sua opinião sobre esta aula..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim()}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Comentar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {comment.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-800">{comment.userName}</span>
                        <span className="text-sm text-gray-500">{formatTimeAgo(comment.dataCriacao)}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{comment.comentario}</p>
                      
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center space-x-1 text-sm transition-colors ${
                            comment.curtidoPorUsuario 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${comment.curtidoPorUsuario ? 'fill-current' : ''}`} />
                          <span>{comment.curtidas}</span>
                        </button>
                        
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          Responder
                        </button>
                      </div>

                      {/* Reply Form */}
                      {replyingTo === comment.id && user && (
                        <div className="mt-3 ml-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {(user.nickname || user.nome).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Escreva sua resposta..."
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={2}
                              />
                              <div className="flex justify-end space-x-2 mt-2">
                                <button
                                  onClick={() => setReplyingTo(null)}
                                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleSubmitReply(comment.id)}
                                  disabled={!replyText.trim()}
                                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                  Responder
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.respostas.length > 0 && (
                        <div className="mt-4 ml-4 space-y-3">
                          {comment.respostas.map((reply) => (
                            <div key={reply.id} className="flex items-start space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {reply.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-800 text-sm">{reply.userName}</span>
                                  <span className="text-xs text-gray-500">{formatTimeAgo(reply.dataCriacao)}</span>
                                </div>
                                <p className="text-gray-700 text-sm mb-2">{reply.comentario}</p>
                                <button
                                  onClick={() => handleLikeReply(comment.id, reply.id)}
                                  className={`flex items-center space-x-1 text-xs transition-colors ${
                                    reply.curtidoPorUsuario 
                                      ? 'text-red-500 hover:text-red-600' 
                                      : 'text-gray-500 hover:text-red-500'
                                  }`}
                                >
                                  <Heart className={`w-3 h-3 ${reply.curtidoPorUsuario ? 'fill-current' : ''}`} />
                                  <span>{reply.curtidas}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Seja o primeiro a comentar nesta aula!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Curso</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{course.titulo}</p>
                  <p className="text-sm text-gray-600">Por: {course.professorNome}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/course/${course.id}`)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition-colors text-sm font-medium"
              >
                Ver todas as aulas
              </button>
            </div>
          </div>

          {/* Materials */}
          {lesson.materiais && lesson.materiais.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Materiais de Apoio ({lesson.materiais.length})
              </h3>
              <div className="space-y-3">
                {lesson.materiais.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {material.tipo === 'link' ? (
                          <ExternalLink className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {material.nome}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span className="capitalize">{material.tipo}</span>
                          {material.tamanho && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(material.tamanho)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadMaterial(material)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                      title={material.tipo === 'link' ? 'Abrir link' : 'Baixar arquivo'}
                    >
                      {material.tipo === 'link' ? (
                        <ExternalLink className="w-4 h-4" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lesson Progress */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className={`w-6 h-6 ${isCompleted ? 'text-green-500' : 'text-gray-400'}`} />
              <h3 className="text-lg font-semibold text-gray-800">Progresso</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status da aula</span>
                <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                  {isCompleted ? 'Concluída' : 'Em andamento'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duração</span>
                <span className="text-gray-800">{lesson.duracaoMinutos || 15} minutos</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Materiais</span>
                <span className="text-gray-800">{lesson.materiais.length} itens</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Comentários</span>
                <span className="text-gray-800">{comments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;