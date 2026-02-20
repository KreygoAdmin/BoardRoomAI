import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient'; 
import Auth from './Auth'; 
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
  Key, 
  LogOut,
  Volume2,
  MessageSquare,
  CloudUpload,
  Globe,
  Loader2 
} from 'lucide-react';

/* ===================================================================
  BOARDROOM SIMULATOR - MULTI-AGENT ORCHESTRATION SYSTEM
  =================================================================== */

// System default key (injected by environment)
const systemApiKey = ""; 

// --- STRIPE CONFIGURATION ---
const STRIPE_LINK = "https://buy.stripe.com/cNi4gybECaEi17N0or0Jq00";

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
  // --- SESSION STATE ---
  const [session, setSession] = useState(null);

  // --- Password Reset State ---
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // --- Auth & Plan Listener ---
  useEffect(() => {
    // 1. Get Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserPlan(session.user.id); 
    });

    // 2. Listen for changes (Including Password Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // Check for Password Recovery Event
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetModal(true);
      }

      if (session) fetchUserPlan(session.user.id); 
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Helper Function to get the plan ---
  const fetchUserPlan = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();

    if (data) {
        console.log("User Plan Loaded:", data.plan); 
        setUserPlan(data.plan);
    } else {
        console.error("Error fetching plan:", error);
    }
  };

  // --- APP STATE ---

  // Plan State
  const [userPlan, setUserPlan] = useState('free'); // Default to free (safe mode)

  // Persistence State
  const [boardId, setBoardId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [boardName, setBoardName] = useState('New Boardroom');
  const [boardList, setBoardList] = useState([]);
  const [showBoardSwitcher, setShowBoardSwitcher] = useState(false);

  // Conversation & Logic
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(""); 
  const [retryStatus, setRetryStatus] = useState(null); 
  
  // Board & Context
  const [boardMembers, setBoardMembers] = useState(DEFAULT_BOARD);
  const [whiteboardFacts, setWhiteboardFacts] = useState(() => {
    const now = new Date();
    const timeStr = now.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `Session Start: ${timeStr} CST\n\nProject: 'Project Alpha'\nGoal: Launch a new AI boardroom app\nBudget: $1k\nTimeline: unknown`;
  });
  
  // API Key State
  const [customApiKey, setCustomApiKey] = useState("");

  // --- Marketplace State ---
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [marketAgents, setMarketAgents] = useState([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);

  // --- AI Builder State ---
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [aiBuilderMessages, setAIBuilderMessages] = useState([]);
  const [aiBuilderInput, setAIBuilderInput] = useState("");
  const [isAIBuilderLoading, setIsAIBuilderLoading] = useState(false);
  const [addedSuggestionIds, setAddedSuggestionIds] = useState(new Set());
  const aiBuilderEndRef = useRef(null);

  const [minutes, setMinutes] = useState({
    consensus: "None yet.",
    friction: "None yet.",
    momentum: "Neutral",
    actionItems: ["Define project scope"]
  });

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showMemberConfig, setShowMemberConfig] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // --- DATA PERSISTENCE (LOAD) ---
  useEffect(() => {
    if (!session) return;

    const loadBoard = async () => {
      const { data, error } = await supabase
        .from('boardrooms')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading board:", error);
      }

      if (data) {
        console.log("Board loaded!", data);
        setBoardId(data.id);
        setBoardName(data.name || 'New Boardroom');
        setBoardMembers(data.members);
        setMessages(data.messages);
        setWhiteboardFacts(data.whiteboard);

        if (data.settings && data.settings.customApiKey) {
            setCustomApiKey(data.settings.customApiKey);
        }
      }
    };

    loadBoard();
    loadBoardList();
  }, [session]);

  // --- SCROLL EFFECT ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, retryStatus]);

  useEffect(() => {
    aiBuilderEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiBuilderMessages, isAIBuilderLoading]);

  // --- GATEKEEPER (Safe Return) ---
  if (!session) {
    return <Auth />;
  }

  // --- Password Update Logic ---
  const handlePasswordUpdate = async () => {
    if (!newPassword) return;
    setResetLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
        alert("Error updating password: " + error.message);
    } else {
        alert("Password updated successfully!");
        setShowResetModal(false);
        setNewPassword("");
    }
    setResetLoading(false);
  };

  // --- DATA PERSISTENCE (SAVE) ---
  const handleSaveBoard = async () => {
    setSaveStatus("Saving...");
    
    const payload = {
      user_id: session.user.id,
      name: boardName,
      whiteboard: whiteboardFacts,
      members: boardMembers,
      messages: messages,
      settings: {
          customApiKey: customApiKey
      }
    };

    try {
      if (boardId) {
        // Update existing
        const { error } = await supabase
          .from('boardrooms')
          .update(payload)
          .eq('id', boardId);
        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('boardrooms')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (data) setBoardId(data.id);
      }
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
      loadBoardList();
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("Error!");
    }
  };

  // --- BOARD LIST (load all boards for switcher) ---
  const loadBoardList = async () => {
    const { data } = await supabase
      .from('boardrooms')
      .select('id, name, updated_at')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
    if (data) setBoardList(data);
  };

  // --- LOAD SPECIFIC BOARD ---
  const loadBoardById = async (id) => {
    const { data } = await supabase
      .from('boardrooms')
      .select('*')
      .eq('id', id)
      .single();
    if (data) {
      setBoardId(data.id);
      setBoardName(data.name);
      setBoardMembers(data.members);
      setMessages(data.messages);
      setWhiteboardFacts(data.whiteboard);
      if (data.settings?.customApiKey) setCustomApiKey(data.settings.customApiKey);
      setMinutes({ consensus: "None yet.", friction: "None yet.", momentum: "Neutral", actionItems: ["Define project scope"] });
      setAIBuilderMessages([]);
      setAddedSuggestionIds(new Set());
      setShowBoardSwitcher(false);
    }
  };

  // --- CREATE NEW BOARD (Pioneer only) ---
  const handleCreateBoard = async () => {
    if (userPlan === 'free') {
      alert("Upgrade to Pioneer to create multiple boardrooms!");
      return;
    }
    // Save current board first
    await handleSaveBoard();
    // Reset to defaults
    const now = new Date();
    const timeStr = now.toLocaleString('en-US', {
      timeZone: 'America/Chicago', weekday: 'short', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
    const defaultFacts = `Session Start: ${timeStr} CST\n\nProject: 'New Project'\nGoal: TBD\nBudget: TBD\nTimeline: TBD`;
    setBoardId(null);
    setBoardName('New Boardroom');
    setBoardMembers(DEFAULT_BOARD);
    setMessages([]);
    setWhiteboardFacts(defaultFacts);
    setMinutes({ consensus: "None yet.", friction: "None yet.", momentum: "Neutral", actionItems: ["Define project scope"] });
    setAIBuilderMessages([]);
    setAddedSuggestionIds(new Set());
    setShowBoardSwitcher(false);
  };

  // --- DELETE BOARD ---
  const handleDeleteBoard = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this boardroom permanently?")) return;
    await supabase.from('boardrooms').delete().eq('id', id);
    if (boardId === id) {
      // Deleted the active board — create a fresh one
      setBoardId(null);
      setBoardName('New Boardroom');
      setBoardMembers(DEFAULT_BOARD);
      setMessages([]);
      const now = new Date();
      const timeStr = now.toLocaleString('en-US', {
        timeZone: 'America/Chicago', weekday: 'short', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
      });
      setWhiteboardFacts(`Session Start: ${timeStr} CST\n\nProject: 'New Project'\nGoal: TBD\nBudget: TBD\nTimeline: TBD`);
      setMinutes({ consensus: "None yet.", friction: "None yet.", momentum: "Neutral", actionItems: ["Define project scope"] });
    }
    loadBoardList();
  };

  // --- Reset / New Meeting Logic ---
  const handleResetBoard = async () => {
    // 1. Confirm with user
    const confirm = window.confirm("Start a new meeting?\n\nThis will clear the chat history and minutes, but keep your Board Members and Whiteboard facts.");
    if (!confirm) return;

    setIsProcessing(true); // Lock UI while resetting

    // 2. Reset Local State
    setMessages([]);
    setMinutes({
      consensus: "None yet.",
      friction: "None yet.",
      momentum: "Neutral",
      actionItems: ["Define project scope"]
    });
    
    // 3. Reset Database
    if (session && boardId) {
        const { error } = await supabase
            .from('boardrooms')
            .update({ 
                messages: [] // Wipe the chat column in DB
            })
            .eq('id', boardId);

        if (error) {
            console.error("Reset DB Error:", error);
            alert("Local reset done, but database update failed.");
        }
    }
    
    // 4. Add a "Fresh Start" marker
    setMessages([{ role: 'system', text: "New session started. The Board is ready.", type: 'alert' }]);
    setIsProcessing(false);
  };

  // --- API CALLER (OPTIMIZED FOR RATE LIMITS) ---
  const callGemini = async (prompt, systemInstruction = "You are a helpful AI.", maxTokens = 1000) => {
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 2000;
    const activeKey = customApiKey || systemApiKey;

    while (retries < maxRetries) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
            }),
          }
        );

        if (response.status === 403) throw new Error("INVALID_KEY");
        if (response.status === 429 || response.status === 503) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(retryAfter ? `RATE_LIMIT:${retryAfter}` : "RATE_LIMIT");
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
            return null;
        }

        const isRateLimit = error.message.startsWith("RATE_LIMIT") || (error.message && error.message.includes("429"));

        if (retries === maxRetries - 1) {
          console.error("Final API Failure:", error);
          setRetryStatus("The Board is overwhelmed (Rate Limit). Please try again in 60s.");
          await sleep(2000);
          setRetryStatus(null);
          return null;
        }

        // --- RETRY STRATEGY ---
        let delay = (Math.pow(2, retries) * baseDelay) + (Math.random() * 2000);

        if (isRateLimit) {
            // Use Retry-After header if provided by the API
            const retryAfterMatch = error.message.match(/RATE_LIMIT:(\d+)/);
            const retryAfterSecs = retryAfterMatch ? parseInt(retryAfterMatch[1]) : 0;
            // Add extra padding for Rate Limits to clear the penalty box
            delay = retryAfterSecs > 0 ? retryAfterSecs * 1000 + 1000 : delay + 5000;
            setRetryStatus(`High traffic (Rate Limit). Cooling down for ${Math.ceil(delay/1000)}s...`);
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

  // --- Manual Trigger ---
  const handleForceTrigger = async (member) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setRetryStatus(null);

    // 1. Add a system note
    const triggerMsg = { role: 'system', sender: 'Chair', text: `The Chair calls on ${member.role}.`, type: 'alert' };
    setMessages(prev => [...prev, triggerMsg]);

    try {
      // 2. Orchestrator (minutes + briefing in one call)
      setProcessingStage(`Briefing ${member.role}...`);

      const orchestration = await runOrchestratorAgent(messages, triggerMsg, minutes, boardMembers, whiteboardFacts, member);
      if (!orchestration) return;
      setMinutes(orchestration.minutes);

      // 3. The Agent Speaks
      setProcessingStage(`${member.role} is speaking...`);

      const agentResponse = await runBoardMemberAgent(orchestration);
      if (!agentResponse) return;

      const agentMsg = {
        role: 'assistant',
        sender: orchestration.nextSpeakerName,
        text: agentResponse,
        type: 'chat',
        avatar: orchestration.nextSpeakerAvatar
      };

      setMessages(prev => [...prev, agentMsg]);

      // Run alignment every 3rd turn to save API calls
      if (messages.length % 3 === 0) {
        runAlignmentAgent(agentMsg, boardMembers);
      }

    } catch (error) {
      console.error("Force Trigger Error:", error);
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  const handleUserTurn = async () => {
    if (!userInput.trim()) return;

    // --- Message Limit Check ---
    if (userPlan === 'free' && messages.length >= 30) {
        setMessages(prev => [...prev, {
            role: 'system',
            text: "🔒 FREE PLAN LIMIT REACHED (30 Messages). Upgrade to Pioneer to continue.",
            type: 'error'
        }]);
        setUserInput("");
        return; 
    }

    const userMsg = { role: 'user', sender: 'User', text: userInput, type: 'chat' };
    setMessages(prev => [...prev, userMsg]);
    setUserInput("");
    setIsProcessing(true);
    setRetryStatus(null);

    try {
      setProcessingStage("The Board is processing...");
      const orchestration = await runOrchestratorAgent(messages, userMsg, minutes, boardMembers, whiteboardFacts, null);
      if (!orchestration) return;
      setMinutes(orchestration.minutes);

      if (orchestration.nextSpeaker) {
        setProcessingStage(`${orchestration.nextSpeaker} is speaking...`);
        const agentResponse = await runBoardMemberAgent(orchestration);
        if (!agentResponse) return;

        const agentMsg = {
          role: 'assistant',
          sender: orchestration.nextSpeakerName,
          text: agentResponse,
          type: 'chat',
          avatar: orchestration.nextSpeakerAvatar
        };

        setMessages(prev => [...prev, agentMsg]);

        // Run alignment every 3rd turn to save API calls
        if (messages.length % 3 === 0) {
          runAlignmentAgent(agentMsg, boardMembers);
        }
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
      setProcessingStage("The board is voting...");
      const results = await runBatchVoteAgent(boardMembers, minutes, whiteboardFacts);
      
      const yesVotes = results.filter(r => r.vote === 'YES').length;
      const noVotes = results.filter(r => r.vote === 'NO').length;
      const passed = yesVotes > noVotes;

      setProcessingStage("Drafting resolution...");
      const resolution = await runResolutionAgent(results, minutes, passed);

      const votesSummary = results.map(r => `${r.member}: ${r.vote} ("${r.reason}")`).join(', ');
      setMessages(prev => [...prev, {
        role: 'system',
        sender: 'Vote',
        text: `VOTE ${passed ? "PASSED" : "REJECTED"} (${yesVotes}-${noVotes}). ${votesSummary}. Resolution: ${resolution}`,
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

  const runOrchestratorAgent = async (history, newMsg, currentMinutes, members, facts, forcedSpeaker) => {
    const recentHistory = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `
      Current Minutes: ${JSON.stringify(currentMinutes)}
      Whiteboard Facts: ${facts}
      Recent Chat: ${recentHistory}
      New Message: "${newMsg.sender}: ${newMsg.text}"
      Board Members: ${members.map(m => m.role).join(', ')}
      Force Speaker: ${forcedSpeaker ? forcedSpeaker.role : "None"}

      Do TWO tasks:
      1. Update the meeting minutes based on the new message.
      2. Pick who speaks next and write a short briefing for them.

      Output purely JSON:
      {
        "minutes": { "consensus": "...", "friction": "...", "momentum": "...", "actionItems": ["..."] },
        "nextSpeakerRole": "Role",
        "briefing": "..."
      }
    `;
    const system = `You are the Board Orchestrator. You manage meeting minutes and decide who speaks. Pick from: ${members.map(m=>m.role).join(', ')}. Output purely JSON.`;
    const result = await callGemini(prompt, system, 500);

    let parsed = { minutes: currentMinutes, nextSpeakerRole: forcedSpeaker?.role || members[0].role, briefing: "Respond to the user." };
    if (result) {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = { ...parsed, ...JSON.parse(jsonMatch[0]) };
      } catch (e) { console.warn("Orchestrator JSON failed, using fallback"); }
    } else {
      return null;
    }

    // If a speaker was forced, always use them regardless of AI's pick
    const member = forcedSpeaker || members.find(m =>
      parsed.nextSpeakerRole && m.role.toLowerCase().includes(parsed.nextSpeakerRole.toLowerCase())
    ) || members[0];

    return {
      minutes: parsed.minutes || currentMinutes,
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

  const runBatchVoteAgent = async (members, currentMinutes, facts) => {
    const memberList = members.map(m => `- ${m.role} (${m.name}): ${m.description}`).join('\n');
    const prompt = `
      Minutes: ${JSON.stringify(currentMinutes)}
      Facts: ${facts}
      Board Members:
      ${memberList}

      Each member votes YES or NO with a 5-word reason based on their personality and motivations.
      Output purely JSON array with one entry per member:
      [{ "member": "Role", "vote": "YES", "reason": "..." }, ...]
    `;
    const system = `You are running a board vote. Each member votes independently based on their unique personality. Output purely JSON array.`;
    const result = await callGemini(prompt, system, 500);
    if (result) {
      try {
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) { console.warn("Batch vote JSON failed"); }
    }
    return members.map(m => ({ member: m.role, vote: "ABSTAIN", reason: "Thinking..." }));
  };

  const runResolutionAgent = async (results, minutes, passed) => {
    const prompt = `Vote Passed: ${passed}\nVotes: ${JSON.stringify(results)}\nMinutes: ${JSON.stringify(minutes)}\nWrite 2 sentence resolution.`;
    return await callGemini(prompt, "You are the Secretary.") || "Resolution unavailable.";
  };

  const runAlignmentAgent = async (lastMsg, members) => {
    const prompt = `
      Message: "${lastMsg.sender} says: ${lastMsg.text}"
      Board Members & Motivations:
      ${members.map(m => `- ${m.role} (${m.name}): ${m.description}`).join('\n')}
      Task: Analyze impact on agreement (0-100) of EACH member.
      Return JSON array of objects with 'role' and 'delta' (-15 to +15).
    `;
    const result = await callGemini(prompt, "You are an AI Analyst. Output purely JSON.", 300);
    if (result) {
      try {
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const adjustments = JSON.parse(jsonMatch[0]);
          setBoardMembers(prev => prev.map(member => {
            const adj = adjustments.find(a => a.role === member.role || a.role === member.name);
            if (adj) {
              const newScore = Math.min(100, Math.max(0, member.stats.agreement + adj.delta));
              return { ...member, stats: { ...member.stats, agreement: newScore } };
            }
            return member;
          }));
        }
      } catch (e) {}
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- AI BOARD BUILDER AGENT ---
  const runAIBuilderAgent = async (conversationHistory) => {
    const historyText = conversationHistory
      .filter(m => m.type === 'ai-chat' || m.type === 'user-chat')
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`)
      .join('\n');

    const existingRoles = boardMembers.map(m => m.role).join(', ');
    const whiteboardContent = whiteboardFacts.trim() || "No whiteboard context provided.";

    const userPrompt = `
WHITEBOARD CONTEXT:
${whiteboardContent}

EXISTING BOARD MEMBERS (do not suggest duplicates):
${existingRoles}

CONVERSATION SO FAR:
${historyText || "(No prior exchanges — this is your opening message)"}

AVATAR OPTIONS (pick one per member):
bg-blue-600, bg-purple-600, bg-yellow-600, bg-pink-600, bg-green-600, bg-red-600, bg-orange-600

TASK:
Based on the whiteboard context and conversation, decide:
1. If you need 1-2 targeted clarifying questions to understand what perspectives are missing, return a message.
2. If you have enough context, return 4-6 board member suggestions tailored to the project.

RULES:
- Never suggest a role that already exists in the existing board members list.
- Each suggested member must have a distinct role, a realistic first name, and a clear personality in the description.
- Stats: agreement (0-100) = how likely they agree by default. aggression (0-100) = how forcefully they push back.

OUTPUT FORMAT — respond ONLY with one of these two JSON shapes, no markdown:

Shape A (need more info):
{ "type": "message", "text": "Your single concise question here." }

Shape B (ready to suggest):
{
  "type": "suggestions",
  "intro": "One sentence explaining your choices.",
  "members": [
    {
      "name": "First name",
      "role": "Role Title",
      "avatar": "bg-XXXXX-600",
      "description": "2-3 sentences describing personality, motivations, and how they challenge or support proposals.",
      "stats": { "agreement": 50, "aggression": 35 }
    }
  ]
}
    `.trim();

    const systemInstruction = `You are an expert organizational designer and AI boardroom architect. Your job is to understand a project from a whiteboard and recommend AI board members that will create productive tension and diverse perspectives. You always respond with pure JSON only — no markdown, no explanation outside the JSON.`;

    const result = await callGemini(userPrompt, systemInstruction);
    if (!result) return null;

    try {
      const cleaned = result.replace(/```json|```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("AI Builder JSON parse failed:", e);
    }
    return null;
  };

  // --- Shared Logic ---
  const handleEditMember = (member) => setEditingMember({ ...member });
  
  const handleCreateMember = () => {
    // --- Limit Check ---
    if (userPlan === 'free' && boardMembers.length >= 3) {
        alert("Free Plan limit reached (3 Members).\n\nUpgrade to Pioneer for unlimited agents!");
        return;
    }

    setEditingMember({
      id: Date.now().toString(), name: 'New Member', role: 'Advisor', avatar: 'bg-gray-600',
      description: 'New member description.', stats: { agreement: 50, aggression: 50 }
    });
  };
  
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

  // --- AI Builder Functions ---
  const addSuggestedMember = (suggestion) => {
    if (userPlan === 'free' && boardMembers.length >= 3) {
      alert("Free Plan limit reached (3 Members).\n\nUpgrade to Pioneer for unlimited agents!");
      return;
    }
    const roleConflict = boardMembers.some(
      m => m.role.toLowerCase() === suggestion.role.toLowerCase()
    );
    if (roleConflict) {
      alert(`A "${suggestion.role}" already exists on your board.`);
      return;
    }
    const newMember = {
      id: `ai_built_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: suggestion.name,
      role: suggestion.role,
      avatar: suggestion.avatar || 'bg-indigo-600',
      description: suggestion.description,
      stats: {
        agreement: Math.min(100, Math.max(0, suggestion.stats?.agreement ?? 50)),
        aggression: Math.min(100, Math.max(0, suggestion.stats?.aggression ?? 30))
      }
    };
    setBoardMembers(prev => [...prev, newMember]);
    setAddedSuggestionIds(prev => new Set([...prev, suggestion.id]));
  };

  const handleOpenAIBuilder = async () => {
    setShowMarketplace(false);
    setShowAIBuilder(true);
    if (aiBuilderMessages.length > 0) return;
    setIsAIBuilderLoading(true);
    const response = await runAIBuilderAgent([]);
    setIsAIBuilderLoading(false);
    if (!response) {
      setAIBuilderMessages([{ role: 'assistant', type: 'ai-chat', text: "I couldn't analyze the whiteboard right now. Please check your API key in Settings." }]);
      return;
    }
    if (response.type === 'message') {
      setAIBuilderMessages([{ role: 'assistant', type: 'ai-chat', text: response.text }]);
    } else if (response.type === 'suggestions') {
      const suggId = Date.now().toString();
      setAIBuilderMessages([{
        role: 'assistant',
        type: 'suggestions',
        text: response.intro || "Based on your whiteboard, here's who I'd recommend:",
        members: response.members.map((m, i) => ({ ...m, id: `sugg_${suggId}_${i}` }))
      }]);
    }
  };

  const handleAIBuilderSend = async () => {
    if (!aiBuilderInput.trim() || isAIBuilderLoading) return;
    const userText = aiBuilderInput.trim();
    setAIBuilderInput("");
    const userMsg = { role: 'user', type: 'user-chat', text: userText };
    const updatedHistory = [...aiBuilderMessages, userMsg];
    setAIBuilderMessages(updatedHistory);
    setIsAIBuilderLoading(true);
    const response = await runAIBuilderAgent(updatedHistory);
    setIsAIBuilderLoading(false);
    if (!response) {
      setAIBuilderMessages(prev => [...prev, { role: 'assistant', type: 'ai-chat', text: "Something went wrong. Please try again." }]);
      return;
    }
    if (response.type === 'message') {
      setAIBuilderMessages(prev => [...prev, { role: 'assistant', type: 'ai-chat', text: response.text }]);
    } else if (response.type === 'suggestions') {
      const suggId = Date.now().toString();
      setAIBuilderMessages(prev => [...prev, {
        role: 'assistant',
        type: 'suggestions',
        text: response.intro || "Here are my recommendations for your board:",
        members: response.members.map((m, i) => ({ ...m, id: `sugg_${suggId}_${i}` }))
      }]);
    }
  };

  // --- Publish to Marketplace ---
  const handlePublishMember = async () => {
    if (!editingMember || !session) return;
    
    const confirm = window.confirm(`Are you sure you want to publish "${editingMember.role}" to the public marketplace?`);
    if (!confirm) return;

    setProcessingStage("Publishing...");
    
    // Create a clean copy for the market
    const payload = {
      user_id: session.user.id,
      name: editingMember.name,
      role: editingMember.role,
      description: editingMember.description,
      avatar: editingMember.avatar,
      stats: editingMember.stats
    };

    const { error } = await supabase
      .from('market_agents')
      .insert(payload);

    if (error) {
      alert("Error publishing: " + error.message);
    } else {
      alert("Success! Your agent is now in the Marketplace.");
    }
    setProcessingStage("");
  };

  // --- Marketplace Logic ---
  const loadMarketplace = async () => {
    setIsLoadingMarket(true);
    setShowMarketplace(true);
    setShowAIBuilder(false);
    
    const { data, error } = await supabase
      .from('market_agents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Just the latest 50 for now

    if (error) console.error("Market error:", error);
    else setMarketAgents(data || []);
    
    setIsLoadingMarket(false);
  };

  // --- Async Download & Count ---
  const handleDownloadAgent = async (agent) => {
    // --- Limit Check ---
    if (userPlan === 'free' && boardMembers.length >= 3) {
        alert("Free Plan limit reached (3 Members).\n\nUpgrade to Pioneer for unlimited agents!");
        return;
    }

    // 1. Check if we already have this role
    const exists = boardMembers.find(m => m.role === agent.role);
    if (exists) {
        alert(`You already have a ${agent.role}! Rename yours first.`);
        return;
    }

    // 2. Add to local board
    const newMember = {
      ...agent,
      id: Date.now().toString(), // Give it a fresh local ID
      user_id: session.user.id   // Now it belongs to you
    };

    setBoardMembers(prev => [...prev, newMember]);
    alert(`Deployed ${agent.role} to your boardroom.`);
    setShowMemberConfig(false); // Close modal

    // 3. Increment Counter in Background
    const { error } = await supabase.rpc('increment_downloads', { row_id: agent.id });
    if (error) console.error("Failed to count download:", error);
  };
  
  const handleIntervention = () => {
    setIsProcessing(false);
    setProcessingStage("");
    setRetryStatus(null);
    setMessages(prev => [...prev, { role: 'system', text: "THE CHAIR INTERVENES", type: 'alert' }]);
  };

  // --- AI Builder Message Renderer ---
  const renderAIBuilderMessage = (msg, idx) => {
    if (msg.type === 'user-chat') {
      return (
        <div key={idx} className="flex w-full mb-3 justify-end">
          <div className="max-w-[80%] bg-blue-600 text-white p-3 rounded-lg rounded-br-none text-sm">
            {msg.text}
          </div>
        </div>
      );
    }
    if (msg.type === 'ai-chat') {
      return (
        <div key={idx} className="flex w-full mb-3 justify-start items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0">
            <Sparkles size={12} className="text-white" />
          </div>
          <div className="max-w-[80%] bg-gray-800 border border-gray-700 p-3 rounded-lg rounded-bl-none text-sm text-gray-200">
            {msg.text}
          </div>
        </div>
      );
    }
    if (msg.type === 'suggestions') {
      return (
        <div key={idx} className="w-full mb-4">
          <div className="flex items-start gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0">
              <Sparkles size={12} className="text-white" />
            </div>
            <div className="max-w-[80%] bg-gray-800 border border-gray-700 p-3 rounded-lg rounded-bl-none text-sm text-gray-200">
              {msg.text}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
            {msg.members.map((member) => {
              const alreadyAdded = addedSuggestionIds.has(member.id);
              const roleConflict = boardMembers.some(
                m => m.role.toLowerCase() === member.role.toLowerCase()
              );
              const disabled = alreadyAdded || roleConflict;
              return (
                <div key={member.id} className={`bg-gray-900 border rounded-lg p-3 transition-all ${disabled ? 'border-gray-800 opacity-50' : 'border-gray-700 hover:border-purple-500'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full ${member.avatar} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                      {member.role[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white leading-tight">{member.role}</div>
                      <div className="text-xs text-purple-400">{member.name}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-3">{member.description}</p>
                  <div className="flex gap-3 text-[10px] text-gray-500 mb-3">
                    <span>Agreement: <span className="text-green-400">{member.stats?.agreement ?? 50}</span></span>
                    <span>Aggression: <span className="text-red-400">{member.stats?.aggression ?? 30}</span></span>
                  </div>
                  <button
                    onClick={() => !disabled && addSuggestedMember(member)}
                    disabled={disabled}
                    className={`w-full py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${disabled ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-purple-900/40 hover:bg-purple-600 border border-purple-900/60 hover:border-purple-500 text-purple-300 hover:text-white'}`}
                  >
                    {alreadyAdded ? <><span className="text-green-400">✓</span> Added</> : roleConflict ? 'Role Exists' : <><Plus size={12} /> Add to Board</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
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
          <div className="flex items-center justify-between gap-2 mb-1">
             <div className="text-xs font-bold opacity-50">{msg.sender}</div>
             <button 
               onClick={() => speakText(msg.text)}
               className="opacity-50 hover:opacity-100 transition-opacity p-1 hover:text-indigo-300"
               title="Read aloud"
             >
               <Volume2 size={12} />
             </button>
          </div>
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
        <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white"><Users size={16} /></div>
            <h1 className="font-bold text-white tracking-wider text-sm">BOARDROOM<br/><span className="text-xs text-indigo-400 font-normal">SIMULATOR</span></h1>
          </div>
          {/* Close for mobile, Save for desktop */}
          <div className="flex items-center gap-2">
             {/* --- Reset Button --- */}
             <button 
                onClick={handleResetBoard} 
                disabled={isProcessing} 
                className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900 rounded text-xs transition-colors disabled:opacity-50 mr-2"
                title="Clear Chat & Restart"
             >
               <RotateCcw size={14} /> <span className="hidden sm:inline">Reset</span>
             </button>
            <button onClick={handleSaveBoard} className="text-gray-400 hover:text-green-400 transition-colors" title="Save Board">
                {saveStatus === "Saving..." ? <RotateCcw size={18} className="animate-spin text-yellow-400"/> : <CloudUpload size={18} />}
            </button>
            <button onClick={() => { setShowBoardSwitcher(!showBoardSwitcher); loadBoardList(); }} className={`transition-colors ${showBoardSwitcher ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-300'}`} title="Switch Boards">
                <ListOrdered size={18} />
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><X size={20} /></button>
          </div>
        </div>

        {/* Board Name Bar */}
        <div className="px-4 py-2 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase font-bold">Board:</span>
          <input
            className="flex-1 bg-transparent text-xs text-white font-medium outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="Board name..."
          />
        </div>

        {/* Board Switcher Dropdown */}
        {showBoardSwitcher && (
          <div className="border-b border-gray-700 bg-gray-900 p-3 space-y-2">
            {userPlan === 'pioneer' && (
              <button onClick={handleCreateBoard} className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-600/50 rounded text-xs transition-colors">
                <Plus size={14} /> New Boardroom
              </button>
            )}
            {userPlan === 'free' && (
              <button onClick={() => alert("Upgrade to Pioneer to create multiple boardrooms!")} className="w-full flex items-center justify-center gap-2 py-2 bg-gray-800 text-gray-500 border border-gray-700 rounded text-xs cursor-not-allowed">
                <Plus size={14} /> New Boardroom <span className="text-[9px] bg-yellow-600/30 text-yellow-400 px-1 rounded">PIONEER</span>
              </button>
            )}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {boardList.length === 0 && <p className="text-[10px] text-gray-600 text-center py-2">No saved boards yet</p>}
              {boardList.map(b => (
                <div
                  key={b.id}
                  onClick={() => loadBoardById(b.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer text-xs transition-colors ${
                    boardId === b.id ? 'bg-indigo-600/20 border border-indigo-500/40 text-white' : 'bg-gray-800/50 hover:bg-gray-800 text-gray-300 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{b.name}</div>
                    <div className="text-[10px] text-gray-500">{new Date(b.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  {boardId !== b.id && (
                    <button onClick={(e) => handleDeleteBoard(b.id, e)} className="ml-2 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {saveStatus === "Saved!" && <div className="bg-green-900/50 text-green-300 text-xs text-center py-1">Session Saved Successfully</div>}
        {saveStatus === "Error!" && <div className="bg-red-900/50 text-red-300 text-xs text-center py-1">Save Failed</div>}

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><FileText size={12} /> The Whiteboard</h2>
            <button onClick={() => setShowSettings(!showSettings)} className={`relative transition-colors ${showSettings ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
              <Settings size={12} />
              <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${customApiKey ? 'bg-green-400' : 'bg-yellow-500'}`}></span>
            </button>
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
                 <div className={`text-[10px] mt-1 font-bold flex items-center gap-1 ${customApiKey ? 'text-green-400' : 'text-yellow-500'}`}>
                   <span className={`w-1.5 h-1.5 rounded-full inline-block ${customApiKey ? 'bg-green-400' : 'bg-yellow-500'}`}></span>
                   {customApiKey ? 'Using your API key' : 'Using system key (limited)'}
                 </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 p-3 rounded text-xs text-gray-400 whitespace-pre-wrap font-mono mb-4">
              {whiteboardFacts}
            </div>
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
              <div key={m.id} className="group flex items-center justify-between p-2 hover:bg-gray-800 rounded transition-colors">
                {/* Member Info */}
                <div className={`w-5 h-5 rounded-full ${m.avatar} flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 mr-2`}>{m.name[0]}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white font-medium">{m.role} <span className="text-gray-500">({m.name})</span></span>
                    <span className={m.stats.agreement > 50 ? "text-green-400" : "text-red-400"}>{m.stats.agreement}%</span>
                  </div>
                  <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden mb-1">
                    <div className={`h-full transition-all duration-500 ${m.stats.agreement > 50 ? 'bg-green-600' : 'bg-red-600'}`} style={{ width: `${m.stats.agreement}%` }} />
                  </div>
                </div>
                
                {/* Force Speak Button (Visible on Hover) */}
                <button 
                    onClick={() => handleForceTrigger(m)}
                    disabled={isProcessing}
                    className="ml-3 opacity-0 group-hover:opacity-100 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg transition-all transform hover:scale-105 disabled:opacity-0"
                    title={`Force ${m.role} to speak`}
                >
                    <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* User Profile & Sign Out */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 mt-auto">
            {/* --- Plan Status --- */}
            <div className="mb-4">
                {userPlan === 'free' ? (
                    <button 
                        onClick={() => window.location.href = STRIPE_LINK} 
                        className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded text-xs shadow-lg transform transition-transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <Sparkles size={14} fill="white" /> UPGRADE TO PIONEER
                    </button>
                ) : (
                    <div className="w-full py-2 bg-gray-800 border border-yellow-600/30 text-yellow-500 font-bold rounded text-xs flex items-center justify-center gap-2">
                        <Sparkles size={14} /> PIONEER MEMBER
                    </div>
                )}
            </div>
            
            <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400 truncate max-w-[150px]">
                    {session?.user?.email}
                </div>
                <button 
                    onClick={() => supabase.auth.signOut()}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    title="Sign Out"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col bg-gray-950 relative w-full">
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 bg-gray-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-400 mr-2"><Menu size={20} /></button>
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

        {/* --- Password Reset Modal --- */}
        {showResetModal && (
          <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-md p-6 rounded-lg shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                 <Key size={20} className="text-indigo-400"/> Update Password
              </h2>
              <p className="text-sm text-gray-400 mb-6">Enter your new password below.</p>
              
              <div className="space-y-4">
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-white focus:border-indigo-500 outline-none"
                    placeholder="New Password"
                  />
                  
                  <div className="flex gap-3">
                    <button 
                        onClick={() => setShowResetModal(false)}
                        className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-bold"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handlePasswordUpdate}
                        disabled={resetLoading || !newPassword}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {resetLoading ? <Loader2 size={16} className="animate-spin"/> : "Save Password"}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Config Modal */}
        {showMemberConfig && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
            <div className="bg-gray-900 border border-gray-700 w-full md:max-w-4xl h-[90vh] md:h-[600px] rounded-lg shadow-2xl flex flex-col overflow-hidden">
              
              {/* MODAL HEADER WITH TABS */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900">
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => { setShowMarketplace(false); setShowAIBuilder(false); }}
                        className={`text-sm font-bold flex items-center gap-2 ${!showMarketplace && !showAIBuilder ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Users size={18} /> Your Board
                    </button>
                    <div className="w-px h-5 bg-gray-700"></div>
                    <button
                        onClick={loadMarketplace}
                        className={`text-sm font-bold flex items-center gap-2 ${showMarketplace ? 'text-indigo-400' : 'text-gray-500 hover:text-indigo-300'}`}
                    >
                        <Globe size={18} /> Marketplace
                    </button>
                    <div className="w-px h-5 bg-gray-700"></div>
                    <button
                        onClick={handleOpenAIBuilder}
                        className={`text-sm font-bold flex items-center gap-2 ${showAIBuilder ? 'text-purple-400' : 'text-gray-500 hover:text-purple-300'}`}
                    >
                        <BrainCircuit size={18} /> AI Builder
                    </button>
                </div>
                <button onClick={() => { setShowMemberConfig(false); setShowMarketplace(false); setShowAIBuilder(false); }} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>

              {showAIBuilder ? (
                // --- AI BUILDER VIEW ---
                <div className="flex flex-col flex-1 overflow-hidden bg-gray-950">
                  <div className="flex-1 overflow-y-auto p-4">
                    {aiBuilderMessages.length === 0 && !isAIBuilderLoading && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 py-16">
                        <Sparkles size={36} className="mb-3" />
                        <p className="text-sm text-center">Analyzing your whiteboard...</p>
                      </div>
                    )}
                    {aiBuilderMessages.map((msg, idx) => renderAIBuilderMessage(msg, idx))}
                    {isAIBuilderLoading && (
                      <div className="flex items-center gap-2 text-xs text-purple-400 animate-pulse pl-9 mt-2">
                        <Loader2 size={14} className="animate-spin" /> Analyzing your project...
                      </div>
                    )}
                    <div ref={aiBuilderEndRef} />
                  </div>
                  <div className="p-3 border-t border-gray-800 bg-gray-900">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiBuilderInput}
                        onChange={(e) => setAIBuilderInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAIBuilderSend()}
                        placeholder="Reply to the AI..."
                        disabled={isAIBuilderLoading}
                        className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 text-sm disabled:opacity-50"
                      />
                      <button
                        onClick={handleAIBuilderSend}
                        disabled={isAIBuilderLoading || !aiBuilderInput.trim()}
                        className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isAIBuilderLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1.5 text-center">Answer the AI's questions, then click "Add to Board" on any suggestions above.</p>
                  </div>
                </div>
              ) : showMarketplace ? (
                // --- MARKETPLACE VIEW ---
                <div className="p-6 overflow-y-auto bg-gray-950 flex-1">
                    {isLoadingMarket && <div className="text-center text-gray-500 py-10">Loading agents...</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {marketAgents.map(agent => (
                            <div key={agent.id} className="bg-gray-900 border border-gray-800 p-4 rounded hover:border-indigo-500 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`w-8 h-8 rounded-full ${agent.avatar} flex items-center justify-center text-xs font-bold text-white`}>{agent.role[0]}</div>
                                    <div className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-400">Downloads: {agent.downloads || 0}</div>
                                </div>
                                <h3 className="font-bold text-white text-sm">{agent.role}</h3>
                                <div className="text-xs text-indigo-400 mb-2">{agent.name}</div>
                                <p className="text-xs text-gray-400 h-16 overflow-hidden mb-4">{agent.description}</p>
                                <button 
                                    onClick={() => handleDownloadAgent(agent)}
                                    className="w-full py-2 bg-indigo-900/30 hover:bg-indigo-600 border border-indigo-900/50 hover:border-indigo-500 text-indigo-200 hover:text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={14}/> Add to Board
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
              ) : (
                // --- EXISTING "YOUR BOARD" VIEW ---
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
                          
                          {/* Member Config Footer */}
                          <div className="pt-4 flex items-center justify-between border-t border-gray-800 mt-8">
                            <button onClick={() => handleDeleteMember(editingMember.id)} className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                            
                            {/* Publish Button */}
                            <button onClick={handlePublishMember} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-2">
                                <Globe size={14} /> Publish to Market
                            </button>

                            <button onClick={handleSaveMember} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2"><Save size={16} /> Save</button>
                          </div>

                        </div>
                      ) : <div className="h-full flex flex-col items-center justify-center text-gray-600"><Users size={48} className="mb-4 opacity-50" /><p>Select a member.</p></div>}
                    </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}