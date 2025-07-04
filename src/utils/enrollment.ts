import { CourseEnrollment } from '../types';
import { generateId } from './auth';
import { createNotification } from './auth';

// Gestão de Matrículas
export const saveEnrollment = (enrollment: CourseEnrollment): void => {
  const enrollments = getEnrollments();
  const existingIndex = enrollments.findIndex(e => e.id === enrollment.id);
  
  if (existingIndex !== -1) {
    enrollments[existingIndex] = enrollment;
  } else {
    enrollments.push(enrollment);
  }
  
  localStorage.setItem('ead_enrollments', JSON.stringify(enrollments));
};

export const getEnrollments = (): CourseEnrollment[] => {
  const enrollments = localStorage.getItem('ead_enrollments');
  return enrollments ? JSON.parse(enrollments) : [];
};

export const getEnrollmentsByCourse = (cursoId: string): CourseEnrollment[] => {
  const enrollments = getEnrollments();
  return enrollments.filter(e => e.cursoId === cursoId);
};

export const getUserEnrollments = (userId: string): CourseEnrollment[] => {
  const enrollments = getEnrollments();
  return enrollments.filter(e => e.userId === userId);
};

export const getUserCourseEnrollment = (userId: string, cursoId: string): CourseEnrollment | null => {
  const enrollments = getEnrollments();
  return enrollments.find(e => e.userId === userId && e.cursoId === cursoId) || null;
};

export const isUserEnrolledInCourse = (userId: string, cursoId: string): boolean => {
  const enrollment = getUserCourseEnrollment(userId, cursoId);
  return enrollment ? enrollment.status === 'aprovado' : false;
};

export const requestEnrollment = (
  cursoId: string,
  userId: string,
  userName: string,
  userEmail: string,
  observacoes?: string
): CourseEnrollment => {
  // Verificar se já existe uma matrícula
  const existingEnrollment = getUserCourseEnrollment(userId, cursoId);
  if (existingEnrollment) {
    throw new Error('Você já possui uma solicitação de matrícula para este curso');
  }

  const newEnrollment: CourseEnrollment = {
    id: generateId(),
    cursoId,
    userId,
    userName,
    userEmail,
    status: 'pendente',
    dataMatricula: new Date().toISOString(),
    observacoes
  };

  saveEnrollment(newEnrollment);

  // Criar notificação para o usuário
  createNotification(userId, {
    titulo: 'Solicitação de Matrícula Enviada',
    mensagem: 'Sua solicitação de matrícula foi enviada e está aguardando aprovação.',
    tipo: 'info'
  });

  return newEnrollment;
};

export const approveEnrollment = (
  enrollmentId: string,
  approvedBy: string
): void => {
  const enrollments = getEnrollments();
  const enrollment = enrollments.find(e => e.id === enrollmentId);
  
  if (!enrollment) {
    throw new Error('Matrícula não encontrada');
  }

  enrollment.status = 'aprovado';
  enrollment.dataAprovacao = new Date().toISOString();
  enrollment.aprovadoPor = approvedBy;

  saveEnrollment(enrollment);

  // Criar notificação para o aluno
  createNotification(enrollment.userId, {
    titulo: 'Matrícula Aprovada!',
    mensagem: 'Sua matrícula foi aprovada! Agora você pode acessar o curso.',
    tipo: 'success',
    link: `/course/${enrollment.cursoId}`
  });
};

export const rejectEnrollment = (
  enrollmentId: string,
  rejectedBy: string,
  observacoes?: string
): void => {
  const enrollments = getEnrollments();
  const enrollment = enrollments.find(e => e.id === enrollmentId);
  
  if (!enrollment) {
    throw new Error('Matrícula não encontrada');
  }

  enrollment.status = 'rejeitado';
  enrollment.dataAprovacao = new Date().toISOString();
  enrollment.aprovadoPor = rejectedBy;
  if (observacoes) {
    enrollment.observacoes = observacoes;
  }

  saveEnrollment(enrollment);

  // Criar notificação para o aluno
  createNotification(enrollment.userId, {
    titulo: 'Matrícula Rejeitada',
    mensagem: `Sua solicitação de matrícula foi rejeitada. ${observacoes || ''}`,
    tipo: 'warning'
  });
};

export const autoApproveEnrollment = (
  cursoId: string,
  userId: string,
  userName: string,
  userEmail: string
): CourseEnrollment => {
  const newEnrollment: CourseEnrollment = {
    id: generateId(),
    cursoId,
    userId,
    userName,
    userEmail,
    status: 'aprovado',
    dataMatricula: new Date().toISOString(),
    dataAprovacao: new Date().toISOString(),
    aprovadoPor: 'sistema'
  };

  saveEnrollment(newEnrollment);

  // Criar notificação para o usuário
  createNotification(userId, {
    titulo: 'Matrícula Realizada!',
    mensagem: 'Você foi matriculado no curso com sucesso!',
    tipo: 'success',
    link: `/course/${cursoId}`
  });

  return newEnrollment;
};

export const getPendingEnrollments = (): CourseEnrollment[] => {
  const enrollments = getEnrollments();
  return enrollments.filter(e => e.status === 'pendente');
};

export const getPendingEnrollmentsByCourse = (cursoId: string): CourseEnrollment[] => {
  const enrollments = getEnrollments();
  return enrollments.filter(e => e.cursoId === cursoId && e.status === 'pendente');
};

export const getApprovedEnrollmentsByCourse = (cursoId: string): CourseEnrollment[] => {
  const enrollments = getEnrollments();
  return enrollments.filter(e => e.cursoId === cursoId && e.status === 'aprovado');
};