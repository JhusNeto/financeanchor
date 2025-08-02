'use client';
import { useEffect } from 'react';

interface HapticFeedbackProps {
  children: React.ReactNode;
}

export default function HapticFeedback({ children }: HapticFeedbackProps) {
  useEffect(() => {
    // Função para feedback tátil
    const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if ('vibrate' in navigator) {
        switch (type) {
          case 'light':
            navigator.vibrate(10);
            break;
          case 'medium':
            navigator.vibrate(50);
            break;
          case 'heavy':
            navigator.vibrate(100);
            break;
        }
      }
    };

    // Adicionar feedback tátil a botões e links
    const addHapticToElements = () => {
      const interactiveElements = document.querySelectorAll('button, a, [role="button"], input[type="submit"], input[type="button"]');
      
      interactiveElements.forEach(element => {
        const handleInteraction = () => {
          hapticFeedback('light');
        };

        element.addEventListener('click', handleInteraction);
        element.addEventListener('touchstart', handleInteraction);
      });
    };

    // Adicionar feedback para ações importantes
    const addHapticToActions = () => {
      // Feedback para navegação
      const handleNavigation = () => {
        hapticFeedback('medium');
      };

      // Feedback para ações de sucesso
      const handleSuccess = () => {
        hapticFeedback('medium');
      };

      // Feedback para ações de erro
      const handleError = () => {
        hapticFeedback('heavy');
      };

      // Adicionar listeners para eventos customizados
      document.addEventListener('navigation', handleNavigation);
      document.addEventListener('success', handleSuccess);
      document.addEventListener('error', handleError);

      return () => {
        document.removeEventListener('navigation', handleNavigation);
        document.removeEventListener('success', handleSuccess);
        document.removeEventListener('error', handleError);
      };
    };

    // Adicionar feedback para scroll
    const addHapticToScroll = () => {
      let lastScrollTop = 0;
      let scrollTimeout: NodeJS.Timeout;

      const handleScroll = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
        
        clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
          if (Math.abs(scrollTop - lastScrollTop) > 100) {
            hapticFeedback('light');
          }
        }, 100);

        lastScrollTop = scrollTop;
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    };

    // Inicializar feedback tátil
    const cleanupNavigation = addHapticToActions();
    const cleanupScroll = addHapticToScroll();

    // Adicionar feedback após um pequeno delay para garantir que o DOM está pronto
    setTimeout(addHapticToElements, 100);

    return () => {
      cleanupNavigation();
      cleanupScroll();
    };
  }, []);

  return <>{children}</>;
} 