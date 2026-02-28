import { motion } from 'framer-motion';

interface LeafInfo {
  id: string;
  completed: boolean;
}

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  leaves?: LeafInfo[];
  children?: React.ReactNode;
}

export default function ProgressRing({
  progress,
  size = 150,
  strokeWidth = 10,
  leaves = [],
  children,
}: ProgressRingProps) {
  // 留足够的 padding 给叶子
  const padding = 28;
  const svgSize = size + padding * 2;
  const center = svgSize / 2;
  const ringRadius = (size - strokeWidth) / 2;
  const vineRadius = ringRadius + strokeWidth / 2 + 4;
  const circumference = 2 * Math.PI * ringRadius;
  const offset = circumference * (1 - Math.min(progress, 1));
  const leafCount = leaves.length;

  // 藤蔓波浪路径
  const vinePoints = 120;
  const vinePathData: string[] = [];
  for (let i = 0; i <= vinePoints; i++) {
    const t = i / vinePoints;
    const angle = -Math.PI / 2 + t * 2 * Math.PI;
    const wobble = Math.sin(t * Math.PI * 8) * 2.5;
    const r = vineRadius + wobble;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    vinePathData.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  const vinePath = vinePathData.join(' ');

  return (
    <div
      className="cb-progress-ring-container"
      style={{ width: svgSize, height: svgSize }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8CB870" />
            <stop offset="50%" stopColor="#6EA550" />
            <stop offset="100%" stopColor="#8CB870" />
          </linearGradient>
        </defs>

        {/* 背景环 */}
        <circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke="rgba(168, 194, 152, 0.2)"
          strokeWidth={strokeWidth}
        />

        {/* 进度弧 */}
        <motion.circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="url(#ringGradient)"
          style={{
            strokeDasharray: circumference,
            transformOrigin: `${center}px ${center}px`,
            transform: 'rotate(-90deg)',
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* 藤蔓线 */}
        {leafCount > 0 && (
          <motion.path
            d={vinePath}
            fill="none"
            stroke="rgba(100, 160, 70, 0.3)"
            strokeWidth={1.5}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}

        {/* 叶子 */}
        {leaves.map((leaf, i) => {
          const angle = -Math.PI / 2 + (2 * Math.PI / leafCount) * i;
          const lx = center + Math.cos(angle) * vineRadius;
          const ly = center + Math.sin(angle) * vineRadius;
          const rotDeg = (angle * 180) / Math.PI + 90;
          const tilt = i % 2 === 0 ? -30 : 30;

          const fillColor = leaf.completed ? '#6EA550' : 'rgba(130, 185, 95, 0.28)';
          const strokeColor = leaf.completed ? '#4D7A35' : 'rgba(130, 185, 95, 0.35)';
          const veinColor = leaf.completed ? 'rgba(255,255,255,0.4)' : 'rgba(130, 185, 95, 0.18)';
          const leafScale = leaf.completed ? 1.1 : 0.9;

          return (
            <motion.g
              key={leaf.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: leafScale }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: 'backOut' }}
              style={{ transformOrigin: `${lx}px ${ly}px` }}
            >
              <g transform={`translate(${lx}, ${ly}) rotate(${rotDeg + tilt}) translate(-11, -18)`}>
                {/* 叶柄 */}
                <line
                  x1="11" y1="24" x2="11" y2="19"
                  stroke={strokeColor}
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                {/* 叶子主体 */}
                <path
                  d="M11 2 C5 5.5, 1.5 11, 4 15.5 C6 19, 9 20, 11 20 C13 20, 16 19, 18 15.5 C20.5 11, 17 5.5, 11 2Z"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="0.8"
                />
                {/* 主叶脉 */}
                <path
                  d="M11 4.5 L11 17.5"
                  stroke={veinColor}
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
                {/* 侧叶脉 */}
                <path
                  d="M11 7.5 L7.5 10.5 M11 11 L7.5 14 M11 7.5 L14.5 10.5 M11 11 L14.5 14"
                  stroke={veinColor}
                  strokeWidth="0.5"
                  strokeLinecap="round"
                />
              </g>
            </motion.g>
          );
        })}
      </svg>

      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || <div className="cb-seed-icon">🌰</div>}
      </div>
    </div>
  );
}
