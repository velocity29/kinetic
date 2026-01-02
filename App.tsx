
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Task, JobApplication, Certificate, AppState, SyllabusModule, TrackCategory, CurriculumDay, DayLog, MissionDocument } from './types';
import { DAILY_ROUTINE, UNARGUABLE_DAILY_5 } from './constants';
import JobTracker from './components/JobTracker';
import CertificateVault from './components/CertificateVault';
import DailyRoutine from './components/DailyRoutine';

const START_DATE = new Date(2025, 0, 2);

const INITIAL_STATE: AppState = {
  isSetupComplete: false,
  userGoals: '',
  startDate: START_DATE.toISOString(),
  tasks: UNARGUABLE_DAILY_5.map(t => ({ ...t, completed: false })),
  applications: [],
  certificates: [],
  completedModuleIds: [],
  masterSyllabus: [],
  curriculumDays: [],
  dayLogs: {},
  lastUpdated: new Date().toLocaleDateString(),
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('kinetic_os_deployment_v1');
    if (saved) return JSON.parse(saved);
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'certs' | 'curriculum'>('dashboard');
  const [curriculumView, setCurriculumView] = useState<'day' | 'track'>('day');
  const [selectedDay, setSelectedDay] = useState(1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [intakeGoal, setIntakeGoal] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('kinetic_os_deployment_v1', JSON.stringify(state));
  }, [state]);

  const taskIntelligence = useMemo(() => {
    const nowHours = currentTime.getHours();
    const nowMins = currentTime.getMinutes();
    const nowSecs = currentTime.getSeconds();
    const nowTotalSecs = (nowHours * 3600) + (nowMins * 60) + nowSecs;
    const nowSimple = nowHours * 100 + nowMins;
    
    let currentIdx = 0;
    for (let i = 0; i < DAILY_ROUTINE.length; i++) {
      const timeVal = parseInt(DAILY_ROUTINE[i].time.replace(':', ''));
      if (nowSimple >= timeVal) {
        currentIdx = i;
      } else {
        break;
      }
    }

    const current = DAILY_ROUTINE[currentIdx];
    const next = DAILY_ROUTINE[currentIdx + 1] || null;

    let countdown = "00:00:00";
    if (next) {
      const [nextH, nextM] = next.time.split(':').map(Number);
      const nextTotalSecs = (nextH * 3600) + (nextM * 60);
      const diffSecs = nextTotalSecs - nowTotalSecs;
      
      if (diffSecs > 0) {
        const h = Math.floor(diffSecs / 3600);
        const m = Math.floor((diffSecs % 3600) / 60);
        const s = diffSecs % 60;
        countdown = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
    }

    return { current, next, countdown };
  }, [currentTime]);

  const generateSyllabus = async (goals: string) => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a 30-day professional mastery and growth syllabus for: "${goals}". 
        Focus on self-paced high-quality free resources for AI, QuickBooks, Excel, and relevant certifications.
        Output a valid JSON object:
        {
          "modules": [{"id": "string", "title": "string", "track": "AI|QuickBooks|Excel|Insurance|Speech|Applications|Tech", "resourceLink": "string"}],
          "days": [{"day": number, "focus": "string", "summary": "Goal for the day", "moduleIds": ["id1", "id2"]}]
        }`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setState(prev => ({
        ...prev,
        isSetupComplete: true,
        userGoals: goals,
        masterSyllabus: result.modules || [],
        curriculumDays: result.days || [],
        dayLogs: {},
        lastUpdated: new Date().toLocaleDateString()
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleDailyTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const toggleModule = (moduleId: string) => {
    setState(prev => ({
      ...prev,
      completedModuleIds: prev.completedModuleIds.includes(moduleId)
        ? prev.completedModuleIds.filter(id => id !== moduleId)
        : [...prev.completedModuleIds, moduleId]
    }));
  };

  const updateDayNotes = (day: number, notes: string) => {
    setState(prev => ({
      ...prev,
      dayLogs: { ...prev.dayLogs, [day]: { ...(prev.dayLogs[day] || { notes: '', documents: [] }), notes } }
    }));
  };

  const addDayDocument = (day: number) => {
    const name = prompt("Achievement Title:");
    const url = prompt("Resource/Verification URL:");
    if (name && url) {
      const newDoc: MissionDocument = { id: Date.now().toString(), name, url };
      setState(prev => ({
        ...prev,
        dayLogs: {
          ...prev.dayLogs,
          [day]: { 
            ...(prev.dayLogs[day] || { notes: '', documents: [] }), 
            documents: [...(prev.dayLogs[day]?.documents || []), newDoc]
          }
        }
      }));
    }
  };

  const removeDayDocument = (day: number, docId: string) => {
    setState(prev => ({
      ...prev,
      dayLogs: {
        ...prev.dayLogs,
        [day]: { 
          ...(prev.dayLogs[day] || { notes: '', documents: [] }), 
          documents: (prev.dayLogs[day]?.documents || []).filter(d => d.id !== docId)
        }
      }
    }));
  };

  // Fix: Implemented missing addJob function to update application state
  const addJob = (job: Omit<JobApplication, 'id'>) => {
    const newJob: JobApplication = { ...job, id: Date.now().toString() };
    setState(prev => ({
      ...prev,
      applications: [...prev.applications, newJob]
    }));
  };

  // Fix: Implemented missing addCert function to update certificates state
  const addCert = (cert: Omit<Certificate, 'id'>) => {
    const newCert: Certificate = { ...cert, id: Date.now().toString() };
    setState(prev => ({
      ...prev,
      certificates: [...prev.certificates, newCert]
    }));
  };

  const trackStats = useMemo(() => {
    const tracks: TrackCategory[] = ['AI', 'QuickBooks', 'Excel', 'Insurance', 'Speech', 'Tech'];
    return tracks.map(track => {
      const modules = state.masterSyllabus.filter(m => m.track === track);
      const completed = modules.filter(m => state.completedModuleIds.includes(m.id)).length;
      return { track, done: completed, total: modules.length };
    }).filter(s => s.total > 0);
  }, [state.completedModuleIds, state.masterSyllabus]);

  const currentDayData = state.curriculumDays[selectedDay - 1];
  const currentDayLog = state.dayLogs[selectedDay] || { notes: '', documents: [] };
  const progressPercentage = Math.round((state.tasks.filter(t => t.completed).length / state.tasks.length) * 100);

  const isDaySuccessful = (dayNum: number) => {
    const day = state.curriculumDays[dayNum - 1];
    return day && day.moduleIds.length > 0 && day.moduleIds.every(id => state.completedModuleIds.includes(id));
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = new Date(2025, 0, 1).getDay(); 
    const totalDays = 31;
    for (let i = 0; i < firstDayOfMonth; i++) days.push({ type: 'empty' });
    for (let d = 1; d <= totalDays; d++) {
      const missionDay = d >= 2 ? (d - 1) : null;
      days.push({ date: d, missionDay, isMission: missionDay !== null && missionDay <= 30, type: 'date' });
    }
    return days;
  }, []);

  if (!state.isSetupComplete) {
    return (
      <div className="min-h-screen bg-[#FDFCFE] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-[4rem] shadow-2xl p-16 relative overflow-hidden border border-slate-100">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-violet-400 to-indigo-500"></div>
          <div className="mb-14 text-center">
            <h1 className="text-7xl font-black italic tracking-tighter text-slate-900 leading-none mb-4">
              KINETIC<span className="text-violet-500">OS</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">Your Personal Momentum Engine</p>
          </div>
          <div className="space-y-12">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">What is your growth target?</label>
              <textarea 
                value={intakeGoal}
                onChange={(e) => setIntakeGoal(e.target.value)}
                placeholder="I want to master digital accounting, become proficient in AI-driven workflows, and build a career in professional services..."
                className="w-full h-48 p-10 rounded-[3rem] border-2 border-slate-50 bg-slate-50 text-slate-800 font-semibold focus:bg-white focus:border-violet-400 transition-all outline-none resize-none leading-relaxed shadow-inner text-lg"
              ></textarea>
            </div>
            <button 
              disabled={isAiLoading || !intakeGoal}
              onClick={() => generateSyllabus(intakeGoal)}
              className="w-full bg-slate-900 text-white py-7 rounded-3xl font-black uppercase tracking-[0.3em] hover:bg-violet-600 disabled:opacity-50 transition-all flex items-center justify-center gap-6 shadow-2xl shadow-violet-900/20"
            >
              {isAiLoading ? <i className="fa-solid fa-sync fa-spin"></i> : <i className="fa-solid fa-sparkles"></i>}
              Begin Evolution
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-inter">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-80 bg-[#12111A] text-white p-10 shrink-0 flex flex-col z-30 shadow-2xl">
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl">
              <i className="fa-solid fa-bolt-lightning text-white text-2xl"></i>
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter">KINETIC<span className="text-violet-400">OS</span></h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-black">Growth Management 1.1</p>
        </div>

        <ul className="space-y-4 flex-1">
          <NavItem icon="fa-house-chimney-window" label="Momentum Center" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon="fa-route" label="Journey Log" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
          <NavItem icon="fa-medal" label="Skill Vault" active={activeTab === 'certs'} onClick={() => setActiveTab('certs')} />
          <NavItem icon="fa-map-location-dot" label="Growth Path" active={activeTab === 'curriculum'} onClick={() => setActiveTab('curriculum')} />
        </ul>

        <div className="mt-auto pt-10 border-t border-slate-800/50">
           <div className="bg-slate-800/20 rounded-[2.5rem] p-8 border border-slate-800 group hover:border-violet-500/50 transition-all">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">Current Flow</span>
                 </div>
              </div>
              
              <div className="mb-6">
                 <p className="text-lg font-black text-white leading-tight mb-2">{taskIntelligence.current.task}</p>
                 <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                    <span>{taskIntelligence.current.time}</span>
                    <span className="font-mono text-violet-400">{taskIntelligence.countdown}</span>
                 </div>
              </div>

              {taskIntelligence.next && (
                 <div className="pt-5 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Coming Up</span>
                       <span className="text-[10px] font-bold text-slate-400 font-mono">@ {taskIntelligence.next.time}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-300 truncate">{taskIntelligence.next.task}</p>
                 </div>
              )}
           </div>
           
           <button 
             onClick={() => { if(confirm('Reset your progress?')) setState(INITIAL_STATE); }}
             className="w-full mt-10 text-[10px] text-slate-600 hover:text-violet-400 font-black uppercase tracking-[0.3em] text-left pl-4 transition-colors"
           >
             Reset Flow
           </button>
        </div>
      </nav>

      <main className="flex-1 p-8 md:p-16 overflow-y-auto max-h-screen">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-10">
          <div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4 uppercase">
              {activeTab === 'dashboard' ? `Growth Day ${selectedDay}` : activeTab.replace('jobs', 'Journey').replace('certs', 'Vault').replace('curriculum', 'Path')}
            </h2>
            <div className="flex items-center gap-4">
               <span className="px-4 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[11px] font-black uppercase rounded-xl tracking-widest shadow-lg shadow-violet-100">
                Level: {selectedDay <= 10 ? 'Foundation' : selectedDay <= 20 ? 'Mastery' : 'Expert'}
               </span>
               <p className="text-slate-400 font-bold text-sm truncate max-w-sm italic opacity-60">Objective: {state.userGoals}</p>
            </div>
          </div>
          
          <div className="bg-white px-8 py-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Momentum</p>
                <p className="text-3xl font-black text-violet-600 leading-none">{progressPercentage}%</p>
             </div>
             <div className="w-2.5 h-14 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 transition-all duration-1000" style={{ height: `${progressPercentage}%` }}></div>
             </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            <div className="xl:col-span-5 space-y-10">
              <section className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Growth Calendar</h3>
                  <div className="text-[11px] font-black text-violet-600 uppercase bg-violet-50 px-4 py-1.5 rounded-full">Jan 2025</div>
                </div>
                
                <div className="grid grid-cols-7 gap-4">
                  {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-200 pb-2">{d}</div>)}
                  {calendarDays.map((cell, i) => {
                    if (cell.type === 'empty') return <div key={i}></div>;
                    const isSelected = cell.missionDay === selectedDay;
                    const success = cell.missionDay && isDaySuccessful(cell.missionDay);
                    return (
                      <button
                        key={i}
                        onClick={() => cell.missionDay && setSelectedDay(cell.missionDay)}
                        disabled={!cell.isMission}
                        className={`aspect-square rounded-[1.5rem] text-[13px] font-black transition-all flex flex-col items-center justify-center relative border-2 ${
                          isSelected ? 'bg-violet-600 text-white border-violet-600 shadow-2xl scale-110 z-10' :
                          success ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          cell.isMission ? 'bg-white text-slate-800 border-slate-100 hover:border-violet-300' : 'opacity-10'
                        }`}
                      >
                        <span className="text-[9px] opacity-40 mb-1">{cell.date}</span>
                        {cell.missionDay && <span>{cell.missionDay}</span>}
                        {success && !isSelected && <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></div>}
                      </button>
                    );
                  })}
                </div>
              </section>
              
              <DailyRoutine routine={DAILY_ROUTINE} />
            </div>

            <div className="xl:col-span-7 space-y-10">
              <section className="bg-white rounded-[4rem] p-14 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#12111A] text-white px-12 py-5 text-[12px] font-black uppercase tracking-[0.4em] rounded-bl-[3rem] shadow-xl">
                  {currentDayData?.focus || 'Daily Focus'}
                </div>
                
                <div className="mb-14 pt-8">
                  <h3 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-5">
                    <div className="w-2.5 h-12 bg-gradient-to-b from-violet-500 to-indigo-600 rounded-full"></div>
                    Daily Intention
                  </h3>
                  <div className="bg-[#F8FAFC] p-10 rounded-[3rem] border border-slate-100 shadow-inner">
                    <p className="text-slate-600 font-bold leading-relaxed text-xl italic opacity-90">
                      "{currentDayData?.summary || "Focus on building foundational excellence through deliberate practice."}"
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-10">
                      <h4 className="text-[12px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-4">
                        <i className="fa-solid fa-seedling text-xl"></i> Growth Units
                      </h4>
                      <div className="space-y-5">
                        {currentDayData?.moduleIds.map((mid) => {
                          const m = state.masterSyllabus.find(mod => mod.id === mid);
                          const done = state.completedModuleIds.includes(mid);
                          if (!m) return null;
                          return (
                            <div key={mid} className={`p-7 rounded-[2.5rem] border-2 transition-all ${done ? 'bg-emerald-50 border-emerald-100' : 'bg-[#F8FAFC] border-slate-50 hover:bg-white hover:shadow-2xl hover:border-violet-100'}`}>
                              <div className="flex items-center gap-6">
                                <button onClick={() => toggleModule(mid)} className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all ${done ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-white border-slate-200 text-slate-200'}`}>
                                  <i className="fa-solid fa-check text-xl"></i>
                                </button>
                                <div className="flex-1 min-w-0">
                                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${done ? 'bg-emerald-200 text-emerald-800' : 'bg-violet-100 text-violet-800'}`}>{m.track}</span>
                                  <p className={`text-lg font-black truncate mt-2 ${done ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{m.title}</p>
                                  {m.resourceLink && !done && <a href={m.resourceLink} target="_blank" className="text-[11px] font-black text-violet-600 hover:underline inline-flex items-center mt-3 gap-2">OPEN TOOL <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i></a>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>

                   <div className="space-y-12">
                      <div className="space-y-6">
                        <h4 className="text-[12px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-4">
                          <i className="fa-solid fa-feather-pointed text-xl"></i> Journal
                        </h4>
                        <textarea value={currentDayLog.notes} onChange={e => updateDayNotes(selectedDay, e.target.value)} placeholder="Reflect on today's progress..." className="w-full h-52 p-10 bg-slate-50 rounded-[3rem] border-2 border-slate-50 text-lg font-semibold focus:bg-white focus:border-amber-400 outline-none transition-all resize-none shadow-inner" />
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[12px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-4">
                          <i className="fa-solid fa-shapes text-xl"></i> Milestones
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                           {currentDayLog.documents.map(doc => (
                             <div key={doc.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                               <a href={doc.url} target="_blank" className="flex items-center gap-5 flex-1 min-w-0">
                                  <i className="fa-solid fa-sparkles text-amber-400 text-lg"></i>
                                  <span className="text-sm font-black text-slate-700 truncate group-hover:text-violet-600 uppercase tracking-tight">{doc.name}</span>
                               </a>
                               <button onClick={() => removeDayDocument(selectedDay, doc.id)} className="text-slate-300 hover:text-rose-500 px-4 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can text-lg"></i></button>
                             </div>
                           ))}
                        </div>
                        <button onClick={() => addDayDocument(selectedDay)} className="w-full py-6 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] border-2 border-dashed border-slate-200 transition-all group">
                           <i className="fa-solid fa-plus-circle mr-3 group-hover:scale-125 transition-transform"></i> Add Milestone
                        </button>
                      </div>
                   </div>
                </div>
              </section>

              <section className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-100">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 text-center">Daily Disciplines</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
                    {state.tasks.map(t => (
                      <button key={t.id} onClick={() => toggleDailyTask(t.id)} className={`p-8 rounded-[3rem] border-2 flex flex-col items-center justify-center text-center gap-5 transition-all ${t.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-violet-500 hover:bg-white hover:shadow-2xl'}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${t.completed ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'bg-white text-slate-200 border-2 border-slate-100'}`}>
                          <i className={`fa-solid ${t.completed ? 'fa-check' : 'fa-wand-magic-sparkles'} text-xl`}></i>
                        </div>
                        <span className={`text-[11px] font-black uppercase leading-tight tracking-widest ${t.completed ? 'text-emerald-800' : 'text-slate-500'}`}>{t.title}</span>
                      </button>
                    ))}
                 </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && <JobTracker applications={state.applications} onAdd={addJob} onUpdate={(id, u) => setState(p => ({...p, applications: p.applications.map(a => a.id === id ? {...a, ...u} : a)}))} />}
        {activeTab === 'certs' && <CertificateVault certificates={state.certificates} onAdd={addCert} />}
        {activeTab === 'curriculum' && (
          <div className="space-y-16">
             <section className="bg-[#12111A] rounded-[4.5rem] p-20 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] -mr-80 -mt-80"></div>
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-20 gap-12 relative z-10">
                  <div>
                    <h3 className="text-6xl font-black italic tracking-tighter mb-6 uppercase">Skill Path</h3>
                    <p className="text-slate-400 font-bold text-xl max-w-2xl opacity-80">Your 30-day journey toward professional mastery.</p>
                  </div>
                  <div className="flex bg-slate-800/20 p-3 rounded-3xl border border-slate-800 shadow-3xl backdrop-blur-xl">
                    <button onClick={() => setCurriculumView('day')} className={`px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all ${curriculumView === 'day' ? 'bg-violet-600 text-white shadow-2xl shadow-violet-900' : 'text-slate-400 hover:text-white'}`}>Timeline</button>
                    <button onClick={() => setCurriculumView('track')} className={`px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all ${curriculumView === 'track' ? 'bg-violet-600 text-white shadow-2xl shadow-violet-900' : 'text-slate-400 hover:text-white'}`}>Verticals</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-10 relative z-10">
                  {trackStats.map(stat => (
                    <CourseProgressCard key={stat.track} label={stat.track} stats={{done: stat.done, total: stat.total}} icon={stat.track === 'QuickBooks' ? 'fa-calculator' : stat.track === 'Excel' ? 'fa-table-cells' : stat.track === 'Insurance' ? 'fa-user-shield' : stat.track === 'AI' ? 'fa-microchip' : 'fa-code-merge'} color={stat.track === 'QuickBooks' ? 'blue' : stat.track === 'Excel' ? 'emerald' : stat.track === 'Insurance' ? 'amber' : stat.track === 'AI' ? 'indigo' : 'rose'} />
                  ))}
                </div>
             </section>

             {curriculumView === 'day' ? (
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                 {state.curriculumDays.map(day => {
                   const done = day.moduleIds.filter(id => state.completedModuleIds.includes(id)).length;
                   const allDone = done === day.moduleIds.length && done > 0;
                   return (
                     <div key={day.day} onClick={() => { setSelectedDay(day.day); setActiveTab('dashboard'); }} className={`p-12 rounded-[3.5rem] border-2 cursor-pointer transition-all ${allDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-violet-300 hover:shadow-2xl hover:-translate-y-3'}`}>
                        <div className="flex justify-between items-start mb-10">
                          <div>
                            <span className="px-5 py-2 bg-[#12111A] text-white text-[11px] font-black rounded-xl uppercase tracking-widest font-mono">STEP {day.day}</span>
                            <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mt-8 leading-tight">{day.focus}</h4>
                          </div>
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${allDone ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-200' : 'bg-slate-50 text-slate-200'}`}>
                            <i className="fa-solid fa-flag-checkered"></i>
                          </div>
                        </div>
                        <p className="text-[12px] text-slate-500 font-bold mb-10 italic leading-relaxed h-14 overflow-hidden opacity-70">{day.summary}</p>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-violet-500 transition-all duration-1000" style={{ width: `${(done/day.moduleIds.length)*100}%` }}></div>
                        </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="space-y-16">
                 {['AI', 'QuickBooks', 'Excel', 'Insurance', 'Tech'].map(track => {
                    const mods = state.masterSyllabus.filter(m => m.track === track);
                    if (mods.length === 0) return null;
                    const done = mods.filter(m => state.completedModuleIds.includes(m.id)).length;
                    return (
                      <div key={track} className="bg-white rounded-[4rem] border-2 border-slate-100 overflow-hidden shadow-sm">
                        <div className="bg-[#F8FAFC] px-14 py-10 border-b-2 border-slate-50 flex justify-between items-center">
                            <div>
                               <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{track} Path</h4>
                               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-3">Specialization Track</p>
                            </div>
                            <div className="text-right">
                               <p className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{done} / {mods.length}</p>
                               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Completed</p>
                            </div>
                        </div>
                        <div className="p-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {mods.map(m => {
                              const isDone = state.completedModuleIds.includes(m.id);
                              return (
                                <div key={m.id} onClick={() => toggleModule(m.id)} className={`p-10 rounded-[3rem] border-2 cursor-pointer transition-all flex items-center gap-6 ${isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:shadow-2xl hover:border-violet-200'}`}>
                                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border-2 ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xl shadow-emerald-100' : 'bg-white border-slate-100 text-slate-200'}`}>
                                    <i className="fa-solid fa-check text-xl"></i>
                                  </div>
                                  <span className={`text-[15px] font-black tracking-tight uppercase ${isDone ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{m.title}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                 })}
               </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
};

const CourseProgressCard: React.FC<{ label: string, stats: {done: number, total: number}, icon: string, color: string }> = ({ label, stats, icon, color }) => {
  const percent = Math.round((stats.done / stats.total) * 100) || 0;
  const colorMap: any = { blue: 'bg-blue-600', emerald: 'bg-emerald-500', amber: 'bg-amber-500', indigo: 'bg-indigo-600', rose: 'bg-rose-500' };
  return (
    <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-xl shadow-2xl">
      <div className="flex justify-between items-start mb-10">
        <div className={`w-16 h-16 rounded-[1.75rem] ${colorMap[color]} flex items-center justify-center text-white text-3xl shadow-2xl`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">{label}</div>
          <div className="text-4xl font-black text-white leading-none font-mono tracking-tighter">{stats.done}/{stats.total}</div>
        </div>
      </div>
      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
        <div className={`h-full ${colorMap[color]} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
      </div>
      <div className="text-[12px] font-black text-right text-violet-400/70 uppercase tracking-widest font-mono">{percent}% Path</div>
    </div>
  );
};

const NavItem: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <li>
    <button onClick={onClick} className={`w-full flex items-center gap-6 px-10 py-6 rounded-[2rem] transition-all group ${active ? 'bg-violet-600 text-white shadow-2xl translate-x-3' : 'text-slate-500 hover:bg-slate-800/40 hover:text-white'}`}>
      <i className={`fa-solid ${icon} w-8 text-center text-xl transition-transform group-hover:scale-125`}></i>
      <span className="font-black text-[14px] tracking-[0.1em] uppercase">{label}</span>
      {active && <div className="ml-auto w-3 h-3 rounded-full bg-white animate-pulse"></div>}
    </button>
  </li>
);

export default App;
