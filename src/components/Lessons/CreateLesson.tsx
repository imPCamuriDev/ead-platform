import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Upload, Plus, Save, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { getCourseById } from '../../utils/storage';
import { saveLesson, getLessonsByCourse, storeFile, formatFileSize } from '../../utils/storage';
import { checkStorageSpace } from '../../utils/fileStorage';
import { generateId } from '../../utils/auth';
import { Lesson, Material } from '../../types';

const CreateLesson: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: ''
  });

  const course = getCourseById(courseId!);
  const existingLessons = getLessonsByCourse(courseId!);

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Curso não encontrado</h2>
        <button
          onClick={() => navigate('/courses')}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Voltar aos Cursos
        </button>
      </div>
    );
  }

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let videoFileId = '';
      let videoName = '';

      if (videoFile) {
        // Check storage space before uploading
        const hasSpace = await checkStorageSpace(videoFile.size);
        if (!hasSpace) {
          throw new Error('Espaço de armazenamento insuficiente. Tente um arquivo menor ou limpe alguns dados.');
        }

        setUploadProgress({ video: 0 });
        videoFileId = await storeFile(videoFile);
        videoName = videoFile.name;
        setUploadProgress({ video: 100 });
      }

      const newLesson: Lesson = {
        id: generateId(),
        cursoId: courseId!,
        titulo: formData.titulo,
        descricao: formData.descricao,
        videoFileId,
        videoName,
        materiais: materials,
        ordem: existingLessons.length + 1,
        dataCriacao: new Date().toISOString()
      };

      saveLesson(newLesson);
      showSuccess('Aula criada com sucesso!');
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate(`/course/${courseId}`);
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao criar aula:', error);
      
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        showError('Espaço de armazenamento esgotado. Tente usar arquivos menores ou limpe dados antigos.');
      } else if (error.message.includes('espaço')) {
        showError(error.message);
      } else {
        showError('Erro ao criar aula. Tente novamente com arquivos menores.');
      }
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verifica se é um arquivo de vídeo
      if (!file.type.startsWith('video/')) {
        showError('Por favor, selecione um arquivo de vídeo válido');
        return;
      }

      // Check file size (limit to 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        showError('Arquivo muito grande. O tamanho máximo é 100MB.');
        return;
      }

      // Check available storage space
      const hasSpace = await checkStorageSpace(file.size);
      if (!hasSpace) {
        showError('Espaço de armazenamento insuficiente para este arquivo.');
        return;
      }

      setVideoFile(file);
      setError('');
    }
  };

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Check file size (limit to 50MB for materials)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          showError('Arquivo muito grande. O tamanho máximo para materiais é 50MB.');
          return;
        }

        // Check available storage space
        const hasSpace = await checkStorageSpace(file.size);
        if (!hasSpace) {
          showError('Espaço de armazenamento insuficiente para este arquivo.');
          return;
        }

        setUploadProgress({ [`material_${file.name}`]: 0 });
        const fileId = await storeFile(file);
        
        const newMaterial: Material = {
          id: generateId(),
          nome: file.name,
          tipo: file.type.includes('pdf') ? 'pdf' : 
                file.type.includes('image') ? 'imagem' : 'outro',
          conteudo: fileId, // Store file ID instead of base64
          fileId: fileId,
          tamanho: file.size
        };
        
        setMaterials([...materials, newMaterial]);
        setUploadProgress({ [`material_${file.name}`]: 100 });
        
        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[`material_${file.name}`];
            return newProgress;
          });
        }, 2000);
      } catch (error: any) {
        console.error('Erro ao carregar arquivo:', error);
        if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
          showError('Espaço de armazenamento esgotado. Tente um arquivo menor.');
        } else {
          showError('Erro ao carregar arquivo. Tente novamente.');
        }
      }
    }
  };

  const addLink = () => {
    const url = prompt('Digite o URL do link:');
    if (url) {
      const name = prompt('Digite o nome do link:') || 'Link';
      const newMaterial: Material = {
        id: generateId(),
        nome: name,
        tipo: 'link',
        conteudo: url
      };
      setMaterials([...materials, newMaterial]);
    }
  };

  const removeMaterial = (materialId: string) => {
    setMaterials(materials.filter(m => m.id !== materialId));
  };

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Criar Nova Aula</h1>
          <p className="text-gray-600 mt-1">Curso: {course.titulo}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Informações da Aula</h2>
              <p className="text-gray-600">Aula #{existingLessons.length + 1}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                Título da Aula *
              </label>
              <input
                type="text"
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Introdução aos Hooks"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordem da Aula
              </label>
              <input
                type="text"
                value={`Aula ${existingLessons.length + 1}`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Aula *
            </label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva o conteúdo da aula..."
              required
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Vídeo da Aula</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {videoFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <PlayCircle className="w-8 h-8 text-green-500" />
                    <span className="text-lg font-medium text-gray-800">{videoFile.name}</span>
                  </div>
                  <p className="text-gray-600">{formatFileSize(videoFile.size)}</p>
                  {uploadProgress.video !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.video}%` }}
                      ></div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remover vídeo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Clique para selecionar um vídeo
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-gray-500 text-sm mt-2">MP4, MOV, AVI até 100MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Materiais de Apoio</h3>
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Arquivo
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    onChange={handleMaterialUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={addLink}
                  className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Link
                </button>
              </div>
            </div>

            {materials.length > 0 && (
              <div className="space-y-3">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">{material.nome}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {material.tipo} {material.tamanho && `• ${formatFileSize(material.tamanho)}`}
                        </p>
                        {uploadProgress[`material_${material.nome}`] !== undefined && (
                          <div className="w-32 bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="bg-green-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[`material_${material.nome}`]}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMaterial(material.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Criando...' : 'Criar Aula'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/course/${courseId}`)}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLesson;