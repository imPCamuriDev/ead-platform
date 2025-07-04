import React, { useState, useEffect } from 'react';
import { Star, Heart, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  getRatingsByCourse, 
  getUserCourseRating, 
  createCourseRating, 
  toggleRatingLike,
  getCourseAverageRating,
  formatTimeAgo 
} from '../../utils/comments';
import { CourseRating } from '../../types';

interface CourseRatingProps {
  courseId: string;
  courseName: string;
}

const CourseRatingComponent: React.FC<CourseRatingProps> = ({ courseId, courseName }) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<CourseRating[]>([]);
  const [userRating, setUserRating] = useState<CourseRating | null>(null);
  const [averageRating, setAverageRating] = useState({ average: 0, total: 0 });
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    loadRatings();
  }, [courseId]);

  const loadRatings = () => {
    const courseRatings = getRatingsByCourse(courseId);
    setRatings(courseRatings);
    
    const avgRating = getCourseAverageRating(courseId);
    setAverageRating(avgRating);
    
    if (user) {
      const userCourseRating = getUserCourseRating(courseId, user.id);
      setUserRating(userCourseRating);
    }
  };

  const handleSubmitRating = () => {
    if (!user || newRating === 0) return;

    createCourseRating(
      courseId,
      user.id,
      user.nickname || user.nome,
      newRating,
      newComment.trim(),
      user.fotoPerfil
    );

    loadRatings();
    setShowRatingForm(false);
    setNewRating(0);
    setNewComment('');
  };

  const handleLikeRating = (ratingId: string) => {
    if (!user) return;
    toggleRatingLike(ratingId, user.id);
    loadRatings();
  };

  const renderStars = (rating: number, interactive: boolean = false, size: string = 'w-5 h-5') => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} cursor-pointer transition-colors ${
              star <= (interactive ? (hoveredStar || newRating) : rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
            onClick={interactive ? () => setNewRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredStar(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // 1-5 stars
    ratings.forEach(rating => {
      if (rating.avaliacao >= 1 && rating.avaliacao <= 5) {
        distribution[rating.avaliacao - 1]++;
      }
    });
    return distribution;
  };

  const distribution = getRatingDistribution();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Avaliações do Curso</h3>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800 mb-2">
            {averageRating.average.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mb-2">
            {renderStars(averageRating.average)}
          </div>
          <p className="text-gray-600">
            {averageRating.total} {averageRating.total === 1 ? 'avaliação' : 'avaliações'}
          </p>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 w-8">{star}</span>
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${averageRating.total > 0 ? (distribution[star - 1] / averageRating.total) * 100 : 0}%`
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-8">{distribution[star - 1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User Rating Form */}
      {user && (
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          {userRating ? (
            <div className="text-center">
              <p className="text-gray-600 mb-2">Sua avaliação:</p>
              <div className="flex items-center justify-center space-x-2 mb-2">
                {renderStars(userRating.avaliacao)}
                <span className="text-gray-600">({userRating.avaliacao}/5)</span>
              </div>
              {userRating.comentario && (
                <p className="text-gray-700 italic">"{userRating.comentario}"</p>
              )}
              <button
                onClick={() => setShowRatingForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Editar avaliação
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Avalie este curso:</p>
              <button
                onClick={() => setShowRatingForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Avaliar Curso
              </button>
            </div>
          )}

          {showRatingForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center mb-4">
                <p className="text-gray-700 mb-3">Como você avalia este curso?</p>
                {renderStars(newRating, true, 'w-8 h-8')}
                {newRating > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {newRating === 1 && 'Muito ruim'}
                    {newRating === 2 && 'Ruim'}
                    {newRating === 3 && 'Regular'}
                    {newRating === 4 && 'Bom'}
                    {newRating === 5 && 'Excelente'}
                  </p>
                )}
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Compartilhe sua experiência com este curso (opcional)..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowRatingForm(false);
                    setNewRating(0);
                    setNewComment('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={newRating === 0}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Avaliação</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ratings List */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-800">
          Comentários dos Alunos ({ratings.length})
        </h4>

        {ratings.map((rating) => (
          <div key={rating.id} className="border-b border-gray-100 pb-6 last:border-b-0">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {rating.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-medium text-gray-800">{rating.userName}</span>
                  <div className="flex items-center space-x-1">
                    {renderStars(rating.avaliacao, false, 'w-4 h-4')}
                  </div>
                  <span className="text-sm text-gray-500">{formatTimeAgo(rating.dataCriacao)}</span>
                </div>
                
                {rating.comentario && (
                  <p className="text-gray-700 mb-3">{rating.comentario}</p>
                )}
                
                <button
                  onClick={() => handleLikeRating(rating.id)}
                  className={`flex items-center space-x-1 text-sm transition-colors ${
                    rating.curtidoPorUsuario 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${rating.curtidoPorUsuario ? 'fill-current' : ''}`} />
                  <span>{rating.curtidas}</span>
                  <span className="ml-1">Útil</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {ratings.length === 0 && (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Seja o primeiro a avaliar este curso!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseRatingComponent;