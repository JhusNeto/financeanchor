'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { createGoal, uploadGoalImage } from '@/lib/goals';
import { CreateGoalData, validateGoalData, formatCurrency, getGoalEmoji } from '@/types/goal';

export default function NewGoalPage() {
  const [formData, setFormData] = useState<CreateGoalData>({
    title: '',
    target_amount: 0,
    current_amount: 0,
    deadline: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error } = await getCurrentUser();

      if (error || !currentUser) {
        router.push('/auth/login');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      router.push('/auth/login');
    }
  };

  const handleInputChange = (field: keyof CreateGoalData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erros quando o usuário começa a digitar
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }

      setSelectedImage(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    try {
      const { url, error } = await uploadGoalImage(selectedImage);
      
      if (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        alert('Erro ao fazer upload da imagem. Tente novamente.');
        return;
      }

      if (url) {
        setFormData(prev => ({ ...prev, image_url: url }));
        alert('Imagem enviada com sucesso!');
      }
    } catch (error) {
      console.error('Erro inesperado ao fazer upload da imagem:', error);
      alert('Erro inesperado. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);

    // Validar dados
    const validation = validateGoalData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setSaving(false);
      return;
    }

    try {
      const { goal, error } = await createGoal(formData);
      
      if (error) {
        console.error('Erro ao criar meta:', error);
        setErrors(['Erro ao salvar meta. Tente novamente.']);
        setSaving(false);
        return;
      }

      if (goal) {
        // Redirecionar para a página da meta
        router.push('/goal');
      }
    } catch (error) {
      console.error('Erro inesperado ao criar meta:', error);
      setErrors(['Erro inesperado. Tente novamente.']);
      setSaving(false);
    }
  };

  const calculateMonths = () => {
    if (!formData.deadline) return 0;
    const deadline = new Date(formData.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(diffMonths, 0);
  };

  const calculateDailySavings = () => {
    if (!formData.target_amount || formData.target_amount <= 0 || calculateMonths() <= 0) return 0;
    const months = calculateMonths();
    const dailyAmount = (formData.target_amount - (formData.current_amount || 0)) / (months * 30);
    return Math.max(dailyAmount, 0);
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link 
              href="/goal"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Nova Meta</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Criar Nova Meta</h2>
            <p className="text-gray-600 mt-1">Defina seu objetivo principal e comece a trabalhar para alcançá-lo.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Mensagens de erro */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erro ao salvar meta</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nome da meta */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Meta *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Viagem para Europa, Carro novo..."
                required
              />
            </div>

            {/* Valor alvo */}
            <div>
              <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 mb-2">
                Valor Alvo *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  id="target_amount"
                  value={formData.target_amount || ''}
                  onChange={(e) => handleInputChange('target_amount', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>

            {/* Valor atual (opcional) */}
            <div>
              <label htmlFor="current_amount" className="block text-sm font-medium text-gray-700 mb-2">
                Valor Atual (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  id="current_amount"
                  value={formData.current_amount || ''}
                  onChange={(e) => handleInputChange('current_amount', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Prazo */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Prazo Final *
              </label>
              <input
                type="date"
                id="deadline"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Upload de imagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem da Meta (opcional)
              </label>
              
              {/* Preview da imagem */}
              {imagePreview && (
                <div className="mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}

              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Selecionar Imagem
                </button>
                
                {selectedImage && (
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Enviar Imagem</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {formData.image_url && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Imagem enviada com sucesso!
                </div>
              )}
            </div>

            {/* Resumo calculado */}
            {formData.target_amount > 0 && formData.deadline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Resumo da Meta</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600">Meses para o prazo:</p>
                    <p className="font-semibold text-blue-800">{calculateMonths()} meses</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Economia diária sugerida:</p>
                    <p className="font-semibold text-blue-800">{formatCurrency(calculateDailySavings())}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Valor alvo:</p>
                    <p className="font-semibold text-blue-800">{formatCurrency(formData.target_amount)}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Valor atual:</p>
                    <p className="font-semibold text-blue-800">{formatCurrency(formData.current_amount || 0)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex items-center justify-between pt-6">
              <Link
                href="/goal"
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Criar Meta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 