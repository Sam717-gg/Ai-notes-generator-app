import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  History, 
  FileText, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check,
  ChevronRight,
  Settings2,
  BookOpen,
  Layout,
  MessageSquare,
  BrainCircuit,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Note, NoteType, GenerationConfig } from './types';
import { generateNote } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    type: 'summary',
    tone: 'professional',
    length: 'medium'
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lumina-notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse notes', e);
      }
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('lumina-notes', JSON.stringify(notes));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.createdAt - a.createdAt);
  }, [notes, searchQuery]);

  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId), 
  [notes, activeNoteId]);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    try {
      const generatedContent = await generateNote(inputText, config);
      
      // Extract title from first line if it starts with #
      const lines = generatedContent.split('\n');
      let title = 'Untitled Note';
      let content = generatedContent;
      
      if (lines[0].startsWith('# ')) {
        title = lines[0].replace('# ', '').trim();
        content = lines.slice(1).join('\n').trim();
      }

      const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        type: config.type,
        createdAt: Date.now(),
        sourceText: inputText
      };

      setNotes(prev => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setInputText('');
    } catch (error) {
      console.error('Generation failed', error);
      alert('Failed to generate note. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const noteTypeIcons: Record<NoteType, React.ReactNode> = {
    'summary': <FileText className="w-4 h-4" />,
    'study-guide': <BookOpen className="w-4 h-4" />,
    'meeting-minutes': <Layout className="w-4 h-4" />,
    'brainstorm': <BrainCircuit className="w-4 h-4" />,
    'flashcards': <CreditCard className="w-4 h-4" />
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-bottom border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Lumina</h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <button 
            onClick={() => setActiveNoteId(null)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              !activeNoteId ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
          
          <div className="pt-4 pb-2 px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Notes</span>
          </div>

          {filteredNotes.map(note => (
            <button
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={cn(
                "w-full group flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all text-left",
                activeNoteId === note.id ? "bg-white shadow-sm border border-slate-200" : "hover:bg-slate-50 border border-transparent"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                activeNoteId === note.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
              )}>
                {noteTypeIcons[note.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{note.title}</div>
                <div className="text-xs text-slate-400 truncate">
                  {format(note.createdAt, 'MMM d, h:mm a')}
                </div>
              </div>
              <button 
                onClick={(e) => deleteNote(note.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!activeNoteId ? (
            <motion.div 
              key="generator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full"
            >
              <div className="w-full space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight">Transform your thoughts</h2>
                  <p className="text-slate-500">Paste your messy notes, meeting transcripts, or study materials below.</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 space-y-6">
                  <textarea
                    placeholder="Paste your content here..."
                    className="w-full h-64 p-4 bg-slate-50 border border-slate-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-700 leading-relaxed"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Note Type</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                        value={config.type}
                        onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as NoteType }))}
                      >
                        <option value="summary">Summary</option>
                        <option value="study-guide">Study Guide</option>
                        <option value="meeting-minutes">Meeting Minutes</option>
                        <option value="brainstorm">Brainstorm</option>
                        <option value="flashcards">Flashcards</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Tone</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                        value={config.tone}
                        onChange={(e) => setConfig(prev => ({ ...prev, tone: e.target.value as any }))}
                      >
                        <option value="professional">Professional</option>
                        <option value="academic">Academic</option>
                        <option value="casual">Casual</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Length</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                        value={config.length}
                        onChange={(e) => setConfig(prev => ({ ...prev, length: e.target.value as any }))}
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !inputText.trim()}
                    className={cn(
                      "w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all",
                      isGenerating || !inputText.trim() 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating your notes...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Notes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="viewer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full bg-white"
            >
              {/* Note Header */}
              <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    {noteTypeIcons[activeNote!.type]}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{activeNote?.title}</h2>
                    <p className="text-xs text-slate-400">{format(activeNote!.createdAt, 'MMMM d, yyyy • h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => copyToClipboard(activeNote!.title + '\n\n' + activeNote!.content, activeNote!.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
                  >
                    {copiedId === activeNote!.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                  <button 
                    onClick={(e) => deleteNote(activeNote!.id, e as any)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* Note Content */}
              <div className="flex-1 overflow-y-auto px-8 py-10">
                <div className="max-w-3xl mx-auto prose prose-slate prose-indigo">
                  <div className="markdown-body">
                    <ReactMarkdown>{activeNote?.content || ''}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
