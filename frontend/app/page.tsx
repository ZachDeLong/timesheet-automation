"use client";

import React, { useState, useEffect } from "react";
import { Play, Square, Download, Clock, Briefcase, CheckCircle, Edit2, Save, X, Calendar, Tag, PlusCircle, Copy, Settings, Trash2, Plus } from "lucide-react";

// --- Types ---
interface Task {
  id: number;
  description: string;
  project: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: string;
  hours: number;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

import { CATEGORIES, DEFAULT_DESCRIPTIONS } from "./constants";

export default function Dashboard() {
  // --- State ---
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  // Custom Tasks Logic (Persists in Browser)
  const [customOptions, setCustomOptions] = useState<Record<string, string[]>>({});

  // Load from Local Storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mom_custom_tasks");
    if (saved) {
      setCustomOptions(JSON.parse(saved));
    }
  }, []);

  // --- Dynamic Category Logic ---
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isManageMode, setIsManageMode] = useState(false); // Toggles the "Edit" view
  const [newCategoryName, setNewCategoryName] = useState("");

  // Load custom categories on startup
  useEffect(() => {
    const saved = localStorage.getItem("mom_custom_categories");
    if (saved) {
      setCustomCategories(JSON.parse(saved));
    }
  }, []);

  const addCategory = () => {
    if (newCategoryName && !CATEGORIES.includes(newCategoryName) && !customCategories.includes(newCategoryName)) {
      const updated = [...customCategories, newCategoryName];
      setCustomCategories(updated);
      localStorage.setItem("mom_custom_categories", JSON.stringify(updated));
      setNewCategoryName(""); // Clear input
      setSelectedCategory(newCategoryName); // Auto-select it
      setIsManageMode(false); // Close menu
    }
  };

  const deleteCategory = (catToDelete: string) => {
    if (confirm(`Delete category "${catToDelete}"?`)) {
      const updated = customCategories.filter(c => c !== catToDelete);
      setCustomCategories(updated);
      localStorage.setItem("mom_custom_categories", JSON.stringify(updated));
      // Reset selection if we deleted the active one
      if (selectedCategory === catToDelete) {
        setSelectedCategory(CATEGORIES[0]);
      }
    }
  };

  // Helper to Save Custom Task
  const saveCustomTask = () => {
    if (!currentTask) return;
    
    const existing = customOptions[selectedCategory] || [];
    if (!existing.includes(currentTask)) {
      const newOptions = {
        ...customOptions,
        [selectedCategory]: [...existing, currentTask]
      };
      setCustomOptions(newOptions);
      localStorage.setItem("mom_custom_tasks", JSON.stringify(newOptions));
      alert("Task saved to list!");
    }
  };

  // Helper to Delete Custom Task
  const deleteCustomTask = (taskToDelete: string) => {
    const existing = customOptions[selectedCategory] || [];
    const newList = existing.filter(t => t !== taskToDelete);
    
    const newOptions = {
      ...customOptions,
      [selectedCategory]: newList
    };
    setCustomOptions(newOptions);
    localStorage.setItem("mom_custom_tasks", JSON.stringify(newOptions));
  };
  
  // Inputs
  const [currentTask, setCurrentTask] = useState("");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  // Combine File Categories + Custom Categories
  const allCategories = [...CATEGORIES, ...customCategories];

  // Dummy Data to start
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, description: "Budget Review", project: "Administration 2025", day: "Monday", startTime: "-", endTime: "-", duration: "1.5h", hours: 1.5 },
  ]);

  // Edit Mode State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ description: "", hours: 0, day: "Monday", project: "" });

  // --- Timer Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleStartStop = () => {
    if (isTimerRunning) {
      const hours = timerSeconds / 3600;
      const newTask: Task = {
        id: Date.now(),
        description: currentTask || "Untitled Task",
        project: selectedCategory,
        day: selectedDay,
        startTime: new Date().toLocaleTimeString(),
        endTime: new Date().toLocaleTimeString(),
        duration: formatTime(timerSeconds),
        hours: parseFloat(hours.toFixed(4)),
      };
      setTasks([newTask, ...tasks]);
      setTimerSeconds(0);
      setCurrentTask("");
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const duplicateTask = (task: Task) => {
    const newTask = { ...task, id: Date.now() }; // Create copy with new ID
    setTasks([newTask, ...tasks]);
  };

  // --- NEW: Manual Entry Logic ---
  const handleManualAdd = () => {
    const descInput = document.getElementById('manual-desc') as HTMLInputElement;
    const hoursInput = document.getElementById('manual-hours') as HTMLInputElement;
    const catInput = document.getElementById('manual-cat') as HTMLSelectElement;
    const dayInput = document.getElementById('manual-day') as HTMLSelectElement;

    const desc = descInput.value;
    const hours = parseFloat(hoursInput.value);
    
    if (desc && hours > 0) {
      const newTask: Task = {
        id: Date.now(),
        description: desc,
        project: catInput.value,
        day: dayInput.value,
        startTime: "-", 
        endTime: "-",
        duration: `${hours}h`,
        hours: hours,
      };
      setTasks([newTask, ...tasks]);
      
      // Reset inputs
      descInput.value = "";
      hoursInput.value = "";
    } else {
      alert("Please enter a description and hours!");
    }
  };

  // --- Export Logic (Group by Project) ---
  const handleExport = async () => {
    // 1. Initialize a map with all your categories (so they appear even if 0 hours)
    // This ensures the order matches Clarity perfectly every time.
    const projectMap: Record<string, any> = {};
    allCategories.forEach(cat => {
      projectMap[cat] = { name: cat, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
    });

    // 2. Sum up the hours
    tasks.forEach(task => {
      // If task has a project not in our list, add it safely
      if (!projectMap[task.project]) {
        projectMap[task.project] = { name: task.project, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
      }
      
      const dayKey = task.day.toLowerCase();
      if (projectMap[task.project][dayKey] !== undefined) {
        projectMap[task.project][dayKey] += task.hours;
      }
    });

    // 3. Convert map to a list for the backend
    const projectList = Object.values(projectMap);

    const payload = { 
      employee_name: "Mom", 
      projects: projectList 
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/export-timesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        a.download = `Mom_Timesheet_${dateStr}_${timeStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Error exporting timesheet.");
      }
    } catch (error) {
      console.error(error);
      alert("Backend not running!");
    }
  };

  // --- Edit Logic ---
  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ description: task.description, hours: task.hours, day: task.day, project: task.project });
  };

  const saveEdit = (id: number) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, ...editForm } : t)));
    setEditingId(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Clock size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">TimeTrack</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium bg-blue-50 text-blue-600">
             <Briefcase size={18} /> Dashboard
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="px-8 py-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Timesheet Dashboard</h1>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm active:scale-95">
            <Download size={18} /> Download Cheat Sheet
          </button>
        </header>

        <div className="p-8 max-w-6xl mx-auto space-y-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 text-gray-500 mb-2"><Clock size={18} /><span className="text-sm font-medium">Total Time This Week</span></div>
              <div className="text-3xl font-bold text-gray-900">{tasks.reduce((acc, t) => acc + t.hours, 0).toFixed(2)}h</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 text-gray-500 mb-2"><CheckCircle size={18} /><span className="text-sm font-medium">Tasks Completed</span></div>
              <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
            </div>
          </div>

          {/* Timer Section */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-1/2 space-y-4">
              {/* Smart Task Input Section */}
              <div>
                <div className="flex justify-between items-end mb-2">
                   <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">
                    What are you working on?
                  </label>
                  {/* Save Button: Only shows if text is typed but not in list yet */}
                  {currentTask && 
                   !DEFAULT_DESCRIPTIONS[selectedCategory]?.includes(currentTask) && 
                   !customOptions[selectedCategory]?.includes(currentTask) && (
                    <button 
                      onClick={saveCustomTask}
                      className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Plus size={14} /> Save to list
                    </button>
                  )}
                </div>
                
                <input 
                  type="text" 
                  list="task-suggestions" 
                  placeholder="Type or select a task..." 
                  className="w-full text-xl font-medium text-gray-700 placeholder-gray-300 outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors py-2 bg-transparent"
                  value={currentTask}
                  onChange={(e) => setCurrentTask(e.target.value)}
                />

                {/* The "Dropdown" Logic */}
                <datalist id="task-suggestions">
                   {/* 1. Show File Defaults (Locked) */}
                   {(DEFAULT_DESCRIPTIONS[selectedCategory] || []).map((desc, i) => (
                      <option key={`def-${i}`} value={desc} />
                   ))}
                   
                   {/* 2. Show Custom User Saved Tasks */}
                   {(customOptions[selectedCategory] || []).map((desc, i) => (
                      <option key={`cust-${i}`} value={desc} />
                   ))}
                </datalist>

                {/* Manage List (Delete Buttons) */}
                {(customOptions[selectedCategory]?.length || 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-400 py-1">Saved:</span>
                    {customOptions[selectedCategory].map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {t}
                        <button 
                          onClick={() => deleteCustomTask(t)}
                          className="hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <Calendar size={16} className="text-gray-400" />
                  <select className="bg-transparent text-sm text-gray-600 focus:outline-none" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                    {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                {/* Dynamic Category Selector */}
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1">
                     <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                       Project / Category
                     </label>
                     <button 
                       onClick={() => setIsManageMode(!isManageMode)}
                       className="text-gray-400 hover:text-blue-600 transition-colors"
                       title="Manage Categories"
                     >
                       <Settings size={14} />
                     </button>
                  </div>

                  {isManageMode ? (
                    // --- MANAGE MODE ---
                    <div className="bg-gray-50 p-2 rounded-lg border border-blue-200 space-y-2 animate-in fade-in slide-in-from-top-2">
                      {/* Add New Input */}
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="New Project Name..."
                          className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 outline-none focus:border-blue-500"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <button 
                          onClick={addCategory}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
                        >
                          ADD
                        </button>
                      </div>
                      
                      {/* List of Custom Categories (Deletable) */}
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {customCategories.length === 0 && <p className="text-xs text-gray-400 italic">No custom categories added.</p>}
                        {customCategories.map(cat => (
                          <div key={cat} className="flex justify-between items-center bg-white px-2 py-1 rounded border border-gray-100 text-sm">
                            <span className="truncate">{cat}</span>
                            <button onClick={() => deleteCategory(cat)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // --- NORMAL MODE ---
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 w-full transition-all hover:border-gray-300">
                      <Tag size={16} className="text-gray-400" />
                      <select 
                        className="bg-transparent text-sm text-gray-600 focus:outline-none w-full cursor-pointer"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-5xl font-mono font-bold text-gray-900 tracking-wider">{formatTime(timerSeconds)}</div>
              <button onClick={handleStartStop} className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white shadow-lg transition-transform active:scale-95 ${isTimerRunning ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}`}>
                {isTimerRunning ? <><Square fill="currentColor" size={18} /> STOP</> : <><Play fill="currentColor" size={18} /> START</>}
              </button>
            </div>
          </div>

          {/* --- NEW: Manual Entry Section --- */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <PlusCircle size={16} /> Add Past Task Manually
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
                <input type="text" id="manual-desc" placeholder="Details..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
              </div>
              <div className="w-full md:w-64">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Project / Category</label>
                <select id="manual-cat" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="w-full md:w-32">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Day</label>
                <select id="manual-day" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="w-full md:w-24">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Hours</label>
                <input type="number" id="manual-hours" placeholder="1.0" step="0.25" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
              </div>
              <button onClick={handleManualAdd} className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-medium h-[38px] w-full md:w-auto">
                Add
              </button>
            </div>
          </div>

          {/* Activity Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-700">This Week's Log</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Day</th>
                  <th className="px-6 py-4 font-semibold">Hours</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {editingId === task.id ? (
                        <input className="border rounded px-2 py-1 w-full" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
                      ) : task.description}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === task.id ? (
                        <select className="border rounded px-2 py-1 text-sm w-48" value={editForm.project} onChange={(e) => setEditForm({...editForm, project: e.target.value})}>
                          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">{task.project}</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                        {editingId === task.id ? (
                        <select className="border rounded px-2 py-1 text-sm" value={editForm.day} onChange={(e) => setEditForm({...editForm, day: e.target.value})}>
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      ) : <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{task.day}</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                        {editingId === task.id ? <input type="number" className="border rounded px-2 py-1 w-20" value={editForm.hours} onChange={(e) => setEditForm({...editForm, hours: parseFloat(e.target.value)})} /> : 
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{task.hours}h</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {editingId === task.id ? (
                         <div className="flex justify-end gap-2">
                           <button onClick={() => saveEdit(task.id)} className="text-green-600 hover:text-green-800"><Save size={18}/></button>
                           <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                         </div>
                       ) : (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => duplicateTask(task)} 
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                            title="Duplicate Task"
                          >
                            <Copy size={16} />
                          </button>
                          <button onClick={() => startEditing(task)} className="text-gray-400 hover:text-blue-600 transition-colors p-1"><Edit2 size={16} /></button>
                          <button 
                            onClick={() => {
                              if(confirm('Delete this task?')) setTasks(tasks.filter(t => t.id !== task.id));
                            }} 
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}