import { SearchResult, SearchFilters } from '../types';
import { getCourses, getLessons } from './storage';

export const searchContent = (query: string, filters?: SearchFilters): SearchResult[] => {
  const courses = getCourses();
  const lessons = getLessons();
  const results: SearchResult[] = [];
  
  if (!query.trim() && !filters) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  // Buscar em cursos
  courses.forEach(course => {
    let relevance = 0;
    let matches = false;

    // Verificar filtros primeiro
    if (filters) {
      if (filters.categoria && course.categoria !== filters.categoria) return;
      if (filters.nivel && course.nivel !== filters.nivel) return;
      if (filters.tipo && ((filters.tipo === 'publico') !== course.publico)) return;
      if (filters.professor && !course.professorNome.toLowerCase().includes(filters.professor.toLowerCase())) return;
      if (filters.avaliacao && (course.avaliacaoMedia || 0) < filters.avaliacao) return;
    }

    // Busca por texto
    if (searchTerm) {
      // Título (peso 3)
      if (course.titulo.toLowerCase().includes(searchTerm)) {
        relevance += 3;
        matches = true;
      }

      // Descrição (peso 2)
      if (course.descricao.toLowerCase().includes(searchTerm)) {
        relevance += 2;
        matches = true;
      }

      // Professor (peso 2)
      if (course.professorNome.toLowerCase().includes(searchTerm)) {
        relevance += 2;
        matches = true;
      }

      // Categoria (peso 1)
      if (course.categoria.toLowerCase().includes(searchTerm)) {
        relevance += 1;
        matches = true;
      }

      // Tags (peso 1)
      if (course.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
        relevance += 1;
        matches = true;
      }
    } else if (filters) {
      // Se não há busca por texto mas há filtros, incluir
      matches = true;
      relevance = 1;
    }

    if (matches) {
      results.push({
        type: 'course',
        id: course.id,
        title: course.titulo,
        description: course.descricao,
        professorName: course.professorNome,
        categoria: course.categoria,
        relevance
      });
    }
  });

  // Buscar em aulas (apenas se há termo de busca)
  if (searchTerm) {
    lessons.forEach(lesson => {
      let relevance = 0;
      let matches = false;
      const course = courses.find(c => c.id === lesson.cursoId);

      if (!course) return;

      // Aplicar filtros do curso
      if (filters) {
        if (filters.categoria && course.categoria !== filters.categoria) return;
        if (filters.nivel && course.nivel !== filters.nivel) return;
        if (filters.tipo && ((filters.tipo === 'publico') !== course.publico)) return;
        if (filters.professor && !course.professorNome.toLowerCase().includes(filters.professor.toLowerCase())) return;
      }

      // Título da aula (peso 3)
      if (lesson.titulo.toLowerCase().includes(searchTerm)) {
        relevance += 3;
        matches = true;
      }

      // Descrição da aula (peso 2)
      if (lesson.descricao.toLowerCase().includes(searchTerm)) {
        relevance += 2;
        matches = true;
      }

      // Materiais (peso 1)
      if (lesson.materiais.some(material => 
        material.nome.toLowerCase().includes(searchTerm)
      )) {
        relevance += 1;
        matches = true;
      }

      if (matches) {
        results.push({
          type: 'lesson',
          id: lesson.id,
          title: lesson.titulo,
          description: lesson.descricao,
          courseId: course.id,
          courseName: course.titulo,
          professorName: course.professorNome,
          categoria: course.categoria,
          relevance
        });
      }
    });

    // Buscar em materiais
    lessons.forEach(lesson => {
      const course = courses.find(c => c.id === lesson.cursoId);
      if (!course) return;

      // Aplicar filtros do curso
      if (filters) {
        if (filters.categoria && course.categoria !== filters.categoria) return;
        if (filters.nivel && course.nivel !== filters.nivel) return;
        if (filters.tipo && ((filters.tipo === 'publico') !== course.publico)) return;
        if (filters.professor && !course.professorNome.toLowerCase().includes(filters.professor.toLowerCase())) return;
      }

      lesson.materiais.forEach(material => {
        let relevance = 0;
        let matches = false;

        // Nome do material (peso 2)
        if (material.nome.toLowerCase().includes(searchTerm)) {
          relevance += 2;
          matches = true;
        }

        // Tipo do material (peso 1)
        if (material.tipo.toLowerCase().includes(searchTerm)) {
          relevance += 1;
          matches = true;
        }

        if (matches) {
          results.push({
            type: 'material',
            id: material.id,
            title: material.nome,
            description: `Material da aula: ${lesson.titulo}`,
            courseId: course.id,
            courseName: course.titulo,
            professorName: course.professorNome,
            categoria: course.categoria,
            relevance
          });
        }
      });
    });
  }

  // Ordenar por relevância
  return results.sort((a, b) => b.relevance - a.relevance);
};

export const getAvailableCategories = (): string[] => {
  const courses = getCourses();
  const categories = [...new Set(courses.map(course => course.categoria))];
  return categories.sort();
};

export const getAvailableProfessors = (): string[] => {
  const courses = getCourses();
  const professors = [...new Set(courses.map(course => course.professorNome))];
  return professors.sort();
};

export const getPopularSearchTerms = (): string[] => {
  // Em uma implementação real, isso viria de analytics
  return [
    'React',
    'JavaScript',
    'Python',
    'Web Development',
    'Data Science',
    'Machine Learning',
    'Design',
    'Marketing'
  ];
};

export const saveSearchHistory = (query: string, userId: string): void => {
  const history = getSearchHistory(userId);
  const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 10);
  localStorage.setItem(`ead_search_history_${userId}`, JSON.stringify(newHistory));
};

export const getSearchHistory = (userId: string): string[] => {
  const history = localStorage.getItem(`ead_search_history_${userId}`);
  return history ? JSON.parse(history) : [];
};

export const clearSearchHistory = (userId: string): void => {
  localStorage.removeItem(`ead_search_history_${userId}`);
};