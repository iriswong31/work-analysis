import { motion } from 'framer-motion';

interface WelcomePageProps {
  onStart: () => void;
}

export function WelcomePage({ onStart }: WelcomePageProps) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: 'url(/images/bg-2026.jpg)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center flex flex-col items-center justify-center"
      >
        {/* 水晶球容器 - 玻璃质感风格 */}
        <motion.button
          onClick={onStart}
          initial={{ scale: 0.9 }}
          animate={{ 
            scale: 1,
            y: [0, -10, 0]
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ 
            scale: { type: 'spring', stiffness: 300 },
            y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="w-[280px] h-[280px] flex flex-col items-center justify-center relative"
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            padding: 0
          }}
        >
          {/* 外层光晕 */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(139, 170, 209, 0.3) 0%, transparent 70%)',
              filter: 'blur(20px)',
              transform: 'scale(1.2)'
            }}
          />
          
          {/* 玻璃球主体 */}
          <div 
            className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 50% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(82, 109, 147, 0.85) 0%, rgba(45, 65, 100, 0.9) 50%, rgba(35, 50, 80, 0.95) 100%)
              `,
              boxShadow: `
                inset 0 -30px 60px rgba(0, 0, 0, 0.3),
                inset 0 30px 60px rgba(255, 255, 255, 0.1),
                0 4px 20px rgba(0, 0, 0, 0.3),
                0 0 60px rgba(139, 170, 209, 0.2)
              `,
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {/* 顶部高光 */}
            <div 
              className="absolute"
              style={{
                top: '8%',
                left: '20%',
                width: '60%',
                height: '30%',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.25) 0%, transparent 70%)',
                borderRadius: '50%'
              }}
            />
            
            {/* 边缘光泽 */}
            <div 
              className="absolute inset-2 rounded-full"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'transparent'
              }}
            />

            {/* 星座装饰 - 左侧星座图案（仙后座风格） */}
            <svg 
              className="absolute" 
              style={{ 
                left: '8%', 
                top: '20%', 
                width: '40%', 
                height: '55%',
                opacity: 0.15
              }}
              viewBox="0 0 100 100"
            >
              {/* 星座连线 */}
              <line x1="20" y1="30" x2="45" y2="20" stroke="white" strokeWidth="0.8" />
              <line x1="45" y1="20" x2="70" y2="35" stroke="white" strokeWidth="0.8" />
              <line x1="70" y1="35" x2="55" y2="60" stroke="white" strokeWidth="0.8" />
              <line x1="55" y1="60" x2="30" y2="70" stroke="white" strokeWidth="0.8" />
              <line x1="30" y1="70" x2="20" y2="30" stroke="white" strokeWidth="0.8" />
              <line x1="45" y1="20" x2="55" y2="60" stroke="white" strokeWidth="0.8" />
              {/* 星点 */}
              <circle cx="20" cy="30" r="2.5" fill="white" />
              <circle cx="45" cy="20" r="3" fill="white" />
              <circle cx="70" cy="35" r="2" fill="white" />
              <circle cx="55" cy="60" r="2.5" fill="white" />
              <circle cx="30" cy="70" r="2" fill="white" />
            </svg>

            {/* 星座装饰 - 右下星座图案（天秤座风格） */}
            <svg 
              className="absolute" 
              style={{ 
                right: '8%', 
                bottom: '18%', 
                width: '35%', 
                height: '45%',
                opacity: 0.13
              }}
              viewBox="0 0 80 80"
            >
              {/* 星座连线 */}
              <line x1="15" y1="25" x2="40" y2="15" stroke="white" strokeWidth="0.6" />
              <line x1="40" y1="15" x2="60" y2="30" stroke="white" strokeWidth="0.6" />
              <line x1="60" y1="30" x2="50" y2="55" stroke="white" strokeWidth="0.6" />
              <line x1="50" y1="55" x2="25" y2="50" stroke="white" strokeWidth="0.6" />
              <line x1="25" y1="50" x2="15" y2="25" stroke="white" strokeWidth="0.6" />
              {/* 星点 */}
              <circle cx="15" cy="25" r="2" fill="white" />
              <circle cx="40" cy="15" r="2.5" fill="white" />
              <circle cx="60" cy="30" r="1.8" fill="white" />
              <circle cx="50" cy="55" r="2" fill="white" />
              <circle cx="25" cy="50" r="1.5" fill="white" />
            </svg>

            {/* 星座装饰 - 顶部小星座（北斗七星风格） */}
            <svg 
              className="absolute" 
              style={{ 
                left: '30%', 
                top: '8%', 
                width: '40%', 
                height: '25%',
                opacity: 0.1
              }}
              viewBox="0 0 100 40"
            >
              <line x1="10" y1="20" x2="25" y2="15" stroke="white" strokeWidth="0.5" />
              <line x1="25" y1="15" x2="40" y2="18" stroke="white" strokeWidth="0.5" />
              <line x1="40" y1="18" x2="55" y2="12" stroke="white" strokeWidth="0.5" />
              <line x1="55" y1="12" x2="70" y2="20" stroke="white" strokeWidth="0.5" />
              <line x1="70" y1="20" x2="85" y2="15" stroke="white" strokeWidth="0.5" />
              <circle cx="10" cy="20" r="1.5" fill="white" />
              <circle cx="25" cy="15" r="1.8" fill="white" />
              <circle cx="40" cy="18" r="1.5" fill="white" />
              <circle cx="55" cy="12" r="2" fill="white" />
              <circle cx="70" cy="20" r="1.5" fill="white" />
              <circle cx="85" cy="15" r="1.8" fill="white" />
            </svg>

            {/* 星座装饰 - 底部星座（猎户座风格） */}
            <svg 
              className="absolute" 
              style={{ 
                left: '25%', 
                bottom: '5%', 
                width: '50%', 
                height: '20%',
                opacity: 0.08
              }}
              viewBox="0 0 120 40"
            >
              <line x1="20" y1="10" x2="40" y2="20" stroke="white" strokeWidth="0.5" />
              <line x1="40" y1="20" x2="60" y2="15" stroke="white" strokeWidth="0.5" />
              <line x1="60" y1="15" x2="80" y2="20" stroke="white" strokeWidth="0.5" />
              <line x1="80" y1="20" x2="100" y2="10" stroke="white" strokeWidth="0.5" />
              <circle cx="20" cy="10" r="1.5" fill="white" />
              <circle cx="40" cy="20" r="1.2" fill="white" />
              <circle cx="60" cy="15" r="2" fill="white" />
              <circle cx="80" cy="20" r="1.2" fill="white" />
              <circle cx="100" cy="10" r="1.5" fill="white" />
            </svg>

            {/* 右上角小星座 */}
            <svg 
              className="absolute" 
              style={{ 
                right: '12%', 
                top: '15%', 
                width: '20%', 
                height: '20%',
                opacity: 0.1
              }}
              viewBox="0 0 50 50"
            >
              <line x1="10" y1="30" x2="25" y2="10" stroke="white" strokeWidth="0.5" />
              <line x1="25" y1="10" x2="40" y2="25" stroke="white" strokeWidth="0.5" />
              <line x1="40" y1="25" x2="25" y2="40" stroke="white" strokeWidth="0.5" />
              <circle cx="10" cy="30" r="1.5" fill="white" />
              <circle cx="25" cy="10" r="2" fill="white" />
              <circle cx="40" cy="25" r="1.5" fill="white" />
              <circle cx="25" cy="40" r="1.2" fill="white" />
            </svg>

            {/* 散落的小星点 - 更多 */}
            <div className="absolute inset-0">
              <div className="absolute" style={{ left: '18%', top: '55%', width: '3px', height: '3px', background: 'white', borderRadius: '50%', opacity: 0.18 }} />
              <div className="absolute" style={{ left: '75%', top: '22%', width: '2px', height: '2px', background: 'white', borderRadius: '50%', opacity: 0.15 }} />
              <div className="absolute" style={{ left: '65%', top: '65%', width: '2.5px', height: '2.5px', background: 'white', borderRadius: '50%', opacity: 0.12 }} />
              <div className="absolute" style={{ left: '28%', top: '18%', width: '2px', height: '2px', background: 'white', borderRadius: '50%', opacity: 0.15 }} />
              <div className="absolute" style={{ left: '82%', top: '48%', width: '2px', height: '2px', background: 'white', borderRadius: '50%', opacity: 0.1 }} />
              <div className="absolute" style={{ left: '12%', top: '70%', width: '2px', height: '2px', background: 'white', borderRadius: '50%', opacity: 0.12 }} />
              <div className="absolute" style={{ left: '88%', top: '35%', width: '1.5px', height: '1.5px', background: 'white', borderRadius: '50%', opacity: 0.1 }} />
              <div className="absolute" style={{ left: '45%', top: '85%', width: '2px', height: '2px', background: 'white', borderRadius: '50%', opacity: 0.08 }} />
              <div className="absolute" style={{ left: '55%', top: '10%', width: '1.5px', height: '1.5px', background: 'white', borderRadius: '50%', opacity: 0.12 }} />
              <div className="absolute" style={{ left: '22%', top: '42%', width: '2px', height: '2px', background: 'white', borderRadius: '50%', opacity: 0.1 }} />
              <div className="absolute" style={{ left: '78%', top: '72%', width: '1.5px', height: '1.5px', background: 'white', borderRadius: '50%', opacity: 0.08 }} />
              <div className="absolute" style={{ left: '35%', top: '75%', width: '2px', height: '2px', background: 'white', borderRadius: '50%', opacity: 0.1 }} />
            </div>

            {/* 文字内容 */}
            <div 
              className="text-center z-10 relative"
              style={{
                color: '#F0E6D3',
                textShadow: '0 0 25px rgba(240, 230, 211, 0.5), 0 2px 6px rgba(0, 0, 0, 0.35)'
              }}
            >
              <div style={{
                fontFamily: '"SF Pro Display", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
                fontSize: '22px',
                fontWeight: 600,
                letterSpacing: '6px',
                marginBottom: '4px',
                opacity: 0.95
              }}>
                我想要的
              </div>
              <div style={{
                fontFamily: '"SF Pro Display", "Helvetica Neue", Arial, sans-serif',
                fontSize: '60px',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '2px'
              }}>
                2026
              </div>
            </div>
          </div>
        </motion.button>

        {/* 方法来源说明 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm mt-10 max-w-xs leading-relaxed"
          style={{ 
            color: '#4A5568',
            textShadow: '0 1px 2px rgba(255,255,255,0.6)'
          }}
        >
          基于 Dan Koe 的文章<br/>
          《How to Fix Your Entire Life in 1 Day》<br/>
          提到的「反愿景 → 愿景」目标设定方法
        </motion.p>
      </motion.div>
    </div>
  );
}
