import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Menu, X, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FullPageContainerProps {
  children: React.ReactNode[];
  sectionNames: string[];
  onSectionChange?: (index: number) => void;
}

export const FullPageContainer: React.FC<FullPageContainerProps> = ({
  children,
  sectionNames,
  onSectionChange,
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const navigate = useNavigate();

  const totalSections = children.length;

  const goToSection = useCallback((index: number) => {
    if (index < 0 || index >= totalSections || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSection(index);
    onSectionChange?.(index);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [totalSections, isTransitioning, onSectionChange]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (isTransitioning) return;
    
    if (e.deltaY > 50) {
      goToSection(currentSection + 1);
    } else if (e.deltaY < -50) {
      goToSection(currentSection - 1);
    }
  }, [currentSection, goToSection, isTransitioning]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isTransitioning) return;
    
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        goToSection(currentSection + 1);
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        goToSection(currentSection - 1);
        break;
      case 'Home':
        e.preventDefault();
        goToSection(0);
        break;
      case 'End':
        e.preventDefault();
        goToSection(totalSections - 1);
        break;
    }
  }, [currentSection, goToSection, isTransitioning, totalSections]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (isTransitioning) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToSection(currentSection + 1);
      } else {
        goToSection(currentSection - 1);
      }
    }
  }, [currentSection, goToSection, isTransitioning]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleKeyDown, handleTouchStart, handleTouchEnd]);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-[#0F172A]">
      {/* Home Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-full bg-slate-800/80 text-white hover:bg-blue-600 transition-all duration-300"
      >
        <Home className="w-5 h-5" />
      </button>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-slate-800/80 text-white hover:bg-blue-600 transition-all duration-300 md:hidden"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-xl z-40 p-6 pt-16 md:hidden"
          >
            <nav className="space-y-2">
              {sectionNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => {
                    goToSection(index);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg transition-all duration-300
                    ${currentSection === index 
                      ? 'bg-blue-500/20 text-blue-400 border-l-2 border-blue-400' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <span className="text-xs text-slate-500 mr-2">{String(index + 1).padStart(2, '0')}</span>
                  {name}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Dots */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
        {sectionNames.map((name, index) => (
          <button
            key={index}
            onClick={() => goToSection(index)}
            className="group flex items-center gap-3 cursor-pointer"
          >
            <span className={`
              text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100
              ${currentSection === index ? 'text-blue-400' : 'text-slate-400'}
            `}>
              {name}
            </span>
            <span className={`
              w-3 h-3 rounded-full transition-all duration-300 border-2
              ${currentSection === index 
                ? 'bg-blue-500 border-blue-400 scale-125' 
                : 'bg-transparent border-slate-500 hover:border-blue-400'}
            `} />
          </button>
        ))}
      </nav>

      {/* Section Counter */}
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-4 text-slate-400">
        <span className="text-4xl font-bold text-blue-400">
          {String(currentSection + 1).padStart(2, '0')}
        </span>
        <span className="text-lg">/</span>
        <span className="text-lg">{String(totalSections).padStart(2, '0')}</span>
      </div>

      {/* Navigation Arrows */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-2">
        <button
          onClick={() => goToSection(currentSection - 1)}
          disabled={currentSection === 0}
          className={`
            p-3 rounded-full transition-all duration-300
            ${currentSection === 0 
              ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' 
              : 'bg-slate-800/80 text-white hover:bg-blue-600'}
          `}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => goToSection(currentSection + 1)}
          disabled={currentSection === totalSections - 1}
          className={`
            p-3 rounded-full transition-all duration-300
            ${currentSection === totalSections - 1 
              ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' 
              : 'bg-slate-800/80 text-white hover:bg-blue-600'}
          `}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-full w-full"
        >
          {children[currentSection]}
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSection + 1) / totalSections) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

export default FullPageContainer;
