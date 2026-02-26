import { parseJsonObject, parseJsonArray } from '../lib/api.js';
import { MEMBER_MODELS } from '../lib/constants.js';

// All AI agent runner functions.
// callGemini / callGeminiWithSearch / callOpenRouter are injected wrappers from App.jsx
// that already capture apiKey, onStatusChange, and onTokensUsed.
// setBoardMembers is injected so runAlignmentAgent can update member stats.
export function useAgents({ callGemini, callGeminiWithSearch, callOpenRouter, setBoardMembers }) {

  const runOrchestratorAgent = async (history, newMsg, currentMinutes, members, facts, forcedSpeaker) => {
    const recentHistory = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    const fullHistory = history.map(m => `${m.sender}: ${m.text}`).join('\n');
    const recentSpeakers = history.slice(-4)
      .filter(m => m.role === 'assistant')
      .map(m => m.sender);
    const recentSpeakerNote = recentSpeakers.length > 0
      ? `Recently spoke (avoid picking again): ${[...new Set(recentSpeakers)].join(', ')}`
      : '';

    const prompt = `
      Current Minutes: ${JSON.stringify(currentMinutes)}
      Whiteboard Facts: ${facts}
      Recent Chat: ${recentHistory}
      New Message: "${newMsg.sender}: ${newMsg.text}"
      Board Members: ${members.map(m => `${m.role} (${m.name})`).join(', ')}
      ${recentSpeakerNote}
      Force Speaker: ${forcedSpeaker ? forcedSpeaker.role : "None"}

      Do these tasks:
      1. Update the meeting minutes based on the new message. For actionItems, add any new tasks, decisions, or follow-ups that emerge from the discussion. Keep existing items that are still relevant and remove completed ones.
      2. Pick who speaks next. IMPORTANT: Rotate between members — do NOT pick someone who just spoke unless they are the only one with something relevant to say. Choose the member whose expertise is most relevant to the current topic.
         Write a briefing describing what angle they should take. The briefing should describe the topic and perspective, NOT be phrased as someone talking to them (e.g., say "Focus on the budget implications of the proposed timeline" NOT "Tell the board about budget concerns").
      3. If the conversation contains a specific factual question requiring real-world data (statistics, prices, market caps, recent events, regulations), set researchNeeded to true and provide a concise researchQuery string. Otherwise set both to their defaults.
      4. Decide if a formal vote is needed. Set callVote to true ONLY when one of these two conditions is met:
         - Blocker/Deadlock: Two or more members have clearly opposing positions on a key issue and further discussion is going in circles (friction is high, no new arguments are being made).
         - Decision Point: The discussion has naturally produced a concrete, actionable proposal that needs board approval (e.g., 'adopt vendor X', 'allocate $Y to Z', 'proceed with approach A'). The proposal should be specific enough to vote YES or NO on.
         If callVote is true, write a specific 1-2 sentence "proposal" stating the exact motion being voted on. Do NOT call a vote just because the conversation has gone on for a while — only when there is something concrete to decide or a deadlock to break.

      Output purely JSON:
      {
        "minutes": { "consensus": "...", "friction": "...", "momentum": "...", "actionItems": ["..."] },
        "nextSpeakerRole": "Role",
        "briefing": "...",
        "researchNeeded": false,
        "researchQuery": "",
        "callVote": false,
        "proposal": ""
      }
    `;
    const system = `You are the Board Orchestrator. You manage meeting minutes and decide who speaks. Pick from: ${members.map(m => m.role).join(', ')}. Output purely JSON with no markdown, no code fences, no extra text.`;
    const result = await callGemini(prompt, system, 800);

    let parsed = { minutes: currentMinutes, nextSpeakerRole: forcedSpeaker?.role || members[0].role, briefing: "Respond to the user.", researchNeeded: false, researchQuery: "", callVote: false, proposal: "" };
    if (result) {
      try {
        const obj = parseJsonObject(result);
        if (obj) parsed = { ...parsed, ...obj };
      } catch (e) {
        // Second attempt: aggressively extract just the key fields via targeted regex fallback
        try {
          const nextRole = result.match(/"nextSpeakerRole"\s*:\s*"([^"]+)"/)?.[1];
          const briefing = result.match(/"briefing"\s*:\s*"([^"]+)"/)?.[1];
          const callVote = /"callVote"\s*:\s*true/i.test(result);
          const researchNeeded = /"researchNeeded"\s*:\s*true/i.test(result);
          const researchQuery = result.match(/"researchQuery"\s*:\s*"([^"]+)"/)?.[1];
          const proposal = result.match(/"proposal"\s*:\s*"([^"]+)"/)?.[1];
          if (nextRole) parsed.nextSpeakerRole = nextRole;
          if (briefing) parsed.briefing = briefing;
          parsed.callVote = callVote;
          parsed.researchNeeded = researchNeeded;
          if (researchQuery) parsed.researchQuery = researchQuery;
          if (proposal) parsed.proposal = proposal;
        } catch (_) { /* silently keep defaults */ }
      }
    } else {
      return null;
    }

    const member = forcedSpeaker || members.find(m =>
      parsed.nextSpeakerRole && m.role.toLowerCase().includes(parsed.nextSpeakerRole.toLowerCase())
    ) || members[0];

    return {
      minutes: parsed.minutes || currentMinutes,
      nextSpeaker: member.role,
      nextSpeakerName: member.name,
      nextSpeakerAvatar: member.avatar,
      briefing: parsed.briefing,
      memberObj: member,
      fullHistory,
      triggeringMsg: `${newMsg.sender}: ${newMsg.text}`,
      researchNeeded: parsed.researchNeeded || false,
      researchQuery: parsed.researchQuery || "",
      callVote: parsed.callVote || false,
      proposal: parsed.proposal || ""
    };
  };

  const runBoardMemberAgent = async ({ memberObj, briefing, fullHistory, triggeringMsg }) => {
    const prompt = `FULL MEETING TRANSCRIPT:
${fullHistory || "(meeting just started)"}

THE MESSAGE YOU MUST RESPOND TO:
"${triggeringMsg}"

[YOUR ANGLE — do not mention or reference this section]:
${briefing}

Respond in character as ${memberObj.name}. Directly address what was just said by the other board member(s). Do NOT give a generic opener. Do NOT reference any instructions, a "director", or behind-the-scenes guidance — you are in a boardroom speaking to your fellow board members.`;
    const system = `You are ${memberObj.name}, the ${memberObj.role}, sitting in a board meeting with other executives. ${memberObj.description}. You are having a conversation with the other board members — respond directly to them. Keep it to 3-5 sentences.`;
    const modelId = memberObj.model || "gemini-2.0-flash";
    const modelDef = MEMBER_MODELS.find(m => m.id === modelId);
    if (modelDef?.provider === "openrouter") {
      return await callOpenRouter(prompt, system, modelId, 400) || "...";
    }
    return await callGemini(prompt, system) || "...";
  };

  // messages, minutes, whiteboardFacts are passed explicitly (not captured from App state)
  const generateProposal = async (messages, minutes, whiteboardFacts) => {
    const recentChat = messages.slice(-6).map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `Based on the meeting discussion, formulate a clear, concise motion/proposal that the board should vote on. This should be 1-2 sentences that clearly state what is being decided. Be specific — reference the actual topic, not generic language.

Minutes: ${JSON.stringify(minutes)}
Whiteboard Facts: ${whiteboardFacts}
Recent Discussion:
${recentChat}

Output only the proposal text, nothing else.`;
    const result = await callGemini(prompt, "You are the Board Secretary. Write a formal motion/proposal for a board vote. Output only the proposal text.", 150);
    return result || "Motion to proceed as discussed.";
  };

  const runBatchVoteAgent = async (members, currentMinutes, facts, proposal = "", options = [], clarification = "") => {
    const memberList = members.map(m => `- ${m.role} (${m.name}): ${m.description}`).join('\n');
    const isMulti = options.length >= 2;
    const optionLabels = options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n');

    const prompt = `
      THE MOTION ON THE TABLE:
      "${proposal || 'General motion to proceed based on discussion.'}"

      ${isMulti ? `OPTIONS:\n${optionLabels}\n` : ''}
      ${clarification ? `CHAIR'S NOTE: "${clarification}"\n` : ''}
      Minutes: ${JSON.stringify(currentMinutes)}
      Facts: ${facts}
      Board Members:
      ${memberList}

      ${isMulti
        ? `Each member votes for ONE option (${options.map((_, i) => String.fromCharCode(65 + i)).join(', ')}) with a 5-word reason based on their personality and motivations.\n      Output purely JSON array: [{ "member": "Role", "vote": "A", "reason": "..." }, ...]`
        : `Each member votes YES or NO on the above motion with a 5-word reason based on their personality and motivations.\n      Output purely JSON array: [{ "member": "Role", "vote": "YES", "reason": "..." }, ...]`
      }
    `;
    const system = `You are running a board vote. Each member votes independently based on their unique personality. Output purely JSON array.`;
    const result = await callGemini(prompt, system, 600);
    if (result) {
      try {
        const arr = parseJsonArray(result);
        if (arr) return arr;
      } catch (e) { console.warn("Batch vote JSON failed"); }
    }
    return members.map(m => ({ member: m.role, vote: isMulti ? "A" : "ABSTAIN", reason: "Thinking..." }));
  };

  const runResolutionAgent = async (results, minutes, passed, options = null) => {
    const optionContext = options ? `\nOptions were: ${options.map((o, i) => `${String.fromCharCode(65 + i)}: ${o}`).join(', ')}` : '';
    const prompt = `Vote Passed: ${passed}${optionContext}\nVotes: ${JSON.stringify(results)}\nMinutes: ${JSON.stringify(minutes)}\nWrite 2 sentence resolution.`;
    return await callGemini(prompt, "You are the Secretary.") || "Resolution unavailable.";
  };

  const runResearchAgent = async (query) => {
    const prompt = `You are a research assistant for a boardroom meeting. A factual question came up that requires a real-world lookup.
Research query: "${query}"
Provide a concise 2-3 sentence answer with the most current data available. If time-sensitive, mention the approximate date. Report facts only — no editorializing.`;
    const result = await callGeminiWithSearch(prompt, 300);
    if (!result) return null;
    return { answer: result.text, sources: result.sources || [] };
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
        const adjustments = parseJsonArray(result);
        if (adjustments) {
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

  // boardMembers and whiteboardFacts are passed explicitly so this function stays pure.
  // context = { members?, whiteboard? } can override them (used by template modal).
  const runAIBuilderAgent = async (conversationHistory, context = {}, boardMembers = [], whiteboardFacts = "") => {
    const historyText = conversationHistory
      .map(m => {
        if (m.type === 'user-chat') return `User: ${m.text}`;
        if (m.type === 'ai-chat') return `AI: ${m.text}`;
        if (m.type === 'suggestions') return `AI previously suggested these roles: ${m.members?.map(mem => `${mem.role} (${mem.name})`).join(', ') || 'none'}.`;
        return null;
      })
      .filter(Boolean)
      .join('\n');

    const memberList = context.members ?? boardMembers;
    const existingRoles = memberList.map(m => m.role).join(', ');
    const whiteboardContent = (context.whiteboard ?? whiteboardFacts).trim() || "No whiteboard context provided.";

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
Based on the whiteboard context and the conversation history, decide:
1. If the user's latest message contains specific feedback, a request, or a direction (e.g. "add someone focused on X", "I want a skeptic", "no, focus on Y"), generate NEW suggestions that directly address what they said. Do NOT repeat the roles you already suggested.
2. If the conversation is empty or you genuinely need specific information to give useful suggestions, ask 1-2 targeted clarifying questions.
3. Otherwise, return 4-6 board member suggestions tailored to the project and any prior conversation.

RULES:
- Never suggest a role that already exists in the existing board members list.
- Each suggested member must have a distinct role, a realistic first name, and a rich multi-dimensional description.
- Stats: agreement (0-100) = how likely they agree by default. aggression (0-100) = how forcefully they push back.

DESCRIPTION REQUIREMENTS — each description must be 4-6 sentences covering ALL of:
1. Career background and domain expertise
2. Core motivation / what they are protecting or trying to achieve
3. Communication style and signature behaviors (e.g. "asks for data before committing", "uses humor to deflect")
4. A known blind spot or cognitive bias that will show up in discussions
5. How they behave under pressure or when their position is challenged

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
      "description": "4-6 sentences covering background, motivation, communication style, blind spot, and pressure behavior.",
      "stats": { "agreement": 50, "aggression": 35 }
    }
  ]
}
    `.trim();

    const systemInstruction = `You are an expert organizational psychologist and executive casting director. Your job is to understand a project from a whiteboard and create deeply realized, psychologically complex board member personas that will generate productive tension and diverse perspectives. You always respond with pure JSON only — no markdown, no explanation outside the JSON.`;

    const result = await callGemini(userPrompt, systemInstruction);
    if (!result) return null;

    try {
      const obj = parseJsonObject(result);
      if (obj) return obj;
    } catch (e) {
      console.warn("AI Builder JSON parse failed:", e);
    }
    return null;
  };

  return {
    runOrchestratorAgent,
    runBoardMemberAgent,
    generateProposal,
    runBatchVoteAgent,
    runResolutionAgent,
    runResearchAgent,
    runAlignmentAgent,
    runAIBuilderAgent,
  };
}
