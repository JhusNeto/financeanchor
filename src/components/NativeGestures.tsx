'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface NativeGesturesProps {
  children: React.ReactNode;
  enableSwipeBack?: boolean;
  enableDoubleTap?: boolean;
}

export default function NativeGestures({ 
  children, 
  enableSwipeBack = true, 
  enableDoubleTap = true 
}: NativeGesturesProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const lastTap = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      touchEndY.current = e.changedTouches[0].clientY;
      
      handleSwipe();
      handleDoubleTap();
    };

    const handleSwipe = () => {
      if (!enableSwipeBack) return;

      const diffX = touchStartX.current - touchEndX.current;
      const diffY = touchStartY.current - touchEndY.current;
      
      // Verificar se é um swipe horizontal significativo
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        // Swipe da esquerda para direita (voltar)
        if (diffX > 0 && touchStartX.current < 50) {
          router.back();
        }
        // Swipe da direita para esquerda (avançar)
        else if (diffX < 0 && touchStartX.current > window.innerWidth - 50) {
          router.forward();
        }
      }
    };

    const handleDoubleTap = () => {
      if (!enableDoubleTap) return;

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap.current;
      
      if (tapLength < 500 && tapLength > 0) {
        // Double tap detectado
        handleDoubleTapAction();
      }
      
      lastTap.current = currentTime;
    };

    const handleDoubleTapAction = () => {
      // Scroll para o topo na double tap
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

    // Adicionar listeners para gestos de teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      // Voltar com Alt+Left ou Backspace
      if ((e.altKey && e.key === 'ArrowLeft') || e.key === 'Backspace') {
        e.preventDefault();
        router.back();
      }
      // Avançar com Alt+Right
      else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        router.forward();
      }
      // Home para ir ao topo
      else if (e.key === 'Home') {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      // End para ir ao final
      else if (e.key === 'End') {
        e.preventDefault();
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, enableSwipeBack, enableDoubleTap]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {children}
    </div>
  );
} 