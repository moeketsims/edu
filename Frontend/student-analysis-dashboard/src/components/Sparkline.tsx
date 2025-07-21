import React from 'react';
import { motion } from 'framer-motion';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#8b5cf6',
  height = 32,
  className = ''
}) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  if (range === 0) return null;

  const width = 120;
  const padding = 2;
  const pointWidth = (width - padding * 2) / (data.length - 1);

  const points = data.map((value, index) => {
    const x = padding + index * pointWidth;
    const y = padding + ((max - value) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const pathData = data.map((value, index) => {
    const x = padding + index * pointWidth;
    const y = padding + ((max - value) / range) * (height - padding * 2);
    return index === 0 ? `M ${x},${y}` : `L ${x},${y}`;
  }).join(' ');

  return (
    <div className={`relative ${className}`}>
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <motion.path
          d={`${pathData} L ${padding + (data.length - 1) * pointWidth},${height - padding} L ${padding},${height - padding} Z`}
          fill={`url(#gradient-${color.replace('#', '')})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        
        {/* Line path */}
        <motion.path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Data points */}
        {data.map((value, index) => {
          const x = padding + index * pointWidth;
          const y = padding + ((max - value) / range) * (height - padding * 2);
          
          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className="hover:r-3 transition-all duration-200"
              style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default Sparkline; 