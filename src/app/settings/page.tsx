'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  ArrowLeftIcon,
  UserIcon,
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  BellIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

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

  const settingsSections = [
    {
      title: 'Conta',
      items: [
        {
          title: 'Perfil',
          description: 'Editar informações pessoais',
          icon: UserIcon,
          href: '/settings/profile',
          color: 'blue'
        },
        {
          title: 'Segurança',
          description: 'Senha e configurações de segurança',
          icon: ShieldCheckIcon,
          href: '/settings/security',
          color: 'green'
        }
      ]
    },
    {
      title: 'Dados',
      items: [
        {
          title: 'Exportar Dados',
          description: 'Baixar todos os seus dados financeiros',
          icon: DocumentArrowDownIcon,
          href: '/settings/export',
          color: 'purple'
        },
        {
          title: 'Conquistas',
          description: 'Ver suas conquistas e progresso',
          icon: TrophyIcon,
          href: '/settings/achievements',
          color: 'yellow'
        }
      ]
    },
    {
      title: 'Preferências',
      items: [
        {
          title: 'Notificações',
          description: 'Configurar alertas e lembretes',
          icon: BellIcon,
          href: '/settings/notifications',
          color: 'yellow'
        },
        {
          title: 'Geral',
          description: 'Configurações gerais do app',
          icon: Cog6ToothIcon,
          href: '/settings/general',
          color: 'gray'
        }
      ]
    },
    {
      title: 'Suporte',
      items: [
        {
          title: 'Ajuda',
          description: 'FAQ e guias de uso',
          icon: QuestionMarkCircleIcon,
          href: '/settings/help',
          color: 'indigo'
        },
        {
          title: 'Sobre',
          description: 'Informações sobre o FinanceAnchor',
          icon: InformationCircleIcon,
          href: '/settings/about',
          color: 'pink'
        }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      gray: 'bg-gray-100 text-gray-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      pink: 'bg-pink-100 text-pink-600',
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Configurações
                </h1>
                <p className="text-sm text-gray-600">
                  Gerencie sua conta e preferências
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {user.email}
              </h2>
              <p className="text-sm text-gray-600">
                Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingsSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {section.title}
              </h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <button
                      onClick={() => router.push(item.href)}
                      className="w-full flex items-center space-x-4 p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(item.color)}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-base font-medium text-gray-900">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    {itemIndex < section.items.length - 1 && (
                      <div className="border-t border-gray-100"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* App Info */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              FinanceAnchor
            </h3>
            <p className="text-sm text-gray-600">
              Versão 1.0.0 • Copiloto Financeiro para Casais
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © 2024 FinanceAnchor. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 