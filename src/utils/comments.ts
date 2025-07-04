import { LessonComment, LessonCommentReply, CourseRating } from '../types';
import { generateId } from './auth';

// Gestão de Comentários das Aulas
export const saveLessonComment = (comment: LessonComment): void => {
  const comments = getLessonComments();
  const existingIndex = comments.findIndex(c => c.id === comment.id);
  
  if (existingIndex !== -1) {
    comments[existingIndex] = comment;
  } else {
    comments.push(comment);
  }
  
  localStorage.setItem('ead_lesson_comments', JSON.stringify(comments));
};

export const getLessonComments = (): LessonComment[] => {
  const comments = localStorage.getItem('ead_lesson_comments');
  return comments ? JSON.parse(comments) : [];
};

export const getCommentsByLesson = (lessonId: string): LessonComment[] => {
  const comments = getLessonComments();
  return comments
    .filter(comment => comment.lessonId === lessonId)
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
};

export const createLessonComment = (
  lessonId: string,
  userId: string,
  userName: string,
  comentario: string,
  userAvatar?: string
): LessonComment => {
  const newComment: LessonComment = {
    id: generateId(),
    lessonId,
    userId,
    userName,
    userAvatar,
    comentario,
    dataCriacao: new Date().toISOString(),
    respostas: [],
    curtidas: 0,
    curtidoPorUsuario: false
  };
  
  saveLessonComment(newComment);
  return newComment;
};

export const replyToComment = (
  commentId: string,
  userId: string,
  userName: string,
  comentario: string,
  userAvatar?: string
): void => {
  const comments = getLessonComments();
  const comment = comments.find(c => c.id === commentId);
  
  if (comment) {
    const reply: LessonCommentReply = {
      id: generateId(),
      userId,
      userName,
      userAvatar,
      comentario,
      dataCriacao: new Date().toISOString(),
      curtidas: 0,
      curtidoPorUsuario: false
    };
    
    comment.respostas.push(reply);
    saveLessonComment(comment);
  }
};

export const toggleCommentLike = (commentId: string, userId: string): void => {
  const comments = getLessonComments();
  const comment = comments.find(c => c.id === commentId);
  
  if (comment) {
    if (comment.curtidoPorUsuario) {
      comment.curtidas = Math.max(0, comment.curtidas - 1);
      comment.curtidoPorUsuario = false;
    } else {
      comment.curtidas += 1;
      comment.curtidoPorUsuario = true;
    }
    
    saveLessonComment(comment);
  }
};

export const toggleReplyLike = (commentId: string, replyId: string, userId: string): void => {
  const comments = getLessonComments();
  const comment = comments.find(c => c.id === commentId);
  
  if (comment) {
    const reply = comment.respostas.find(r => r.id === replyId);
    if (reply) {
      if (reply.curtidoPorUsuario) {
        reply.curtidas = Math.max(0, reply.curtidas - 1);
        reply.curtidoPorUsuario = false;
      } else {
        reply.curtidas += 1;
        reply.curtidoPorUsuario = true;
      }
      
      saveLessonComment(comment);
    }
  }
};

// Gestão de Avaliações dos Cursos
export const saveCourseRating = (rating: CourseRating): void => {
  const ratings = getCourseRatings();
  const existingIndex = ratings.findIndex(r => r.id === rating.id);
  
  if (existingIndex !== -1) {
    ratings[existingIndex] = rating;
  } else {
    ratings.push(rating);
  }
  
  localStorage.setItem('ead_course_ratings', JSON.stringify(ratings));
};

export const getCourseRatings = (): CourseRating[] => {
  const ratings = localStorage.getItem('ead_course_ratings');
  return ratings ? JSON.parse(ratings) : [];
};

export const getRatingsByCourse = (cursoId: string): CourseRating[] => {
  const ratings = getCourseRatings();
  return ratings
    .filter(rating => rating.cursoId === cursoId)
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
};

export const getUserCourseRating = (cursoId: string, userId: string): CourseRating | null => {
  const ratings = getCourseRatings();
  return ratings.find(r => r.cursoId === cursoId && r.userId === userId) || null;
};

export const createCourseRating = (
  cursoId: string,
  userId: string,
  userName: string,
  avaliacao: number,
  comentario: string,
  userAvatar?: string
): CourseRating => {
  // Check if user already rated this course
  const existingRating = getUserCourseRating(cursoId, userId);
  
  if (existingRating) {
    // Update existing rating
    existingRating.avaliacao = avaliacao;
    existingRating.comentario = comentario;
    existingRating.dataCriacao = new Date().toISOString();
    saveCourseRating(existingRating);
    return existingRating;
  } else {
    // Create new rating
    const newRating: CourseRating = {
      id: generateId(),
      cursoId,
      userId,
      userName,
      userAvatar,
      avaliacao,
      comentario,
      dataCriacao: new Date().toISOString(),
      curtidas: 0,
      curtidoPorUsuario: false
    };
    
    saveCourseRating(newRating);
    return newRating;
  }
};

export const toggleRatingLike = (ratingId: string, userId: string): void => {
  const ratings = getCourseRatings();
  const rating = ratings.find(r => r.id === ratingId);
  
  if (rating) {
    if (rating.curtidoPorUsuario) {
      rating.curtidas = Math.max(0, rating.curtidas - 1);
      rating.curtidoPorUsuario = false;
    } else {
      rating.curtidas += 1;
      rating.curtidoPorUsuario = true;
    }
    
    saveCourseRating(rating);
  }
};

export const getCourseAverageRating = (cursoId: string): { average: number; total: number } => {
  const ratings = getRatingsByCourse(cursoId);
  
  if (ratings.length === 0) {
    return { average: 0, total: 0 };
  }
  
  const sum = ratings.reduce((acc, rating) => acc + rating.avaliacao, 0);
  const average = sum / ratings.length;
  
  return {
    average: Math.round(average * 10) / 10,
    total: ratings.length
  };
};

export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora mesmo';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min atrás`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h atrás`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d atrás`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
};