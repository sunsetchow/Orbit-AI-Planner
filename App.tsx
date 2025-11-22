
import React, { useState, useEffect } from 'react';
import { View, Objective, JournalEntry, Period, AIUpdateSuggestion } from './types';
import { Dashboard } from './components/Dashboard';
import { OKRManager } from './components/OKRManager';
import { Journal } from './components/Journal';
import { suggestOKRUpdates } from './services/geminiService';
import { LayoutDashboard, Target, BookOpen, Menu, X, Check, Edit2 } from 'lucide-react';

interface SuggestionItemProps {
  suggestion: AIUpdateSuggestion;
  objectives: Objective[];
  onApply: (s: AIUpdateSuggestion, val: number) => void;
}

// Sub-component for individual suggestions to handle local edit state
const SuggestionItem: React.FC<SuggestionItemProps> = ({ 
  suggestion, 
  objectives, 
  onApply 
}) => {
  const obj = objectives.find(o => o.id === suggestion.objectiveId);
  const kr = obj?.keyResults.find(k => k.id === suggestion.keyResultId);
  
  const [value, setValue] = useState<string>(String(suggestion.suggestedValue));
  const [isEditing, setIsEditing] = useState(false);

  if (!obj || !kr) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 transition-all hover:shadow-sm">
        <div className="flex justify-between items-start mb-2">
            <div>
                <div className="text-xs text-gray-500">{obj.title}</div>
                <div className="font-semibold text-gray-900">{kr.title}</div>
            </div>
            <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                AI Suggestion
            </div>
        </div>
        
        <div className="flex items-end gap-3 bg-white p-3 rounded-lg border border-gray-100">
            <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Update Value</label>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 line-through text-sm">{kr.currentValue}</span>
                    <span className="text-gray-300">→</span>
                    <div className="relative flex-1">
                        <input 
                            type="number" 
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-indigo-700 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <div className="absolute right-3 top-1.5 text-xs text-gray-400 pointer-events-none">
                            {kr.unit}
                        </div>
                    </div>
                </div>
            </div>
            <button 
                onClick={() => onApply(suggestion, Number(value))}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 h-[38px]"
            >
                <Check className="h-4 w-4" /> Apply
            </button>
        </div>
        <div className="mt-2 flex gap-2 items-start">
            <div className="min-w-[3px] h-3 bg-indigo-300 rounded-full mt-1.5"></div>
            <p className="text-xs text-gray-500 italic leading-relaxed">
                "{suggestion.reasoning}"
            </p>
        </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<AIUpdateSuggestion[]>([]);

  // State initialization with Mock Data if empty
  const [objectives, setObjectives] = useState<Objective[]>(() => {
      const saved = localStorage.getItem('orbit_okrs');
      return saved ? JSON.parse(saved) : [];
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
      const saved = localStorage.getItem('orbit_entries');
      return saved ? JSON.parse(saved) : [];
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('orbit_okrs', JSON.stringify(objectives));
  }, [objectives]);

  useEffect(() => {
    localStorage.setItem('orbit_entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  // Handlers
  const handleAddEntry = async (entry: JournalEntry) => {
    setJournalEntries(prev => [...prev, entry]);
    
    // Check for OKR updates based on the new entry
    if (objectives.length > 0) {
        const suggestions = await suggestOKRUpdates(entry.content, objectives);
        if (suggestions.length > 0) {
            setPendingSuggestions(suggestions);
            setShowUpdateModal(true);
        }
    }
  };

  const handleApplySuggestion = (suggestion: AIUpdateSuggestion, newValue: number) => {
    setObjectives(prev => prev.map(obj => {
        if (obj.id !== suggestion.objectiveId) return obj;
        
        const updatedKRs = obj.keyResults.map(kr => {
            if (kr.id !== suggestion.keyResultId) return kr;
            return { ...kr, currentValue: newValue };
        });
        
        // Recalculate progress
        const total = updatedKRs.reduce((acc, kr) => {
            const p = Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100));
            return acc + p;
        }, 0);
        
        return { 
            ...obj, 
            keyResults: updatedKRs, 
            progress: updatedKRs.length > 0 ? Math.round(total / updatedKRs.length) : 0 
        };
    }));
    
    // Remove applied suggestion
    setPendingSuggestions(prev => prev.filter(s => s.keyResultId !== suggestion.keyResultId));
    if (pendingSuggestions.length <= 1) setShowUpdateModal(false);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => { setActiveView(view); setIsMobileMenuOpen(false); }}
      className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activeView === view 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center z-20 relative shadow-sm">
        <h1 className="text-xl font-bold text-indigo-600 tracking-tight">Orbit</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
            <div className="mb-8 px-2 hidden md:block">
                <h1 className="text-2xl font-bold text-indigo-600 tracking-tight flex items-center gap-2">
                    <span className="bg-indigo-600 text-white rounded-lg p-1">
                        <Target className="h-5 w-5" />
                    </span>
                    Orbit
                </h1>
                <p className="text-xs text-gray-400 mt-1 pl-1">Plan. Act. Reflect.</p>
            </div>

            <nav className="space-y-2 flex-1">
                <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem view="okrs" icon={Target} label="My OKRs" />
                <NavItem view="journal" icon={BookOpen} label="Journal" />
            </nav>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 text-center">
                <p className="text-xs text-gray-500 mb-2">"Discipline is the bridge between goals and accomplishment."</p>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jim Rohn</div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-4rem)] md:h-screen">
        {activeView === 'dashboard' && (
          <Dashboard objectives={objectives} entries={journalEntries} userName="Planner" />
        )}
        {activeView === 'okrs' && (
          <OKRManager 
            objectives={objectives} 
            onCreateObjective={(obj) => setObjectives([...objectives, obj])}
            onUpdateObjective={(updated) => setObjectives(objectives.map(o => o.id === updated.id ? updated : o))}
            onDeleteObjective={(id) => setObjectives(objectives.filter(o => o.id !== id))}
          />
        )}
        {activeView === 'journal' && (
          <Journal entries={journalEntries} onAddEntry={handleAddEntry} />
        )}
      </main>

      {/* Update Suggestion Modal */}
      {showUpdateModal && pendingSuggestions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] flex flex-col">
                <button 
                    onClick={() => setShowUpdateModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-5 w-5"/>
                </button>
                <div className="flex items-center gap-3 mb-2 flex-shrink-0">
                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Review Progress</h3>
                        <p className="text-xs text-gray-500">AI detected updates from your journal</p>
                    </div>
                </div>
                
                <div className="my-4 overflow-y-auto pr-2 space-y-4 flex-1">
                    {pendingSuggestions.map((suggestion) => (
                         <SuggestionItem 
                            key={suggestion.keyResultId}
                            suggestion={suggestion}
                            objectives={objectives}
                            onApply={handleApplySuggestion}
                         />
                    ))}
                </div>
                
                <div className="mt-2 pt-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button 
                        onClick={() => setShowUpdateModal(false)}
                        className="text-gray-500 hover:text-gray-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Dismiss Remaining
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
