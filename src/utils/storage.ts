import { Course, Lesson, Material, UserProgress, UserStats, CourseStats } from '../types';
import { createNotification, getUsers, findUserById, saveUser } from './auth';
import { fileStorageManager } from './fileStorage';

// Re-exportar getUsers para uso em outros componentes
export { getUsers } from './auth';

// Gestão de Cursos
export const saveCourse = (course: Course): void => {
  const courses = getCourses();
  const existingIndex = courses.findIndex(c => c.id === course.id);
  
  // Garantir propriedades padrão
  const courseWithDefaults = {
    ativo: true,
    categoria: 'Geral',
    nivel: 'iniciante' as const,
    duracaoEstimada: 0,
    tags: [],
    preco: 0,
    totalAlunos: 0,
    avaliacaoMedia: 0,
    totalAvaliacoes: 0,
    ...course
  };
  
  if (existingIndex !== -1) {
    courses[existingIndex] = courseWithDefaults;
  } else {
    courses.push(courseWithDefaults);
  }
  
  localStorage.setItem('ead_courses', JSON.stringify(courses));
};

export const getCourses = (): Course[] => {
  const courses = localStorage.getItem('ead_courses');
  const parsedCourses = courses ? JSON.parse(courses) : [];
  
  // Normalizar dados dos cursos
  return parsedCourses.map((course: any) => ({
    ativo: true,
    categoria: 'Geral',
    nivel: 'iniciante',
    duracaoEstimada: 0,
    tags: [],
    preco: 0,
    totalAlunos: 0,
    avaliacaoMedia: 0,
    totalAvaliacoes: 0,
    ...course
  }));
};

export const getActiveCourses = (): Course[] => {
  return getCourses().filter(course => course.ativo);
};

export const getCourseById = (id: string): Course | null => {
  const courses = getCourses();
  return courses.find(course => course.id === id) || null;
};

export const updateCourse = (updatedCourse: Course): void => {
  saveCourse(updatedCourse);
};

export const deleteCourse = (id: string): void => {
  const courses = getCourses();
  const filteredCourses = courses.filter(course => course.id !== id);
  localStorage.setItem('ead_courses', JSON.stringify(filteredCourses));
  
  // Remove também as aulas do curso
  const lessons = getLessons();
  const filteredLessons = lessons.filter(lesson => lesson.cursoId !== id);
  localStorage.setItem('ead_lessons', JSON.stringify(filteredLessons));
  
  // Remove progresso dos usuários
  const progress = getAllUserProgress();
  const filteredProgress = progress.filter(p => p.cursoId !== id);
  localStorage.setItem('ead_user_progress', JSON.stringify(filteredProgress));
};

// Gestão de Aulas
export const saveLesson = (lesson: Lesson): void => {
  const lessons = getLessons();
  const existingIndex = lessons.findIndex(l => l.id === lesson.id);
  
  // Garantir propriedades padrão
  const lessonWithDefaults = {
    duracaoMinutos: 15,
    ativo: true,
    ...lesson,
    materiais: lesson.materiais.map(material => ({
      dataCriacao: new Date().toISOString(),
      ...material
    }))
  };
  
  if (existingIndex !== -1) {
    lessons[existingIndex] = lessonWithDefaults;
  } else {
    lessons.push(lessonWithDefaults);
  }
  
  localStorage.setItem('ead_lessons', JSON.stringify(lessons));
  
  // Atualiza estatísticas do curso
  updateCourseStats(lesson.cursoId);
};

export const getLessons = (): Lesson[] => {
  const lessons = localStorage.getItem('ead_lessons');
  const parsedLessons = lessons ? JSON.parse(lessons) : [];
  
  // Normalizar dados das aulas
  return parsedLessons.map((lesson: any) => ({
    duracaoMinutos: 15,
    ativo: true,
    ...lesson,
    materiais: Array.isArray(lesson.materiais) ? lesson.materiais.map((material: any) => ({
      dataCriacao: new Date().toISOString(),
      ...material
    })) : []
  }));
};

export const getLessonsByCourse = (courseId: string): Lesson[] => {
  const lessons = getLessons();
  return lessons
    .filter(lesson => lesson.cursoId === courseId && lesson.ativo)
    .sort((a, b) => a.ordem - b.ordem);
};

export const getLessonById = (id: string): Lesson | null => {
  const lessons = getLessons();
  return lessons.find(lesson => lesson.id === id) || null;
};

export const updateLesson = (updatedLesson: Lesson): void => {
  saveLesson(updatedLesson);
};

export const deleteLesson = (id: string): void => {
  const lessons = getLessons();
  const lesson = lessons.find(l => l.id === id);
  const filteredLessons = lessons.filter(lesson => lesson.id !== id);
  localStorage.setItem('ead_lessons', JSON.stringify(filteredLessons));
  
  if (lesson) {
    updateCourseStats(lesson.cursoId);
  }
};

// Gestão de Progresso do Usuário
export const saveUserProgress = (progress: UserProgress): void => {
  const allProgress = getAllUserProgress();
  const existingIndex = allProgress.findIndex(p => 
    p.userId === progress.userId && p.cursoId === progress.cursoId
  );
  
  if (existingIndex !== -1) {
    allProgress[existingIndex] = progress;
  } else {
    allProgress.push(progress);
  }
  
  localStorage.setItem('ead_user_progress', JSON.stringify(allProgress));
  
  // Verifica se o curso foi completado
  checkCourseCompletion(progress);
};

export const getAllUserProgress = (): UserProgress[] => {
  const progress = localStorage.getItem('ead_user_progress');
  return progress ? JSON.parse(progress) : [];
};

export const getUserProgress = (userId: string, courseId: string): UserProgress | null => {
  const allProgress = getAllUserProgress();
  return allProgress.find(p => p.userId === userId && p.cursoId === courseId) || null;
};

export const getUserCourseProgress = (userId: string): UserProgress[] => {
  const allProgress = getAllUserProgress();
  return allProgress.filter(p => p.userId === userId);
};

export const markLessonAsWatched = (userId: string, courseId: string, lessonId: string): void => {
  let progress = getUserProgress(userId, courseId);
  
  if (!progress) {
    progress = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      cursoId: courseId,
      aulasAssistidas: [],
      percentualConcluido: 0,
      tempoTotalEstudo: 0,
      dataInicio: new Date().toISOString()
    };
  }
  
  if (!progress.aulasAssistidas.includes(lessonId)) {
    progress.aulasAssistidas.push(lessonId);
    progress.ultimaAulaAssistida = lessonId;
    
    // Calcula percentual
    const totalLessons = getLessonsByCourse(courseId).length;
    progress.percentualConcluido = (progress.aulasAssistidas.length / totalLessons) * 100;
    
    // Adiciona tempo de estudo (estimativa)
    const lesson = getLessonById(lessonId);
    if (lesson) {
      progress.tempoTotalEstudo += lesson.duracaoMinutos || 15;
    }
    
    saveUserProgress(progress);
    
    // Atualiza estatísticas do usuário
    updateUserStats(userId);
  }
};

export const checkCourseCompletion = (progress: UserProgress): void => {
  if (progress.percentualConcluido >= 90 && !progress.dataConclusao) {
    // Marca curso como completo
    progress.dataConclusao = new Date().toISOString();
    
    // Atualiza usuário
    const user = findUserById(progress.userId);
    if (user && !user.cursosCompletos.includes(progress.cursoId)) {
      user.cursosCompletos.push(progress.cursoId);
      user.pontuacao += 100; // Pontos por completar curso
      saveUser(user);
      
      // Cria notificação
      const course = getCourseById(progress.cursoId);
      createNotification(progress.userId, {
        titulo: 'Parabéns! Curso Concluído!',
        mensagem: `Você concluiu o curso "${course?.titulo}". Continue aprendendo!`,
        tipo: 'success',
        link: `/course/${progress.cursoId}`
      });
    }
  }
};

export const updateUserStats = (userId: string): void => {
  const user = findUserById(userId);
  if (!user) return;
  
  const userProgress = getUserCourseProgress(userId);
  
  // Atualiza cursos em andamento
  user.cursosEmAndamento = userProgress
    .filter(p => p.percentualConcluido > 0 && p.percentualConcluido < 90)
    .map(p => p.cursoId);
  
  // Atualiza total de horas de estudo
  user.totalHorasEstudo = userProgress.reduce((total, p) => total + p.tempoTotalEstudo, 0);
  
  saveUser(user);
};

export const updateCourseStats = (courseId: string): void => {
  const course = getCourseById(courseId);
  if (!course) return;
  
  const lessons = getLessonsByCourse(courseId);
  const allProgress = getAllUserProgress();
  const courseProgress = allProgress.filter(p => p.cursoId === courseId);
  
  // Atualiza estatísticas
  course.totalAlunos = courseProgress.length;
  course.duracaoEstimada = lessons.reduce((total, lesson) => total + (lesson.duracaoMinutos || 15), 0);
  
  // Calcula avaliação média
  const avaliacoes = courseProgress.filter(p => p.avaliacaoCurso).map(p => p.avaliacaoCurso!);
  if (avaliacoes.length > 0) {
    course.avaliacaoMedia = avaliacoes.reduce((sum, rating) => sum + rating, 0) / avaliacoes.length;
    course.totalAvaliacoes = avaliacoes.length;
  }
  
  saveCourse(course);
};

// Estatísticas Dinâmicas
export const getUserStats = (userId: string): UserStats => {
  const user = findUserById(userId);
  const userProgress = getUserCourseProgress(userId);
  
  if (!user) {
    return {
      cursosCompletos: 0,
      cursosEmAndamento: 0,
      totalHorasEstudo: 0,
      pontuacao: 0,
      percentualMedioCursos: 0,
      streakDias: 0
    };
  }
  
  const percentualMedio = userProgress.length > 0 
    ? userProgress.reduce((sum, p) => sum + p.percentualConcluido, 0) / userProgress.length
    : 0;
  
  return {
    cursosCompletos: Array.isArray(user.cursosCompletos) ? user.cursosCompletos.length : 0,
    cursosEmAndamento: Array.isArray(user.cursosEmAndamento) ? user.cursosEmAndamento.length : 0,
    totalHorasEstudo: Math.round((user.totalHorasEstudo || 0) / 60 * 10) / 10, // Converte para horas
    pontuacao: user.pontuacao || 0,
    percentualMedioCursos: Math.round(percentualMedio),
    streakDias: calculateStreakDays(userId)
  };
};

export const getCourseStats = (): CourseStats => {
  const courses = getCourses();
  const lessons = getLessons();
  const allProgress = getAllUserProgress();
  const users = getUsers();
  
  const totalHoras = lessons.reduce((total, lesson) => total + (lesson.duracaoMinutos || 15), 0) / 60;
  const cursosCompletos = allProgress.filter(p => p.dataConclusao).length;
  
  // Calcula média de avaliações
  const avaliacoes = allProgress.filter(p => p.avaliacaoCurso).map(p => p.avaliacaoCurso!);
  const mediaAvaliacao = avaliacoes.length > 0 
    ? avaliacoes.reduce((sum, rating) => sum + rating, 0) / avaliacoes.length
    : 0;
  
  return {
    totalCursos: courses.filter(c => c.ativo).length,
    totalAlunos: users.filter(u => u.tipo === 'aluno' && u.ativo).length,
    totalAulas: lessons.filter(l => l.ativo).length,
    horasConteudo: Math.round(totalHoras * 10) / 10,
    cursosCompletos,
    mediaAvaliacao: Math.round(mediaAvaliacao * 10) / 10
  };
};

export const calculateStreakDays = (userId: string): number => {
  // Implementação simplificada - em produção, seria baseado em logs de acesso
  const userProgress = getUserCourseProgress(userId);
  const recentActivity = userProgress.filter(p => {
    const lastActivity = new Date(p.ultimaAulaAssistida || p.dataInicio);
    const daysDiff = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7; // Atividade na última semana
  });
  
  return Math.min(recentActivity.length, 30); // Máximo 30 dias de streak
};

// Utilitários para arquivos - Updated to use new file storage
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const storeFile = async (file: File): Promise<string> => {
  try {
    return await fileStorageManager.storeFile(file);
  } catch (error) {
    console.error('Error storing file:', error);
    throw new Error('Falha ao armazenar arquivo. Verifique o espaço disponível.');
  }
};

export const getStoredFile = async (fileId: string): Promise<File | null> => {
  try {
    return await fileStorageManager.getFile(fileId);
  } catch (error) {
    console.error('Error retrieving file:', error);
    return null;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR');
};