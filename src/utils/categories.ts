export const DEFAULT_CATEGORIES = [
  'Tecnologia',
  'Design',
  'Marketing',
  'Negócios',
  'Desenvolvimento Pessoal',
  'Idiomas',
  'Ciências',
  'Arte',
  'Música',
  'Saúde',
  'Culinária',
  'Esportes',
  'Educação',
  'Finanças',
  'Fotografia'
];

export const saveCategories = (categories: string[]): void => {
  localStorage.setItem('ead_categories', JSON.stringify(categories));
};

export const getCategories = (): string[] => {
  const categories = localStorage.getItem('ead_categories');
  return categories ? JSON.parse(categories) : DEFAULT_CATEGORIES;
};

export const addCategory = (category: string): void => {
  const categories = getCategories();
  if (!categories.includes(category)) {
    categories.push(category);
    categories.sort();
    saveCategories(categories);
  }
};

export const removeCategory = (category: string): void => {
  const categories = getCategories();
  const filteredCategories = categories.filter(c => c !== category);
  saveCategories(filteredCategories);
};

export const getCategoryIcon = (category: string): string => {
  const icons: { [key: string]: string } = {
    'Tecnologia': '💻',
    'Design': '🎨',
    'Marketing': '📈',
    'Negócios': '💼',
    'Desenvolvimento Pessoal': '🌱',
    'Idiomas': '🌍',
    'Ciências': '🔬',
    'Arte': '🖼️',
    'Música': '🎵',
    'Saúde': '🏥',
    'Culinária': '👨‍🍳',
    'Esportes': '⚽',
    'Educação': '📚',
    'Finanças': '💰',
    'Fotografia': '📸'
  };
  
  return icons[category] || '📖';
};

export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Tecnologia': 'bg-blue-100 text-blue-800',
    'Design': 'bg-purple-100 text-purple-800',
    'Marketing': 'bg-green-100 text-green-800',
    'Negócios': 'bg-gray-100 text-gray-800',
    'Desenvolvimento Pessoal': 'bg-yellow-100 text-yellow-800',
    'Idiomas': 'bg-indigo-100 text-indigo-800',
    'Ciências': 'bg-cyan-100 text-cyan-800',
    'Arte': 'bg-pink-100 text-pink-800',
    'Música': 'bg-orange-100 text-orange-800',
    'Saúde': 'bg-red-100 text-red-800',
    'Culinária': 'bg-amber-100 text-amber-800',
    'Esportes': 'bg-lime-100 text-lime-800',
    'Educação': 'bg-teal-100 text-teal-800',
    'Finanças': 'bg-emerald-100 text-emerald-800',
    'Fotografia': 'bg-violet-100 text-violet-800'
  };
  
  return colors[category] || 'bg-gray-100 text-gray-800';
};