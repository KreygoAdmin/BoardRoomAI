# Boardroom Simulator — User Guide

> **Version:** 1.2
> **Last Updated:** March 2026

---

## Table of Contents

1. [What Is Boardroom Simulator?](#1-what-is-boardroom-simulator)
2. [Getting Started](#2-getting-started) *(includes Templates)*
3. [The Interface](#3-the-interface)
4. [The Board Members](#4-the-board-members)
5. [Running a Meeting](#5-running-a-meeting)
6. [The Voting System](#6-the-voting-system)
7. [Auto-Mode (Continuous Debate)](#7-auto-mode-continuous-debate)
8. [Research Lookups](#8-research-lookups)
9. [Secretary's Minutes](#9-secretarys-minutes)
10. [Board Members Panel](#10-board-members-panel)
11. [The Whiteboard (Meeting Context)](#11-the-whiteboard-meeting-context)
12. [Customizing Board Members](#12-customizing-board-members)
13. [Per-Member AI Models](#13-per-member-ai-models)
14. [My Library (Personal Agent Storage)](#14-my-library-personal-agent-storage)
15. [The AI Builder](#15-the-ai-builder)
16. [The Agent Marketplace](#16-the-agent-marketplace)
17. [Managing Multiple Boards](#17-managing-multiple-boards)
18. [Token Usage Tracking](#18-token-usage-tracking)
19. [Plans & Limits](#19-plans--limits)
20. [Tips & Best Practices](#20-tips--best-practices)
21. [Troubleshooting](#21-troubleshooting)
22. [Glossary](#22-glossary)

---

## 1. What Is Boardroom Simulator?

Boardroom Simulator is an AI-powered application that simulates a corporate boardroom meeting. You present proposals, questions, or ideas to a virtual board of executives — each with a distinct personality, role, and perspective — and they debate, challenge, and ultimately vote on decisions.

**Use it to:**

- Stress-test a business idea before committing resources
- See how a proposal holds up against finance, legal, tech, marketing, and operations perspectives
- Practice pitching to a skeptical audience
- Explore the trade-offs of a decision through structured debate
- Generate meeting minutes, action items, and formal resolutions

Each board member is powered by an AI model of your choosing (Google Gemini by default, with support for Claude, GPT-4o, Llama, Mistral, and more via OpenRouter). An AI Orchestrator manages the flow: picking speakers, tracking consensus, triggering research, and calling votes when the time is right.

---

## 2. Getting Started

### 2.1 Create an Account

1. Open the app in your browser.
2. On the login screen, click **"New here? Create an Account"**.
3. Enter your email and a password, then click **Create Account**.
4. Check your email for a confirmation link and click it.
5. Sign in — you'll land directly in the boardroom setup.

### 2.2 Log In

Enter your email and password, then click **Sign In**.

If you've forgotten your password, click **Forgot Password?**, enter your email, and check your inbox for a reset link.

### 2.3 Your First Meeting

When you sign in for the first time, the **New Boardroom** setup opens automatically. Fill it in and click **Start Meeting** — you'll land in the boardroom ready to go.

1. **Choose a template** — pick one that matches your scenario (see [Section 2.4](#24-templates) below), or start with Blank Board.
2. **Set a meeting purpose** — describe what this meeting is about. The more specific, the better the debate.
3. **Review your board members** — the template pre-loads a relevant roster. Remove any members you don't want, or use the AI Builder tab to get custom suggestions.
4. **Click "Start Meeting"** — you're in.
5. **Type your proposal** in the input field and press Enter.
6. **Pick a speaker**, read their response, and keep the conversation going.
7. **Call a vote** when you're ready for a decision.

### 2.4 Templates

When creating a new boardroom, pick a starting template:

| Template | Best for |
|---|---|
| ⬜ Blank Board | General use — default CFO, CTO, CMO, Legal, COO |
| 🚀 Product Launch | Go/no-go decisions, launch timing, GTM strategy |
| 🚨 Crisis Management | PR incidents, data breaches, damage control |
| 🤝 M&A / Due Diligence | Acquisition evaluation, deal risk, integration planning |
| 💻 Tech Stack Decision | Platform choices, migrations, build vs. buy |
| 🌱 Startup Strategy | Early-stage prioritization, PMF, runway decisions |

Each template pre-loads a board of 5 executives specialized for that scenario and fills the whiteboard with a relevant starting structure. You can customize members and whiteboard content before starting.

---

## 3. The Interface

The app is split into two areas: a **left sidebar** and the **main stage**.

### 3.1 Left Sidebar

The sidebar contains all configuration and tracking panels. On mobile, tap the hamburger menu to open it.

From top to bottom:

| Section | Purpose |
|---------|---------|
| **Header** | App logo. Save and reset buttons. |
| **Board Name** | Editable name for the current boardroom. The **board switcher** button (list icon) sits inline to the right — click it to switch boards or create a new one. |
| **The Whiteboard** | Editable session context — project details, constraints, goals. All board members can reference this. |
| **Secretary's Minutes** | Auto-tracked meeting metrics: momentum, consensus, friction points, action items. |
| **Board Members** | Live view of each member's agreement score and AI model badge. Access the member editor from here. |
| **Profile Footer** | Your plan status, email, sign-out button, and upgrade option. |

Each section is collapsible — click the header to expand or collapse it.

### 3.2 Main Stage

This is where the meeting happens.

**Top Toolbar** (left to right):

| Button | What It Does |
|--------|--------------|
| **Menu** (mobile only) | Opens the sidebar |
| **Next Speaker** | Skip your turn — go straight to the next board member |
| **Auto: On/Off** | Toggle continuous conversation mode. Turning off also clears all processing state. |
| **Research: On/Off** | Toggle automatic fact-checking lookups |
| **Look It Up** | Manually trigger a research lookup on the current topic |
| **Call Vote** | Opens the Vote Setup modal to configure and run a formal board vote |
| **Message counter** | Shows messages used this month (e.g. `5 / 30`). Pioneer members see `Unlimited`. |
| **Token counter** | Shows your lifetime AI token usage (⚡ icon). Updates in real time. |

> **Keyboard shortcut:** Press **Escape** at any time to stop auto-mode and unstick the UI if something hangs.

**Chat Area:**

The conversation unfolds here. Messages are color-coded:

- **Your messages** — blue, right-aligned
- **Board member messages** — gray with colored avatar, left-aligned
- **Research results** — cyan box with sources
- **Vote results** — large gray box with tally and resolution
- **System alerts** — red box (interventions, errors)

**Speaker Picker:**

After you send a message, a picker appears showing the AI's recommended speaker and all available members. Click one to continue.

**Input Field:**

Type your message and press Enter or click the send button. The placeholder text changes based on the current state.

---

## 4. The Board Members

By default, your board has five executives:

### Marcus — Chief Financial Officer (CFO)
- **Personality:** Risk-averse, budget-conscious, obsessed with ROI
- **Tends to:** Challenge spending, demand financial projections, question unproven ideas
- **Starting Agreement:** 50% · **Aggression:** 20%

### Sarah — Chief Technology Officer (CTO)
- **Personality:** Tech-forward, excited about AI and modern architectures
- **Tends to:** Push for cutting-edge solutions, clash with the CFO on costs
- **Starting Agreement:** 60% · **Aggression:** 40%

### Priya — Legal Counsel
- **Personality:** Cautious, compliance-focused, concerned about liability
- **Tends to:** Flag regulatory risks, ask about contracts and data privacy
- **Starting Agreement:** 40% · **Aggression:** 10%

### David — Chief Marketing Officer (CMO)
- **Personality:** Excitable, brand-focused, loves virality and storytelling
- **Tends to:** Ignore technical constraints, push for bigger launches
- **Starting Agreement:** 70% · **Aggression:** 60%

### Alex — Chief Operating Officer (COO)
- **Personality:** Pragmatic, execution-focused, cares about logistics
- **Tends to:** Ask "how do we actually build this?", focus on timelines and resources
- **Starting Agreement:** 55% · **Aggression:** 30%

Each member has two core stats:

- **Agreement (0–100%)** — How aligned they are with the current direction. Higher = more likely to agree. This changes dynamically during the meeting.
- **Aggression (0–100%)** — How forcefully they push their position. Higher = more confrontational responses.

---

## 5. Running a Meeting

### 5.1 Present Your Case

Type a proposal, question, or idea in the input field. Examples:

- *"We should migrate to a serverless architecture to cut costs."*
- *"What's the best way to enter the European market?"*
- *"I want to spend $50K on influencer marketing this quarter."*

Press **Enter** or click the send button.

### 5.2 The Orchestrator Decides

Behind the scenes, an AI Orchestrator analyzes your message and determines:

- Which board member should speak next (based on relevance)
- What angle they should take
- Whether a research lookup is needed
- Whether a vote should be called

### 5.3 Pick a Speaker

The **Speaker Picker** appears, showing:

- The AI's **recommended speaker** (highlighted)
- All other board members as clickable options

You can accept the recommendation or override it. Want the CFO to respond to a tech question? Go for it.

### 5.4 Read and Respond

The chosen member responds in character (typically 3–5 sentences). You can then:

- **Type a reply** to continue the discussion
- **Click "Next Speaker"** to let another member respond without you typing
- **Turn on Auto-Mode** for continuous debate
- **Call a Vote** to formalize a decision

### 5.5 The Conversation Loop

A typical meeting flows like this:

```
You propose → AI picks speaker → You confirm → Member responds
    ↓
You reply → AI picks next speaker → You confirm → Member responds
    ↓
(repeat until ready for a vote or decision)
```

Every 3 messages, the **Alignment Agent** recalculates each member's agreement score based on how persuasive the arguments have been.

---

## 6. The Voting System

### 6.1 When Votes Happen

Votes can be triggered in two ways:

1. **You click "Call Vote"** — manually opens the Vote Setup modal at any time.
2. **The Orchestrator calls one** — automatically detects a deadlock (members going in circles) or a clear decision point (concrete proposal on the table). Instead of firing immediately, it opens the Vote Setup modal so you can review first.

### 6.2 The Vote Setup Modal

Before any vote runs, the **Vote Setup modal** appears. This gives you full control over the vote before it happens:

**Motion / Question**
The AI pre-fills a proposal based on the discussion. You can edit it freely — change the wording, sharpen the scope, or replace it entirely.

**Vote Type**
Choose between two modes:

- **Binary (Yes / No)** — Each member votes YES or NO. The motion passes if YES votes outnumber NO votes.
- **Multi-Option** — Each member votes for one of 2–4 named options. The option with the most votes wins.

**Options** *(Multi-Option mode only)*
Add 2–4 labeled options (A, B, C, D). Each option needs a description before the vote can run. Click **+ Add Option** to add more, or **×** to remove one.

**Clarification Note** *(optional)*
Add a note for the board before they vote — e.g., *"Focus on short-term cost implications"* or *"Assume a 6-month runway."* This is injected directly into the vote prompt so members factor it into their reasoning.

**Buttons**
- **Cancel** — Dismisses the modal. No vote is run.
- **Run Vote** — Executes the vote with your configured settings.

### 6.3 The Voting Process

Once you click **Run Vote**:

1. Each board member casts their vote with a 5-word reason based on their personality and the context.
2. Results are tallied and displayed in the chat.
3. A Secretary writes a formal 2-sentence resolution summarizing the outcome.
4. The Meeting Report modal opens with the full breakdown.

### 6.4 Binary Vote Results

```
PROPOSAL: Adopt Vendor X for AI infrastructure with a $100K
          12-month commitment.

Marcus (CFO):    NO  — "Budget constraints remain unresolved"
Sarah (CTO):     YES — "Best-in-class technology available"
Priya (Legal):   NO  — "Contract terms need review"
David (CMO):     YES — "Accelerates our product launch"
Alex (COO):      YES — "Streamlines engineering pipeline"

RESULT: VOTE PASSED (3-2)

RESOLUTION: The board approves the adoption of Vendor X for AI
infrastructure. Legal will review contract terms within two weeks
before final signature.
```

### 6.5 Multi-Option Vote Results

When running a multi-option vote, results show a **tally bar** per option with the winner highlighted in green:

```
MOTION: Which go-to-market approach should we pursue?

A. Direct sales team (enterprise)    ████████░░  3 votes  ✓ WINNER
B. Self-serve product-led growth     ████░░░░░░  2 votes
C. Channel partner program           ░░░░░░░░░░  0 votes

Marcus:  A — "Enterprise contracts ensure revenue stability"
Sarah:   B — "PLG scales without headcount investment"
Priya:   A — "Partner agreements add compliance risk"
David:   B — "PLG generates organic growth momentum"
Alex:    A — "Enterprise gives predictable pipeline"

RESULT: Option A Selected — "Direct sales team (enterprise)"
```

### 6.6 After a Vote

- Auto-Mode stops automatically when a vote is called.
- The resolution is added to the meeting minutes as an action item.
- You can continue the discussion or start a new topic.

---

## 7. Auto-Mode (Continuous Debate)

### 7.1 What It Does

Auto-Mode lets the board debate without your input. The Orchestrator picks speakers, rotates perspectives, and the conversation flows automatically.

### 7.2 How to Use It

1. Click **"Auto: On"** in the top toolbar.
2. The board begins debating the current topic.
3. Watch the conversation unfold — each member speaks in turn.

### 7.3 Rules

- **Max 20 turns** — Auto-Mode stops after 20 exchanges to prevent runaway conversations.
- **No repeat speakers** — The same member never speaks twice in a row.
- **2.5-second delay** between messages for readability.
- **Stops automatically** if the Orchestrator decides a vote is needed (opens Vote Setup modal).

### 7.4 Stopping Auto-Mode

There are two ways to stop auto-mode and regain control:

- **Click "Auto: Off"** — Toggles auto-mode off and clears all processing state (pending API calls, speaker picker, retry banners).
- **Press Escape** — Does the same thing from the keyboard. Also works outside of auto-mode if the UI is stuck on a processing step or speaker picker.

Both methods display a *"THE CHAIR INTERVENES"* alert in the chat and immediately return control to you.

---

## 8. Research Lookups

### 8.1 Automatic Research

When **Research: On** is toggled in the toolbar, the Orchestrator can automatically trigger fact-checking lookups when it detects the conversation needs real-world data.

Examples of when research triggers:

- *"What's the current market size for electric vehicles?"*
- *"What are the latest GDPR regulations?"*
- *"How much does AWS Lambda cost per invocation?"*

### 8.2 Manual Research

Click **"Look It Up"** to manually trigger a research lookup. The AI identifies the most pressing unanswered factual question in the discussion and looks it up.

### 8.3 Research Results

Research results appear as a cyan-highlighted box in the chat, showing:

- The **search query** that was used
- A **2–3 sentence answer** with current data
- **Source URLs** for verification

Board members can reference research results in their subsequent responses.

---

## 9. Secretary's Minutes

The Secretary automatically tracks four metrics throughout the meeting. Find them in the **Secretary's Minutes** section of the left sidebar.

### 9.1 Momentum

The overall direction and energy of the discussion.

Examples: *"Building — team aligning on serverless approach"*, *"Stalled — deadlock between CFO and CTO on budget"*

### 9.2 Consensus

Areas where members agree.

Example: *"CFO and COO aligned on the need for a phased rollout. CTO and CMO agree the product needs AI features."*

### 9.3 Friction Points

Active disagreements.

Example: *"CTO wants cutting-edge cloud-native stack; CFO insists on proven on-premise solutions. Legal concerned about data residency."*

### 9.4 Action Items

Decisions made, tasks assigned, and follow-ups needed.

Example:
- *"CTO to prepare serverless cost analysis by Friday"*
- *"Legal to review GDPR implications of cloud migration"*
- *"Board approved $50K pilot budget (Vote: 3-2)"*

Minutes update after every exchange via the Orchestrator and persist with your saved board.

---

## 10. Board Members Panel

The **Board Members** panel in the sidebar shows each member's current **agreement score** as a color-coded progress bar (0–100%), plus a small **model badge** showing which AI model powers that member.

### How Alignment Changes

Every 3 messages, the **Alignment Agent** evaluates the impact of recent arguments:

- Persuasive arguments **increase** agreement (+1 to +15 points)
- Unconvincing or threatening arguments **decrease** agreement (-1 to -15 points)
- Scores are clamped between 0% and 100%

### Reading the Alignment Panel

| Score Range | Meaning |
|-------------|---------|
| 0–25% | Strongly opposed — expect heavy pushback |
| 25–50% | Skeptical — needs convincing |
| 50–75% | Leaning positive — mostly on board |
| 75–100% | Strongly supportive — likely to vote YES |

Watch alignment shift in real time as you make your case. If the CFO's agreement drops to 20%, you know your financial argument isn't landing.

The model badge under each member's bar shows their assigned AI (e.g., "Gemini 2.0 Flash" in blue, or "Claude 3.5 Sonnet" in purple for OpenRouter models). See [Section 13](#13-per-member-ai-models) to change a member's model.

---

## 11. The Whiteboard (Meeting Context)

The Whiteboard is a freeform text area that sets the context for your meeting. All board members can reference it during discussion.

### 11.1 Editing the Whiteboard

1. Click the **edit icon** (pencil) in the Whiteboard section.
2. Modify the text.
3. Click the **save icon** (upload) to persist changes.
4. Click **X** to discard changes.

### 11.2 What to Put on the Whiteboard

```
Session Start: Mon, Feb 14, 2026 2:00 PM CST

Project: 'Project Nova'
Goal: Launch AI-powered customer support platform
Budget: $200,000
Timeline: Q3 2026
Target Market: Mid-size SaaS companies
Constraints:
  - Must comply with SOC 2 and GDPR
  - Team of 4 engineers available
  - Existing customers expect no downtime during migration
Key Question: Build in-house or buy a white-label solution?
```

The more context you provide, the more relevant and grounded the board's responses will be.

---

## 12. Customizing Board Members

### 12.1 Open the Member Editor

1. In the sidebar, find the **Board Members** section.
2. Click the **Edit** icon.
3. A modal opens showing all current members on the left.

### 12.2 Edit an Existing Member

Click any member's name in the left panel, then modify:

| Field | Description |
|-------|-------------|
| **Name** | The member's first name |
| **Role** | Job title (e.g., "Chief Revenue Officer") |
| **Avatar Color** | Choose from 7 colors: blue, purple, yellow, pink, green, red, gray |
| **AI Model** | The AI model this member uses when speaking — see [Section 13](#13-per-member-ai-models) |
| **System Instructions** | The full personality description — defines how they think, speak, and what they care about |

Click **Save** to apply changes.

### 12.3 Add a New Member

1. Click **"Add New Member"** at the bottom of the member list.
2. Fill in name, role, avatar color, AI model, and personality description.
3. Set initial **Agreement** and **Aggression** stats.
4. Click **Save**.

> **Free plan:** Limited to 3 board members total.
> **Pioneer plan:** Unlimited members.

### 12.4 Delete a Member

While editing a member, click **Delete**. The member is removed from the board immediately.

### 12.5 Save a Member to Your Library

While editing a member, click **"Save to Library"** (amber button in the editor footer). This saves a copy of the member to your personal library for reuse across boards. The member stays on your current board as well.

### 12.6 Reset to Defaults

Use the **Reset** button in the sidebar header to restore the original five board members (Marcus, Sarah, Priya, David, Alex).

---

## 13. Per-Member AI Models

Each board member has their own assigned AI model. When they speak during a meeting, their responses are generated by that specific model. This lets you mix models across the board — a Claude member debates differently from a Gemini member — and lets you swap out any member who isn't performing well.

### 13.1 Available Models

**Gemini (Google)**

| Model | Notes |
|-------|-------|
| Gemini 2.0 Flash | Default — fast and capable |
| Gemini 1.5 Pro | More thorough reasoning |

**OpenRouter models** *(require `VITE_OPENROUTER_API_KEY` to be set)*

| Model | Notes |
|-------|-------|
| Claude 3.5 Sonnet | Strong nuanced reasoning, excellent for legal/strategic roles |
| Claude 3 Haiku | Fast and concise |
| GPT-4o | Versatile, strong at structured arguments |
| GPT-4o Mini | Faster, lower cost |
| Llama 3.3 70B | Open-source, diverse perspective |
| Mistral Large | European perspective, good at logic-heavy roles |

### 13.2 Changing a Member's Model

1. Open the Member Editor (Board Members → Edit icon).
2. Click the member you want to change.
3. Use the **AI Model** dropdown to select a new model.
4. Click **Save**.

The model badge in the sidebar updates immediately. Blue badges = Gemini; purple badges = OpenRouter.

### 13.3 Why Use Different Models?

- **Diversity of voice** — Different models have genuinely different reasoning styles, producing more varied and interesting debate.
- **Fix a bad actor** — If one member keeps giving flat or repetitive responses, switch them to a different model.
- **Role matching** — Assign a model with strong analytical reasoning (e.g., Claude 3.5 Sonnet) to your Legal or CFO role, and a faster model to less critical seats.

---

## 14. My Library (Personal Agent Storage)

My Library is your personal collection of saved agents. Unlike the Marketplace (which is public), your library is private and only visible to you. Use it to build a reusable roster of agents you can deploy to any board.

### 14.1 How to Access

1. Open the Member Editor (Board Members → Edit).
2. Switch to the **My Library** tab (amber).

### 14.2 Save an Agent to Your Library

1. In the **Your Board** tab, select a member to edit.
2. Click **"Save to Library"** in the editor footer.
3. A copy is saved to your library. You can save the same agent multiple times if you want different versions.

> **Free plan:** Up to 5 saved agents.
> **Pioneer plan:** Unlimited.

### 14.3 Browse Your Library

Your saved agents appear as cards showing their role, name, avatar, and a description preview. Click any card to select it for editing.

### 14.4 Load a Library Agent onto Your Board

Click the **+** button on any card to add that agent to your current board. The same free-plan limits and role-conflict checks apply as when downloading from the Marketplace.

### 14.5 Edit a Library Agent

Click a card to open the edit form on the right. You can modify the name, role, avatar color, AI model, and system instructions. Click **"Save Changes"** to persist your edits.

### 14.6 Remove a Library Agent

Click the trash icon on a card, or click **"Delete"** in the edit form. You'll be asked to confirm before removal.

---

## 15. The AI Builder

The AI Builder is an intelligent assistant that suggests new board members tailored to your project.

### 15.1 How to Access

1. Open the Member Editor (Board Members → Edit).
2. Switch to the **AI Builder** tab.

### 15.2 How It Works

1. The AI Builder reads your **Whiteboard** and **conversation history**.
2. It may ask a clarifying question: *"What's the biggest challenge you're facing?"*
3. Answer the question and it generates **4–6 suggested members**, each with:
   - Name and role
   - **Rich 4–6 sentence personality description** covering:
     - Career background and domain expertise
     - Core motivation and what they're protecting
     - Communication style and signature behaviors
     - Known blind spots or cognitive biases
     - How they behave under pressure
   - Starting agreement and aggression stats
   - Avatar color

### 15.3 Adding Suggestions to Your Board

Click **"Add to Board"** on any suggestion. The member is added immediately (defaulting to Gemini 2.0 Flash) and can be further customized in the member editor, including changing their AI model.

### 15.4 Example

If your Whiteboard says *"Building an e-commerce platform for luxury goods"*, the AI Builder might suggest:

- **Elena** — Head of Brand & Luxury Experience
- **James** — Supply Chain Director
- **Nadia** — Chief Customer Officer
- **Tom** — Head of Digital Commerce

Each suggestion comes with a detailed backstory and personality profile, not just a one-liner.

---

## 16. The Agent Marketplace

The Marketplace lets users share and discover custom board members created by the community.

### 16.1 Browse the Marketplace

1. Open the Member Editor.
2. Switch to the **Marketplace** tab.
3. Browse available agents — each shows name, role, description, and download count.

### 16.2 Add a Marketplace Agent

Click **"Add to Board"** on any marketplace agent. It's copied to your board and can be customized, including changing the AI model.

### 16.3 Publish Your Own Agent

1. Open the Member Editor and select a member you've created.
2. Click **"Publish to Market"**.
3. Your agent becomes available to all users.

Published agents show a download counter so you can see how popular they are.

---

## 17. Managing Multiple Boards

### 17.1 The Board Switcher

The board switcher button (list icon) sits inline next to the **Board Name** field in the sidebar. Click it to expand a dropdown listing all your saved boards.

Each entry shows:
- Board name
- Last updated timestamp
- Delete option

### 17.2 Switch Boards

Click any board in the list to load it. All state is restored: members, messages, whiteboard, minutes, and settings.

### 17.3 Create a New Board

Click **"New Boardroom"** in the Board Switcher. The **New Boardroom** setup modal opens — choose a template, set your meeting purpose, customize members, and click **Start Meeting**. See [Section 2.4](#24-templates) for template descriptions.

> **Free plan:** 1 board only.
> **Pioneer plan:** Unlimited boards.

### 17.4 Delete a Board

Click the delete icon next to any board in the switcher. This is permanent.

### 17.5 Auto-Save

Your board auto-saves whenever any of the following change (2-second debounce):

- **Chat messages** — after every exchange
- **Board name** — as you type
- **Board members** — after edits or additions
- **Whiteboard content** — after edits

When auto-save fires, the save icon briefly shows a spinning indicator, followed by a *"Saved!"* banner. You can also click **Save** manually at any time.

> Auto-save only triggers for boards that already exist (have a board ID). The very first save of a new board happens when you send your first message.

---

## 18. Token Usage Tracking

The app tracks how many AI tokens you consume across all your meetings. This counter persists across sessions.

### 18.1 Where to Find It

In the **top toolbar** on the right side, next to the message counter. It shows a ⚡ icon followed by your lifetime total (e.g. `⚡ 12,450`).

### 18.2 How It Works

Every time the AI generates a response — board member speeches, research lookups, vote processing, orchestrator decisions — the token count from that API call is added to your total. The counter updates in real time as the meeting progresses.

> **Note:** Token tracking currently covers Gemini API calls only. Responses from OpenRouter models are not counted toward this total.

### 18.3 What Counts as Tokens

Tokens include both the input (your prompt, conversation context, system instructions) and the output (the AI's response). A typical board member response uses roughly 300–1,500 tokens depending on the complexity of the discussion.

---

## 19. Plans & Limits

### Free Plan

| Feature | Limit |
|---------|-------|
| Board members | 3 max |
| Messages per session | 30 max |
| Boards | 1 |
| Library agents | 5 max |
| Token tracking | Included |

### Pioneer Plan

| Feature | Limit |
|---------|-------|
| Board members | Unlimited |
| Messages | Unlimited |
| Boards | Unlimited |
| Library agents | Unlimited |
| Token tracking | Included |

### Upgrading

Click **"UPGRADE TO PIONEER"** in the profile footer (bottom of the sidebar). You'll be redirected to a Stripe checkout page. After payment, you're redirected back and your plan is upgraded immediately.

### Managing Your Subscription

Once upgraded, the button changes to **"PIONEER MEMBER"**. Clicking it opens the Stripe Customer Portal where you can:

- View your billing history
- Update your payment method
- Cancel your subscription

If you cancel, your Pioneer access remains active until the end of the current billing period. After that, your account reverts to the Free plan automatically.

---

## 20. Tips & Best Practices

### Writing Effective Proposals

- **Be specific.** *"We should adopt Stripe for payments"* gets better responses than *"We need a payment system."*
- **Include constraints.** Budget, timeline, team size — put them on the Whiteboard.
- **State the trade-off.** *"We can launch faster with a vendor but lose control of the stack."*

### Getting Better Debate

- **Override the speaker.** Don't always accept the AI's recommendation — picking an unexpected member can spark new angles.
- **Use Next Speaker** to let the board talk among themselves without your input.
- **Challenge members.** Reply with *"Marcus, how do you respond to Sarah's point about long-term savings?"*

### Managing Alignment

- Watch the **Board Alignment** panel. If a key member is dropping, address their concerns directly.
- Members with low agreement are more likely to vote NO. Persuade them before calling a vote.
- High-aggression members won't change their minds easily — frame arguments in terms they care about.

### Using the Voting System

- **Edit the proposal** in the Vote Setup modal before running the vote — the AI's generated motion is a starting point, not final.
- **Add a clarification note** to steer the vote without rewriting the motion: *"Assume budget approval is already secured."*
- **Use multi-option voting** when there are genuinely 3+ competing approaches — binary YES/NO often forces a false choice.
- Let the discussion develop before calling a vote. Members who are 50%+ agreement are more likely to vote YES.

### Choosing AI Models for Members

- Assign Claude 3.5 Sonnet or GPT-4o to roles that need careful, nuanced reasoning (Legal, CFO).
- Use faster models (Claude Haiku, GPT-4o Mini) for members with simpler, more reactive personalities.
- Mix models intentionally — a board where every member runs the same model tends to echo itself.

### Using Research Effectively

- Turn on **auto-research** when discussing topics that need current data (pricing, regulations, market sizes).
- Turn it off for purely strategic or opinion-based discussions to keep things moving.
- Use **"Look It Up"** for a one-time check without enabling auto-research permanently.

### Auto-Mode Strategies

- Let Auto-Mode run to **surface disagreements** you hadn't considered.
- Press **Escape** or click **"Auto: Off"** to **redirect** when the conversation drifts.
- Auto-Mode is great for the **middle** of a meeting — let members hash it out, then step in for the conclusion.

### Whiteboard Best Practices

- Update the Whiteboard **before** starting discussion — it grounds every response.
- Add new constraints **during** the meeting as they emerge.
- Include the **key question** you want the board to resolve.

---

## 21. Troubleshooting

### "The Board is overwhelmed (Rate Limit)"

You've hit the API rate limit. Wait 30–60 seconds and try again. The app retries automatically with exponential backoff.

### Board members give generic responses

Your Whiteboard is probably too vague. Add specific project details, constraints, and goals. The more context you provide, the more targeted the responses. You can also try switching that member to a more capable model (Claude 3.5 Sonnet or GPT-4o).

### An OpenRouter member isn't responding

Ensure the `VITE_OPENROUTER_API_KEY` environment variable is set on the server. Without it, OpenRouter models will silently fail and the member will show `"..."` as their response. Contact your administrator if you don't have access to set environment variables.

### A member keeps getting picked

The Orchestrator picks based on relevance. If discussions consistently fall in one domain (e.g., budget), the CFO will keep getting picked. Broaden the topic or manually override the speaker.

### Auto-Mode stopped unexpectedly

Auto-Mode stops after:
- 20 turns (max limit)
- A vote is called (Vote Setup modal opens)
- You click "Auto: Off" or press Escape
- A rate limit error occurs

### Can't create a new board

New boards require the **Pioneer plan**. Free accounts are limited to 1 board.

### "Invalid API Key" error

The system API key may be misconfigured. Contact your administrator to verify the Gemini API key is valid and has not expired.

### Messages aren't saving

Check your internet connection — the app requires a connection to Supabase for persistence. Try clicking **Save** manually. If the issue persists, your session may have expired — sign out and back in.

### Login/password issues

Use the **Forgot Password** link on the login screen. A reset email will be sent to your registered address.

---

## 22. Glossary

| Term | Definition |
|------|------------|
| **Agreement** | A member's alignment score (0–100%) indicating how much they support the current direction |
| **Aggression** | How forcefully a member pushes their position (0–100%) |
| **AI Model** | The specific AI (Gemini, Claude, GPT-4o, etc.) assigned to a board member for generating their responses |
| **Auto-Mode** | Continuous conversation mode where the board debates without user input |
| **Binary Vote** | A YES/NO vote on a single motion — passes if YES outnumbers NO |
| **Board** | A saved boardroom session including members, conversation, whiteboard, and minutes |
| **Board Switcher** | The list icon next to the board name that opens a dropdown of all saved boards |
| **Briefing** | Instructions the Orchestrator gives to the next speaker about what angle to take |
| **Clarification Note** | An optional note added in the Vote Setup modal, injected into the vote prompt to guide member reasoning |
| **Escape (key)** | Keyboard shortcut that stops auto-mode, clears processing, and returns control to you |
| **Friction** | Points of disagreement tracked in the meeting minutes |
| **Marketplace** | Public library of community-created board members |
| **Model Badge** | The small colored tag on each member's sidebar card showing their assigned AI model |
| **Multi-Option Vote** | A vote with 2–4 labeled options; each member picks one, and the most-voted option wins |
| **My Library** | Your private collection of saved agent templates, reusable across boards |
| **Minutes** | Automatically tracked meeting metrics: momentum, consensus, friction, action items |
| **OpenRouter** | A routing service that provides access to Claude, GPT-4o, Llama, Mistral, and other models via a unified API |
| **Orchestrator** | The AI agent that manages meeting flow — picks speakers, triggers research, calls votes |
| **Pioneer** | The paid plan tier with unlimited features |
| **Resolution** | The formal outcome statement written after a vote |
| **Speaker Picker** | The UI that appears after your message, letting you choose who responds |
| **Tokens Used** | Running counter of AI tokens consumed across all meetings, displayed in the top toolbar |
| **Vote Setup Modal** | The modal that appears before any vote runs, letting you review and edit the motion, choose vote type, add options, and add a clarification note |
| **Whiteboard** | Freeform text defining the meeting context — project details, constraints, goals |

---

*Built with React, Google Gemini AI, Supabase, and OpenRouter.*
