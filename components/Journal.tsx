import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { Button } from './Button';
import { analyzeJournalEntry, draftJournalFromSchedule } from '../services/geminiService';
import { connectToGoogleCalendar, fetchCalendarEvents, formatEventsForPrompt } from '../services/calendarService';
import { Smile, Frown, Battery, BatteryCharging, MessageSquare, Calendar, X, Loader2, RefreshCw, Plus } from 'lucide-react';

interface JournalProps {
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
}

export const Journal: React.FC<JournalProps> = ({ entries, onAddEntry }) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Calendar Integration State
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  // Schedule Import State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleText, setScheduleText] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  // Helper for local date string YYYY-MM-DD
  const getTodayString = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const [entryDate, setEntryDate] = useState(getTodayString());

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsAnalyzing(true);
    
    // AI Analysis
    const feedback = await analyzeJournalEntry(content, mood, energy);

    // Construct date object from local date string to ensure consistency
    const now = new Date();
    const [y, m, d] = entryDate.split('-').map(Number);
    // Create date using local components for the selected date, and current time
    const dateObj = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: dateObj.toISOString(),
      content,
      mood,
      energy,
      aiFeedback: feedback
    };

    onAddEntry(newEntry);
    
    // Reset form
    setContent('');
    setMood(7);
    setEnergy(7);
    setEntryDate(getTodayString());
    setIsAnalyzing(false);
  };

  const handleDraftFromScheduleText = async () => {
    if (!scheduleText.trim()) return;
    setIsDrafting(true);
    const draft = await draftJournalFromSchedule(scheduleText);
    setContent(prev => prev ? prev + "\n\n" + draft : draft);
    setIsDrafting(false);
    setShowScheduleModal(false);
    setScheduleText('');
  };

  const handleSyncCalendar = async () => {
      setIsSyncingCalendar(true);
      try {
          // Connect if not already
          if (!isGCalConnected) {
              await connectToGoogleCalendar();
              setIsGCalConnected(true);
          }

          // Fetch events for the selected entry date
          const [y, m, d] = entryDate.split('-').map(Number);
          const targetDate = new Date(y, m - 1, d);
          
          const events = await fetchCalendarEvents(targetDate);
          const formattedSchedule = formatEventsForPrompt(events);

          // Draft with AI
          setIsDrafting(true); // Re-use drafting loading state for the text generation part
          const draft = await draftJournalFromSchedule(formattedSchedule);
          setContent(prev => prev ? prev + "\n\n" + draft : draft);
          setIsDrafting(false);

      } catch (error) {
          console.error("Failed to sync calendar", error);
      } finally {
          setIsSyncingCalendar(false);
      }
  };

  const loadDemoSchedule = () => {
      setScheduleText(`9:00 AM - Weekly Team Sync\n10:30 AM - Client Project Review\n12:00 PM - Lunch with Sarah\n2:00 PM - Deep Work: Q2 Planning\n4:30 PM - Gym Session`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      {/* List Column */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-700">Recent Entries</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {entries.length === 0 && (
             <div className="text-center py-8 text-gray-400 text-sm">No entries yet.</div>
          )}
          {[...entries].reverse().map(entry => (
            <div key={entry.id} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-colors group">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                <div className="flex gap-2 text-xs">
                    <span className={`flex items-center gap-1 ${entry.mood >= 7 ? 'text-green-600' : 'text-orange-500'}`}>
                        <Smile className="h-3 w-3" /> {entry.mood}
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                        <Battery className="h-3 w-3" /> {entry.energy}
                    </span>
                </div>
              </div>
              <p className="text-sm text-gray-800 line-clamp-2">{entry.content}</p>
              {entry.aiFeedback && (
                  <div className="mt-2 text-xs bg-indigo-50 text-indigo-700 p-2 rounded border border-indigo-100 group-hover:block hidden animate-fade-in">
                      <span className="font-semibold mr-1">AI:</span> {entry.aiFeedback}
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Editor Column */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
          
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-3">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500"/> 
                Daily Reflection
            </h2>
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <input 
                        type="date" 
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 focus:outline-none p-0 w-32"
                    />
                </div>
                
                <button 
                    onClick={handleSyncCalendar}
                    disabled={isSyncingCalendar || isDrafting}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
                        isGCalConnected 
                        ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' 
                        : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    }`}
                >
                   {isSyncingCalendar ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                       // Google-ish icon or calendar icon
                       <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                         <path d="M22 19H2V7H22V19ZM19 2H17V4H7V2H5V4H2V22H22V4H20V2ZM7 11H5V13H7V11ZM12 11H10V13H12V11ZM17 11H15V13H17V11ZM7 15H5V17H7V15ZM12 15H10V17H12V15ZM17 15H15V17H17V15Z" />
                       </svg>
                   )}
                   <span>{isGCalConnected ? 'Sync Calendar' : 'Connect Calendar'}</span>
                </button>

                <button 
                    onClick={() => setShowScheduleModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    title="Manual Input"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mood ({mood}/10)</label>
              <div className="flex items-center gap-3">
                <Frown className="h-5 w-5 text-gray-400" />
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <Smile className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Energy ({energy}/10)</label>
              <div className="flex items-center gap-3">
                <Battery className="h-5 w-5 text-gray-400" />
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <BatteryCharging className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="relative flex-1 flex flex-col">
              {isDrafting && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3 text-indigo-600">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="font-medium text-sm">AI is drafting your reflection...</span>
                      </div>
                  </div>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="How was your day? What did you achieve regarding your goals? &#10;&#10;Tip: Use the Calendar button to auto-draft based on your schedule."
                className="flex-1 w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow mb-4 text-base leading-relaxed"
              />
          </div>

          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
             <p className="text-xs text-gray-500 hidden md:block">
                 Orbit AI will analyze your entry for insights and suggest OKR updates.
             </p>
             <Button onClick={handleSubmit} isLoading={isAnalyzing} disabled={!content.trim()}>
                Save & Analyze
             </Button>
          </div>
        </div>
      </div>

      {/* Manual Schedule Modal */}
      {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
                <button 
                    onClick={() => setShowScheduleModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Manual Schedule Input</h3>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    If you don't use Google Calendar, you can paste your agenda here.
                </p>

                <textarea
                    value={scheduleText}
                    onChange={(e) => setScheduleText(e.target.value)}
                    placeholder="9:00 AM - Team Sync&#10;11:00 AM - Client Call&#10;2:00 PM - Focus Work"
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                
                <div className="flex justify-between items-center">
                     <button 
                        onClick={loadDemoSchedule}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                     >
                        Load Demo Data
                     </button>
                     <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleDraftFromScheduleText} isLoading={isDrafting} disabled={!scheduleText.trim()}>
                            {isDrafting ? 'Drafting...' : 'Generate Draft'}
                        </Button>
                     </div>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};