import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import {
  MEMBER_MODELS,
  DEFAULT_BOARD,
  BOARD_TEMPLATES,
  DEFAULT_MINUTES,
  FREE_PLAN_MEMBER_LIMIT,
  FREE_PLAN_MESSAGE_LIMIT,
  FREE_PLAN_LIBRARY_LIMIT,
  formatCST,
  MEMBER_VOICES,
  WEBHOOK_SERVER_URL,
  getVoiceForName,
} from './lib/constants.js';
import {
  callGemini as callGeminiApi,
  callGeminiWithSearch as callGeminiWithSearchApi,
  callOpenRouter as callOpenRouterApi,
  parseJsonObject,
  parseJsonArray,
} from './lib/api.js';
import { useAgents } from './hooks/useAgents.js';
import { useAutoMode } from './hooks/useAutoMode.js';
import VoteModal from './components/modals/VoteModal.jsx';
import ReportModal from './components/modals/ReportModal.jsx';
import TemplateModal from './components/modals/TemplateModal.jsx';
import MemberConfigModal from './components/modals/MemberConfigModal.jsx';
import ChatStage from './components/ChatStage.jsx';
import Sidebar from './components/Sidebar.jsx';
import TutorialOverlay from './components/TutorialOverlay.jsx';
import { useTutorial } from './hooks/useTutorial.js';

/* ===================================================================
  BOARDROOM SIMULATOR - MULTI-AGENT ORCHESTRATION SYSTEM
  =================================================================== */

// API keys (injected by environment)
const systemApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

// DEFAULT_BOARD, BOARD_TEMPLATES, MEMBER_MODELS, formatCST → imported from ./lib/constants.js
// callGemini, callGeminiWithSearch, callOpenRouter, parseJsonObject, parseJsonArray → imported from ./lib/api.js


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

  // Re-fetch plan when Stripe redirects back after payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true' && session) {
      fetchUserPlan(session.user.id);
      window.history.replaceState({}, '', '/');
    }
  }, [session]);

  // --- Helper Function to get the plan ---
  const fetchUserPlan = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan, total_tokens, messages_used, billing_cycle_anchor')
      .eq('id', userId)
      .single();

    if (data) {
        console.log("User Plan Loaded:", data.plan);
        setUserPlan(data.plan);
        setTotalTokensUsed(data.total_tokens || 0);
        // Monthly reset check
        const anchor = new Date(data.billing_cycle_anchor);
        const now = new Date();
        const nextReset = new Date(anchor);
        nextReset.setMonth(nextReset.getMonth() + 1);

        if (now >= nextReset) {
          // Cycle has elapsed — reset usage
          await supabase
            .from('profiles')
            .update({ messages_used: 0, billing_cycle_anchor: now.toISOString() })
            .eq('id', userId);
          setMessagesUsed(0);
        } else {
          setMessagesUsed(data.messages_used || 0);
        }
    } else {
        console.error("Error fetching plan:", error);
    }
  };

  // --- APP STATE ---

  // Plan State
  const [userPlan, setUserPlan] = useState('free'); // Default to free (safe mode)
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [messagesUsed, setMessagesUsed] = useState(0);

  // User personalization
  const [preferredName, setPreferredName] = useState('');

  // Session settings
  const [briefMode, setBriefMode] = useState(false);
  const [headphonesMode, setHeadphonesMode] = useState(true);

  // Audio queue for sequential playback
  const audioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);
  const currentAudioRef = useRef(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);

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
  const [whiteboardFacts, setWhiteboardFacts] = useState(() =>
    `Session Start: ${formatCST()} CST\n\nProject: 'Project Alpha'\nGoal: Launch a new AI boardroom app\nBudget: $1k\nTimeline: unknown`
  );
  

  // Research State
  const [autoResearch, setAutoResearch] = useState(true);

  // Speaker Pick State
  const [speakerPickState, setSpeakerPickState] = useState(null);

  // Auto-Conversation Mode
  const { autoMode, setAutoMode, autoModeRef, autoTurnCountRef, lastAutoSpeakerRef, autoLoopRunningRef, runAutoLoop } = useAutoMode();
  const resumeAutoAfterUserTurn = useRef(false);

  // --- Marketplace State ---
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [marketAgents, setMarketAgents] = useState([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketSort, setMarketSort] = useState("newest");

  // --- My Library State ---
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryAgents, setLibraryAgents] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [editingLibraryAgent, setEditingLibraryAgent] = useState(null);

  // --- AI Builder State ---
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [aiBuilderMessages, setAIBuilderMessages] = useState([]);
  const [aiBuilderInput, setAIBuilderInput] = useState("");
  const [isAIBuilderLoading, setIsAIBuilderLoading] = useState(false);
  const [addedSuggestionIds, setAddedSuggestionIds] = useState(new Set());
  const aiBuilderEndRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showMemberConfig, setShowMemberConfig] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alignmentCollapsed, setAlignmentCollapsed] = useState(true);
  const [whiteboardCollapsed, setWhiteboardCollapsed] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [pendingVote, setPendingVote] = useState(null);
  // pendingVote shape: { proposal: string, options: string[], clarification: string }
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [minutesCollapsed, setMinutesCollapsed] = useState(true);
  // Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank');
  const [pendingBoardName, setPendingBoardName] = useState('New Boardroom');
  const [templateCustomizeOpen, setTemplateCustomizeOpen] = useState(false);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [pendingWhiteboard, setPendingWhiteboard] = useState('');
  // Meeting Setup State
  const [meetingSetupDone, setMeetingSetupDone] = useState(false);
  const [setupPurpose, setSetupPurpose] = useState('');
  const [setupBudget, setSetupBudget] = useState('');
  const [setupTimeline, setSetupTimeline] = useState('');
  const messagesEndRef = useRef(null);
  const whiteboardSnapshot = useRef("");

  // --- TUTORIAL ---
  const {
    showPromptModal: tutorialPrompt,
    isActive: tutorialActive,
    stepIndex: tutorialStep,
    steps: tutorialSteps,
    currentStep: tutorialCurrentStep,
    isLastStep: tutorialIsLastStep,
    maybeShowPrompt: tutorialMaybeShow,
    startTutorial,
    skipTutorial,
    nextStep: tutorialNext,
    prevStep: tutorialPrev,
  } = useTutorial(session?.user?.id);

  const tutorialTriggeredRef = useRef(false);
  useEffect(() => {
    if (meetingSetupDone && session && !tutorialTriggeredRef.current) {
      tutorialTriggeredRef.current = true;
      tutorialMaybeShow();
    }
  }, [meetingSetupDone, session, tutorialMaybeShow]);


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
        setMeetingSetupDone(true);

        if (data.settings && data.settings.autoResearch !== undefined) {
            setAutoResearch(data.settings.autoResearch);
        }
        if (data.settings?.minutes) {
            setMinutes(data.settings.minutes);
        }
        if (data.settings?.briefMode !== undefined) {
            setBriefMode(data.settings.briefMode);
        }
      } else {
        // No boards exist — first-time user. Open template modal with welcome flow.
        const timeStr = formatCST();
        const blankTemplate = BOARD_TEMPLATES[0];
        const initialWhiteboard = blankTemplate.whiteboard(timeStr);
        setSelectedTemplateId('blank');
        setPendingBoardName('New Boardroom');
        setTemplateCustomizeOpen(false);
        setPendingMembers([...DEFAULT_BOARD]);
        setPendingWhiteboard(initialWhiteboard);
        setAIBuilderMessages([]);
        setAddedSuggestionIds(new Set());
        setIsFirstTimeUser(true);
        setShowTemplateModal(true);
        // Auto-init AI builder
        setIsAIBuilderLoading(true);
        const initResponse = await runAIBuilderAgent([], { members: DEFAULT_BOARD, whiteboard: initialWhiteboard });
        setIsAIBuilderLoading(false);
        if (!initResponse || initResponse.type === 'message') {
          setAIBuilderMessages([{ role: 'assistant', type: 'ai-chat', text: "Describe your project and I'll suggest the right board members." }]);
        } else if (initResponse.type === 'suggestions') {
          const sid = Date.now().toString();
          setAIBuilderMessages([{ role: 'assistant', type: 'suggestions', text: initResponse.intro || "Here are my starting recommendations:", members: initResponse.members.map((m, i) => ({ ...m, id: `sugg_${sid}_${i}` })) }]);
        }
      }
    };

    loadBoard();
    loadBoardList();
  }, [session]);

  // --- ESCAPE KEY: UNSTICK UI ---
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && (autoMode || isProcessing || speakerPickState || retryStatus)) {
        handleIntervention();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [autoMode, isProcessing, speakerPickState, retryStatus]);

  // --- SCROLL EFFECT ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, retryStatus]);

  useEffect(() => {
    aiBuilderEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiBuilderMessages, isAIBuilderLoading]);

  // --- AUTO-CONVERSATION LOOP TRIGGER ---
  useEffect(() => {
    if (!autoMode || isProcessing || messages.length === 0 || speakerPickState) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.type === 'vote-result') {
      setAutoMode(false);
      autoModeRef.current = false;
      return;
    }
    runAutoLoop({
      messages, minutes, boardMembers, whiteboardFacts,
      userPlan, messagesUsed, autoResearch,
      runOrchestratorAgent, runBoardMemberAgent, runAlignmentAgent, runResearchAgent,
      openVoteModal,
      setMessages, setMinutes, setIsProcessing, setProcessingStage, setRetryStatus,
      headphonesMode, waitForSilence,
    });
  }, [autoMode, messages, isProcessing]);

  // --- AUTO-SAVE ---
  const autoSave = useCallback(async () => {
    if (!session || messages.length === 0) return;
    setSaveStatus("Saving...");
    const payload = {
      user_id: session.user.id,
      name: boardName,
      whiteboard: whiteboardFacts,
      members: boardMembers,
      messages: messages,
      settings: { autoResearch: autoResearch, minutes: minutes, briefMode: briefMode }
    };
    try {
      if (boardId) {
        await supabase.from('boardrooms').update(payload).eq('id', boardId);
      } else {
        const { data } = await supabase.from('boardrooms').insert([payload]).select().single();
        if (data) setBoardId(data.id);
      }
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      console.warn("Auto-save failed:", e);
      setSaveStatus("Error!");
    }
  }, [session, boardId, boardName, whiteboardFacts, boardMembers, messages, autoResearch, minutes]);

  // --- AUTO-SAVE on message change (2s debounce) ---
  useEffect(() => {
    if (!session || messages.length === 0) return;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave();
    }, 2000);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [messages]);

  // --- AUTO-SAVE on board metadata change (2s debounce) ---
  useEffect(() => {
    if (!session || !boardId) return;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave();
    }, 2000);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [boardName, boardMembers, whiteboardFacts]);

  // --- AUTO-SAVE on 15-second interval (safety net) ---
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => { autoSave(); }, 15000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // --- Audio Queue (server-proxied ElevenLabs, or Web Speech fallback) ---
  // Processes items one at a time so messages are never cut off.
  const processAudioQueue = async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0) return;
    isPlayingAudioRef.current = true;
    setIsPlayingAudio(true);
    const { text, voiceId, userId, msgIndex = null } = audioQueueRef.current.shift();
    setSpeakingMsgIndex(msgIndex);
    try {
      let spokenviaElevenLabs = false;
      if (voiceId && userId) {
        // Server-proxied ElevenLabs (key lives on server, usage tracked per user)
        try {
          const res = await fetch(`${WEBHOOK_SERVER_URL}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, voice_id: voiceId, text }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.warn('ElevenLabs proxy non-ok response:', res.status, err.detail || err);
          } else if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.playbackRate = 1.15;
            currentAudioRef.current = audio;
            await new Promise(resolve => {
              audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
              audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
              audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
            });
            currentAudioRef.current = null;
            spokenviaElevenLabs = true;
          }
        } catch (e) { console.warn('ElevenLabs TTS error, falling back to web speech:', e); }
      }
      if (!spokenviaElevenLabs) {
        // Web Speech fallback (no voice assigned, not logged in, or ElevenLabs failed)
        await new Promise(resolve => {
          if (!('speechSynthesis' in window)) { resolve(); return; }
          const utt = new SpeechSynthesisUtterance(text);
          utt.rate = 1.15;
          utt.onend = resolve;
          utt.onerror = resolve;
          window.speechSynthesis.speak(utt);
        });
      }
    } catch (e) { console.warn('Audio error:', e); }
    isPlayingAudioRef.current = false;
    if (audioQueueRef.current.length === 0) { setIsPlayingAudio(false); setSpeakingMsgIndex(null); }
    processAudioQueue(); // next item
  };

  const speakText = (text, voiceId = "", msgIndex = null) => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    audioQueueRef.current.push({ text, voiceId, userId: session?.user?.id, msgIndex });
    processAudioQueue();
  };

  const stopAudio = () => {
    audioQueueRef.current = [];
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    isPlayingAudioRef.current = false;
    setIsPlayingAudio(false);
    setSpeakingMsgIndex(null);
  };

  // Resolves when the audio queue is empty and nothing is playing
  const waitForSilence = () => new Promise(resolve => {
    const check = () => {
      if (!isPlayingAudioRef.current && audioQueueRef.current.length === 0) resolve();
      else setTimeout(check, 150);
    };
    check();
  });

  // Headphones mode: auto-speak new assistant messages (must be before gatekeeper)
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (!headphonesMode) return;
    if (messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length;
      return;
    }
    prevMessageCountRef.current = messages.length;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last?.text) {
      speakText(last.text, last.voice_id || "", messages.length - 1);
    }
  }, [messages, headphonesMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- HEADPHONES + AUTO MODE TIP ---
  // Show a one-time UI-only hint the first time both modes are on together.
  // Uses a separate state (never injected into messages) so AI members can't see it.
  const headphonesAutoTipShownRef = useRef(false);
  const [headphonesTip, setHeadphonesTip] = useState(false);
  useEffect(() => {
    if (headphonesMode && autoMode && !headphonesAutoTipShownRef.current && messages.length > 0) {
      headphonesAutoTipShownRef.current = true;
      setHeadphonesTip(true);
    }
  }, [headphonesMode, autoMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
      settings: { autoResearch, minutes, briefMode }
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
      .select('id, name, updated_at, members')
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
      .eq('user_id', session.user.id)
      .single();
    if (data) {
      setBoardId(data.id);
      setBoardName(data.name);
      setBoardMembers(data.members);
      setMessages(data.messages);
      setWhiteboardFacts(data.whiteboard);
      setMeetingSetupDone(true);
      if (data.settings?.minutes) {
        setMinutes(data.settings.minutes);
      } else {
        setMinutes(DEFAULT_MINUTES);
      }
      setAIBuilderMessages([]);
      setAddedSuggestionIds(new Set());
      setShowBoardSwitcher(false);
    }
  };

  // --- CREATE NEW BOARD (opens template picker) ---
  const handleCreateBoard = async () => {
    if (userPlan === 'free') {
      alert("Upgrade to Pioneer to create multiple boardrooms!");
      return;
    }
    const timeStr = formatCST();
    const blankTemplate = BOARD_TEMPLATES[0];
    const initialWhiteboard = blankTemplate.whiteboard(timeStr);
    setSelectedTemplateId('blank');
    setPendingBoardName('New Boardroom');
    setTemplateCustomizeOpen(false);
    setPendingMembers([...DEFAULT_BOARD]);
    setPendingWhiteboard(initialWhiteboard);
    setAIBuilderMessages([]);
    setAddedSuggestionIds(new Set());
    setShowTemplateModal(true);
    setShowBoardSwitcher(false);
    // Auto-init AI builder with blank board context
    setIsAIBuilderLoading(true);
    const initResponse = await runAIBuilderAgent([], { members: DEFAULT_BOARD, whiteboard: initialWhiteboard });
    setIsAIBuilderLoading(false);
    if (!initResponse) {
      setAIBuilderMessages([{ role: 'assistant', type: 'ai-chat', text: "Describe your project and I'll suggest the right board members." }]);
    } else if (initResponse.type === 'message') {
      setAIBuilderMessages([{ role: 'assistant', type: 'ai-chat', text: initResponse.text }]);
    } else if (initResponse.type === 'suggestions') {
      const sid = Date.now().toString();
      setAIBuilderMessages([{ role: 'assistant', type: 'suggestions', text: initResponse.intro || "Here are my starting recommendations:", members: initResponse.members.map((m, i) => ({ ...m, id: `sugg_${sid}_${i}` })) }]);
    }
  };

  // --- APPLY TEMPLATE AND CREATE NEW BOARD ---
  const handleCreateFromTemplate = async () => {
    const template = BOARD_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (!template) return;
    await handleSaveBoard();
    const timeStr = formatCST();
    // Build whiteboard: template base + any meeting context the user entered
    const baseWhiteboard = template.whiteboard(timeStr);
    const contextLines = [
      setupPurpose.trim() && `\nMeeting Purpose: ${setupPurpose.trim()}`,
      setupBudget.trim() && `Budget: ${setupBudget.trim()}`,
      setupTimeline.trim() && `Timeline: ${setupTimeline.trim()}`,
    ].filter(Boolean);
    const finalWhiteboard = contextLines.length > 0 ? baseWhiteboard + '\n' + contextLines.join('\n') : baseWhiteboard;

    setBoardId(null);
    setBoardName(pendingBoardName.trim() || template.name);
    setBoardMembers(pendingMembers.length > 0 ? pendingMembers : template.members);
    setMessages([]);
    setWhiteboardFacts(finalWhiteboard);
    setMinutes(DEFAULT_MINUTES);
    setAIBuilderMessages([]);
    setAddedSuggestionIds(new Set());
    // Mark setup done since context was collected in the modal
    setMeetingSetupDone(true);
    setSetupPurpose('');
    setSetupBudget('');
    setSetupTimeline('');
    setShowTemplateModal(false);
    setTemplateCustomizeOpen(false);
    setIsFirstTimeUser(false);
  };

  // --- START FRESH (free tier: delete current board and open template picker) ---
  const handleStartFresh = async () => {
    if (!window.confirm("Delete this boardroom and start a new one?\n\nThis cannot be undone.")) return;
    if (boardId) {
      await supabase.from('boardrooms').delete().eq('id', boardId);
    }
    const timeStr = formatCST();
    const blankTemplate = BOARD_TEMPLATES[0];
    const initialWhiteboard = blankTemplate.whiteboard(timeStr);
    setBoardId(null);
    setSelectedTemplateId('blank');
    setPendingBoardName('New Boardroom');
    setTemplateCustomizeOpen(false);
    setPendingMembers([...DEFAULT_BOARD]);
    setPendingWhiteboard(initialWhiteboard);
    setAIBuilderMessages([]);
    setAddedSuggestionIds(new Set());
    setShowBoardSwitcher(false);
    setShowTemplateModal(true);
    setIsAIBuilderLoading(true);
    const initResponse = await runAIBuilderAgent([], { members: DEFAULT_BOARD, whiteboard: initialWhiteboard });
    setIsAIBuilderLoading(false);
    if (!initResponse || initResponse.type === 'message') {
      setAIBuilderMessages([{ role: 'assistant', type: 'ai-chat', text: "Describe your project and I'll suggest the right board members." }]);
    } else if (initResponse.type === 'suggestions') {
      const sid = Date.now().toString();
      setAIBuilderMessages([{ role: 'assistant', type: 'suggestions', text: initResponse.intro || "Here are my starting recommendations:", members: initResponse.members.map((m, i) => ({ ...m, id: `sugg_${sid}_${i}` })) }]);
    }
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
      setWhiteboardFacts(`Session Start: ${formatCST()} CST\n\nProject: 'New Project'\nGoal: TBD\nBudget: TBD\nTimeline: TBD`);
      setMinutes(DEFAULT_MINUTES);
      setMeetingSetupDone(false);
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
    setMinutes(DEFAULT_MINUTES);
    
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
    setSpeakerPickState(null);
    setIsProcessing(false);
  };

  // --- API WRAPPERS ---
  // These delegate to the extracted functions in src/lib/api.js,
  // capturing React state setters via closure so call sites remain unchanged.
  const onTokensUsed = session ? (count) => {
    setTotalTokensUsed(prev => prev + count);
    supabase.rpc('increment_tokens', { user_id: session.user.id, count })
      .then(({ error }) => { if (error) console.error('increment_tokens failed:', error); });
  } : null;

  const callGemini = (prompt, systemInstruction = "You are a helpful AI.", maxTokens = 1000) =>
    callGeminiApi(prompt, systemInstruction, maxTokens, { apiKey: systemApiKey, onStatusChange: setRetryStatus, onTokensUsed });

  const callGeminiWithSearch = (prompt, maxTokens = 300) =>
    callGeminiWithSearchApi(prompt, maxTokens, { apiKey: systemApiKey, onStatusChange: setRetryStatus, onTokensUsed });

  const callOpenRouter = (userPrompt, systemInstruction = "", model, maxTokens = 500) =>
    callOpenRouterApi(userPrompt, systemInstruction, model, maxTokens, { apiKey: openRouterKey, onStatusChange: setRetryStatus });

  const {
    runOrchestratorAgent,
    runBoardMemberAgent,
    generateProposal,
    runBatchVoteAgent,
    runResolutionAgent,
    runResearchAgent,
    runAlignmentAgent,
    runAIBuilderAgent,
  } = useAgents({ callGemini, callGeminiWithSearch, callOpenRouter, setBoardMembers, userName: preferredName, briefMode });

  // --- Logic Functions ---

  // --- Manual Trigger ---
  const handleUserTurn = async () => {
    if (!userInput.trim()) return;

    // If autoMode is running, pause it and resume after user turn completes
    if (autoModeRef.current) {
      autoModeRef.current = false;
      setAutoMode(false);
      resumeAutoAfterUserTurn.current = true;
    }

    // --- Message Limit Check ---
    if (userPlan === 'free' && messagesUsed >= FREE_PLAN_MESSAGE_LIMIT) {
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

    // Increment usage counter
    const newCount = messagesUsed + 1;
    setMessagesUsed(newCount);
    supabase.from('profiles').update({ messages_used: newCount }).eq('id', session.user.id);

    try {
      setProcessingStage("The Board is processing...");
      const orchestration = await runOrchestratorAgent(messages, userMsg, minutes, boardMembers, whiteboardFacts, null);
      if (!orchestration) return;
      setMinutes(orchestration.minutes);

      if (autoResearch && orchestration.researchNeeded && orchestration.researchQuery) {
        setProcessingStage("Looking it up...");
        const research = await runResearchAgent(orchestration.researchQuery);
        if (research) {
          setMessages(prev => [...prev, {
            role: 'system',
            sender: 'Research',
            text: research.answer,
            type: 'research',
            query: orchestration.researchQuery,
            sources: research.sources
          }]);
        }
      }

      // Show speaker picker — user chooses who responds (or accepts AI recommendation)
      setIsProcessing(false);
      setProcessingStage("");
      setSpeakerPickState({ orchestration, recommendation: orchestration.memberObj });

    } catch (error) {
      console.error("Turn Error:", error);
      setMessages(prev => [...prev, { role: 'system', text: "Simulation paused. Please check API Key in settings.", type: 'error' }]);
      setIsProcessing(false);
      setProcessingStage("");
      setRetryStatus(null);
    }
  };

  // --- Manually surface the speaker picker (e.g. when resuming a session) ---
  const handleContinue = async () => {
    if (isProcessing || messages.length === 0 || speakerPickState) return;
    setIsProcessing(true);
    setRetryStatus(null);
    try {
      setProcessingStage("The Board is processing...");
      const lastMsg = messages[messages.length - 1];
      const orchestration = await runOrchestratorAgent(messages, lastMsg, minutes, boardMembers, whiteboardFacts, null);
      if (!orchestration) return;
      setMinutes(orchestration.minutes);
      setIsProcessing(false);
      setProcessingStage("");
      setSpeakerPickState({ orchestration, recommendation: orchestration.memberObj });
    } catch (error) {
      console.error("Continue failed:", error);
      setMessages(prev => [...prev, { role: 'system', text: "Simulation paused. Please check API Key in settings.", type: 'error' }]);
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  const handlePickSpeaker = async (chosenMember) => {
    if (!speakerPickState) return;
    const { orchestration, recommendation } = speakerPickState;
    setSpeakerPickState(null);
    setIsProcessing(true);
    setRetryStatus(null);

    const isAIPick = chosenMember.id === recommendation.id;
    const finalOrchestration = {
      ...orchestration,
      memberObj: chosenMember,
      nextSpeaker: chosenMember.role,
      nextSpeakerName: chosenMember.name,
      nextSpeakerAvatar: chosenMember.avatar,
      briefing: isAIPick
        ? orchestration.briefing
        : `You've been called on. Respond to the last message in character.`
    };

    try {
      setProcessingStage(`${chosenMember.role} is speaking...`);
      const agentResponse = await runBoardMemberAgent(finalOrchestration);
      if (!agentResponse) return;

      const agentMsg = {
        role: 'assistant',
        sender: chosenMember.name,
        senderRole: chosenMember.role,
        text: agentResponse,
        type: 'chat',
        avatar: chosenMember.avatar,
        voice_id: chosenMember.voice_id || ""
      };
      setMessages(prev => [...prev, agentMsg]);

      if (messages.length % 3 === 0) {
        runAlignmentAgent(agentMsg, boardMembers);
      }
    } catch (error) {
      console.error("Pick Speaker Error:", error);
      setMessages(prev => [...prev, { role: 'system', text: "Simulation paused. Please check API Key in settings.", type: 'error' }]);
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
      setRetryStatus(null);
      if (resumeAutoAfterUserTurn.current) {
        resumeAutoAfterUserTurn.current = false;
        autoModeRef.current = true;
        setAutoMode(true);
      }
    }
  };


  // Step 1: Opens the vote setup modal (replaces immediate triggerVote)
  const openVoteModal = async (proposalText = null) => {
    if (isProcessing) return;
    let proposal = proposalText;
    if (!proposal) {
      setIsProcessing(true);
      setProcessingStage("Formulating the motion...");
      proposal = await generateProposal(messages, minutes, whiteboardFacts);
      setIsProcessing(false);
      setProcessingStage("");
    }
    setPendingVote({ proposal: proposal || "", options: [], clarification: "" });
  };

  // Step 1.5: AI-suggests multi-option vote choices from conversation context
  const handleAISuggestOptions = async (proposal) => {
    setAiSuggestLoading(true);
    try {
      const recentContext = messages
        .filter(m => m.text && m.sender)
        .slice(-15)
        .map(m => `${m.sender}: ${m.text}`)
        .join('\n');
      const prompt = `You are helping structure a boardroom vote. Based on the discussion below and the proposed motion, suggest 2-4 concrete, distinct options to vote on.\n\nMotion: "${proposal}"\n\nRecent discussion:\n${recentContext}\n\nReturn ONLY a valid JSON array of 2-4 short option strings (each under 12 words). No explanation, no markdown. Example: ["Approve budget increase","Defer to next quarter","Reject proposal"]`;
      const result = await callGemini(prompt, "You output only a valid JSON array of strings. No markdown, no explanation.", 300);
      const cleaned = result.trim().replace(/^```json|^```|```$/gm, '').trim();
      const options = JSON.parse(cleaned);
      if (Array.isArray(options) && options.length >= 2) {
        setPendingVote(v => ({ ...v, options: options.slice(0, 4).map(o => String(o)) }));
      }
    } catch (e) {
      console.error('AI suggest options failed', e);
    } finally {
      setAiSuggestLoading(false);
    }
  };

  // Step 2: Runs the actual vote from the modal
  const runVote = async (voteConfig) => {
    setPendingVote(null);
    if (isProcessing) return;
    setIsProcessing(true);
    const minutesSnapshot = minutes;
    const { proposal, options, clarification } = voteConfig;

    try {
      setProcessingStage("The board is voting...");
      const results = await runBatchVoteAgent(boardMembers, minutesSnapshot, whiteboardFacts, proposal, options, clarification);

      let passed, summary, isTie = false, tiedKeys = null;
      if (options.length >= 2) {
        // Multi-option: tally votes, detect ties
        const tally = {};
        options.forEach((_, i) => { tally[String.fromCharCode(65 + i)] = 0; });
        results.forEach(r => { if (tally[r.vote] !== undefined) tally[r.vote]++; });
        const maxVotes = Math.max(...Object.values(tally));
        const topKeys = Object.keys(tally).filter(k => tally[k] === maxVotes);
        if (topKeys.length > 1) {
          isTie = true;
          tiedKeys = topKeys;
          passed = false;
          summary = `TIED VOTE — No winner. Options ${topKeys.join(', ')} each received ${maxVotes} vote${maxVotes !== 1 ? 's' : ''}`;
        } else {
          const winnerKey = topKeys[0];
          const winnerText = options[winnerKey.charCodeAt(0) - 65];
          passed = true;
          summary = `OPTION ${winnerKey} SELECTED: "${winnerText}"`;
        }
      } else {
        const yesVotes = results.filter(r => r.vote === 'YES').length;
        const noVotes = results.filter(r => r.vote === 'NO').length;
        passed = yesVotes > noVotes;
        summary = `VOTE ${passed ? "PASSED" : "REJECTED"} (${yesVotes}-${noVotes})`;
      }

      setProcessingStage("Drafting resolution...");
      const resolution = await runResolutionAgent(results, minutesSnapshot, passed, options.length >= 2 ? options : null);

      const votesSummary = results.map(r => `${r.member}: ${r.vote} ("${r.reason}")`).join(', ');
      setMessages(prev => [...prev, {
        role: 'system',
        sender: 'Vote',
        text: `${summary}. ${votesSummary}. Resolution: ${resolution}`,
        type: 'vote-result',
        details: results,
        resolution,
        proposal,
        options,
      }]);

      const yesVotes = options.length < 2 ? results.filter(r => r.vote === 'YES').length : null;
      const noVotes = options.length < 2 ? results.filter(r => r.vote === 'NO').length : null;
      setReportData({ boardName, boardMembers, minutes: minutesSnapshot, proposal, options, results, resolution, passed, yesVotes, noVotes, isTie, tiedKeys });
      setShowReportModal(true);
      setAutoMode(false);
      autoModeRef.current = false;

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'system', text: "Vote interrupted. Check API Key.", type: 'error' }]);
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
      setRetryStatus(null);
    }
  };
  // --- Shared Logic ---
  const handleEditMember = (member) => setEditingMember({ ...member });
  
  const handleCreateMember = () => {
    // --- Limit Check ---
    if (userPlan === 'free' && boardMembers.length >= FREE_PLAN_MEMBER_LIMIT) {
        alert("Free Plan limit reached (3 Members).\n\nUpgrade to Pioneer for unlimited agents!");
        return;
    }

    setEditingMember({
      id: Date.now().toString(), name: 'New Member', role: 'Advisor', avatar: 'bg-gray-600',
      description: 'New member description.', stats: { agreement: 50, aggression: 50 }, model: 'gemini-2.0-flash'
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
    const newMember = {
      id: `ai_built_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: suggestion.name,
      role: suggestion.role,
      avatar: suggestion.avatar || 'bg-indigo-600',
      description: suggestion.description,
      stats: {
        agreement: Math.min(100, Math.max(0, suggestion.stats?.agreement ?? 50)),
        aggression: Math.min(100, Math.max(0, suggestion.stats?.aggression ?? 30))
      },
      model: MEMBER_MODELS[Math.floor(Math.random() * MEMBER_MODELS.length)].id,
      voice_id: getVoiceForName(suggestion.name),
    };
    // When in template modal context, add to pendingMembers instead of live board
    if (showTemplateModal) {
      const roleConflict = pendingMembers.some(m => m.role.toLowerCase() === suggestion.role.toLowerCase());
      if (roleConflict) { alert(`A "${suggestion.role}" already exists in this board setup.`); return; }
      setPendingMembers(prev => [...prev, newMember]);
      setAddedSuggestionIds(prev => new Set([...prev, suggestion.id]));
      return;
    }
    if (userPlan === 'free' && boardMembers.length >= FREE_PLAN_MEMBER_LIMIT) {
      alert("Free Plan limit reached (3 Members).\n\nUpgrade to Pioneer for unlimited agents!");
      return;
    }
    const roleConflict = boardMembers.some(m => m.role.toLowerCase() === suggestion.role.toLowerCase());
    if (roleConflict) { alert(`A "${suggestion.role}" already exists on your board.`); return; }
    setBoardMembers(prev => [...prev, newMember]);
    setAddedSuggestionIds(prev => new Set([...prev, suggestion.id]));
  };

  const handleOpenAIBuilder = async () => {
    setShowMarketplace(false);
    setShowAIBuilder(true);
    setShowLibrary(false);
    setEditingLibraryAgent(null);
    if (aiBuilderMessages.length > 0) return;
    setIsAIBuilderLoading(true);
    const response = await runAIBuilderAgent([], {}, boardMembers, whiteboardFacts);
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
    const modalWhiteboard = showTemplateModal
      ? [pendingWhiteboard, setupPurpose.trim() && `Meeting Purpose: ${setupPurpose.trim()}`, setupBudget.trim() && `Budget: ${setupBudget.trim()}`, setupTimeline.trim() && `Timeline: ${setupTimeline.trim()}`].filter(Boolean).join('\n')
      : undefined;
    const ctx = showTemplateModal ? { members: pendingMembers, whiteboard: modalWhiteboard } : {};
    const response = await runAIBuilderAgent(updatedHistory, ctx, boardMembers, whiteboardFacts);
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
    setShowLibrary(false);
    setEditingLibraryAgent(null);

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
    if (userPlan === 'free' && boardMembers.length >= FREE_PLAN_MEMBER_LIMIT) {
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

  // --- My Library Logic ---
  const loadLibrary = async () => {
    setIsLoadingLibrary(true);
    setShowLibrary(true);
    setShowMarketplace(false);
    setShowAIBuilder(false);

    const { data, error } = await supabase
      .from('saved_agents')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (error) console.error("Library error:", error);
    else setLibraryAgents(data || []);

    setIsLoadingLibrary(false);
  };

  const handleSaveToLibrary = async (member) => {
    if (!member || !session) return;

    if (userPlan === 'free') {
      const { count } = await supabase
        .from('saved_agents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      if (count >= FREE_PLAN_LIBRARY_LIMIT) {
        alert(`Free Plan limit reached (${FREE_PLAN_LIBRARY_LIMIT} saved agents).\n\nUpgrade to Pioneer for unlimited library storage!`);
        return;
      }
    }

    const payload = {
      user_id: session.user.id,
      name: member.name,
      role: member.role,
      description: member.description,
      avatar: member.avatar,
      stats: member.stats
    };

    const { error } = await supabase
      .from('saved_agents')
      .insert(payload);

    if (error) {
      alert("Error saving to library: " + error.message);
    } else {
      alert(`"${member.role}" saved to your Library!`);
      if (showLibrary) loadLibrary();
    }
  };

  const handleLoadFromLibrary = (agent) => {
    if (userPlan === 'free' && boardMembers.length >= FREE_PLAN_MEMBER_LIMIT) {
      alert("Free Plan limit reached (3 Members).\n\nUpgrade to Pioneer for unlimited agents!");
      return;
    }

    const exists = boardMembers.find(m => m.role === agent.role);
    if (exists) {
      alert(`You already have a "${agent.role}" on your board! Rename yours first.`);
      return;
    }

    const newMember = {
      id: Date.now().toString(),
      name: agent.name,
      role: agent.role,
      avatar: agent.avatar,
      description: agent.description,
      stats: agent.stats
    };

    setBoardMembers(prev => [...prev, newMember]);
    alert(`Deployed "${agent.role}" to your boardroom.`);
    setShowMemberConfig(false);
  };

  const handleEditLibraryAgent = (agent) => {
    setEditingLibraryAgent({ ...agent });
  };

  const handleSaveLibraryAgent = async () => {
    if (!editingLibraryAgent) return;

    const { id, user_id, created_at, updated_at, ...updates } = editingLibraryAgent;

    const { error } = await supabase
      .from('saved_agents')
      .update(updates)
      .eq('id', editingLibraryAgent.id);

    if (error) {
      alert("Error updating agent: " + error.message);
    } else {
      setLibraryAgents(prev =>
        prev.map(a => a.id === editingLibraryAgent.id ? editingLibraryAgent : a)
      );
      setEditingLibraryAgent(null);
    }
  };

  const handleDeleteLibraryAgent = async (agentId) => {
    if (!window.confirm("Remove this agent from your library?")) return;

    const { error } = await supabase
      .from('saved_agents')
      .delete()
      .eq('id', agentId);

    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      setLibraryAgents(prev => prev.filter(a => a.id !== agentId));
      if (editingLibraryAgent?.id === agentId) setEditingLibraryAgent(null);
    }
  };

  const handleIntervention = () => {
    setAutoMode(false);
    autoModeRef.current = false;
    autoLoopRunningRef.current = false;
    setIsProcessing(false);
    setProcessingStage("");
    setRetryStatus(null);
    setSpeakerPickState(null);
    setMessages(prev => [...prev, { role: 'system', text: "THE CHAIR INTERVENES", type: 'alert' }]);
  };

  const handleManualResearch = async () => {
    if (isProcessing || messages.length === 0) return;
    setIsProcessing(true);
    setRetryStatus(null);

    const recentText = messages.slice(-4).map(m => `${m.sender}: ${m.text}`).join('\n');
    setProcessingStage("Identifying research question...");
    const queryResult = await callGemini(
      `Given this recent boardroom conversation, identify the most pressing unanswered factual question and return only a concise search query string, nothing else.\n\n${recentText}`,
      "You are a research assistant. Output only a search query string.",
      80
    );
    if (!queryResult) { setIsProcessing(false); setProcessingStage(""); return; }

    setProcessingStage("Looking it up...");
    const research = await runResearchAgent(queryResult.trim());
    if (research) {
      setMessages(prev => [...prev, {
        role: 'system',
        sender: 'Research',
        text: research.answer,
        type: 'research',
        query: queryResult.trim(),
        sources: research.sources
      }]);
    }
    setIsProcessing(false);
    setProcessingStage("");
  };

  // --- AI Builder Message Renderer --- (extracted to src/components/AIBuilderMessage.jsx)

  // --- Render --- (components extracted to src/components/)

  return (
    <div className="flex h-dvh bg-gray-950 text-gray-200 font-sans overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        handleResetBoard={handleResetBoard} isProcessing={isProcessing}
        handleSaveBoard={handleSaveBoard} saveStatus={saveStatus}
        boardName={boardName} setBoardName={setBoardName}
        showBoardSwitcher={showBoardSwitcher} setShowBoardSwitcher={setShowBoardSwitcher} loadBoardList={loadBoardList}
        boardList={boardList} boardId={boardId} loadBoardById={loadBoardById}
        handleCreateBoard={handleCreateBoard} handleDeleteBoard={handleDeleteBoard} handleStartFresh={handleStartFresh}
        whiteboardCollapsed={whiteboardCollapsed} setWhiteboardCollapsed={setWhiteboardCollapsed}
        whiteboardFacts={whiteboardFacts} setWhiteboardFacts={setWhiteboardFacts}
        showSettings={showSettings} setShowSettings={setShowSettings} whiteboardSnapshot={whiteboardSnapshot}
        minutesCollapsed={minutesCollapsed} setMinutesCollapsed={setMinutesCollapsed} minutes={minutes}
        alignmentCollapsed={alignmentCollapsed} setAlignmentCollapsed={setAlignmentCollapsed}
        boardMembers={boardMembers} setShowMemberConfig={setShowMemberConfig}
        setShowLibrary={setShowLibrary}
        userPlan={userPlan} messagesUsed={messagesUsed} totalTokensUsed={totalTokensUsed} session={session}
        onReplayTutorial={startTutorial}
      />

      {/* Main Stage */}
      <ChatStage
        setIsSidebarOpen={setIsSidebarOpen}
        handleContinue={handleContinue} autoMode={autoMode} setAutoMode={setAutoMode}
        autoModeRef={autoModeRef} autoTurnCountRef={autoTurnCountRef} lastAutoSpeakerRef={lastAutoSpeakerRef}
        setIsProcessing={setIsProcessing} setProcessingStage={setProcessingStage} setRetryStatus={setRetryStatus}
        autoResearch={autoResearch} setAutoResearch={setAutoResearch}
        messages={messages} setMessages={setMessages} isProcessing={isProcessing}
        processingStage={processingStage} retryStatus={retryStatus}
        boardMembers={boardMembers} speakText={speakText} stopAudio={stopAudio} messagesEndRef={messagesEndRef}
        headphonesMode={headphonesMode} setHeadphonesMode={setHeadphonesMode} isPlayingAudio={isPlayingAudio}
        speakingMsgIndex={speakingMsgIndex}
        headphonesTip={headphonesTip} setHeadphonesTip={setHeadphonesTip}
        briefMode={briefMode} setBriefMode={setBriefMode}
        preferredName={preferredName} setPreferredName={setPreferredName}
        boardName={boardName} meetingSetupDone={meetingSetupDone} setMeetingSetupDone={setMeetingSetupDone}
        setupPurpose={setupPurpose} setSetupPurpose={setSetupPurpose}
        setupBudget={setupBudget} setSetupBudget={setSetupBudget}
        setupTimeline={setupTimeline} setSetupTimeline={setSetupTimeline}
        setWhiteboardFacts={setWhiteboardFacts} userInput={userInput} setUserInput={setUserInput}
        speakerPickState={speakerPickState} setSpeakerPickState={setSpeakerPickState} handlePickSpeaker={handlePickSpeaker}
        handleUserTurn={handleUserTurn} handleManualResearch={handleManualResearch} openVoteModal={openVoteModal}
        showResetModal={showResetModal} setShowResetModal={setShowResetModal}
        newPassword={newPassword} setNewPassword={setNewPassword}
        resetLoading={resetLoading} handlePasswordUpdate={handlePasswordUpdate}
        showMemberConfig={showMemberConfig} setShowMemberConfig={setShowMemberConfig}
        showMarketplace={showMarketplace} setShowMarketplace={setShowMarketplace}
        showAIBuilder={showAIBuilder} setShowAIBuilder={setShowAIBuilder}
        showLibrary={showLibrary} setShowLibrary={setShowLibrary}
        loadMarketplace={loadMarketplace} loadLibrary={loadLibrary} handleOpenAIBuilder={handleOpenAIBuilder}
        aiBuilderMessages={aiBuilderMessages} isAIBuilderLoading={isAIBuilderLoading}
        addedSuggestionIds={addedSuggestionIds} aiBuilderEndRef={aiBuilderEndRef}
        aiBuilderInput={aiBuilderInput} setAIBuilderInput={setAIBuilderInput}
        handleAIBuilderSend={handleAIBuilderSend} addSuggestedMember={addSuggestedMember} pendingMembers={pendingMembers}
        marketAgents={marketAgents} isLoadingMarket={isLoadingMarket}
        marketSearch={marketSearch} setMarketSearch={setMarketSearch}
        marketSort={marketSort} setMarketSort={setMarketSort}
        handleDownloadAgent={handleDownloadAgent}
        libraryAgents={libraryAgents} isLoadingLibrary={isLoadingLibrary}
        editingLibraryAgent={editingLibraryAgent} setEditingLibraryAgent={setEditingLibraryAgent}
        handleEditLibraryAgent={handleEditLibraryAgent} handleLoadFromLibrary={handleLoadFromLibrary}
        handleDeleteLibraryAgent={handleDeleteLibraryAgent} handleSaveLibraryAgent={handleSaveLibraryAgent}
        editingMember={editingMember} setEditingMember={setEditingMember}
        handleEditMember={handleEditMember} handleCreateMember={handleCreateMember}
        handleDeleteMember={handleDeleteMember} handleSaveMember={handleSaveMember}
        handleSaveToLibrary={handleSaveToLibrary} handlePublishMember={handlePublishMember}
        setBoardMembers={setBoardMembers} userId={session?.user?.id}
      />

      {/* --- Template Picker Modal --- */}
      {showTemplateModal && (
        <TemplateModal
          selectedTemplateId={selectedTemplateId} setSelectedTemplateId={setSelectedTemplateId}
          pendingBoardName={pendingBoardName} setPendingBoardName={setPendingBoardName}
          pendingMembers={pendingMembers} setPendingMembers={setPendingMembers}
          pendingWhiteboard={pendingWhiteboard} setPendingWhiteboard={setPendingWhiteboard}
          setupPurpose={setupPurpose} setSetupPurpose={setSetupPurpose}
          setupBudget={setupBudget} setSetupBudget={setSetupBudget}
          setupTimeline={setupTimeline} setSetupTimeline={setSetupTimeline}
          aiBuilderMessages={aiBuilderMessages} setAIBuilderMessages={setAIBuilderMessages}
          aiBuilderInput={aiBuilderInput} setAIBuilderInput={setAIBuilderInput}
          isAIBuilderLoading={isAIBuilderLoading} setIsAIBuilderLoading={setIsAIBuilderLoading}
          addedSuggestionIds={addedSuggestionIds}
          aiBuilderEndRef={aiBuilderEndRef}
          runAIBuilderAgent={runAIBuilderAgent}
          handleAIBuilderSend={handleAIBuilderSend}
          addSuggestedMember={addSuggestedMember}
          handleCreateFromTemplate={handleCreateFromTemplate}
          isFirstTime={isFirstTimeUser}
          onClose={() => { setShowTemplateModal(false); setIsFirstTimeUser(false); }}
        />
      )}
      {/* --- Vote Setup Modal --- */}
      {pendingVote && (
        <VoteModal pendingVote={pendingVote} setPendingVote={setPendingVote} runVote={runVote} onAISuggest={handleAISuggestOptions} isLoadingAI={aiSuggestLoading} />
      )}

      {/* --- Meeting Report Modal --- */}
      {showReportModal && reportData && (
        <ReportModal reportData={reportData} onClose={() => setShowReportModal(false)} />
      )}

      {/* --- Tutorial Overlay --- */}
      <TutorialOverlay
        showPromptModal={tutorialPrompt}
        isActive={tutorialActive}
        currentStep={tutorialCurrentStep}
        stepIndex={tutorialStep}
        totalSteps={tutorialSteps.length}
        isLastStep={tutorialIsLastStep}
        onStart={startTutorial}
        onSkip={skipTutorial}
        onNext={tutorialNext}
        onPrev={tutorialPrev}
      />
    </div>
  );
}