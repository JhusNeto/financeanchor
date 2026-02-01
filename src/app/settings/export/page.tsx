'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isGuestUser, useAuth } from '@/lib/auth';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function ExportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isGuest = isGuestUser(user);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string>('');

  const handleExport = async (type: 'json' | 'excel' | 'pdf') => {
    if (!user) return;
    if (isGuest) {
      alert('Modo visitante: exportação desativada.');
      return;
    }
    
    setIsExporting(true);
    setExportType(type);
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, userId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Erro na exportação');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeanchor-${type}-${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isGuest && (
        <div className="bg-blue-50 border-b border-blue-100 text-blue-700 text-sm px-4 py-3 text-center">
          Você está em modo visitante. A exportação está desativada.
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Exportar Dados
              </h1>
              <p className="text-sm text-gray-600">
                Baixe todos os seus dados financeiros
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DocumentArrowDownIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Exportar meus dados
              </h3>
              <p className="text-blue-700 text-sm leading-relaxed">
                Baixe todos os seus dados financeiros em diferentes formatos. 
                Os dados incluem despesas, orçamentos, dívidas, metas e insights.
                Apenas seus dados pessoais serão exportados.
              </p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* JSON Export */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Exportar em JSON
                </h3>
                <p className="text-sm text-gray-600">
                  Dados estruturados
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Formato ideal para backup e integração com outros sistemas. 
              Todos os dados organizados em um arquivo JSON estruturado.
            </p>
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isExporting && exportType === 'json' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Exportar JSON</span>
                </>
              )}
            </button>
          </div>

          {/* Excel Export */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TableCellsIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Exportar em Excel
                </h3>
                <p className="text-sm text-gray-600">
                  Planilhas organizadas
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Dados organizados em planilhas separadas por categoria. 
              Ideal para análise detalhada e relatórios.
            </p>
            <button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isExporting && exportType === 'excel' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </>
              )}
            </button>
          </div>

          {/* PDF Export */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Exportar em PDF
                </h3>
                <p className="text-sm text-gray-600">
                  Relatório visual
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Relatório visual com resumos e gráficos. 
              Perfeito para compartilhamento e apresentações.
            </p>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isExporting && exportType === 'pdf' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Data Info */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dados incluídos na exportação
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Despesas e receitas</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Orçamentos e categorias</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Dívidas e parcelamentos</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Metas financeiras</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Insights e análises</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Configurações pessoais</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 text-yellow-600 mt-0.5">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Segurança dos dados
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Seus dados são exportados apenas para você. Mantenha os arquivos em local seguro 
                e não compartilhe com terceiros. Os dados são criptografados durante o download.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
