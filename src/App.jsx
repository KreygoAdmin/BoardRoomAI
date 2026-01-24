import React, { useState, useEffect, useRef } from 'react';
import { 
  Gavel, 
  Users, 
  FileText, 
  Settings, 
  Vote, 
  RotateCcw, 
  BrainCircuit, 
  ChevronRight, 
  Shuffle,
  ListOrdered,
  Sparkles,
  ClipboardList,
  Edit,
  Plus,
  Trash2,
  X,
  Save,
  Menu,
  AlertTriangle,
  ShieldAlert,
  Key
} from 'lucide-react';

/* ===================================================================
  BOARDROOM SIMULATOR - MULTI-AGENT ORCHESTRATION SYSTEM
  
  Features:
  - Mobile Friendly (Responsive Sidebar)
  - Rate Limit Protection (Exponential Backoff + Jitter)
  - Paced Execution (Delays between agents)
  - Hybrid API Key Handling
  ===================================================================
*/

// System default key (injected by environment)
const systemApiKey = ""; 

// --- Default Personas ---
const DEFAULT_BOARD = [
  {
    id: 'cfo',
    name: 'Marcus',
    role: 'CFO',
    avatar: 'bg-blue-600',
    description: 'Risk-averse, focused on ROI, budget constraints, and fiscal responsibility. Skeptical of new spending.',
    stats: { agreement: 50, aggression: 20 }
  },
  {
    id: 'cto',
    name: 'Sarah',
    role: 'CTO',
    avatar: 'bg-purple-600',
    description: 'Tech-forward, obsessed with scalability, AI, and modern stacks. Dislikes legacy systems. Often clashes with CFO.',
    stats: { agreement: 60, aggression: 40 }
  },
  {
    id: 'legal',
    name: 'Priya',
    role: 'Legal',
    avatar: 'bg-yellow-600',
    description: 'Cautious, focused on compliance, liability, and regulation. The "no" person if things get risky.',
    stats: { agreement: 40, aggression: 10 }
  },
  {
    id: 'cmo',
    name: 'David',
    role: 'CMO',
    avatar: 'bg-pink-600',
    description: 'Excitable, focused on brand image, virality, and user perception. Often ignores technical constraints.',
    stats: { agreement: 70, aggression: 60 }
  },
  {
    id: 'coo',
    name: 'Alex',
    role: 'COO',
    avatar: 'bg-green-600',
    description: 'Pragmatic, focused on execution, logistics, and operational efficiency. Cares about "how" we actually build it, not just the vision.',
    stats: { agreement: 55, aggression: 30 }
  }
];

// --- Helper: Sleep ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- Main Component ---
export default function App() {
  // State: Conversation & Logic
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(""); 
  const [retryStatus, setRetryStatus] = useState(null); 
  
  // Turn Modes
  const [turnMode, setTurnMode] = useState("smart"); 
  const [lastSpeakerIndex, setLastSpeakerIndex] = useState(-1);

  // State: Board & Context
  const [boardMembers, setBoardMembers] = useState(DEFAULT_BOARD);
  const [whiteboardFacts, setWhiteboardFacts] = useState("Project: 'Project Alpha'\nGoal: Launch a new AI boardroom app\nBudget: $1k\nTimeline: unknown");
  
  // API Key State
  const [customApiKey, setCustomApiKey] = useState("");

  const [minutes, setMinutes] = useState({
    consensus: "None yet.",
    friction: "None yet.",
    momentum: "Neutral",
    actionItems: ["Define project scope"]
  });

  // State: UI
  const [showSettings, setShowSettings] = useState(false);
  const [showMemberConfig, setShowMemberConfig] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, retryStatus]);

  // --- API CALLER ---
  const callGemini = async (prompt, systemInstruction = "You are a helpful AI.") => {
    let retries = 0;
    const maxRetries = 4; // Sufficient retry count
    const baseDelay = 2000; // Start with 2 seconds minimum wait

    // Use custom key if provided, otherwise fallback to system key
    const activeKey = customApiKey || systemApiKey;

    while (retries < maxRetries) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${activeKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
            }),
          }
        );

        if (response.status === 403) {
            throw new Error("INVALID_KEY");
        }

        if (response.status === 429 || response.status === 503) {
          throw new Error("RATE_LIMIT");
        }

        if (!response.ok) throw new Error(`HTTP_${response.status}`);
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text && data.candidates?.[0]?.finishReason === "SAFETY") {
             return "I cannot respond to that due to safety guidelines.";
        }
        if (!text) throw new Error("EMPTY_RESPONSE");
        
        setRetryStatus(null); 
        return text;

      } catch (error) {
        if (error.message === "INVALID_KEY") {
            setRetryStatus("Error: Invalid or missing API Key. Please check Settings.");
            return null; // Don't retry on auth errors
        }

        const isRateLimit = error.message === "RATE_LIMIT" || (error.message && error.message.includes("429"));
        
        if (retries === maxRetries - 1) {
          console.error("Final API Failure:", error);
          setRetryStatus("The Board is overwhelmed (Rate Limit). Please try again in 30s.");
          await sleep(2000);
          setRetryStatus(null);
          return null;
        }

        // Exponential Backoff with Jitter: 2s, 4s, 8s... + random(0-1000ms)
        const delay = (Math.pow(2, retries) * baseDelay) + (Math.random() * 1000);
        
        if (isRateLimit) {
          setRetryStatus(`High traffic. Cooling down for ${Math.ceil(delay/1000)}s...`);
        } else {
          setRetryStatus(`Network glitch. Retrying in ${Math.ceil(delay/1000)}s...`);
        }

        await sleep(delay);
        retries++;
      }
    }
    return null;
  };

  // --- Logic Functions ---

  const handleUserTurn = async () => {
    if (!userInput.trim()) return;

    const userMsg = { role: 'user', sender: 'User', text: userInput, type: 'chat' };
    setMessages(prev => [...prev, userMsg]);
    setUserInput("");
    setIsProcessing(true);
    setRetryStatus(null);

    try {
      // 1. Secretary
      setProcessingStage("The Secretary is taking minutes...");
      const updatedMinutes = await runSecretaryAgent(messages, userMsg, minutes);
      setMinutes(updatedMinutes);
      
      // PAUSE 1: Give API breathing room
      await sleep(1500);

      // 2. Turn Logic
      let forcedSpeaker = null;
      if (turnMode === 'sequential') {
        const nextIdx = (lastSpeakerIndex + 1) % boardMembers.length;
        setLastSpeakerIndex(nextIdx);
        forcedSpeaker = boardMembers[nextIdx];
      } else if (turnMode === 'chaos') {
        const randIdx = Math.floor(Math.random() * boardMembers.length);
        setLastSpeakerIndex(randIdx);
        forcedSpeaker = boardMembers[randIdx];
      }

      // 3. Director
      setProcessingStage(forcedSpeaker ? `Briefing ${forcedSpeaker.role}...` : "Director is choosing...");
      const briefing = await runDirectorAgent(messages, userMsg, updatedMinutes, boardMembers, whiteboardFacts, forcedSpeaker);

      if (turnMode === 'smart') {
         const pickedIdx = boardMembers.findIndex(m => m.role === briefing.nextSpeaker);
         if (pickedIdx >= 0) setLastSpeakerIndex(pickedIdx);
      }
      
      // PAUSE 2: Give API breathing room
      await sleep(1500);

      // 4. Board Member
      if (briefing.nextSpeaker) {
        setProcessingStage(`${briefing.nextSpeaker} is speaking...`);
        const agentResponse = await runBoardMemberAgent(briefing);
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          sender: briefing.nextSpeakerName,
          text: agentResponse,
          type: 'chat',
          avatar: briefing.nextSpeakerAvatar
        }]);

        updateVibes(updatedMinutes);
      }

    } catch (error) {
      console.error("Turn Error:", error);
      setMessages(prev => [...prev, { role: 'system', text: "Simulation paused. Please check API Key in settings.", type: 'error' }]);
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
      setRetryStatus(null);
    }
  };

  const triggerVote = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setProcessingStage("Polling board members...");

    try {
      const results = [];
      for (const member of boardMembers) {
        setProcessingStage(`Polling ${member.role}...`);
        const vote = await runVotingAgent(member, minutes, whiteboardFacts);
        results.push(vote);
        // INCREASED DELAY: Slower voting to avoid rate limits
        await sleep(2000); 
      }
      
      const yesVotes = results.filter(r => r.vote === 'YES').length;
      const noVotes = results.filter(r => r.vote === 'NO').length;
      const passed = yesVotes > noVotes;

      setProcessingStage("Drafting resolution...");
      const resolution = await runResolutionAgent(results, minutes, passed);

      setMessages(prev => [...prev, { 
        role: 'system', 
        text: `VOTE COMPLETED: ${passed ? "PASSED" : "REJECTED"}`, 
        type: 'vote-result',
        details: results,
        resolution: resolution
      }]);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'system', text: "Vote interrupted. Check API Key.", type: 'error' }]);
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
      setRetryStatus(null);
    }
  };

  // --- Agents ---

  const runSecretaryAgent = async (history, newMsg, currentMinutes) => {
    const recentHistory = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `
      Current Minutes: ${JSON.stringify(currentMinutes)}
      Recent Chat: ${recentHistory}
      New Message: "${newMsg.sender}: ${newMsg.text}"
      Update minutes. Output purely JSON: { "consensus": "...", "friction": "...", "momentum": "...", "actionItems": ["..."] }
    `;
    const result = await callGemini(prompt, "You are the Board Secretary. Output purely JSON.");
    if (!result) return currentMinutes;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : currentMinutes;
    } catch { return currentMinutes; }
  };

  const runDirectorAgent = async (history, lastMsg, minutes, members, facts, forcedSpeaker) => {
    const recentHistory = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `
      Minutes: ${JSON.stringify(minutes)}
      Facts: ${facts}
      Recent Chat: ${recentHistory}
      Last Msg: "${lastMsg.sender}: ${lastMsg.text}"
      Force Speaker: ${forcedSpeaker ? forcedSpeaker.role : "None"}
      Who speaks next? Provide briefing.
      Output purely JSON: { "nextSpeakerRole": "Role", "briefing": "..." }
    `;
    const system = `You are the Director. Pick from: ${members.map(m=>m.role).join(', ')}. Output purely JSON.`;
    const result = await callGemini(prompt, system);
    
    let parsed = { nextSpeakerRole: forcedSpeaker?.role || members[0].role, briefing: "Respond to the user." };
    if (result) {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (e) { console.warn("Director JSON failed, using fallback"); }
    }
    const member = members.find(m => 
      parsed.nextSpeakerRole && m.role.toLowerCase().includes(parsed.nextSpeakerRole.toLowerCase())
    ) || members[0];

    return {
      nextSpeaker: member.role,
      nextSpeakerName: member.name,
      nextSpeakerAvatar: member.avatar,
      briefing: parsed.briefing,
      memberObj: member
    };
  };

  const runBoardMemberAgent = async ({ memberObj, briefing }) => {
    const prompt = `DIRECTOR'S BRIEFING: "${briefing}"\nSpeak now.`;
    const system = `You are ${memberObj.name}, the ${memberObj.role}. ${memberObj.description}. Keep it short (1-2 sentences).`;
    return await callGemini(prompt, system) || "...";
  };

  const runVotingAgent = async (member, minutes, facts) => {
    const prompt = `Minutes: ${JSON.stringify(minutes)}\nFacts: ${facts}\nVote YES or NO and give a 5-word reason.\nOutput JSON: { "vote": "YES/NO", "reason": "..." }`;
    const system = `You are ${member.name}, the ${member.role}. ${member.description}. Output purely JSON.`;
    const result = await callGemini(prompt, system);
    try {
      const jsonMatch = result && result.match(/\{[\s\S]*\}/);
      if (jsonMatch) return { ...JSON.parse(jsonMatch[0]), member: member.role };
    } catch (e) {}
    return { vote: "ABSTAIN", reason: "Thinking...", member: member.role };
  };

  const runResolutionAgent = async (results, minutes, passed) => {
    const prompt = `Vote Passed: ${passed}\nVotes: ${JSON.stringify(results)}\nMinutes: ${JSON.stringify(minutes)}\nWrite 2 sentence resolution.`;
    return await callGemini(prompt, "You are the Secretary.") || "Resolution unavailable.";
  };

  const updateVibes = (mins) => {
    const isNegative = mins.momentum.toLowerCase().includes('negative') || mins.friction.length > 50;
    setBoardMembers(prev => prev.map(m => {
      let shift = Math.floor(Math.random() * 10) - 5;
      if (isNegative && m.role === 'CFO') shift -= 10;
      if (!isNegative && m.role === 'CMO') shift += 10;
      return { ...m, stats: { ...m.stats, agreement: Math.min(100, Math.max(0, m.stats.agreement + shift)) } };
    }));
  };

  // --- Shared Logic ---
  const handleEditMember = (member) => setEditingMember({ ...member });
  
  const handleCreateMember = () => setEditingMember({
    id: Date.now().toString(), name: 'New Member', role: 'Advisor', avatar: 'bg-gray-600',
    description: 'New member description.', stats: { agreement: 50, aggression: 50 }
  });
  
  const handleSaveMember = () => {
    if (!editingMember) return;
    setBoardMembers(prev => {
      const exists = prev.find(m => m.id === editingMember.id);
      return exists ? prev.map(m => m.id === editingMember.id ? editingMember : m) : [...prev, editingMember];
    });
    setEditingMember(null);
  };
  
  const handleDeleteMember = (id) => {
    setBoardMembers(prev => prev.filter(m => m.id !== id));
    if (editingMember?.id === id) setEditingMember(null);
  };
  
  const handleIntervention = () => {
    setIsProcessing(false);
    setProcessingStage("");
    setRetryStatus(null);
    setMessages(prev => [...prev, { role: 'system', text: "THE CHAIR INTERVENES", type: 'alert' }]);
  };

  // --- Render ---
  const renderMessage = (msg, idx) => {
    if (msg.type === 'alert') return (
      <div key={idx} className="flex items-center justify-center p-2 my-2 text-xs font-bold text-red-400 border border-red-900 rounded bg-red-900/20">
        <Gavel className="w-4 h-4 mr-2" /> {msg.text}
      </div>
    );
    if (msg.type === 'error') return (
      <div key={idx} className="flex items-center justify-center p-2 my-2 text-xs font-bold text-yellow-500 border border-yellow-900 rounded bg-yellow-900/20">
         <AlertTriangle className="w-4 h-4 mr-2"/> {msg.text}
      </div>
    );
    if (msg.type === 'vote-result') return (
        <div key={idx} className="p-4 my-4 border border-gray-700 rounded-lg bg-gray-800/80">
            <h3 className="mb-3 text-sm font-bold text-white uppercase border-b border-gray-700 pb-2 flex justify-between">
                <span>Vote Results</span>
                <span className={msg.text.includes("PASSED") ? "text-green-400" : "text-red-400"}>{msg.text.split(': ')[1]}</span>
            </h3>
            <div className="space-y-2">
                {msg.details.map((vote, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 w-24">{vote.member}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold w-12 text-center ${vote.vote === 'YES' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                            {vote.vote}
                        </span>
                        <span className="text-gray-500 italic flex-1 ml-4 truncate">"{vote.reason}"</span>
                    </div>
                ))}
            </div>
            {msg.resolution && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <div className="text-xs font-bold text-indigo-400 uppercase mb-1">Official Resolution</div>
                    <div className="text-xs text-gray-300 italic bg-gray-900 p-2 rounded border border-gray-700">{msg.resolution}</div>
                </div>
            )}
        </div>
    );
    const isUser = msg.role === 'user';
    return (
      <div key={idx} className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 shadow-lg ${msg.avatar || 'bg-gray-600'}`}>{msg.sender[0]}</div>
        )}
        <div className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-lg text-sm shadow-md ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none'}`}>
          <div className="text-xs font-bold opacity-50 mb-1">{msg.sender}</div>
          {msg.text}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-80 bg-gray-900/95 backdrop-blur shadow-2xl border-r border-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center gap-2 justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white"><Users size={16} /></div>
            <h1 className="font-bold text-white tracking-wider text-sm">BOARDROOM<br/><span className="text-xs text-indigo-400 font-normal">SIMULATOR</span></h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><X size={20} /></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><FileText size={12} /> The Whiteboard</h2>
            <button onClick={() => setShowSettings(!showSettings)} className={`transition-colors ${showSettings ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}><Settings size={12} /></button>
          </div>
          {showSettings ? (
            <div className="space-y-4 mb-4">
              <textarea 
                className="w-full h-32 bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500" 
                value={whiteboardFacts} 
                onChange={(e) => setWhiteboardFacts(e.target.value)} 
                placeholder="Enter facts..." 
              />
              {/* API Key Input */}
              <div className="border-t border-gray-700 pt-3">
                 <label className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1 mb-1"><Key size={10}/> Custom API Key</label>
                 <input 
                    type="password"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-300 focus:border-indigo-500 outline-none"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Paste Gemini API key here..."
                 />
                 <div className="text-[10px] text-gray-500 mt-1 italic">Leave empty to use system default.</div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 p-3 rounded text-xs text-gray-400 whitespace-pre-wrap font-mono mb-4">{whiteboardFacts}</div>
          )}
          <div className="mt-2 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><BrainCircuit size={12} /> The Secretary's Minutes</h2>
            <div className="space-y-2">
              <div className="bg-gray-800/30 p-2 rounded border border-gray-800">
                <div className="text-[10px] uppercase text-green-500 font-bold mb-1">Momentum</div>
                <div className="text-xs">{minutes.momentum}</div>
              </div>
              <div className="bg-gray-800/30 p-2 rounded border border-gray-800">
                <div className="text-[10px] uppercase text-blue-500 font-bold mb-1">Consensus</div>
                <div className="text-xs text-gray-400">{minutes.consensus}</div>
              </div>
              <div className="bg-gray-800/30 p-2 rounded border border-gray-800">
                <div className="text-[10px] uppercase text-red-500 font-bold mb-1">Friction Points</div>
                <div className="text-xs text-gray-400">{minutes.friction}</div>
              </div>
               <div className="bg-gray-800/30 p-2 rounded border border-gray-800">
                <div className="text-[10px] uppercase text-yellow-500 font-bold mb-1 flex items-center gap-1"><ClipboardList size={10} /> Action Items</div>
                <ul className="text-xs text-gray-400 list-disc list-inside">{minutes.actionItems?.map((item, i) => <li key={i}>{item}</li>) || <li className="italic opacity-50">No actions</li>}</ul>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-800 bg-gray-900/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase">Board Alignment</h2>
            <button onClick={() => setShowMemberConfig(true)} className="text-gray-500 hover:text-white transition-colors"><Edit size={12} /></button>
          </div>
          <div className="space-y-3">
            {boardMembers.map(m => (
              <div key={m.id}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-white font-medium">{m.role}</span>
                  <span className={m.stats.agreement > 50 ? "text-green-400" : "text-red-400"}>{m.stats.agreement}%</span>
                </div>
                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${m.stats.agreement > 50 ? 'bg-green-600' : 'bg-red-600'}`} style={{ width: `${m.stats.agreement}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col bg-gray-950 relative w-full">
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 bg-gray-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-400 mr-2"><Menu size={20} /></button>
              <div className="flex bg-gray-800 rounded p-1">
                 {['smart', 'sequential', 'chaos'].map(mode => (
                   <button key={mode} onClick={() => setTurnMode(mode)} className={`px-2 sm:px-3 py-1 rounded text-xs font-medium flex items-center gap-1 sm:gap-2 transition-all ${turnMode === mode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                      {mode === 'smart' && <Sparkles size={12} />}
                      {mode === 'sequential' && <ListOrdered size={12} />}
                      {mode === 'chaos' && <Shuffle size={12} />}
                      <span className="hidden sm:inline capitalize">{mode}</span>
                   </button>
                 ))}
              </div>
          </div>
          <div className="flex gap-2">
             <button onClick={handleIntervention} className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900 rounded text-xs transition-colors">
               <Gavel size={14} /> <span className="hidden sm:inline">The Gavel</span>
             </button>
             <button onClick={triggerVote} disabled={isProcessing} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 border border-indigo-900 rounded text-xs transition-colors disabled:opacity-50">
               <Vote size={14} /> <span className="hidden sm:inline">Call Vote</span>
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-800 relative">
          {retryStatus && (
             <div className="sticky top-0 z-50 w-full bg-yellow-900/90 text-yellow-200 text-xs font-bold p-2 text-center border-b border-yellow-700 backdrop-blur animate-pulse flex items-center justify-center gap-2">
               <ShieldAlert size={14}/> {retryStatus}
             </div>
          )}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
              <Users size={48} className="mb-4" />
              <p className="text-sm">The Board is assembled.</p>
            </div>
          )}
          {messages.map((msg, idx) => renderMessage(msg, idx))}
          {isProcessing && !retryStatus && (
            <div className="flex items-center gap-3 text-xs text-indigo-400 animate-pulse mt-4 ml-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              {processingStage || "Thinking..."}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <input 
              type="text" 
              value={userInput} 
              onChange={(e) => setUserInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleUserTurn()} 
              placeholder="Present your case..." 
              className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm" 
              disabled={isProcessing} 
            />
            <button 
              onClick={handleUserTurn} 
              disabled={isProcessing || !userInput.trim()} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isProcessing ? <RotateCcw className="animate-spin" size={18} /> : <ChevronRight size={20} />}
            </button>
          </div>
        </div>

        {/* Member Config Modal */}
        {showMemberConfig && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
            <div className="bg-gray-900 border border-gray-700 w-full md:max-w-4xl h-[90vh] md:h-[600px] rounded-lg shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} /> Manage Board</h2>
                <button onClick={() => setShowMemberConfig(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                <div className="w-full md:w-1/3 h-48 md:h-auto border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900/50 flex flex-col">
                  <div className="p-2 overflow-y-auto flex-1 space-y-2">
                    {boardMembers.map(m => (
                      <div key={m.id} onClick={() => handleEditMember(m)} className={`p-3 rounded cursor-pointer border transition-all ${editingMember?.id === m.id ? 'bg-indigo-900/30 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full ${m.avatar} flex items-center justify-center text-[10px] font-bold text-white`}>{m.role[0]}</div>
                            <div><div className="text-sm font-bold text-gray-200">{m.role}</div><div className="text-xs text-gray-500">{m.name}</div></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-800">
                    <button onClick={handleCreateMember} className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs font-bold text-gray-300 flex items-center justify-center gap-2"><Plus size={14} /> Add New Member</button>
                  </div>
                </div>
                <div className="flex-1 bg-gray-950 p-6 overflow-y-auto">
                  {editingMember ? (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Name</label>
                          <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Role</label>
                          <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" value={editingMember.role} onChange={(e) => setEditingMember({...editingMember, role: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Avatar Color</label>
                        <div className="flex gap-2">{['bg-blue-600', 'bg-purple-600', 'bg-yellow-600', 'bg-pink-600', 'bg-green-600', 'bg-red-600', 'bg-gray-600'].map(c => (<button key={c} onClick={() => setEditingMember({...editingMember, avatar: c})} className={`w-6 h-6 rounded-full ${c} ${editingMember.avatar === c ? 'ring-2 ring-white' : ''}`} />))}</div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">System Instructions</label>
                        <textarea className="w-full h-40 bg-gray-800 border border-gray-700 rounded p-3 text-sm text-gray-300 focus:border-indigo-500 outline-none leading-relaxed" value={editingMember.description} onChange={(e) => setEditingMember({...editingMember, description: e.target.value})} />
                      </div>
                      <div className="pt-4 flex items-center justify-between border-t border-gray-800 mt-8">
                        <button onClick={() => handleDeleteMember(editingMember.id)} className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                        <button onClick={handleSaveMember} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2"><Save size={16} /> Save</button>
                      </div>
                    </div>
                  ) : <div className="h-full flex flex-col items-center justify-center text-gray-600"><Users size={48} className="mb-4 opacity-50" /><p>Select a member.</p></div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}