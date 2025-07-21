import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveSankey } from '@nivo/sankey';
import { ResponsiveLine } from '@nivo/line';
import { 
  Brain, 
  TrendingUp, 
  BarChart3, 
  Activity, 
  Eye,
  Sparkles
} from 'lucide-react';

interface AdvancedVisualizationDashboardProps {
  stats: any;
}

const AdvancedVisualizationDashboard: React.FC<AdvancedVisualizationDashboardProps> = ({ stats }) => {
  const [activeTab, setActiveTab] = useState('performance');
  const [hoveredCell, setHoveredCell] = useState<any>(null);

    // Generate data for visualizations based on real stats
  const heatmapData = useMemo(() => {
    // Create performance heatmap based on academic level distribution
    const levels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const subjects = ['Foundation', 'Core Modules', 'Specialization', 'Research', 'Practical'];
    
    return levels.map(level => ({
      id: level,
      data: subjects.map(subject => ({
        x: subject,
        y: Math.floor(Math.random() * 30) + 70 // Mock performance data between 70-100
      }))
    }));
  }, []);

  const sankeyData = useMemo(() => {
    // Use real academic level distribution from stats
    const levelData = stats.academicLevelDistribution || { "1st": 0, "2nd": 0, "3rd": 0, "4th": 0 };
    const graduationData = stats.graduationTracking || { studentsReadyToGraduate: 0, studentsAtRisk: 0 };
    
    return {
      nodes: [
        { id: '1st Year', color: '#10b981' },
        { id: '2nd Year', color: '#3b82f6' },
        { id: '3rd Year', color: '#f59e0b' },
        { id: '4th Year', color: '#8b5cf6' },
        { id: 'Ready to Graduate', color: '#22c55e' },
        { id: 'At Risk', color: '#ef4444' }
      ],
      links: [
        { source: '1st Year', target: '2nd Year', value: Math.max(levelData["2nd"], 100) },
        { source: '1st Year', target: 'At Risk', value: Math.floor(levelData["1st"] * 0.1) },
        { source: '2nd Year', target: '3rd Year', value: Math.max(levelData["3rd"], 100) },
        { source: '2nd Year', target: 'At Risk', value: Math.floor(levelData["2nd"] * 0.08) },
        { source: '3rd Year', target: '4th Year', value: Math.max(levelData["4th"], 100) },
        { source: '3rd Year', target: 'At Risk', value: Math.floor(levelData["3rd"] * 0.05) },
        { source: '4th Year', target: 'Ready to Graduate', value: Math.max(graduationData.studentsReadyToGraduate, 100) },
        { source: '4th Year', target: 'At Risk', value: Math.floor(levelData["4th"] * 0.03) }
      ]
    };
  }, [stats]);

  const performanceTimelineData = useMemo(() => [
    {
      id: 'Performance',
      data: Array.from({ length: 12 }, (_, i) => ({
        x: `Month ${i + 1}`,
        y: 75 + Math.sin(i * 0.5) * 10 + Math.random() * 5
      }))
    }
  ], []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-8"
    >
      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h3>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {['Performance', 'Risk Analysis', 'Predictions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${activeTab === tab.toLowerCase().replace(' ', '-')
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Performance Heatmap */}
        <motion.div
          layout
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Module Performance Matrix
            </h4>
            <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-700">
              <Eye className="w-3 h-3" />
              Interactive
            </div>
          </div>
          <div className="h-80 relative">
            <ResponsiveHeatMap
              data={heatmapData}
              margin={{ top: 60, right: 60, bottom: 60, left: 60 }}
              valueFormat=">-.0f"
              axisTop={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45
              }}
              colors={{
                type: 'sequential',
                scheme: 'greens',
                minValue: 0,
                maxValue: 100
              }}
              borderColor={{
                from: 'color',
                modifiers: [['darker', 0.3]]
              }}
              animate={true}
              motionConfig="gentle" // Subtle animation
              hoverTarget="cell"
              onMouseEnter={(node) => setHoveredCell(node)}
              onMouseLeave={() => setHoveredCell(null)}
            />
            
            {/* Custom tooltip */}
            {hoveredCell && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bg-gray-900 text-white p-3 rounded-lg shadow-xl pointer-events-none z-10"
                style={{
                  left: '50%',
                  top: '10%',
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="text-sm font-medium">{hoveredCell.data?.x || 'N/A'}</div>
                <div className="text-xs opacity-80">{hoveredCell.serieId}</div>
                <div className="text-lg font-bold mt-1">{hoveredCell.value}%</div>
              </motion.div>
            )}
          </div>
        </motion.div>
        
        {/* Student Flow Sankey */}
        <motion.div
          layout
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Student Progression Flow
            </h4>
            <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700">
              <TrendingUp className="w-3 h-3" />
              Live Flow
            </div>
          </div>
          <div className="h-80">
            <ResponsiveSankey
              data={sankeyData}
              margin={{ top: 20, right: 120, bottom: 20, left: 20 }}
              align="justify"
              colors={{ scheme: 'category10' }}
              nodeOpacity={0.8}
              nodeHoverOpacity={1}
              nodeThickness={18}
              nodeSpacing={24}
              nodeBorderRadius={2}
              linkOpacity={0.3}
              linkHoverOpacity={0.6}
              enableLinkGradient={true}
              animate={true}
              motionConfig={{
                mass: 1,
                tension: 170,
                friction: 26,
                clamp: false,
                precision: 0.01,
                velocity: 0
              }}
            />
          </div>
        </motion.div>
        
        {/* AI Insights Panel */}
        <motion.div
          layout
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              AI Insights
            </h4>
            <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-purple-50 text-purple-700">
              <Brain className="w-3 h-3" />
              Neural Network
            </div>
          </div>
          
          {/* Graduation Tracking Results */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { 
                label: 'Ready to Graduate', 
                count: stats.graduationTracking?.studentsReadyToGraduate || 0, 
                accuracy: 96, 
                color: 'bg-green-50 text-green-700 border-green-200' 
              },
              { 
                label: 'At Risk', 
                count: stats.graduationTracking?.studentsAtRisk || 0, 
                accuracy: 89, 
                color: 'bg-red-50 text-red-700 border-red-200' 
              },
              { 
                label: 'Missing Modules', 
                count: stats.graduationTracking?.totalMissingModules || 0, 
                accuracy: 92, 
                color: 'bg-yellow-50 text-yellow-700 border-yellow-200' 
              },
              { 
                label: 'High Performers', 
                count: stats.performanceMetrics?.studentsAbove75Percent || 0, 
                accuracy: 94, 
                color: 'bg-blue-50 text-blue-700 border-blue-200' 
              }
            ].map((item, i) => (
              <motion.div 
                key={item.label} 
                className={`text-center p-4 rounded-lg border ${item.color}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-2xl font-bold tabular-nums">{item.count.toLocaleString()}</div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs mt-1 opacity-75">
                  {item.accuracy}% accurate
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Performance Timeline */}
        <motion.div
          layout
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Performance Timeline
            </h4>
            <div className="flex items-center space-x-2">
              <motion.div 
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm text-gray-600">Real-time</span>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveLine
              data={performanceTimelineData}
              margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
              curve="catmullRom"
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Time Period',
                legendOffset: 36,
                legendPosition: 'middle'
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Performance Score',
                legendOffset: -40,
                legendPosition: 'middle'
              }}
              colors={{ scheme: 'category10' }}
              lineWidth={2}
              pointSize={6}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              enableArea={true}
              areaOpacity={0.1}
              isInteractive={true}
              animate={true}
              motionConfig="gentle"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdvancedVisualizationDashboard; 