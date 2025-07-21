import React from 'react';
import { motion } from 'framer-motion';

interface MiniChartProps {
  data: number[];
  type: 'bar' | 'line' | 'area' | 'progress';
  color?: string;
  height?: number;
  className?: string;
}

const MiniChart: React.FC<MiniChartProps> = ({
  data,
  type,
  color = '#3b82f6',
  height = 48,
  className = ''
}) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const width = 100;
  const padding = 4;

  const renderBarChart = () => {
    const barWidth = (width - padding * 2) / data.length;
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`barGradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {data.map((value, index) => {
          const barHeight = range === 0 ? height / 2 : ((value - min) / range) * (height - padding * 2);
          const x = padding + index * barWidth + barWidth * 0.1;
          const y = height - padding - barHeight;
          
          return (
            <motion.rect
              key={index}
              x={x}
              y={y}
              width={barWidth * 0.8}
              height={barHeight}
              fill={`url(#barGradient-${color.replace('#', '')})`}
              rx="2"
              initial={{ height: 0, y: height - padding }}
              animate={{ height: barHeight, y }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            />
          );
        })}
      </svg>
    );
  };

  const renderLineChart = () => {
    const pointWidth = (width - padding * 2) / (data.length - 1);
    
    const pathData = data.map((value, index) => {
      const x = padding + index * pointWidth;
      const y = range === 0 ? height / 2 : padding + ((max - value) / range) * (height - padding * 2);
      return index === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <motion.path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
    );
  };

  const renderAreaChart = () => {
    const pointWidth = (width - padding * 2) / (data.length - 1);
    
    const pathData = data.map((value, index) => {
      const x = padding + index * pointWidth;
      const y = range === 0 ? height / 2 : padding + ((max - value) / range) * (height - padding * 2);
      return index === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    }).join(' ');

    const areaData = `${pathData} L ${padding + (data.length - 1) * pointWidth},${height - padding} L ${padding},${height - padding} Z`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`areaGradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaData}
          fill={`url(#areaGradient-${color.replace('#', '')})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
    );
  };

  const renderProgressChart = () => {
    const progress = data[0] || 0;
    const normalizedProgress = Math.min(100, Math.max(0, progress));
    
    return (
      <div className="relative w-full bg-gray-800 rounded-full h-2">
        <motion.div
          className="h-2 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}80)`,
            boxShadow: `0 0 8px ${color}40`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${normalizedProgress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      case 'progress':
        return renderProgressChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {renderChart()}
    </div>
  );
};

export default MiniChart; 