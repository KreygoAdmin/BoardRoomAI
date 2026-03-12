import React from 'react';
import {
  Users, RotateCcw, CloudUpload, X, ListOrdered, Plus, Trash2,
  FileText, Edit, BrainCircuit, ClipboardList, ChevronRight,
  Sparkles, MessageSquare, Zap, LogOut
} from 'lucide-react';
import { MEMBER_MODELS, STRIPE_BASE_URL, WEBHOOK_SERVER_URL } from '../lib/constants.js';
import { supabase } from '../supabaseClient';

export default function Sidebar({
  isSidebarOpen, setIsSidebarOpen,
  handleResetBoard, isProcessing,
  handleSaveBoard, saveStatus,
  boardName, setBoardName,
  showBoardSwitcher, setShowBoardSwitcher, loadBoardList,
  boardList, boardId, loadBoardById, handleCreateBoard, handleDeleteBoard, handleStartFresh,
  whiteboardCollapsed, setWhiteboardCollapsed,
  whiteboardFacts, setWhiteboardFacts,
  showSettings, setShowSettings, whiteboardSnapshot,
  minutesCollapsed, setMinutesCollapsed, minutes,
  alignmentCollapsed, setAlignmentCollapsed,
  boardMembers, setShowMemberConfig,
  userPlan, messagesUsed, totalTokensUsed, session,
}) {
  return (
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
      <button onClick={() => { setShowBoardSwitcher(!showBoardSwitcher); loadBoardList(); }} className={`transition-colors ${showBoardSwitcher ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-300'}`} title="Switch Boards">
        <ListOrdered size={16} />
      </button>
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
          <div className="space-y-1.5">
            <button onClick={() => alert("Upgrade to Pioneer to create multiple boardrooms!")} className="w-full flex items-center justify-center gap-2 py-2 bg-gray-800 text-gray-500 border border-gray-700 rounded text-xs cursor-not-allowed">
              <Plus size={14} /> New Boardroom <span className="text-[9px] bg-yellow-600/30 text-yellow-400 px-1 rounded">PIONEER</span>
            </button>
            <button onClick={handleStartFresh} className="w-full flex items-center justify-center gap-2 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded text-xs transition-colors">
              <Trash2 size={13} /> Delete & Start Fresh
            </button>
          </div>
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
                <div className="text-[10px] text-gray-500 flex items-center gap-2">
                  <span>{new Date(b.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {b.members?.length > 0 && (
                    <span className="flex items-center gap-0.5 text-gray-600">
                      <Users size={9} /> {b.members.length}
                    </span>
                  )}
                </div>
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

    <div className="flex-1 overflow-y-auto">
      {/* --- Whiteboard (collapsible) --- */}
      <div className="border-b border-gray-800">
        <button onClick={() => setWhiteboardCollapsed(c => !c)} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 transition-colors">
          <h2 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><FileText size={12} /> The Whiteboard</h2>
          <div className="flex items-center gap-2">
            {showSettings ? (
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={async () => { await handleSaveBoard(); setShowSettings(false); }}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="Save"
                  >
                    {saveStatus === "Saving..." ? <RotateCcw size={12} className="animate-spin" /> : <CloudUpload size={12} />}
                  </button>
                  <button
                    onClick={() => { setWhiteboardFacts(whiteboardSnapshot.current); setShowSettings(false); }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); whiteboardSnapshot.current = whiteboardFacts; setShowSettings(true); setWhiteboardCollapsed(false); }}
                  className="text-gray-500 hover:text-white transition-colors"
                  title="Edit whiteboard"
                >
                  <Edit size={12} />
                </button>
              )}
            <ChevronRight size={14} className={`text-gray-500 transition-transform duration-200 ${whiteboardCollapsed ? '' : 'rotate-90'}`} />
          </div>
        </button>
        {!whiteboardCollapsed && (
          <div className="px-4 pb-3">
            {showSettings ? (
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                  value={whiteboardFacts}
                  onChange={(e) => setWhiteboardFacts(e.target.value)}
                  placeholder="Enter facts..."
                />
              </div>
            ) : (
              <div className="bg-gray-900/50 border border-gray-800 p-3 rounded text-xs text-gray-400 whitespace-pre-wrap font-mono">
                {whiteboardFacts}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Secretary's Minutes (collapsible) --- */}
      <div className="border-b border-gray-800">
        <button onClick={() => setMinutesCollapsed(c => !c)} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 transition-colors">
          <h2 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><BrainCircuit size={12} /> Secretary's Minutes</h2>
          <ChevronRight size={14} className={`text-gray-500 transition-transform duration-200 ${minutesCollapsed ? '' : 'rotate-90'}`} />
        </button>
        {!minutesCollapsed && (
          <div className="px-4 pb-2 space-y-0.5">
            {[
              { key: 'momentum', label: 'Momentum', color: 'text-green-500', content: minutes.momentum },
              { key: 'consensus', label: 'Consensus', color: 'text-blue-500', content: minutes.consensus },
              { key: 'friction', label: 'Friction Points', color: 'text-red-500', content: minutes.friction },
              { key: 'actions', label: 'Action Items', color: 'text-yellow-500', content: null },
            ].map(item => (
              <details key={item.key} className="group bg-gray-800/30 rounded border border-gray-800">
                <summary className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <div className={`text-[10px] uppercase font-bold flex items-center gap-1 ${item.color}`}>
                    {item.key === 'actions' && <ClipboardList size={10} />}
                    {item.label}
                  </div>
                  <ChevronRight size={12} className="text-gray-500 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="px-2 pb-2">
                  {item.key === 'actions' ? (
                    <ul className="text-xs text-gray-400 list-disc list-inside">{minutes.actionItems?.map((ai, i) => <li key={i}>{ai}</li>) || <li className="italic opacity-50">No actions</li>}</ul>
                  ) : (
                    <div className="text-xs text-gray-400">{item.content}</div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>


      {/* --- Board Alignment (collapsible) --- */}
      <div className="border-b border-gray-800">
        <button id="tutorial-board-members" onClick={() => setAlignmentCollapsed(c => !c)} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 transition-colors">
          <h2 className="text-xs font-bold text-gray-400 uppercase">Board Members</h2>
          <div className="flex items-center gap-2">
            <button onClick={e => { e.stopPropagation(); setShowMemberConfig(true); }} className="text-gray-500 hover:text-white transition-colors"><Edit size={12} /></button>
            <ChevronRight size={14} className={`text-gray-500 transition-transform duration-200 ${alignmentCollapsed ? '' : 'rotate-90'}`} />
          </div>
        </button>
        {!alignmentCollapsed && (
          <div className="px-4 pb-3 space-y-2">
            {boardMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded transition-colors">
                <div className={`w-4 h-4 rounded-full ${m.avatar} flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0`}>{m.name[0]}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-white font-medium">{m.role} <span className="text-gray-500">({m.name})</span></span>
                    <span className={m.stats.agreement > 50 ? "text-green-400" : "text-red-400"}>{m.stats.agreement}%</span>
                  </div>
                  <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${m.stats.agreement > 50 ? 'bg-green-600' : 'bg-red-600'}`} style={{ width: `${m.stats.agreement}%` }} />
                  </div>
                  <div className="mt-0.5">
                    <span className={`text-[8px] px-1 rounded ${MEMBER_MODELS.find(md => md.id === (m.model || 'gemini-2.0-flash'))?.provider === 'openrouter' ? 'bg-purple-900/40 text-purple-400' : 'bg-blue-900/40 text-blue-400'}`}>
                      {MEMBER_MODELS.find(md => md.id === (m.model || 'gemini-2.0-flash'))?.label || 'Gemini 2.0 Flash'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    
    {/* User Profile & Sign Out */}
    <div className="p-4 border-t border-gray-800 bg-gray-900 mt-auto">
        {/* --- Plan Status --- */}
        <div className="mb-4">
            {userPlan === 'free' ? (
                <button 
                    onClick={() => window.location.href = `${STRIPE_BASE_URL}?client_reference_id=${session.user.id}`}
                    className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded text-xs shadow-lg transform transition-transform hover:scale-105 flex items-center justify-center gap-2"
                >
                    <Sparkles size={14} fill="white" /> UPGRADE TO PIONEER
                </button>
            ) : (
                <button
                    onClick={async () => {
                        const res = await fetch(`${WEBHOOK_SERVER_URL}/create-portal-session`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: session.user.email }),
                        });
                        const { url } = await res.json();
                        window.location.href = url;
                    }}
                    className="w-full py-2 bg-gray-800 border border-yellow-600/30 text-yellow-500 font-bold rounded text-xs flex items-center justify-center gap-2 hover:border-yellow-500/60 hover:text-yellow-400 transition-colors"
                >
                    <Sparkles size={14} /> PIONEER MEMBER
                </button>
            )}
        </div>
        
        {/* Usage counters */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border flex-1 justify-center ${
            userPlan === 'pioneer'
              ? 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50'
              : messagesUsed >= 25
                ? 'bg-red-900/30 text-red-400 border-red-900'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}>
            <MessageSquare size={10} />
            {userPlan === 'pioneer' ? <span>Unlimited</span> : <span>{messagesUsed} / 30</span>}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border bg-zinc-800 text-zinc-400 border-zinc-700 flex-1 justify-center">
            <Zap size={10} />
            <span>{totalTokensUsed.toLocaleString()}</span>
          </div>
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
  );
}
