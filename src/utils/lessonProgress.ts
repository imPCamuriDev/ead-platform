import { LessonProgress } from '../types';
import { generateId } from './auth';
import { markLessonAsWatched } from './storage';

// Gestão de Progresso das Aulas
export const saveLessonProgress = (progress: LessonProgress): void => {
  const allProgress = getLessonProgress();
  const existingIndex = allProgress.findIndex(p => 
    p.userId === progress.userId && p.lessonId === progress.lessonId
  );
  
  if (existingIndex !== -1) {
    allProgress[existingIndex] = progress;
  } else {
    allProgress.push(progress);
  }
  
  localStorage.setItem('ead_lesson_progress', JSON.stringify(allProgress));
};

export const getLessonProgress = (): LessonProgress[] => {
  const progress = localStorage.getItem('ead_lesson_progress');
  return progress ? JSON.parse(progress) : [];
};

export const getUserLessonProgress = (userId: string, lessonId: string): LessonProgress | null => {
  const allProgress = getLessonProgress();
  return allProgress.find(p => p.userId === userId && p.lessonId === lessonId) || null;
};

export const updateLessonProgress = (
  userId: string,
  lessonId: string,
  cursoId: string,
  tempoAssistido: number,
  duracaoTotal: number
): LessonProgress => {
  let progress = getUserLessonProgress(userId, lessonId);
  
  if (!progress) {
    progress = {
      id: generateId(),
      userId,
      lessonId,
      cursoId,
      tempoAssistido: 0,
      duracaoTotal,
      percentualAssistido: 0,
      concluida: false,
      dataInicio: new Date().toISOString()
    };
  }
  
  // Update progress
  progress.tempoAssistido = Math.max(progress.tempoAssistido, tempoAssistido);
  progress.duracaoTotal = duracaoTotal;
  progress.percentualAssistido = duracaoTotal > 0 ? (progress.tempoAssistido / duracaoTotal) * 100 : 0;
  
  // Mark as completed if watched 90% or more
  if (progress.percentualAssistido >= 90 && !progress.concluida) {
    progress.concluida = true;
    progress.dataConclusao = new Date().toISOString();
    
    // Mark lesson as watched in the main system
    markLessonAsWatched(userId, cursoId, lessonId);
  }
  
  saveLessonProgress(progress);
  return progress;
};

export const markLessonAsCompleted = (userId: string, lessonId: string, cursoId: string): void => {
  let progress = getUserLessonProgress(userId, lessonId);
  
  if (!progress) {
    progress = {
      id: generateId(),
      userId,
      lessonId,
      cursoId,
      tempoAssistido: 0,
      duracaoTotal: 0,
      percentualAssistido: 100,
      concluida: true,
      dataInicio: new Date().toISOString(),
      dataConclusao: new Date().toISOString()
    };
  } else {
    progress.concluida = true;
    progress.percentualAssistido = 100;
    progress.dataConclusao = new Date().toISOString();
  }
  
  saveLessonProgress(progress);
  markLessonAsWatched(userId, cursoId, lessonId);
};

export const isLessonCompleted = (userId: string, lessonId: string): boolean => {
  const progress = getUserLessonProgress(userId, lessonId);
  return progress ? progress.concluida : false;
};