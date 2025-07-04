import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  BookOpen, 
  PlayCircle, 
  FileText, 
  Star, 
  Clock, 
  Users,
  Globe,
  Lock,
  X
} from 'lucide-react';
import { searchContent, getAvailableCategories, getAvailableProfessors } from '../../utils/search';
import { getCategoryIcon, getCategoryColor } from '../../utils/categories';
import { SearchResult, SearchFilters } from '../../types';

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    categoria: searchParams.get('categoria') || '',
    nivel: searchParams.get('nivel') || '',
    tipo: searchParams.get('tipo') as 'publico' | 'privado' || '',
    professor: searchParams.get('professor') || ''
  });

  const categories = getAvailableCategories();
  const professors = getAvailableProfessors();

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const performSearch = async () => {
    setLoading(true);
    
    try {
      const query = searchParams.get('q') || '';
      const searchFilters: SearchFilters = {
        categoria: searchParams.get('categoria') || undefined,
        nivel: searchParams.get('nivel') as any || undefined,
        tipo: searchParams.get('tipo') as 'publico' | 'privado' || undefined,
        professor: searchParams.get('professor') || undefined
      };

      const searchResults = searchContent(query, searchFilters);
      setResults(searchResults);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = (newFilters: SearchFilters, newQuery?: string) => {
    const params = new URLSearchParams();
    
    if (newQuery !== undefined) {
      if (newQuery.trim()) params.set('q', newQuery.trim());
    } else {
      const currentQuery = searchParams.get('q');
      if (currentQuery) params.set('q', currentQuery);
    }
    
    if (newFilters.categoria) params.set('categoria', newFilters.categoria);
    if (newFilters.nivel) params.set('nivel', newFilters.nivel);
    if (newFilters.tipo) params.set('tipo', newFilters.tipo);
    if (newFilters.professor) params.set('professor', newFilters.professor);
    
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams(filters, searchTerm);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  const clearFilters = () => {
    const newFilters: SearchFilters = {};
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'course') {
      navigate(`/course/${result.id}`);
    } else if (result.type === 'lesson') {
      navigate(`/lesson/${result.id}`);
    } else if (result.type === 'material' && result.courseId) {
      navigate(`/course/${result.courseId}`);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-5 h-5" />;
      case 'lesson':
        return <PlayCircle className="w-5 h-5" />;
      case 'material':
        return <FileText className="w-5 h-5" />;
      default:
        return <Search className="w-5 h-5" />;
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'course':
        return 'Curso';
      case 'lesson':
        return 'Aula';
      case 'material':
        return 'Material';
      default:
        return 'Item';
    }
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-700';
      case 'lesson':
        return 'bg-green-100 text-green-700';
      case 'material':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Resultados da Busca</h1>
          <p className="text-gray-600 mt-1">
            {searchParams.get('q') && `Resultados para "${searchParams.get('q')}"`}
            {results.length > 0 && ` - ${results.length} ${results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar cursos, aulas, materiais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                hasActiveFilters 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={filters.categoria || ''}
                  onChange={(e) => handleFilterChange('categoria', e.target.value)}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Nível</label>
                <select
                  value={filters.nivel || ''}
                  onChange={(e) => handleFilterChange('nivel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os níveis</option>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={filters.tipo || ''}
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os tipos</option>
                  <option value="publico">Público</option>
                  <option value="privado">Privado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professor</label>
                <select
                  value={filters.professor || ''}
                  onChange={(e) => handleFilterChange('professor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os professores</option>
                  {professors.map(professor => (
                    <option key={professor} value={professor}>
                      {professor}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.categoria && (
                    <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span>Categoria: {filters.categoria}</span>
                      <button
                        onClick={() => handleFilterChange('categoria', '')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.nivel && (
                    <span className="inline-flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      <span>Nível: {filters.nivel}</span>
                      <button
                        onClick={() => handleFilterChange('nivel', '')}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.tipo && (
                    <span className="inline-flex items-center space-x-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      <span>Tipo: {filters.tipo}</span>
                      <button
                        onClick={() => handleFilterChange('tipo', '')}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.professor && (
                    <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                      <span>Professor: {filters.professor}</span>
                      <button
                        onClick={() => handleFilterChange('professor', '')}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Buscando...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar sua busca ou filtros para encontrar o que procura
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Verifique a ortografia das palavras</p>
              <p>• Use termos mais gerais</p>
              <p>• Remova alguns filtros</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    result.type === 'course' ? 'bg-blue-100 text-blue-600' :
                    result.type === 'lesson' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {getResultIcon(result.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{result.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultTypeColor(result.type)}`}>
                        {getResultTypeLabel(result.type)}
                      </span>
                      {result.categoria && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(result.categoria)}`}>
                          {getCategoryIcon(result.categoria)} {result.categoria}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{result.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {result.professorName && (
                        <span>Professor: {result.professorName}</span>
                      )}
                      {result.courseName && result.type !== 'course' && (
                        <span>Curso: {result.courseName}</span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Star className="w-4 h-4" />
                        <span>Relevância: {result.relevance}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;