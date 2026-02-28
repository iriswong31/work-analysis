import { useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import type { GoalFormData } from './hooks/useGoalForm';
import {
  FullGoalCard,
  TemplateA,
  TemplateB,
  TemplateC,
  TemplateD
} from './components/cards';
import { getRandomQuotes } from './data/quotes';

interface PreviewPageProps {
  formData: GoalFormData;
  onBack: () => void;
  onReset: () => void;
}

interface CardDownloadButtonProps {
  cardRef: React.RefObject<HTMLDivElement>;
  fileName: string;
  label: string;
  scale?: number;
}

// 检测是否为移动设备
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || (window.innerWidth <= 768);
}

function CardDownloadButton({ cardRef, fileName, label, scale = 3 }: CardDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!cardRef.current || isLoading) return;

    setIsLoading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale,
        backgroundColor: null,
        useCORS: true,
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');
      
      // 移动端显示预览图片供长按保存
      if (isMobileDevice()) {
        setPreviewImage(dataUrl);
      } else {
        // 桌面端直接下载
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('图片生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={handleDownload}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          w-full py-2.5 px-4 rounded-xl text-sm font-medium
          transition-all duration-200
          ${isLoading 
            ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
            : 'bg-[#4A5568] text-white hover:bg-[#2D3748]'
          }
        `}
      >
        {isLoading ? '生成中...' : label}
      </motion.button>
      
      {/* 移动端预览弹窗 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="bg-white rounded-2xl p-4 max-w-[90vw] max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <p className="text-center text-gray-600 text-sm mb-3">📱 长按图片保存到相册</p>
            <img 
              src={previewImage} 
              alt={fileName} 
              className="max-w-full rounded-lg shadow-lg"
              style={{ maxHeight: '70vh' }}
            />
            <button 
              onClick={() => setPreviewImage(null)}
              className="mt-4 w-full py-2.5 bg-[#4A5568] text-white rounded-xl text-sm font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function PreviewPage({ formData, onBack, onReset }: PreviewPageProps) {
  // refs
  const fullCardRef = useRef<HTMLDivElement>(null);
  const templateARef = useRef<HTMLDivElement>(null);
  const templateBRef = useRef<HTMLDivElement>(null);
  const templateCRef = useRef<HTMLDivElement>(null);
  const templateDRef = useRef<HTMLDivElement>(null);
  
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  
  // 生成5个不重复的金句，分配给5张卡片
  const randomQuotes = useMemo(() => getRandomQuotes(5), []);

  // 一键下载全部图片
  const handleDownloadAll = async () => {
    if (isDownloadingAll) return;
    
    setIsDownloadingAll(true);
    
    const cards = [
      { ref: fullCardRef, fileName: '我想要的2026-完整版' },
      { ref: templateARef, fileName: '我想要的2026-四象限版' },
      { ref: templateBRef, fileName: '我想要的2026-每日必做小事' },
      { ref: templateCRef, fileName: '我想要的2026-月度追踪卡' },
      { ref: templateDRef, fileName: '我想要的2026-年度宣言卡' },
    ];
    
    try {
      for (const card of cards) {
        if (!card.ref.current) continue;
        
        const canvas = await html2canvas(card.ref.current, {
          scale: 3,
          backgroundColor: null,
          useCORS: true,
          logging: false
        });
        
        const link = document.createElement('a');
        link.download = `${card.fileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // 间隔下载避免浏览器阻止
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Download all failed:', error);
      alert('部分图片生成失败，请重试');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div 
      className="min-h-screen py-6 px-4"
      style={{ 
        backgroundImage: 'url(/images/bg-2026.jpg)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-[#4A5568] hover:text-[#2D3748] transition-colors flex items-center gap-1 text-sm font-medium"
            style={{ textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}
          >
            ← 返回编辑
          </button>
          <h1 className="text-lg font-semibold text-[#2D3748]" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}>预览与下载</h1>
          <button
            onClick={onReset}
            className="text-[#718096] hover:text-[#4A5568] transition-colors text-sm font-medium"
            style={{ textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}
          >
            重新开始
          </button>
        </div>



        {/* 完整版展示区 */}
        <section className="mb-12">
          
          <div className="flex flex-col items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="shadow-xl rounded-3xl overflow-hidden"
            >
              <FullGoalCard ref={fullCardRef} formData={formData} quote={randomQuotes[4]} />
            </motion.div>
            
            <div className="w-[400px] max-w-full">
              <CardDownloadButton 
                cardRef={fullCardRef} 
                fileName="我想要的2026-完整版" 
                label="下载"
              />
            </div>
          </div>
        </section>

        {/* 四种场景卡片 */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
            {/* A模板：四象限 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="shadow-lg rounded-2xl overflow-hidden">
                <TemplateA ref={templateARef} formData={formData} quote={randomQuotes[0]} />
              </div>
              <div className="w-[360px] max-w-full">
                <CardDownloadButton 
                  cardRef={templateARef} 
                  fileName="我想要的2026-四象限版" 
                  label="下载"
                  scale={3}
                />
              </div>
            </motion.div>

            {/* B模板：每日必做小事 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="shadow-lg rounded-2xl overflow-hidden">
                <TemplateB ref={templateBRef} formData={formData} quote={randomQuotes[1]} />
              </div>
              <div className="w-[360px] max-w-full">
                <CardDownloadButton 
                  cardRef={templateBRef} 
                  fileName="我想要的2026-晨间提醒卡" 
                  label="下载"
                  scale={3}
                />
              </div>
            </motion.div>

            {/* C模板：时间轴 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="shadow-lg rounded-2xl overflow-hidden">
                <TemplateC ref={templateCRef} formData={formData} quote={randomQuotes[2]} />
              </div>
              <div className="w-[360px] max-w-full">
                <CardDownloadButton 
                  cardRef={templateCRef} 
                  fileName="我想要的2026-月度追踪卡" 
                  label="下载"
                  scale={3}
                />
              </div>
            </motion.div>

            {/* D模板：年度宣言 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="shadow-lg rounded-2xl overflow-hidden">
                <TemplateD ref={templateDRef} formData={formData} quote={randomQuotes[3]} />
              </div>
              <div className="w-[360px] max-w-full">
                <CardDownloadButton 
                  cardRef={templateDRef} 
                  fileName="我想要的2026-年度宣言卡" 
                  label="下载"
                  scale={3}
                />
              </div>
            </motion.div>
          </div>
        </section>


      </div>
    </div>
  );
}
