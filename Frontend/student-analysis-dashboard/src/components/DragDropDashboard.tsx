import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { 
  GripVertical, 
  Plus, 
  Settings, 
  Maximize2, 
  Minimize2, 
  X,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  BookOpen,
  Activity
} from 'lucide-react';
import EnterpriseVisualization from './EnterpriseVisualization';

interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'visualization';
  title: string;
  size: 'small' | 'medium' | 'large';
  data?: any;
  config?: any;
}

interface WidgetProps {
  widget: Widget;
  isOverlay?: boolean;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: Widget['size']) => void;
}

// Individual Widget Component
const DraggableWidget: React.FC<WidgetProps> = ({ widget, isOverlay = false, onRemove, onResize }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSizeClasses = (size: Widget['size']) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-2 row-span-1';
      case 'large':
        return 'col-span-2 row-span-2';
      default:
        return 'col-span-1 row-span-1';
    }
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'metric':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">7,771</div>
                <div className="text-sm text-gray-500">+5.2%</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">Total Students</div>
          </div>
        );
      case 'chart':
        return (
          <div className="p-4">
            <EnterpriseVisualization
              data={{}}
              type="heatmap"
              title="Performance Overview"
              height={200}
              interactive={false}
            />
          </div>
        );
      case 'visualization':
        return (
          <div className="p-4">
            <EnterpriseVisualization
              data={{}}
              type={widget.config?.visualizationType || 'sankey'}
              title={widget.title}
              height={widget.size === 'large' ? 400 : 200}
              interactive={true}
            />
          </div>
        );
      case 'table':
        return (
          <div className="p-4">
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900">John Doe</td>
                    <td className="px-4 py-2 text-sm text-green-600">85%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900">Jane Smith</td>
                    <td className="px-4 py-2 text-sm text-yellow-600">72%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return <div className="p-6 text-center text-gray-500">Widget Content</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden
        transition-all duration-200 hover:shadow-xl
        ${getSizeClasses(widget.size)}
        ${isExpanded ? 'col-span-full row-span-full z-50 fixed inset-4' : ''}
        ${isOverlay ? 'rotate-3 cursor-grabbing' : 'cursor-grab'}
      `}
    >
      {/* Widget Header */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-200 rounded"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{widget.title}</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-500" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {onRemove && (
            <button
              onClick={() => onRemove(widget.id)}
              className="p-1 hover:bg-red-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 px-4 py-3 border-b border-gray-100"
        >
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-600">Size:</label>
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => onResize?.(widget.id, size)}
                className={`
                  px-2 py-1 text-xs rounded capitalize
                  ${widget.size === size 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {size}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Widget Content */}
      <div className="h-full overflow-hidden">
        {renderWidgetContent()}
      </div>
    </div>
  );
};

// Widget Selector Component
const WidgetSelector: React.FC<{ onAddWidget: (widget: Omit<Widget, 'id'>) => void }> = ({ onAddWidget }) => {
  const [isOpen, setIsOpen] = useState(false);

  const widgetTypes = [
    { type: 'metric' as const, icon: Activity, title: 'Metric Card', description: 'Display key metrics' },
    { type: 'chart' as const, icon: BarChart3, title: 'Chart', description: 'Basic charts and graphs' },
    { type: 'visualization' as const, icon: PieChart, title: 'Advanced Viz', description: 'Interactive visualizations' },
    { type: 'table' as const, icon: BookOpen, title: 'Data Table', description: 'Tabular data display' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Widget</span>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
        >
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Add Widget</h3>
          </div>
          <div className="p-2">
            {widgetTypes.map((widgetType) => (
              <button
                key={widgetType.type}
                onClick={() => {
                  onAddWidget({
                    type: widgetType.type,
                    title: widgetType.title,
                    size: 'medium',
                    config: widgetType.type === 'visualization' ? { visualizationType: 'sankey' } : {}
                  });
                  setIsOpen(false);
                }}
                className="w-full flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <widgetType.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{widgetType.title}</div>
                  <div className="text-xs text-gray-500">{widgetType.description}</div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Main Dashboard Component
const DragDropDashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', type: 'metric', title: 'Total Students', size: 'small' },
    { id: '2', type: 'metric', title: 'Success Rate', size: 'small' },
    { id: '3', type: 'chart', title: 'Performance Chart', size: 'medium' },
    { id: '4', type: 'visualization', title: 'Student Flow', size: 'large', config: { visualizationType: 'sankey' } },
    { id: '5', type: 'table', title: 'Recent Students', size: 'medium' },
    { id: '6', type: 'visualization', title: 'Course Network', size: 'large', config: { visualizationType: 'network' } },
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const widget = widgets.find(w => w.id === event.active.id);
    setDraggedWidget(widget || null);
  }, [widgets]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
    setDraggedWidget(null);
  }, []);

  const addWidget = useCallback((newWidget: Omit<Widget, 'id'>) => {
    const id = Date.now().toString();
    setWidgets(prev => [...prev, { ...newWidget, id }]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  }, []);

  const resizeWidget = useCallback((id: string, size: Widget['size']) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, size } : widget
    ));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Custom Dashboard</h1>
            <p className="text-gray-600 mt-1">Drag and drop widgets to customize your view</p>
          </div>
          <WidgetSelector onAddWidget={addWidget} />
        </div>
      </div>

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-6 auto-rows-fr">
            {widgets.map((widget) => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                onRemove={removeWidget}
                onResize={resizeWidget}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && draggedWidget ? (
            <DraggableWidget widget={draggedWidget} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default DragDropDashboard; 