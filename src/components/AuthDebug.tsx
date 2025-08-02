'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getProfile } from '@/lib/auth';

export default function AuthDebug() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error: userError } = await getCurrentUser();
      
      if (userError) {
        console.error('Erro ao obter usuário:', userError);
      } else {
        setUser(currentUser);
        
        if (currentUser) {
          const { profile: userProfile, error: profileError } = await getProfile(currentUser.id);
          
          if (profileError) {
            console.error('Erro ao obter perfil:', profileError);
          } else {
            setProfile(userProfile);
          }
        }
      }
    } catch (error) {
      console.error('Erro geral:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Carregando debug...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 text-sm">
      <h3 className="font-bold mb-2">Debug de Autenticação</h3>
      
      <div className="mb-2">
        <strong>Usuário:</strong>
        <pre className="bg-white p-2 rounded mt-1 overflow-auto">
          {user ? JSON.stringify(user, null, 2) : 'Não autenticado'}
        </pre>
      </div>
      
      <div className="mb-2">
        <strong>Perfil:</strong>
        <pre className="bg-white p-2 rounded mt-1 overflow-auto">
          {profile ? JSON.stringify(profile, null, 2) : 'Perfil não encontrado'}
        </pre>
      </div>
      
      <div className="mb-2">
        <strong>Status:</strong>
        <span className={`ml-2 px-2 py-1 rounded text-xs ${
          user && profile ? 'bg-green-200 text-green-800' : 
          user && !profile ? 'bg-yellow-200 text-yellow-800' : 
          'bg-red-200 text-red-800'
        }`}>
          {user && profile ? '✅ Tudo OK' : 
           user && !profile ? '⚠️ Usuário sem perfil' : 
           '❌ Não autenticado'}
        </span>
      </div>
    </div>
  );
} 