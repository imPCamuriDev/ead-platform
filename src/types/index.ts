export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string;
  tipo: 'professor' | 'administrador' | 'aluno';
  dataCriacao: string;
  ultimoLogin?: string;
  ativo: boolean;
  // Perfil personalizado
  nickname?: string;
  fotoPerfil?: string; // Base64
  descricao?: string;
  telefone?: string;
  endereco?: string;
  dataNascimento?: string;
  // Estatísticas
  cursosCompletos: string[]; // IDs dos cursos
  cursosEmAndamento: string[]; // IDs dos cursos
  totalHorasEstudo: number;
  pontuacao: number;
}

export interface Course {
  id: string;
  titulo: string;
  descricao: string;
  professorId: string;
  professorNome: string;
  dataCriacao: string;
  thumbnail?: string;
  categoria: string;
  nivel?: 'iniciante' | 'intermediario' | 'avancado';
  duracaoEstimada?: number; // em minutos
  tags?: string[];
  ativo?: boolean;
  preco?: number;
  // Configurações de acesso
  publico: boolean; // true = público, false = privado
  // Estatísticas
  totalAlunos?: number;
  avaliacaoMedia?: number;
  totalAvaliacoes?: number;
}

export interface Lesson {
  id: string;
  cursoId: string;
  titulo: string;
  descricao: string;
  videoFileId?: string; // Changed from videoData to videoFileId
  videoName?: string;
  materiais: Material[];
  ordem: number;
  dataCriacao: string;
  duracaoMinutos?: number;
  ativo?: boolean;
}

export interface Material {
  id: string;
  nome: string;
  tipo: 'pdf' | 'imagem' | 'link' | 'video' | 'outro';
  conteudo: string; // For links, this is the URL. For files, this is the fileId
  tamanho?: number;
  dataCriacao?: string;
  fileId?: string; // Added for file storage reference
}

export interface UserProgress {
  id: string;
  userId: string;
  cursoId: string;
  aulasAssistidas: string[]; // IDs das aulas
  percentualConcluido: number;
  tempoTotalEstudo: number; // em minutos
  ultimaAulaAssistida?: string;
  dataInicio: string;
  dataConclusao?: string;
  avaliacaoCurso?: number;
  comentario?: string;
}

export interface Notification {
  id: string;
  userId: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  lida: boolean;
  dataCriacao: string;
  link?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface CourseStats {
  totalCursos: number;
  totalAlunos: number;
  totalAulas: number;
  horasConteudo: number;
  cursosCompletos: number;
  mediaAvaliacao: number;
}

export interface UserStats {
  cursosCompletos: number;
  cursosEmAndamento: number;
  totalHorasEstudo: number;
  pontuacao: number;
  percentualMedioCursos: number;
  streakDias: number;
}

// New interfaces for comments and ratings
export interface LessonComment {
  id: string;
  lessonId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comentario: string;
  dataCriacao: string;
  respostas: LessonCommentReply[];
  curtidas: number;
  curtidoPorUsuario?: boolean;
}

export interface LessonCommentReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comentario: string;
  dataCriacao: string;
  curtidas: number;
  curtidoPorUsuario?: boolean;
}

export interface CourseRating {
  id: string;
  cursoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  avaliacao: number; // 1-5 stars
  comentario: string;
  dataCriacao: string;
  curtidas: number;
  curtidoPorUsuario?: boolean;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  cursoId: string;
  tempoAssistido: number; // em segundos
  duracaoTotal: number; // em segundos
  percentualAssistido: number;
  concluida: boolean;
  dataInicio: string;
  dataConclusao?: string;
}

// New interfaces for enrollment system
export interface CourseEnrollment {
  id: string;
  cursoId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  dataMatricula: string;
  dataAprovacao?: string;
  aprovadoPor?: string; // ID do professor/admin que aprovou
  observacoes?: string;
}

// New interfaces for chat system
export interface CourseChat {
  id: string;
  cursoId: string;
  curseName: string;
  participantes: string[]; // IDs dos usuários matriculados
  dataCriacao: string;
  ativo: boolean;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userType: 'professor' | 'administrador' | 'aluno';
  mensagem: string;
  dataCriacao: string;
  editado?: boolean;
  dataEdicao?: string;
  tipo: 'texto' | 'arquivo' | 'imagem';
  anexo?: {
    nome: string;
    tipo: string;
    tamanho: number;
    url: string;
  };
}

// Search interfaces
export interface SearchResult {
  type: 'course' | 'lesson' | 'material';
  id: string;
  title: string;
  description: string;
  courseId?: string;
  courseName?: string;
  professorName?: string;
  categoria?: string;
  relevance: number;
}

export interface SearchFilters {
  categoria?: string;
  nivel?: string;
  tipo?: 'publico' | 'privado';
  professor?: string;
  duracao?: 'curta' | 'media' | 'longa';
  avaliacao?: number;
}