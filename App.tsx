
import React, { useState, useRef, useEffect } from 'react';
import { AppState, INITIAL_STATE, Stage, ChatMessage, OutlineItem, FeedbackPoint } from './types';
import { LevelLayout } from './components/LevelLayout';
import { StatusHUD } from './components/StatusHUD';
import { getBrainstormResponse, generateOutlineFeedback, generateRefinementFeedback, extractOutlineIdeas } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { HeroAvatar, TavernScene, WoodsScene, FortressScene, PlainsScene, DragonScene, VictoryScene } from './components/PixelArt';

// Icons
const LoadingIcon = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [tempInput, setTempInput] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  
  // Specific state inputs
  const [outlineFeedback, setOutlineFeedback] = useState<string>('');

  // Scroll/Camera Ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Camera Movement Logic
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Since we added a 6th stage (CREDITS = 5), we need to support it in translation
      scrollContainerRef.current.style.transform = `translateX(-${state.currentStage * 100}vw)`;
    }
  }, [state.currentStage]);

  // --- Handlers ---

  const updateGoal = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      goals: { ...prev.goals, [field]: value }
    }));
  };

  const handleBrainstormSend = async () => {
    if (!tempInput.trim()) return;
    
    const newUserMsg: ChatMessage = { role: 'user', text: tempInput, timestamp: Date.now() };
    
    // Optimistically add user message
    setState(prev => ({
      ...prev,
      brainstormChat: [...prev.brainstormChat, newUserMsg],
      xp: prev.xp + 10
    }));
    setTempInput('');
    setLoading(true);

    // Construct history including the new message for the API call
    const historyForApi = [...state.brainstormChat, newUserMsg];
    const response = await getBrainstormResponse(historyForApi, state.goals.topic, newUserMsg.text);
    
    // Only append the MODEL response, do not re-add user message
    setState(prev => ({
      ...prev,
      brainstormChat: [...prev.brainstormChat, { role: 'model', text: response, timestamp: Date.now() }]
    }));
    setLoading(false);
  };

  // Transition from Brainstorm to Outline with Idea Extraction
  const handleTransitionToOutline = async () => {
    setTransitioning(true);
    try {
      // If we haven't extracted ideas yet, do it now
      if (state.suggestedIdeas.length === 0 && state.brainstormChat.length > 0) {
        const ideas = await extractOutlineIdeas(state.goals.topic, state.brainstormChat);
        setState(prev => ({
          ...prev,
          suggestedIdeas: ideas,
          currentStage: 2
        }));
      } else {
        setState(prev => ({ ...prev, currentStage: 2 }));
      }
    } catch (e) {
      console.error("Failed to transition", e);
      setState(prev => ({ ...prev, currentStage: 2 }));
    } finally {
      setTransitioning(false);
    }
  };

  const addOutlineItem = (titleOverride?: string) => {
    const newItem: OutlineItem = {
      id: Date.now().toString(),
      title: titleOverride || `Point ${state.outline.length + 1}`,
      description: ''
    };
    setState(prev => ({ ...prev, outline: [...prev.outline, newItem] }));
  };

  const updateOutlineItem = (id: string, field: 'title' | 'description', value: string) => {
    setState(prev => ({
      ...prev,
      outline: prev.outline.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const moveOutlineItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === state.outline.length - 1) return;

    const newOutline = [...state.outline];
    // Swap items
    const temp = newOutline[index];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    newOutline[index] = newOutline[targetIndex];
    newOutline[targetIndex] = temp;
    
    setState(prev => ({ ...prev, outline: newOutline }));
  };

  const deleteOutlineItem = (id: string) => {
     if (window.confirm("Destroy this building block?")) {
        setState(prev => ({ ...prev, outline: prev.outline.filter(i => i.id !== id) }));
     }
  };

  const checkOutline = async () => {
    setLoading(true);
    const feedback = await generateOutlineFeedback(state.goals.topic, state.outline);
    setOutlineFeedback(feedback);
    setState(prev => ({ ...prev, xp: prev.xp + 50 }));
    setLoading(false);
  };

  const initializeDraftFromOutline = () => {
    if (state.draftContent.trim().length > 20) {
      if (!window.confirm("This will overwrite your current draft with the outline structure. Continue?")) {
        return;
      }
    }

    const skeleton = state.outline
      .map((item) => `## ${item.title}\n${item.description}\n\n[Start writing here...]\n`)
      .join('\n\n');
    
    setState(prev => ({
      ...prev,
      draftContent: skeleton
    }));
  };

  const analyzeDraft = async () => {
    setLoading(true);
    const feedback = await generateRefinementFeedback(state.draftContent, state.goals.topic, state.goals);
    setState(prev => ({
      ...prev,
      refinementFeedback: feedback,
      xp: prev.xp + 100,
      revisionCount: prev.revisionCount + 1
    }));
    setLoading(false);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(state.draftContent).then(() => {
      alert("Draft copied to your clipboard!");
    });
  };

  const handleDownloadDraft = () => {
    const element = document.createElement("a");
    const file = new Blob([state.draftContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${state.goals.topic.replace(/\s+/g, '_') || 'quest_essay'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const wordCount = state.draftContent.trim().split(/\s+/).filter(w => w.length > 0).length;

  // Helper to compose Scene + Hero for the Header
  const RenderScene = ({ Scene, stage }: { Scene: React.FC<any>, stage: number }) => (
    <div className="flex items-end justify-center gap-0 md:gap-4 relative">
      {/* Background Scene Element */}
      <div className="absolute bottom-0 opacity-60 md:opacity-80 scale-75 md:scale-100 origin-bottom">
         <Scene className="w-40 h-20 md:w-48 md:h-24 text-white" />
      </div>
      {/* Hero Element - Foreground */}
      <div className="relative z-10 translate-y-1">
         <HeroAvatar stage={stage} className="w-20 h-20 md:w-24 md:h-24" />
      </div>
    </div>
  );

  // --- Render ---

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white relative">
      {/* The World Container */}
      <div 
        ref={scrollContainerRef}
        className="flex w-[600vw] h-full transition-transform duration-700 ease-in-out will-change-transform"
      >
        
        {/* --- Stage 1: The Tavern (Setup) --- */}
        <LevelLayout 
          title="The Starting Tavern" 
          subtitle="Mission Setup" 
          colorClass="slate-900"
          isActive={state.currentStage === 0}
          onNext={() => setState(p => ({ ...p, currentStage: 1 }))}
          canProceed={!!state.goals.topic}
          visual={<RenderScene Scene={TavernScene} stage={0} />}
        >
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8 relative z-10">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-quest-accent">What brings you here, traveler?</h2>
              <p className="text-gray-400">Define your quest before we embark into the wilderness.</p>
            </div>

            <div className="w-full space-y-6 bg-gray-800/50 p-8 rounded-lg border border-gray-700 shadow-xl backdrop-blur-xl">
              <div className="space-y-2 text-left">
                <label className="text-sm font-bold uppercase text-quest-warning">Essay Topic</label>
                <input 
                  type="text"
                  value={state.goals.topic}
                  onChange={(e) => updateGoal('topic', e.target.value)}
                  placeholder="e.g., The Impact of AI on Education"
                  className="w-full bg-black/30 border border-gray-600 rounded p-3 text-white focus:border-quest-accent focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                 <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-quest-warning">Word Goal</label>
                  <input 
                    type="number"
                    value={state.goals.wordCount}
                    onChange={(e) => updateGoal('wordCount', parseInt(e.target.value))}
                    className="w-full bg-black/30 border border-gray-600 rounded p-3 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-quest-warning">Paragraphs</label>
                  <input 
                    type="number"
                    value={state.goals.paragraphCount}
                    onChange={(e) => updateGoal('paragraphCount', parseInt(e.target.value))}
                    className="w-full bg-black/30 border border-gray-600 rounded p-3 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </LevelLayout>

        {/* --- Stage 2: Whispering Woods (Brainstorm) --- */}
        <LevelLayout 
          title="Whispering Woods" 
          subtitle="Brainstorming" 
          colorClass="emerald-900"
          isActive={state.currentStage === 1}
          onPrev={() => setState(p => ({ ...p, currentStage: 0 }))}
          onNext={handleTransitionToOutline} // Uses custom handler for transition
          nextLabel={transitioning ? "Gathering..." : "Collect & Travel East"}
          canProceed={state.brainstormChat.length > 2 && !transitioning}
          visual={<RenderScene Scene={WoodsScene} stage={1} />}
        >
          <div className="flex flex-col h-full relative z-10">
            <div className="flex-1 overflow-y-auto space-y-4 p-4 mb-4 custom-scroll bg-black/20 rounded-lg">
              {state.brainstormChat.length === 0 && (
                <div className="text-center text-gray-400 mt-10 italic">
                  "The woods are quiet. Speak your thoughts to awaken the spirits..."
                </div>
              )}
              {state.brainstormChat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[80%] p-4 rounded-lg
                    ${msg.role === 'user' 
                      ? 'bg-quest-accent/20 border border-quest-accent/50 text-white rounded-tr-none' 
                      : 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-100 rounded-tl-none'}
                  `}>
                    {msg.role === 'model' && <span className="block text-xs font-bold mb-1 text-emerald-400">Mentor Spirit</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && <div className="text-emerald-400 text-sm animate-pulse">The spirits are thinking...</div>}
            </div>
            
            <div className="flex gap-2 h-16">
              <input 
                className="flex-1 bg-black/40 border border-gray-600 rounded px-4 focus:border-emerald-500 focus:outline-none"
                placeholder="Ask a question or share an idea..."
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBrainstormSend()}
              />
              <button 
                onClick={handleBrainstormSend}
                disabled={loading || !tempInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded font-bold disabled:opacity-50"
              >
                SEND
              </button>
            </div>
          </div>
        </LevelLayout>

        {/* --- Stage 3: The Outline Fortress (Structure) --- */}
        <LevelLayout 
          title="The Outline Fortress" 
          subtitle="Structuring" 
          colorClass="indigo-900"
          isActive={state.currentStage === 2}
          onPrev={() => setState(p => ({ ...p, currentStage: 1 }))}
          onNext={() => setState(p => ({ ...p, currentStage: 3 }))}
          canProceed={state.outline.length >= 3}
          visual={<RenderScene Scene={FortressScene} stage={2} />}
        >
          <div className="flex h-full gap-6 relative z-10">
            
            {/* Left: Idea Inventory (New) */}
            <div className="w-64 hidden md:flex flex-col gap-2 border-r border-indigo-800/50 pr-4">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">Idea Inventory</h3>
              <div className="flex-1 overflow-y-auto custom-scroll space-y-2">
                {state.suggestedIdeas.length === 0 ? (
                  <div className="text-xs text-gray-500 italic p-2 bg-black/20 rounded">
                    No ideas gathered from the woods.
                  </div>
                ) : (
                  state.suggestedIdeas.map((idea, i) => (
                    <div key={i} className="bg-indigo-900/40 border border-indigo-700/50 p-3 rounded hover:bg-indigo-800/40 transition group">
                      <p className="text-xs text-indigo-200 mb-2">{idea}</p>
                      <button 
                        onClick={() => addOutlineItem(idea)}
                        className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded w-full opacity-60 group-hover:opacity-100 transition"
                      >
                        + Use Block
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Center: Builder */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scroll pr-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-indigo-300">Fortress Blueprint</h3>
                <button onClick={() => addOutlineItem()} className="text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-500">+ Add Empty Block</button>
              </div>
              
              {state.outline.map((item, idx) => (
                <div key={item.id} className="bg-gray-800/50 p-4 rounded border border-gray-700 group transition-all hover:shadow-lg hover:border-indigo-500/30">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="bg-indigo-900/50 text-indigo-300 text-xs font-bold px-2 py-1 rounded">#{idx + 1}</span>
                      <input 
                        className="bg-transparent font-bold text-indigo-100 w-full focus:outline-none border-b border-transparent focus:border-indigo-500 px-1 transition-colors"
                        value={item.title}
                        onChange={(e) => updateOutlineItem(item.id, 'title', e.target.value)}
                        placeholder="Section Title"
                      />
                    </div>
                    
                    {/* Manipulation Controls */}
                    <div className="flex items-center gap-1 ml-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => moveOutlineItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-indigo-600 rounded text-indigo-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => moveOutlineItem(idx, 'down')}
                        disabled={idx === state.outline.length - 1}
                        className="p-1 hover:bg-indigo-600 rounded text-indigo-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <div className="w-px h-4 bg-gray-600 mx-1"></div>
                      <button 
                        onClick={() => deleteOutlineItem(item.id)}
                        className="p-1 hover:bg-red-900/50 text-gray-500 hover:text-red-400 rounded transition-colors"
                        title="Remove Block"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <textarea 
                    className="w-full bg-black/20 rounded p-3 text-sm text-gray-300 resize-none focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 min-h-[80px]"
                    placeholder="Describe this section's main argument, evidence, or purpose..."
                    value={item.description}
                    onChange={(e) => updateOutlineItem(item.id, 'description', e.target.value)}
                  />
                </div>
              ))}
              
              {state.outline.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded text-gray-500">
                  Your fortress foundation is empty. Use ideas from your inventory or add blocks manually.
                </div>
              )}
            </div>

            {/* Right: Feedback */}
            <div className="w-1/4 hidden lg:flex bg-black/30 rounded border border-indigo-500/30 p-4 flex-col backdrop-blur-sm">
              <h3 className="text-sm font-bold text-indigo-300 mb-4 uppercase tracking-wider border-b border-indigo-500/20 pb-2">
                Architect's Review
              </h3>
              
              <div className="flex-1 overflow-y-auto text-sm text-gray-300 whitespace-pre-wrap custom-scroll">
                {outlineFeedback ? (
                  <div className="bg-indigo-900/20 p-3 rounded border border-indigo-500/30">
                     {outlineFeedback}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-center mt-10">
                    "Construct your outline, then ask for a review to ensure structural integrity."
                  </p>
                )}
              </div>
              
              <button 
                onClick={checkOutline} 
                disabled={loading || state.outline.length === 0}
                className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? <LoadingIcon /> : "Inspect Structure"}
              </button>
            </div>
          </div>
        </LevelLayout>

        {/* --- Stage 4: The Drafting Plains (Writing) --- */}
        <LevelLayout 
          title="The Drafting Plains" 
          subtitle="Production" 
          colorClass="amber-900"
          isActive={state.currentStage === 3}
          onPrev={() => setState(p => ({ ...p, currentStage: 2 }))}
          onNext={() => setState(p => ({ ...p, currentStage: 4 }))}
          canProceed={wordCount > 50}
          visual={<RenderScene Scene={PlainsScene} stage={3} />}
        >
           <div className="h-full flex gap-6 relative z-10">
            {/* Main Editor */}
            <div className="flex-1 flex flex-col relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-amber-400 font-bold text-sm uppercase tracking-widest">Manuscript</h3>
                {state.outline.length > 0 && (
                  <button 
                    onClick={initializeDraftFromOutline}
                    className="text-xs flex items-center gap-1 bg-amber-900/50 border border-amber-700 text-amber-200 px-3 py-1 rounded hover:bg-amber-800 hover:text-white transition-colors"
                    title="Populate editor with your outline structure"
                  >
                    <span>📜</span> Convert Outline to Skeleton
                  </button>
                )}
              </div>
              
              <div className="flex-1 relative">
                <textarea
                  className="w-full h-full bg-white/5 text-gray-100 p-8 text-lg leading-relaxed resize-none focus:outline-none rounded border border-white/10 focus:border-amber-500/50 custom-scroll font-serif"
                  placeholder="Begin your story here..."
                  value={state.draftContent}
                  onChange={(e) => setState(p => ({ ...p, draftContent: e.target.value }))}
                />
                {/* Stats Overlay */}
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur p-2 rounded text-xs text-amber-200 border border-amber-900 shadow-lg">
                  {wordCount} / {state.goals.wordCount} words
                </div>
              </div>
            </div>

            {/* Outline Reference Panel */}
            <div className="hidden md:flex w-80 flex-col bg-black/20 border border-amber-900/30 rounded p-4 backdrop-blur-sm">
               <h3 className="text-amber-500/80 font-bold mb-4 uppercase text-xs tracking-widest border-b border-amber-900/30 pb-2">
                 Reference Guide
               </h3>
               <div className="flex-1 overflow-y-auto custom-scroll space-y-4 pr-2">
                 {state.outline.length === 0 ? (
                   <p className="text-gray-600 italic text-xs text-center mt-10">No outline data found.</p>
                 ) : (
                   state.outline.map((item, i) => (
                     <div key={item.id} className="group">
                       <div className="flex justify-between items-center mb-1">
                         <span className="font-bold text-amber-100 text-sm">{i+1}. {item.title}</span>
                       </div>
                       <div className="text-gray-400 text-xs leading-relaxed pl-4 border-l-2 border-amber-900/50 group-hover:border-amber-500/50 transition-colors">
                         {item.description}
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        </LevelLayout>

         {/* --- Stage 5: The Crystal Summit (Refinement) --- */}
         <LevelLayout 
          title="The Crystal Summit" 
          subtitle="Refinement" 
          colorClass="cyan-900"
          isActive={state.currentStage === 4}
          onPrev={() => setState(p => ({ ...p, currentStage: 3 }))}
          onNext={() => setState(p => ({ ...p, currentStage: 5 }))}
          nextLabel="Finish Quest"
          canProceed={true}
          visual={<RenderScene Scene={DragonScene} stage={4} />}
        >
          <div className="flex h-full gap-8 relative z-10">
            {/* Left: The Draft (Visual Presentation) */}
            <div className="w-full md:w-2/3 flex flex-col relative">
              {/* Toolbar */}
              <div className="flex items-center justify-between bg-gray-900/90 border border-white/10 rounded-t-lg px-4 py-3 backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                   <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">Final Manuscript</h3>
                   {state.revisionCount > 0 && (
                     <span className="text-xs bg-cyan-900 text-cyan-200 px-2 py-0.5 rounded-full border border-cyan-700">
                       Revision v{state.revisionCount + 1}
                     </span>
                   )}
                 </div>
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={handleCopyDraft}
                     className="text-xs flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/20 px-3 py-1.5 rounded transition-colors"
                     title="Copy text to clipboard"
                   >
                     📋 Copy
                   </button>
                   <button 
                     onClick={handleDownloadDraft}
                     className="text-xs flex items-center gap-1 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-600 text-cyan-100 px-3 py-1.5 rounded transition-colors"
                     title="Download as .txt"
                   >
                     💾 Export
                   </button>
                 </div>
              </div>

              {/* Paper View */}
              <div className="flex-1 overflow-y-auto custom-scroll bg-white text-gray-900 p-8 md:p-12 shadow-2xl border-x border-b border-gray-300/20 rounded-b-lg relative">
                 <div className="max-w-3xl mx-auto whitespace-pre-wrap font-serif text-lg leading-relaxed">
                   {state.draftContent || <span className="text-gray-400 italic">The scroll is blank... return to the plains to write.</span>}
                 </div>
              </div>
            </div>

            {/* Right: Analysis & Navigation */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              
              {/* Action Card */}
              <div className="bg-black/40 backdrop-blur-md p-5 rounded-xl border border-cyan-500/30 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg text-cyan-300 pixel-font">Crystal Analysis</h3>
                    <p className="text-xs text-cyan-500/70 mt-1">Polish Level</p>
                    {/* Polish Meter */}
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-2 w-6 rounded-sm ${i < state.revisionCount ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-gray-800'}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={analyzeDraft}
                    disabled={loading || !state.draftContent}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                    title="Analyze Draft"
                  >
                    {loading ? <LoadingIcon /> : "🔍"}
                  </button>
                </div>

                {/* Feedback Feed */}
                <div className="h-64 overflow-y-auto custom-scroll space-y-3 pr-1">
                  {state.refinementFeedback.length === 0 && (
                    <div className="text-gray-500 text-center text-sm italic py-8">
                      "Gaze into the crystal to reveal hidden truths about your writing."
                    </div>
                  )}
                  {state.refinementFeedback.map((fb, i) => (
                    <div key={i} className={`
                      p-3 rounded text-sm border-l-2
                      ${fb.type === 'strength' ? 'bg-green-900/20 border-green-500' : 
                        fb.type === 'improvement' ? 'bg-red-900/20 border-red-500' : 
                        'bg-blue-900/20 border-blue-500'}
                    `}>
                      <div className="flex justify-between mb-1">
                        <span className={`uppercase text-[10px] font-bold tracking-wider
                           ${fb.type === 'strength' ? 'text-green-400' : 
                             fb.type === 'improvement' ? 'text-red-400' : 
                             'text-blue-400'}
                        `}>{fb.type}</span>
                        <span className="text-[10px] text-gray-500">{fb.area}</span>
                      </div>
                      <p className="text-gray-300 leading-snug">{fb.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Iteration Call to Action */}
              <div className="bg-gradient-to-r from-amber-900/40 to-transparent p-4 rounded-lg border border-amber-700/30 flex flex-col gap-2">
                <p className="text-xs text-amber-200/80">
                  Writing is a cycle. Use the feedback above, then return to the Drafting Plains to polish your work.
                </p>
                <button 
                  onClick={() => setState(p => ({ ...p, currentStage: 3 }))}
                  className="w-full py-2 bg-amber-800/50 hover:bg-amber-700 border border-amber-600/50 rounded text-amber-100 text-sm font-bold flex justify-center items-center gap-2 transition-all"
                >
                  <span>←</span> Return to Drafting Plains to Edit
                </button>
              </div>

              {/* Stats */}
               <div className="flex-1 min-h-[100px] bg-black/20 rounded p-2 border border-white/5 backdrop-blur-sm">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={[
                       { name: 'Current', val: wordCount }, 
                       { name: 'Goal', val: state.goals.wordCount }
                     ]}>
                       <XAxis dataKey="name" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false}/>
                       <YAxis hide />
                       <Tooltip 
                        contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px', fontSize: '12px'}}
                        itemStyle={{color: '#e5e7eb'}}
                        cursor={{fill: 'transparent'}} 
                       />
                       <Bar dataKey="val" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={40} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>

            </div>
          </div>
        </LevelLayout>

        {/* --- Stage 5: Hall of Legends (Credits) --- */}
        <LevelLayout 
          title="The Hall of Legends" 
          subtitle="Victory" 
          colorClass="yellow-900"
          isActive={state.currentStage === 5}
          onPrev={() => setState(p => ({ ...p, currentStage: 4 }))}
          visual={<RenderScene Scene={VictoryScene} stage={5} />}
        >
          <div className="flex flex-col items-center justify-center h-full relative z-10">
            <div className="text-center space-y-8 bg-black/60 backdrop-blur-xl p-12 rounded-2xl border-2 border-yellow-500/30 shadow-2xl max-w-2xl">
              <div>
                <h2 className="text-4xl md:text-5xl pixel-font text-yellow-400 mb-2">Quest Complete!</h2>
                <p className="text-yellow-200/80 italic">You have conquered the blank page and forged an essay of legend.</p>
              </div>

              <div className="space-y-6 py-8 border-y border-white/10">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest text-gray-500">Lead Architect</p>
                  <p className="text-2xl font-bold text-white">Dr. Mario Borrero</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Powered By</p>
                    <p className="text-lg text-blue-300 font-semibold">Google Gemini API</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Built With</p>
                    <p className="text-lg text-cyan-300 font-semibold">React & Tailwind</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (window.confirm("Start a new journey? This will clear your current progress.")) {
                    setState(INITIAL_STATE);
                  }
                }}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-8 py-4 rounded text-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]"
              >
                Start New Quest
              </button>
            </div>
          </div>
        </LevelLayout>

      </div>
      
      {/* Global Status HUD */}
      <StatusHUD 
        currentStage={state.currentStage}
        wordCount={wordCount}
        goalWordCount={state.goals.wordCount}
        xp={state.xp}
      />
    </div>
  );
}
