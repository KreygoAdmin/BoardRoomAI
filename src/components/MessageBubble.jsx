import React from 'react';
import { Gavel, AlertTriangle, Globe, Volume2, X } from 'lucide-react';

// Renders a single message in the chat feed.
// Handles five variants: research, alert, error, vote-result, and standard chat (user/assistant).
export default function MessageBubble({ msg, idx, onDismiss, onSpeak, isSpeaking = false }) {
  if (msg.type === 'research') return (
    <div className="flex items-start gap-3 p-3 my-2 border border-cyan-900 rounded-lg bg-cyan-950/30">
      <div className="w-7 h-7 rounded-full bg-cyan-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Globe size={13} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-cyan-400 uppercase mb-1 flex items-center gap-2">
          <span>Research Lookup</span>
          {msg.query && <span className="text-cyan-600 normal-case font-normal italic truncate">"{msg.query}"</span>}
        </div>
        <div className="text-sm text-gray-300 leading-relaxed">{msg.text}</div>
        {msg.sources?.length > 0 && (
          <div className="mt-1.5 text-[10px] text-cyan-700 truncate">
            via Google Search: {msg.sources.join(', ')}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(idx)}
        className="text-cyan-800 hover:text-cyan-500 transition-colors flex-shrink-0 mt-0.5"
        title="Dismiss research"
      >
        <X size={14} />
      </button>
    </div>
  );

  if (msg.type === 'alert') return (
    <div className="flex items-center justify-center p-2 my-2 text-xs font-bold text-red-400 border border-red-900 rounded bg-red-900/20">
      <Gavel className="w-4 h-4 mr-2" /> {msg.text}
    </div>
  );

  if (msg.type === 'error') return (
    <div className="flex items-center justify-center p-2 my-2 text-xs font-bold text-yellow-500 border border-yellow-900 rounded bg-yellow-900/20">
      <AlertTriangle className="w-4 h-4 mr-2" /> {msg.text}
    </div>
  );

  if (msg.type === 'vote-result') {
    const isMulti = msg.options && msg.options.length >= 2;
    const tally = isMulti ? (() => {
      const t = {};
      msg.options.forEach((_, i) => { t[String.fromCharCode(65 + i)] = 0; });
      msg.details.forEach(r => { if (t[r.vote] !== undefined) t[r.vote]++; });
      return t;
    })() : null;
    const winnerKey = isMulti ? Object.keys(tally).reduce((a, b) => tally[a] >= tally[b] ? a : b) : null;
    const optionColors = ['bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-orange-600'];
    return (
      <div className="p-4 my-4 border border-gray-700 rounded-lg bg-gray-800/80">
        {msg.proposal && (
          <div className="mb-3 p-3 bg-indigo-900/30 border border-indigo-800 rounded">
            <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Motion on the Table</div>
            <div className="text-sm text-white italic">"{msg.proposal}"</div>
          </div>
        )}
        <h3 className="mb-3 text-sm font-bold text-white uppercase border-b border-gray-700 pb-2 flex justify-between">
          <span>Vote Results</span>
          <span className="text-green-400">{isMulti ? `Option ${winnerKey} Wins` : (msg.text.includes("PASSED") ? "PASSED" : "REJECTED")}</span>
        </h3>

        {/* Multi-option tally */}
        {isMulti && (
          <div className="mb-4 space-y-2">
            {msg.options.map((opt, i) => {
              const key = String.fromCharCode(65 + i);
              const count = tally[key] || 0;
              const pct = msg.details.length > 0 ? Math.round((count / msg.details.length) * 100) : 0;
              const isWinner = key === winnerKey;
              return (
                <div key={i}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className={isWinner ? 'text-white font-bold' : 'text-gray-400'}>
                      <span className="font-bold mr-1">{key}.</span>{opt}
                      {isWinner && <span className="ml-2 text-green-400 text-[9px]">✓ WINNER</span>}
                    </span>
                    <span className={isWinner ? 'text-green-400 font-bold' : 'text-gray-500'}>{count} vote{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isWinner ? 'bg-green-500' : optionColors[i % optionColors.length]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Per-member breakdown */}
        <div className="space-y-2">
          {msg.details.map((vote, i) => {
            const isYes = vote.vote === 'YES';
            const isNo = vote.vote === 'NO';
            const voteColor = isMulti
              ? (vote.vote === winnerKey ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400')
              : (isYes ? 'bg-green-900 text-green-300' : isNo ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-400');
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-400 w-24">{vote.member}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold w-12 text-center ${voteColor}`}>{vote.vote}</span>
                <span className="text-gray-500 italic flex-1 ml-4 truncate">"{vote.reason}"</span>
              </div>
            );
          })}
        </div>

        {msg.resolution && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-xs font-bold text-indigo-400 uppercase mb-1">Official Resolution</div>
            <div className="text-xs text-gray-300 italic bg-gray-900 p-2 rounded border border-gray-700">{msg.resolution}</div>
          </div>
        )}
      </div>
    );
  }

  // Standard chat bubble (user or assistant)
  const isUser = msg.role === 'user';
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 shadow-lg flex-shrink-0 ${msg.avatar || 'bg-gray-600'}${isSpeaking ? ' ring-2 ring-violet-400 ring-offset-1 ring-offset-gray-950' : ''}`}>{msg.sender[0]}</div>
      )}
      <div className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-lg text-sm shadow-md transition-colors ${isUser ? 'bg-blue-600 text-white rounded-br-none' : `bg-gray-800 border text-gray-200 rounded-bl-none ${isSpeaking ? 'border-violet-500/60 bg-gray-800/80 shadow-violet-900/30 shadow-lg' : 'border-gray-700'}`}`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-xs font-bold opacity-50">{msg.sender}{msg.senderRole && <span className="font-normal opacity-75"> · {msg.senderRole}</span>}</div>
          <button
            onClick={() => onSpeak(idx)}
            className="opacity-50 hover:opacity-100 transition-opacity p-1 hover:text-indigo-300"
            title="Read aloud from here"
          >
            <Volume2 size={12} />
          </button>
        </div>
        {msg.text}
      </div>
    </div>
  );
}
