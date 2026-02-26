import React from 'react';
import { X, ClipboardList } from 'lucide-react';

export default function ReportModal({ reportData, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-white font-bold text-base">{reportData.boardName} — Meeting Report</h2>
            <p className="text-gray-500 text-xs mt-0.5">{new Date().toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5 scrollbar-thin scrollbar-thumb-gray-800">

          {/* Board Members */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Board Members</h3>
            <div className="flex flex-wrap gap-2">
              {reportData.boardMembers.map(m => (
                <span key={m.id} className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300">
                  <span className="text-white font-medium">{m.role}</span> <span className="text-gray-500">({m.name})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Meeting Minutes */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Meeting Minutes</h3>
            <div className="space-y-2 bg-gray-800/50 border border-gray-800 rounded-lg p-3">
              {[
                { label: 'Momentum', value: reportData.minutes.momentum, color: 'text-green-400' },
                { label: 'Consensus', value: reportData.minutes.consensus, color: 'text-blue-400' },
                { label: 'Friction Points', value: reportData.minutes.friction, color: 'text-red-400' },
              ].map(item => (
                <div key={item.label}>
                  <span className={`text-[10px] font-bold uppercase ${item.color}`}>{item.label}: </span>
                  <span className="text-xs text-gray-300">{item.value}</span>
                </div>
              ))}
              {reportData.minutes.actionItems?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-yellow-400">Action Items:</span>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    {reportData.minutes.actionItems.map((ai, i) => (
                      <li key={i} className="text-xs text-gray-300">{ai}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Vote Record */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Vote Record</h3>
            <div className="bg-gray-800/50 border border-gray-800 rounded-lg p-3 space-y-3">
              <div className="bg-indigo-900/30 border border-indigo-800 rounded p-2">
                <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Motion on the Table</div>
                <div className="text-sm text-white italic">"{reportData.proposal}"</div>
              </div>
              <div className="space-y-1.5">
                {reportData.results.map((vote, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400 w-28 flex-shrink-0">{vote.member}</span>
                    <span className={`px-2 py-0.5 rounded font-bold w-10 text-center flex-shrink-0 ${vote.vote === 'YES' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{vote.vote}</span>
                    <span className="text-gray-500 italic truncate">"{vote.reason}"</span>
                  </div>
                ))}
              </div>
              <div className={`text-sm font-bold text-center py-1 rounded ${reportData.passed ? 'bg-green-900/40 text-green-300 border border-green-800' : 'bg-red-900/40 text-red-300 border border-red-800'}`}>
                {reportData.passed ? 'MOTION PASSED' : 'MOTION REJECTED'} — {reportData.yesVotes} YES / {reportData.noVotes} NO
              </div>
            </div>
          </div>

          {/* Official Resolution */}
          {reportData.resolution && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Official Resolution</h3>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 italic">{reportData.resolution}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button
            onClick={() => {
              const actionLines = reportData.minutes.actionItems?.length
                ? reportData.minutes.actionItems.map(ai => `  - ${ai}`).join('\n')
                : '  None';
              const memberLines = reportData.boardMembers.map(m => `  - ${m.role} (${m.name})`).join('\n');
              const voteLines = reportData.results.map(r => `  ${r.member}: ${r.vote} — "${r.reason}"`).join('\n');
              const text = [
                'BOARDROOM MEETING REPORT',
                `Board: ${reportData.boardName}`,
                `Date: ${new Date().toLocaleString()}`,
                '',
                'BOARD MEMBERS',
                memberLines,
                '',
                'MEETING MINUTES',
                `  Momentum: ${reportData.minutes.momentum}`,
                `  Consensus: ${reportData.minutes.consensus}`,
                `  Friction Points: ${reportData.minutes.friction}`,
                '  Action Items:',
                actionLines,
                '',
                'VOTE RECORD',
                `  Motion: "${reportData.proposal}"`,
                voteLines,
                `  Result: ${reportData.passed ? 'PASSED' : 'REJECTED'} (${reportData.yesVotes}-${reportData.noVotes})`,
                '',
                'OFFICIAL RESOLUTION',
                `  ${reportData.resolution}`,
              ].join('\n');
              navigator.clipboard.writeText(text);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-xs font-bold transition-colors"
          >
            <ClipboardList size={14} /> Copy to Clipboard
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-bold transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}
