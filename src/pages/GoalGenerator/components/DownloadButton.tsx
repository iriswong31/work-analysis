import { useState } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';

interface DownloadButtonProps {
  cardRef: React.RefObject<HTMLDivElement>;
  themeName: string;
}

export function DownloadButton({ cardRef, themeName }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || isLoading) return;

    setIsLoading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false
      });

      const link = document.createElement('a');
      link.download = `我想要的2026.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
      alert('图片生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleDownload}
      disabled={isLoading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full py-3 rounded-xl font-medium text-white
        transition-all duration-200
        ${isLoading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-gradient-to-r from-[#7cb342] to-[#558b2f] hover:shadow-lg'
        }
      `}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          生成中...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <span>📥</span>
          下载目标卡
        </span>
      )}
    </motion.button>
  );
}
