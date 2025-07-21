import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { ResponsiveContainer, Area, AreaChart } from 'recharts';

interface SparklineData {
  value: number;
  time: number;
}

interface EnhancedMetricCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  trend: string;
  trendColor: string;
  borderColor: string;
  sparklineData?: SparklineData[];
  suffix?: string;
  colorTheme?: string;
}

const EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  icon,
  value,
  label,
  trend,
  trendColor,
  borderColor,
  sparklineData = [],
  suffix = '',
  colorTheme = '#10b981'
}) => {
  // Generate mock sparkline data if none provided
  const defaultSparklineData = sparklineData.length > 0 
    ? sparklineData 
    : Array.from({ length: 20 }, (_, i) => ({
        value: Math.floor(Math.random() * 20) + 75 + Math.sin(i * 0.3) * 8,
        time: i
      }));

  const trendValue = trend;
  const isPositiveTrend = trendColor === 'text-emerald-800';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }} // Very subtle lift
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 card-hover"
    >
             {/* Header */}
       <div className="flex items-center justify-between mb-4">
         <div className="p-2.5 rounded-lg bg-gray-50">
           <div className="w-5 h-5 text-gray-600">
             {icon}
           </div>
         </div>
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md
            ${isPositiveTrend ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}
        >
          {isPositiveTrend ? '↑' : '↓'} {trendValue}
        </motion.div>
      </div>
      
      {/* Value */}
      <div className="mb-3">
        <div className="text-3xl font-bold text-gray-900 tabular-nums">
          <CountUp
            end={value}
            duration={1.2}
            separator=","
            suffix={suffix}
            preserveValue
          />
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
      
      {/* Improved Sparkline */}
      <div className="h-12 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={defaultSparklineData}>
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorTheme} stopOpacity={0.2} />
                <stop offset="100%" stopColor={colorTheme} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="natural" // Smoother curves
              dataKey="value"
              stroke={colorTheme}
              strokeWidth={1.5}
              fill={`url(#gradient-${label})`}
              animationDuration={800} // Faster animation
              animationEasing="ease-out"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '70%' }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="h-full bg-gray-300 rounded-full"
          style={{ backgroundColor: colorTheme, opacity: 0.5 }}
        />
      </div>
    </motion.div>
  );
};

export default EnhancedMetricCard; 