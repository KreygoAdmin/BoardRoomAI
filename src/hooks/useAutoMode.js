import { useState, useRef } from 'react';
import { sleep } from '../lib/api.js';
import { AUTO_MODE_TURN_LIMIT, AUTO_LOOP_DELAY, FREE_PLAN_MESSAGE_LIMIT } from '../lib/constants.js';

// Owns all auto-conversation state and refs.
// runAutoLoop receives all live state values as an options object to avoid stale closures.
export function useAutoMode() {
  const [autoMode, setAutoMode] = useState(false);
  const autoModeRef = useRef(false);
  const autoTurnCountRef = useRef(0);
  const lastAutoSpeakerRef = useRef(null);

  const runAutoLoop = async ({
    messages, minutes, boardMembers, whiteboardFacts,
    userPlan, messagesUsed, autoResearch,
    runOrchestratorAgent, runBoardMemberAgent, runAlignmentAgent, runResearchAgent,
    openVoteModal,
    setMessages, setMinutes, setIsProcessing, setProcessingStage, setRetryStatus,
  }) => {
    if (!autoModeRef.current || messages.length === 0) return;

    // Free plan limit
    if (userPlan === 'free' && messagesUsed >= FREE_PLAN_MESSAGE_LIMIT) {
      setAutoMode(false);
      autoModeRef.current = false;
      return;
    }

    // Safety limit — prevent infinite loops
    autoTurnCountRef.current += 1;
    if (autoTurnCountRef.current > AUTO_MODE_TURN_LIMIT) {
      setMessages(prev => [...prev, {
        role: 'system',
        text: "Auto-mode paused after 20 turns. You can call a vote manually or toggle auto-mode back on to continue.",
        type: 'alert'
      }]);
      setAutoMode(false);
      autoModeRef.current = false;
      return;
    }

    // Delay so user can read the last message
    await sleep(AUTO_LOOP_DELAY);
    if (!autoModeRef.current) return;

    setIsProcessing(true);
    setRetryStatus(null);

    try {
      // Step 1: Run orchestrator
      setProcessingStage("The Board is processing...");
      const lastMsg = messages[messages.length - 1];
      let orchestration = await runOrchestratorAgent(messages, lastMsg, minutes, boardMembers, whiteboardFacts, null);

      if (!orchestration || !autoModeRef.current) {
        setIsProcessing(false);
        setProcessingStage("");
        return;
      }

      setMinutes(orchestration.minutes);

      // Step 2: Check if orchestrator wants to call a vote
      if (orchestration.callVote) {
        setIsProcessing(false);
        setProcessingStage("");
        setAutoMode(false);
        autoModeRef.current = false;
        await openVoteModal(orchestration.proposal);
        return;
      }

      // Step 3: Optional research
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

      if (!autoModeRef.current) {
        setIsProcessing(false);
        setProcessingStage("");
        return;
      }

      // Step 4: Auto-pick the recommended speaker (skip speaker picker UI)
      // Never allow the same member twice in a row during auto-mode
      let chosenMember = orchestration.memberObj;
      if (lastAutoSpeakerRef.current === chosenMember.id && boardMembers.length > 1) {
        const others = boardMembers.filter(m => m.id !== chosenMember.id);
        chosenMember = others[Math.floor(Math.random() * others.length)];
        orchestration = {
          ...orchestration,
          memberObj: chosenMember,
          nextSpeaker: chosenMember.role,
          nextSpeakerName: chosenMember.name,
          nextSpeakerAvatar: chosenMember.avatar,
          briefing: `Respond to the ongoing discussion from your perspective as ${chosenMember.role}.`
        };
      }
      lastAutoSpeakerRef.current = chosenMember.id;

      setProcessingStage(`${chosenMember.role} is speaking...`);
      const agentResponse = await runBoardMemberAgent(orchestration);

      if (!agentResponse || !autoModeRef.current) {
        setIsProcessing(false);
        setProcessingStage("");
        return;
      }

      const agentMsg = {
        role: 'assistant',
        sender: chosenMember.name,
        text: agentResponse,
        type: 'chat',
        avatar: chosenMember.avatar
      };
      setMessages(prev => [...prev, agentMsg]);

      // Alignment check every 3 messages
      if (messages.length % 3 === 0) {
        runAlignmentAgent(agentMsg, boardMembers);
      }

    } catch (error) {
      console.error("Auto-loop Error:", error);
      setMessages(prev => [...prev, {
        role: 'system',
        text: "Auto-mode paused due to an error. Check API Key in settings.",
        type: 'error'
      }]);
      setAutoMode(false);
      autoModeRef.current = false;
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
      setRetryStatus(null);
    }
  };

  return { autoMode, setAutoMode, autoModeRef, autoTurnCountRef, lastAutoSpeakerRef, runAutoLoop };
}
