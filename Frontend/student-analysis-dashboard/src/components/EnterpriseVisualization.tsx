import React, { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { TrendingUp, Network, GitBranch, Thermometer, Eye, Settings } from 'lucide-react';

interface VisualizationProps {
  data: any;
  type: 'heatmap' | 'sankey' | 'network' | '3d' | 'advanced';
  title: string;
  height?: number;
  interactive?: boolean;
}

// Heatmap Component for Course Difficulty vs Performance
const HeatmapVisualization: React.FC<{ data: any }> = ({ data }) => {
  const courseData = [
    ['CURM4502', 'WILS1500', 'MTTI4705', 'BLGY1643', 'UFSS1504'],
    [85, 72, 68, 91, 78],
    [23, 45, 67, 12, 34],
    [78, 82, 59, 88, 71],
    [65, 77, 84, 69, 73]
  ];

  const plotData = [{
    z: courseData.slice(1),
    x: courseData[0],
    y: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    type: 'heatmap' as const,
    colorscale: 'RdYlGn' as const,
    hoverongaps: false,
    hovertemplate: 'Course: %{x}<br>Level: %{y}<br>Performance: %{z}%<extra></extra>'
  }];

  return (
    <Plot
      data={plotData}
      layout={{
        title: { text: 'Course Performance Heatmap' },
        xaxis: { title: { text: 'Course Codes' } },
        yaxis: { title: { text: 'Academic Levels' } },
        font: { family: 'Inter, sans-serif' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 50, r: 50, b: 100, l: 100 }
      }}
      style={{ width: '100%', height: '400px' }}
      config={{ responsive: true, displayModeBar: false }}
    />
  );
};

// Sankey Diagram for Student Progression Paths
const SankeyVisualization: React.FC<{ data: any }> = ({ data }) => {
  const sankeyData = [{
    type: "sankey" as const,
    orientation: "h" as const,
    node: {
      pad: 15,
      thickness: 30,
      line: { color: "black", width: 0.5 },
      label: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate", "Dropout"],
      color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#22c55e", "#ef4444"]
    },
    link: {
      source: [0, 0, 1, 1, 2, 2, 3, 3],
      target: [1, 5, 2, 5, 3, 5, 4, 5],
      value: [2500, 263, 2100, 194, 1800, 180, 1600, 20],
      color: ["rgba(59, 130, 246, 0.3)", "rgba(239, 68, 68, 0.3)", "rgba(16, 185, 129, 0.3)", "rgba(239, 68, 68, 0.3)", "rgba(245, 158, 11, 0.3)", "rgba(239, 68, 68, 0.3)", "rgba(139, 92, 246, 0.3)", "rgba(239, 68, 68, 0.3)"]
    }
  }];

  return (
    <Plot
      data={sankeyData}
      layout={{
        title: { text: 'Student Progression Flow' },
        font: { family: 'Inter, sans-serif', size: 12 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 50, r: 50, b: 50, l: 50 }
      }}
      style={{ width: '100%', height: '500px' }}
      config={{ responsive: true, displayModeBar: false }}
    />
  );
};

// Network Graph for Prerequisites
const NetworkVisualization: React.FC<{ data: any }> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 600;
    const height = 400;

    const nodes = [
      { id: "CURM4502", group: 1, level: 4 },
      { id: "MTTI4705", group: 2, level: 4 },
      { id: "WILS1500", group: 1, level: 1 },
      { id: "BLGY1643", group: 3, level: 1 },
      { id: "UFSS1504", group: 1, level: 1 },
      { id: "EALT1508", group: 2, level: 1 }
    ];

    const links = [
      { source: "WILS1500", target: "CURM4502", strength: 0.8 },
      { source: "BLGY1643", target: "MTTI4705", strength: 0.9 },
      { source: "UFSS1504", target: "CURM4502", strength: 0.6 },
      { source: "EALT1508", target: "MTTI4705", strength: 0.7 }
    ];

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", (d: any) => d.strength * 5);

    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", 20)
      .attr("fill", (d: any) => {
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
        return colors[d.group - 1];
      })
      .call(d3.drag<any, any>()
        .on("start", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    const labels = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .text((d: any) => d.id)
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      labels
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y + 5);
    });

  }, [data]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Network className="w-5 h-5 mr-2 text-blue-600" />
        Course Prerequisites Network
      </h3>
      <svg ref={svgRef} className="w-full border rounded-lg bg-gray-50"></svg>
    </div>
  );
};

// 3D Scatter Plot for Complex Relationships
const ThreeDVisualization: React.FC<{ data: any }> = ({ data }) => {
  const scatter3DData = [{
    x: [65, 78, 82, 91, 88, 72, 85, 69],
    y: [23, 34, 45, 12, 18, 56, 23, 41],
    z: [75, 82, 68, 92, 86, 71, 83, 74],
    mode: 'markers' as const,
    marker: {
      size: 12,
      color: [75, 82, 68, 92, 86, 71, 83, 74],
      colorscale: 'Viridis',
      opacity: 0.8,
      colorbar: {
        title: 'Performance Score'
      }
    },
    type: 'scatter3d' as const,
    hovertemplate: 'Completion: %{x}%<br>Missing: %{y}<br>GPA: %{z}<extra></extra>'
  }];

  return (
    <Plot
      data={scatter3DData}
      layout={{
        title: { text: '3D Student Performance Analysis' },
        scene: {
          xaxis: { title: { text: 'Completion %' } },
          yaxis: { title: { text: 'Missing Modules' } },
          zaxis: { title: { text: 'GPA Score' } }
        },
        font: { family: 'Inter, sans-serif' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 50, r: 50, b: 50, l: 50 }
      }}
      style={{ width: '100%', height: '500px' }}
      config={{ responsive: true, displayModeBar: true }}
    />
  );
};

// Main Enterprise Visualization Component
const EnterpriseVisualization: React.FC<VisualizationProps> = ({ 
  data, 
  type, 
  title, 
  height = 400, 
  interactive = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const renderVisualization = () => {
    switch (type) {
      case 'heatmap':
        return <HeatmapVisualization data={data} />;
      case 'sankey':
        return <SankeyVisualization data={data} />;
      case 'network':
        return <NetworkVisualization data={data} />;
      case '3d':
        return <ThreeDVisualization data={data} />;
      default:
        return <HeatmapVisualization data={data} />;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'heatmap':
        return <Thermometer className="w-5 h-5" />;
      case 'sankey':
        return <GitBranch className="w-5 h-5" />;
      case 'network':
        return <Network className="w-5 h-5" />;
      case '3d':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Eye className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              {getIcon()}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {interactive && (
            <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        {renderVisualization()}
      </div>
    </motion.div>
  );
};

export default EnterpriseVisualization; 