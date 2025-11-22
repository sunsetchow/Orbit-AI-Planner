import React, { useEffect, useState } from 'react';
import { Objective, JournalEntry } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { Target, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { generateInsights } from '../services/geminiService';

interface DashboardProps {
  objectives: Objective[];
  entries: JournalEntry[];
  userName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ objectives, entries, userName }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Calculate overall stats
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter(o => o.progress >= 100).length;
  const avgProgress = totalObjectives > 0 
    ? Math.round(objectives.reduce((acc, curr) => acc + curr.progress, 0) / totalObjectives) 
    : 0;

  // Prepare chart data
  const chartData = [...entries].reverse().slice(0, 14).map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: e.mood,
    energy: e.energy
  }));

  useEffect(() => {
    const fetchInsights = async () => {
        if (entries.length > 0 && objectives.length > 0) {
            setIsLoadingInsight(true);
            const insight = await generateInsights(entries, objectives);
            setAiInsight(insight);
            setIsLoadingInsight(false);
        }
    };
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, objectives.length]); // Only re-run if counts change to avoid spam

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {userName}</h2>
          <p className="text-gray-500">Here's what's happening with your goals today.</p>
        </div>
        <div className="hidden md:block">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between pb-4">
            <div className="text-sm font-medium text-gray-500">Avg. Progress</div>
            <Target className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{avgProgress}%</div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${avgProgress}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between pb-4">
            <div className="text-sm font-medium text-gray-500">Active Goals</div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalObjectives - completedObjectives}</div>
          <p className="text-xs text-gray-400 mt-1">{completedObjectives} completed this period</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between pb-4">
            <div className="text-sm font-medium text-gray-500">Recent Energy</div>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {entries.length > 0 ? entries[0].energy : '-'}
            <span className="text-lg text-gray-400 font-normal">/10</span>
          </div>
           <p className="text-xs text-gray-400 mt-1">Last recorded entry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood & Energy Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood & Energy Trends</h3>
            <div className="h-64">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                        <YAxis hide domain={[0, 10]} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorMood)" />
                        <Area type="monotone" dataKey="energy" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" />
                    </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <p>No journal data yet</p>
                        <p className="text-xs">Start journaling to see trends</p>
                    </div>
                )}
            </div>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-200 rounded-full opacity-20 blur-xl"></div>
             <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-indigo-900">Orbit AI Insights</h3>
             </div>
             
             {isLoadingInsight ? (
                 <div className="animate-pulse space-y-3">
                     <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
                     <div className="h-4 bg-indigo-200 rounded w-full"></div>
                     <div className="h-4 bg-indigo-200 rounded w-5/6"></div>
                 </div>
             ) : (
                 <div className="prose prose-indigo text-sm text-indigo-800">
                    {aiInsight || "Add more goals and journal entries to unlock personalized AI insights about your performance patterns."}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};