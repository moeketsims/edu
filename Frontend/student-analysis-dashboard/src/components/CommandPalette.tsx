import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  FileDown, 
  Calendar, 
  Brain, 
  Users, 
  BookOpen,
  Database,
  Settings,
  X,
  Command,
  BarChart3
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onDataManagement?: () => void;
  onStudentSearch?: () => void;
  onSystemAdmin?: () => void;
  onComprehensiveAnalysis?: () => void;
}

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  shortcut?: string;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, onClose, onDataManagement, onStudentSearch, onSystemAdmin, onComprehensiveAnalysis 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: 'export-pdf',
      label: 'Export Dashboard as PDF',
      icon: <FileDown className="w-4 h-4" />,
      action: () => {
        console.log('Exporting to PDF...');
        onClose();
      },
      category: 'Export',
      shortcut: '⌘E'
    },
    {
      id: 'schedule-report',
      label: 'Schedule Weekly Report',
      icon: <Calendar className="w-4 h-4" />,
      action: () => {
        console.log('Scheduling report...');
        onClose();
      },
      category: 'Reports',
      shortcut: '⌘R'
    },
    {
      id: 'ai-insights',
      label: 'Generate AI Insights',
      icon: <Brain className="w-4 h-4" />,
      action: () => {
        console.log('Generating AI insights...');
        onClose();
      },
      category: 'AI',
      shortcut: '⌘I'
    },
    {
      id: 'student-search',
      label: 'Search Students',
      icon: <Users className="w-4 h-4" />,
      action: () => {
        onStudentSearch?.();
        onClose();
      },
      category: 'Navigation',
      shortcut: '⌘S'
    },
    {
      id: 'data-management',
      label: 'Data Management',
      icon: <Database className="w-4 h-4" />,
      action: () => {
        onDataManagement?.();
        onClose();
      },
      category: 'Management',
      shortcut: '⌘D'
    },
    {
      id: 'system-admin',
      label: 'System Administration',
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        onSystemAdmin?.();
        onClose();
      },
      category: 'Management',
      shortcut: '⌘A'
    },
    {
      id: 'comprehensive-analysis',
      label: 'Comprehensive Data Analysis',
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => {
        onComprehensiveAnalysis?.();
        onClose();
      },
      category: 'Analysis',
      shortcut: '⌘F'
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase()) ||
    command.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search commands, students, modules..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 outline-none text-gray-900 placeholder-gray-500"
                autoFocus
              />
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↵</kbd>
                <span>to select</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ESC</kbd>
                <span>to close</span>
              </div>
            </div>
            
            {/* Command List */}
            <div className="max-h-96 overflow-y-auto">
              {Object.keys(groupedCommands).length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No commands found</p>
                  <p className="text-sm mt-1">Try searching for something else</p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category} className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </div>
                    {categoryCommands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <motion.button
                          key={command.id}
                          onClick={command.action}
                          className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                            isSelected 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`p-2 rounded-lg mr-3 ${
                            isSelected ? 'bg-emerald-100' : 'bg-gray-100'
                          }`}>
                            {command.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{command.label}</div>
                          </div>
                          {command.shortcut && (
                            <div className="flex items-center space-x-1">
                              {command.shortcut.split('').map((key, i) => (
                                <kbd 
                                  key={i}
                                  className="px-2 py-1 bg-gray-100 rounded text-xs font-mono"
                                >
                                  {key === '⌘' ? <Command className="w-3 h-3" /> : key}
                                </kbd>
                              ))}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-white rounded">↑↓</kbd>
                    <span>navigate</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-white rounded">↵</kbd>
                    <span>select</span>
                  </div>
                </div>
                <div className="text-emerald-600 font-medium">
                  {filteredCommands.length} commands
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette; 