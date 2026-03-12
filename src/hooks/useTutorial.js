import { useState, useCallback } from 'react';

const TUTORIAL_KEY = (userId) => `tutorial_done_${userId}`;

const ALL_STEPS = [
  {
    targetId: 'tutorial-message-input',
    title: 'Drive the discussion',
    text: 'Type your message here to present a case, ask a question, or challenge the board.',
    skipOnMobile: false,
  },
  {
    targetId: 'tutorial-send-button',
    title: 'Submit your message',
    text: 'Hit Send (or press Enter) — the board will respond with their perspectives.',
    skipOnMobile: false,
  },
  {
    targetId: 'tutorial-automode-toggle',
    title: 'Auto Mode',
    text: 'Toggle Auto Mode to let the board debate hands-free. They keep talking until you intervene.',
    skipOnMobile: false,
  },
  {
    targetId: 'tutorial-vote-button',
    title: 'Call a vote',
    text: 'Use the Vote button when the group needs to reach a formal decision. Each member votes with reasoning.',
    skipOnMobile: false,
  },
  {
    targetId: 'tutorial-board-members',
    title: 'Your board',
    text: 'Each board member has a unique role and an agreement score that shifts as the discussion unfolds.',
    skipOnMobile: true,
  },
];

export function useTutorial(userId) {
  const isDone = userId
    ? localStorage.getItem(TUTORIAL_KEY(userId)) === 'true'
    : true;

  const effectiveSteps = ALL_STEPS.filter(
    (s) => !s.skipOnMobile || window.innerWidth >= 768
  );

  const [showPromptModal, setShowPromptModal] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const markDone = useCallback(() => {
    if (userId) localStorage.setItem(TUTORIAL_KEY(userId), 'true');
    setShowPromptModal(false);
    setIsActive(false);
  }, [userId]);

  const maybeShowPrompt = useCallback(() => {
    if (!userId || isDone) return;
    setShowPromptModal(true);
  }, [userId, isDone]);

  const startTutorial = useCallback(() => {
    setShowPromptModal(false);
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const skipTutorial = useCallback(() => {
    markDone();
  }, [markDone]);

  const nextStep = useCallback(() => {
    if (stepIndex < effectiveSteps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      markDone();
    }
  }, [stepIndex, effectiveSteps.length, markDone]);

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  return {
    showPromptModal,
    isActive,
    stepIndex,
    steps: effectiveSteps,
    currentStep: effectiveSteps[stepIndex],
    isLastStep: stepIndex === effectiveSteps.length - 1,
    maybeShowPrompt,
    startTutorial,
    skipTutorial,
    nextStep,
    prevStep,
  };
}
