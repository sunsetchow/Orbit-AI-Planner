import React, { useState } from 'react';
import { Objective, KeyResult, Period, KRStatus } from '../types';
import { Button } from './Button';
import { Plus, Trash2, ChevronDown, ChevronUp, Wand2, Edit2, Check, X } from 'lucide-react';
import { suggestKeyResults } from '../services/geminiService';

interface OKRManagerProps {
  objectives: Objective[];
  onUpdateObjective: (objective: Objective) => void;
  onDeleteObjective: (id: string) => void;
  onCreateObjective: (objective: Objective) => void;
}

export const OKRManager: React.FC<OKRManagerProps> = ({ 
  objectives, 
  onUpdateObjective, 
  onDeleteObjective,
  onCreateObjective 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState<Period>(Period.Q1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Objective Logic
  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newObjective: Objective = {
      id: crypto.randomUUID(),
      title: newTitle,
      period: newPeriod,
      keyResults: [],
      progress: 0
    };
    onCreateObjective(newObjective);
    setNewTitle('');
    setIsCreating(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Objectives & Key Results</h2>
        <Button onClick={() => setIsCreating(true)} variant="primary">
          <Plus className="h-4 w-4 mr-2" /> New Objective
        </Button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 animate-fade-in-down">
          <h3 className="text-lg font-semibold mb-4">Create New Objective</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objective Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Improve Physical Health"
                className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value as Period)}
                className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500"
              >
                {Object.values(Period).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Objective</Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {objectives.length === 0 && !isCreating && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <TargetIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No objectives</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new quarterly or annual goal.</p>
            </div>
        )}
        {objectives.map(obj => (
          <ObjectiveCard
            key={obj.id}
            objective={obj}
            isExpanded={expandedId === obj.id}
            onToggleExpand={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
            onUpdate={onUpdateObjective}
            onDelete={onDeleteObjective}
          />
        ))}
      </div>
    </div>
  );
};

// Sub-component for individual Key Results (Handling Edit State)
const KeyResultItem: React.FC<{
    kr: KeyResult;
    onUpdate: (kr: KeyResult) => void;
    onDelete: () => void;
}> = ({ kr, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(kr.title);
    const [editTarget, setEditTarget] = useState(kr.targetValue);
    const [editUnit, setEditUnit] = useState(kr.unit);

    const handleSave = () => {
        onUpdate({
            ...kr,
            title: editTitle,
            targetValue: editTarget,
            unit: editUnit
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditTitle(kr.title);
        setEditTarget(kr.targetValue);
        setEditUnit(kr.unit);
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 ring-1 ring-indigo-300 space-y-3">
                <div>
                    <label className="block text-xs font-medium text-indigo-800 mb-1">Key Result Title</label>
                    <input 
                        className="w-full border border-indigo-300 rounded px-2 py-1 text-sm" 
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-indigo-800 mb-1">Target</label>
                        <input 
                            type="number"
                            className="w-full border border-indigo-300 rounded px-2 py-1 text-sm" 
                            value={editTarget}
                            onChange={e => setEditTarget(Number(e.target.value))}
                        />
                    </div>
                    <div className="flex-1">
                         <label className="block text-xs font-medium text-indigo-800 mb-1">Unit</label>
                        <input 
                            className="w-full border border-indigo-300 rounded px-2 py-1 text-sm" 
                            value={editUnit}
                            onChange={e => setEditUnit(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <Button size="sm" variant="secondary" onClick={handleCancel}>Cancel</Button>
                    <Button size="sm" onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-indigo-300 transition-colors">
            <div className="flex-1">
                <div className="flex items-start justify-between md:justify-start gap-2">
                    <p className="font-medium text-gray-800">{kr.title}</p>
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Edit Key Result"
                    >
                        <Edit2 className="h-3 w-3" />
                    </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <span>Target: {kr.targetValue} {kr.unit}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        value={kr.currentValue}
                        onChange={(e) => onUpdate({...kr, currentValue: Number(e.target.value)})}
                        className="w-20 p-1.5 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <span className="text-gray-500 text-sm w-12">/ {kr.targetValue} {kr.unit}</span>
                </div>
                <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

// Sub-component for individual Objective Cards
const ObjectiveCard: React.FC<{
  objective: Objective;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (obj: Objective) => void;
  onDelete: (id: string) => void;
}> = ({ objective, isExpanded, onToggleExpand, onUpdate, onDelete }) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [newKRTitle, setNewKRTitle] = useState('');
  const [newKRTarget, setNewKRTarget] = useState<number>(100);
  const [newKRUnit, setNewKRUnit] = useState('%');
  
  // Objective Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(objective.title);

  const calculateProgress = (krs: KeyResult[]) => {
    if (krs.length === 0) return 0;
    const total = krs.reduce((acc, kr) => {
        const target = kr.targetValue || 1; // Avoid division by zero
        const p = Math.min(100, Math.max(0, (kr.currentValue / target) * 100));
        return acc + p;
    }, 0);
    return Math.round(total / krs.length);
  };

  const handleAddKR = () => {
    if (!newKRTitle) return;
    const newKR: KeyResult = {
      id: crypto.randomUUID(),
      title: newKRTitle,
      currentValue: 0,
      targetValue: newKRTarget,
      unit: newKRUnit,
      status: KRStatus.ON_TRACK
    };
    const updated = {
      ...objective,
      keyResults: [...objective.keyResults, newKR]
    };
    updated.progress = calculateProgress(updated.keyResults);
    onUpdate(updated);
    setNewKRTitle('');
    setNewKRTarget(100);
  };

  const handleAISuggest = async () => {
    setIsSuggesting(true);
    const suggestions = await suggestKeyResults(objective.title);
    setIsSuggesting(false);
    if (suggestions.length > 0) {
      setNewKRTitle(suggestions[0]);
    }
  };

  const updateKR = (updatedKR: KeyResult) => {
    const updatedKRs = objective.keyResults.map(kr => 
      kr.id === updatedKR.id ? updatedKR : kr
    );
    onUpdate({
      ...objective,
      keyResults: updatedKRs,
      progress: calculateProgress(updatedKRs)
    });
  };

  const deleteKR = (krId: string) => {
    const updatedKRs = objective.keyResults.filter(kr => kr.id !== krId);
    onUpdate({
        ...objective,
        keyResults: updatedKRs,
        progress: calculateProgress(updatedKRs)
    });
  }

  const saveObjectiveTitle = () => {
    if (editedTitle.trim()) {
        onUpdate({ ...objective, title: editedTitle });
        setIsEditingTitle(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="p-5 flex items-center justify-between cursor-pointer" onClick={!isEditingTitle ? onToggleExpand : undefined}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">{objective.period}</span>
            
            {isEditingTitle ? (
                 <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                    <input 
                        value={editedTitle}
                        onChange={e => setEditedTitle(e.target.value)}
                        className="border border-indigo-300 rounded px-2 py-1 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />
                    <button onClick={saveObjectiveTitle} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check className="h-4 w-4" /></button>
                    <button onClick={() => { setEditedTitle(objective.title); setIsEditingTitle(false); }} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="h-4 w-4" /></button>
                 </div>
            ) : (
                <div className="flex items-center gap-2 group">
                    <h3 className="text-lg font-semibold text-gray-900">{objective.title}</h3>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }} 
                        className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                </div>
            )}
          </div>
          <div className="w-full max-w-md bg-gray-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${objective.progress >= 100 ? 'bg-green-500' : 'bg-indigo-600'}`} 
              style={{ width: `${objective.progress}%` }}
            ></div>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-4">
          <span className="text-2xl font-bold text-gray-700">{objective.progress}%</span>
          {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-5 border-t border-gray-100">
          <div className="space-y-4 mb-6">
            {objective.keyResults.map(kr => (
                <KeyResultItem 
                    key={kr.id} 
                    kr={kr} 
                    onUpdate={updateKR} 
                    onDelete={() => deleteKR(kr.id)} 
                />
            ))}
          </div>

          <div className="bg-white p-4 rounded-lg border border-indigo-100">
            <h4 className="text-sm font-semibold text-indigo-900 mb-3">Add Key Result</h4>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="What is the measurable result?"
                  value={newKRTitle}
                  onChange={(e) => setNewKRTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 pr-8"
                />
                 <button 
                    onClick={handleAISuggest}
                    disabled={isSuggesting}
                    className="absolute right-2 top-2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                    title="Get AI Suggestions"
                 >
                    <Wand2 className={`h-5 w-5 ${isSuggesting ? 'animate-pulse' : ''}`} />
                 </button>
              </div>
              <input
                type="number"
                placeholder="Target"
                value={newKRTarget}
                onChange={(e) => setNewKRTarget(Number(e.target.value))}
                className="w-24 border border-gray-300 rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="Unit (e.g. km)"
                value={newKRUnit}
                onChange={(e) => setNewKRUnit(e.target.value)}
                className="w-24 border border-gray-300 rounded-lg p-2"
              />
              <Button onClick={handleAddKR} disabled={!newKRTitle}>Add KR</Button>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button variant="danger" size="sm" onClick={() => onDelete(objective.id)}>Delete Objective</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const TargetIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);