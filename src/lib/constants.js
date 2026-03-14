// --- Plan Limits ---
export const FREE_PLAN_MEMBER_LIMIT = 3;
export const FREE_PLAN_MESSAGE_LIMIT = 30;
export const FREE_PLAN_LIBRARY_LIMIT = 5;
export const PRO_PLAN_MEMBER_LIMIT = 10;
export const PRO_PLAN_MESSAGE_LIMIT = 500;
export const PRO_PLAN_LIBRARY_LIMIT = 25;
export const PRO_PLAN_BOARDROOM_LIMIT = 5;
export const AUTO_MODE_TURN_LIMIT = 20;

// --- API Retry Config ---
export const MAX_RETRIES = 3;
export const BASE_DELAY = 2000;
export const AUTO_LOOP_DELAY = 800;

// --- External URLs ---
export const STRIPE_BASE_URL = "https://buy.stripe.com/cNi4gybECaEi17N0or0Jq00"; // Pioneer
export const STRIPE_PRO_URL = "https://buy.stripe.com/8x27sK0ZY3bQ9Ejefh0Jq02"; // Pro
export const WEBHOOK_SERVER_URL = "https://api.kreygo.com";

// --- Default Values ---
export const DEFAULT_MINUTES = {
  consensus: "None yet.",
  friction: "None yet.",
  momentum: "Neutral",
  actionItems: []
};

// --- Date Formatter (America/Chicago) ---
export function formatCST(date = new Date()) {
  return date.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// --- Available LLM Models ---
export const MEMBER_MODELS = [
  { id: "gemini-2.0-flash",                  label: "Gemini 2.0 Flash (default)", provider: "gemini" },
  { id: "gemini-1.5-pro",                    label: "Gemini 1.5 Pro",             provider: "gemini" },
  { id: "anthropic/claude-3.5-sonnet",       label: "Claude 3.5 Sonnet",          provider: "openrouter" },
  { id: "anthropic/claude-3-haiku",          label: "Claude 3 Haiku (fast)",      provider: "openrouter" },
  { id: "openai/gpt-4o",                     label: "GPT-4o",                     provider: "openrouter" },
  { id: "openai/gpt-4o-mini",               label: "GPT-4o Mini (fast)",         provider: "openrouter" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B",             provider: "openrouter" },
  { id: "mistralai/mistral-large",           label: "Mistral Large",              provider: "openrouter" },
  { id: "deepseek/deepseek-chat",            label: "DeepSeek V3",                provider: "openrouter" },
  { id: "deepseek/deepseek-r1",              label: "DeepSeek R1 (Reasoner)",     provider: "openrouter" },
];

// --- Role Definitions (for tooltips) ---
export const ROLE_DEFINITIONS = {
  CEO:  "Chief Executive Officer — sets overall direction and has final authority on major decisions.",
  CFO:  "Chief Financial Officer — owns the budget, cash flow, and financial risk.",
  CTO:  "Chief Technology Officer — leads the technical vision and engineering strategy.",
  COO:  "Chief Operating Officer — translates strategy into execution and manages day-to-day operations.",
  CMO:  "Chief Marketing Officer — drives brand, demand generation, and customer acquisition.",
  CPO:  "Chief Product Officer — owns the product roadmap and user experience strategy.",
  CISO: "Chief Information Security Officer — owns security posture, compliance, and risk management.",
  Legal: "General Counsel / Legal — manages regulatory compliance, contracts, and liability.",
  "PR / Comms": "Public Relations / Communications — manages media relations, messaging, and reputation.",
  Strategy: "Strategy Lead — evaluates competitive positioning, market opportunities, and long-term bets.",
  "Integration Lead": "Integration Lead — oversees the operational and technical merging of acquired entities.",
  "Engineering Lead": "Engineering Lead — represents the engineering team on feasibility, timelines, and tech debt.",
  "Head of Growth": "Head of Growth — focuses on acquisition channels, retention loops, and path to product-market fit.",
  Finance: "Finance Lead — tracks burn rate, runway, and unit economics.",
  Advisor: "External Advisor — brings outside perspective, industry experience, and unfiltered honesty.",
};

// --- Voice gender classification ---
const FEMALE_NAMES = new Set([
  'aaliyah','abby','abigail','ada','adeline','adriana','agnes','aigerim','aisha','alana',
  'alejandra','alessandra','alexa','alexandra','alexia','alexis','alice','alicia','alina',
  'alison','allison','allyson','alma','alondra','alva','amalia','amanda','amara','amaya',
  'amber','amelia','ami','amina','amy','ana','anastasia','andrea','angel','angela','angelica',
  'angie','anita','ann','anna','annabelle','anne','annette','annie','antonia','april','aria',
  'ariana','arianna','ariel','arielle','ashley','asia','astrid','audrey','aurora','autumn',
  'ava','avery','ayasha','ayesha','barbara','beatrice','beatriz','bella','bernadette','beth',
  'bethany','betty','bianca','bonnie','brenda','brianna','bridget','brittany','brooke',
  'caitlin','camille','candice','cara','carina','carla','carlee','carmen','carol','carolina',
  'caroline','carolyn','cassandra','cassidy','catalina','catherine','cecelia','cecilia',
  'celeste','celine','charlotte','chelsea','cheryl','chloe','christa','christia','christina',
  'christine','cindy','claire','clara','claudia','colette','connie','constance','corinne',
  'courtney','crystal','daisy','dana','daniela','danielle','daphne','dawn','deborah','delaney',
  'diana','diane','dominique','dorothy','elena','eliana','elisa','elise','eliza','elizabeth',
  'ella','ellie','elsa','emily','emma','erika','erin','esmeralda','eva','eve','evelyn',
  'fatima','felicia','fernanda','fiona','frances','francesca','freya','gabriela','gabrielle',
  'gina','grace','gracie','greta','gwendolyn','hailey','hannah','harper','heather','heidi',
  'helen','holly','ingrid','isabella','isabelle','ivy','jade','jane','jasmine','jennifer',
  'jessica','jillian','joanna','jocelyn','jordan','josefina','josephine','joy','julia',
  'juliana','julianna','june','kaitlyn','karen','karina','kate','katelyn','katherine',
  'kathleen','kathryn','katie','kayla','kaylee','kelly','kennedy','kim','kimberly','krista',
  'kristin','lana','laura','lauren','layla','leah','leila','lexi','lia','lila','lily',
  'linda','lisa','lola','lorena','lori','lucia','lucy','luna','lydia','madeleine','madeline',
  'madison','maggie','makayla','mallory','maria','mariana','marisol','mary','maya','megan',
  'mei','melissa','mia','micaela','michelle','mikaela','miranda','miriam','molly','monica',
  'morgan','nadia','naomi','natalie','natasha','nicole','nina','nora','nour','olivia',
  'paige','pamela','patricia','paula','payton','penelope','phoebe','priya','rachel','reagan',
  'rebecca','regina','renata','riley','robin','rosa','rosie','ruby','sabrina','samantha',
  'sandra','sara','sarah','savannah','scarlett','selena','shannon','sierra','simone',
  'sky','skylar','sofia','sonja','sophia','sophie','stacy','stella','stephanie','susan',
  'tess','tessa','tiffany','tina','vanessa','veronica','victoria','violet','virginia',
  'vivian','wendy','whitney','zoe','zoey',
]);

const MALE_NAMES = new Set([
  'aaron','adam','adrian','alejandro','alex','alexander','alexei','alfred','ali','alonso',
  'amir','andre','andres','andrew','andy','angel','anthony','antonio','archer','arjun',
  'arthur','austin','axel','ben','benjamin','bernard','blake','brad','bradley','brandon',
  'brian','bruce','bryan','caden','caleb','cameron','carlos','chad','charles','charlie',
  'chris','christian','christopher','cole','colin','conner','connor','cory','craig','daniel',
  'david','derek','devin','diego','dominic','donovan','drew','dustin','dylan','edgar',
  'edward','eli','elijah','eric','ethan','evan','ezra','felix','fernando','finn','francisco',
  'frank','franklin','freddie','gabriel','gavin','george','giovanni','gordon','grant','greg',
  'henry','hiro','hugo','ian','isaac','isaiah','ivan','jack','jackson','jacob','jake',
  'james','jared','jason','javier','jay','jeff','jesse','john','jonathan','jordan','jorge',
  'jose','joseph','josh','joshua','julian','justin','kai','kevin','kwame','kyle','liam',
  'logan','luca','lucas','luis','marcus','mark','mason','matthew','max','michael','miguel',
  'morgan','nathan','nicholas','nick','nicolai','noah','noel','oliver','omar','oscar',
  'owen','parker','patrick','paul','peter','pete','phillip','rafael','raj','raymond',
  'reuben','richard','riley','rob','robert','roberto','robin','rodrigo','ryan','samuel',
  'sanjay','scott','sean','sebastien','simon','stefan','stephen','steve','steven','taylor',
  'thomas','tim','timothy','tobi','tobias','tom','tommy','trevor','tristan','tyler','victor',
  'vincent','walter','william','wyatt','xavier','zachary','zach','ollie',
]);

/**
 * Given a first name (or full name), returns a voice_id from MEMBER_VOICES that
 * matches the inferred gender. Falls back to a random non-empty voice if unknown.
 */
export function getVoiceForName(name) {
  const firstName = (name || '').split(/\s+/)[0].toLowerCase();
  const femaleVoices = MEMBER_VOICES.filter(v => v.id && /alexandra|eryn|ellen/i.test(v.label));
  const maleVoices   = MEMBER_VOICES.filter(v => v.id && !/alexandra|eryn|ellen/i.test(v.label));

  let pool;
  if (FEMALE_NAMES.has(firstName)) pool = femaleVoices;
  else if (MALE_NAMES.has(firstName)) pool = maleVoices;
  else pool = [...maleVoices, ...femaleVoices]; // unknown — any voice

  // Never fall back to "" (web speech) — use Jason as the guaranteed fallback
  return pool[Math.floor(Math.random() * pool.length)]?.id || '3sfGn775ryaDXhFWHwBg';
}

// --- ElevenLabs Voice Presets ---
// id = ElevenLabs voice_id; label = display name
export const MEMBER_VOICES = [
  { id: "",                       label: "None" },
  { id: "Fahco4VZzobUeiPqni1S",  label: "Archer — Conversational (Latin American Spanish)" },
  { id: "jRAAK67SEFE9m7ci5DhD",  label: "Ollie — Natural & Relaxed British (Brazilian Portuguese)" },
  { id: "1SM7GgM6IMuvQlz2BwM3",  label: "Mark — Casual, Relaxed and Light (Modern Arabic)" },
  { id: "kdmDKE6EkgrWrrykO9Qt",  label: "Alexandra — Conversational and Natural (Filipino)" },
  { id: "DXFkLCBUTmvXpp2QwZjA",  label: "Eryn — Friendly AI Assistant" },
  { id: "BIvP0GN1cAtSRTxNHnWS",  label: "Ellen — Serious, Direct and Confident" },
  { id: "s3TPKV1kjDlVtZbl4Ksh",  label: "Adam — Engaging, Friendly and Bright" },
  { id: "3sfGn775ryaDXhFWHwBg",  label: "Jason — Warm, Confident and Natural" },
  { id: "ChO6kqkVouUn0s7HMunx",  label: "Pete — Unhurried and Casual" },
  { id: "goT3UYdM9bhm0n2lmKQx",  label: "Edward — British, Dark, Seductive, Low" },
  { id: "GsfuR3Wo2BACoxELWyEF",  label: "Cooper — Nervous, Dramatic and Timid" },
  { id: "nzeAacJi50IvxcyDnMXa",  label: "Marshal — Friendly, Funny Professor" },
  { id: "2gPFXx8pN3Avh27Dw5Ma",  label: "Oxley — Evil, Mature and Ominous" },
  { id: "kPzsL2i3teMYv0FxEYQ6",  label: "Brittney — Social Media Voice, Fun, Youthful & Informative" },
  { id: "q0IMILNRPxOgtBTS4taI",  label: "Drew — Casual, Curious & Fun" },
  { id: "m8ysB8KEJV5BeYQnOtWN",  label: "Noor — Expressive, Sassy and Humoristic" },
];

// --- Default Board Members ---
export const DEFAULT_BOARD = [
  {
    id: 'cfo',
    name: 'Marcus',
    role: 'CFO',
    avatar: 'bg-blue-600',
    description: 'Risk-averse, focused on ROI, budget constraints, and fiscal responsibility. Skeptical of new spending.',
    stats: { agreement: 50, aggression: 20 },
    model: 'openai/gpt-4o',
    voice_id: 'ChO6kqkVouUn0s7HMunx'  // Pete — Unhurried and Casual
  },
  {
    id: 'cto',
    name: 'Sarah',
    role: 'CTO',
    avatar: 'bg-purple-600',
    description: 'Tech-forward, obsessed with scalability, AI, and modern stacks. Dislikes legacy systems. Often clashes with CFO.',
    stats: { agreement: 60, aggression: 40 },
    model: 'anthropic/claude-3.5-sonnet',
    voice_id: 'm8ysB8KEJV5BeYQnOtWN'  // Noor — Expressive, Sassy and Humoristic
  },
  {
    id: 'legal',
    name: 'Priya',
    role: 'Legal',
    avatar: 'bg-yellow-600',
    description: 'Cautious, focused on compliance, liability, and regulation. The "no" person if things get risky.',
    stats: { agreement: 40, aggression: 10 },
    model: 'mistralai/mistral-large',
    voice_id: 'BIvP0GN1cAtSRTxNHnWS'  // Ellen — Serious, Direct and Confident
  },
  {
    id: 'cmo',
    name: 'David',
    role: 'CMO',
    avatar: 'bg-pink-600',
    description: 'Excitable, focused on brand image, virality, and user perception. Often ignores technical constraints.',
    stats: { agreement: 70, aggression: 60 },
    model: 'gemini-1.5-pro',
    voice_id: 's3TPKV1kjDlVtZbl4Ksh'  // Adam — Engaging, Friendly and Bright
  },
  {
    id: 'coo',
    name: 'Alex',
    role: 'COO',
    avatar: 'bg-green-600',
    description: 'Pragmatic, focused on execution, logistics, and operational efficiency. Cares about "how" we actually build it, not just the vision.',
    stats: { agreement: 55, aggression: 30 },
    model: 'meta-llama/llama-3.3-70b-instruct',
    voice_id: '1SM7GgM6IMuvQlz2BwM3'  // Mark — Casual, Relaxed and Light
  }
];

// --- Board Templates ---
export const BOARD_TEMPLATES = [
  {
    id: 'blank',
    icon: '⬜',
    name: 'Blank Board',
    description: 'Start fresh. You configure everything — members, whiteboard, and agenda.',
    suggestedPurpose: '',
    members: DEFAULT_BOARD,
    whiteboard: (timeStr) =>
      `Session Start: ${timeStr} CST\n\nProject: 'New Project'\nGoal: TBD\nBudget: TBD\nTimeline: TBD`,
    suggestedPrompts: [
      "Let's kick things off — what's the first item on the agenda?",
      "What's the single biggest risk we need to address today?",
      "Walk me through where we stand on the core initiative."
    ]
  },
  {
    id: 'product-launch',
    icon: '🚀',
    name: 'Product Launch',
    description: 'Marketing, Product, Tech, Legal, and Finance debate launch strategy, timing, and budget.',
    suggestedPurpose: 'We are 3 months from launch and need to finalize our go-to-market strategy, align on timing, and get sign-off on the launch budget.',
    members: [
      { id: 'cpo-pl', name: 'Jordan', role: 'CPO', avatar: 'bg-indigo-600',
        description: 'Visionary product leader. Focused on user value, roadmap prioritization, and shipping on time. Pushes back on scope creep.',
        stats: { agreement: 65, aggression: 45 }, model: 'anthropic/claude-3.5-sonnet', voice_id: 'q0IMILNRPxOgtBTS4taI' }, // Drew — Casual, Curious & Fun
      { id: 'cmo-pl', name: 'Priya', role: 'CMO', avatar: 'bg-pink-600',
        description: 'Brand-obsessed marketing exec. Cares about narrative, positioning, and viral momentum. Will fight hard for launch timing.',
        stats: { agreement: 70, aggression: 55 }, model: 'openai/gpt-4o', voice_id: 'kPzsL2i3teMYv0FxEYQ6' }, // Brittney — Social Media Voice, Fun, Youthful
      { id: 'cto-pl', name: 'Marcus', role: 'CTO', avatar: 'bg-purple-600',
        description: 'Pragmatic engineer. Warns about technical debt, scalability, and realistic timelines. Resists overpromising.',
        stats: { agreement: 50, aggression: 35 }, model: 'gemini-1.5-pro', voice_id: 'ChO6kqkVouUn0s7HMunx' }, // Pete — Unhurried and Casual
      { id: 'legal-pl', name: 'Sandra', role: 'Legal', avatar: 'bg-yellow-600',
        description: 'Risk-averse counsel. Flags IP, compliance, and liability concerns. Will block the launch if terms of service issues are unresolved.',
        stats: { agreement: 40, aggression: 15 }, model: 'deepseek/deepseek-chat', voice_id: 'BIvP0GN1cAtSRTxNHnWS' }, // Ellen — Serious, Direct and Confident
      { id: 'cfo-pl', name: 'Derek', role: 'CFO', avatar: 'bg-blue-600',
        description: "Numbers-first CFO. Scrutinizes CAC, LTV, launch spend, and break-even. Skeptical of marketing's budget requests.",
        stats: { agreement: 45, aggression: 25 }, model: 'meta-llama/llama-3.3-70b-instruct', voice_id: 'goT3UYdM9bhm0n2lmKQx' }, // Edward — British, Dark, Seductive, Low
    ],
    whiteboard: (timeStr) =>
      `Session Start: ${timeStr} CST\n\nProduct: [Product Name]\nTarget Launch Date: [Date]\nTarget Market: [Segment]\nLaunch Budget: $[Amount]\nKey Risk: [e.g. competitor, timing, readiness]\n\nGoal: Align on go/no-go decision and finalize launch playbook.`,
    suggestedPrompts: [
      "Are we actually ready to launch next quarter, or are we setting ourselves up to fail publicly?",
      "Walk me through the go-to-market strategy — who is our ICP and how do we reach them in the first 30 days?",
      "What's the single biggest risk that could derail this launch, and what's our mitigation plan?"
    ]
  },
  {
    id: 'crisis',
    icon: '🚨',
    name: 'Crisis Management',
    description: 'Legal, PR/Comms, CEO, CFO, and COO respond to a breaking crisis scenario.',
    suggestedPurpose: 'A major incident has just broken publicly and we need to align immediately on our response, public statement, and containment strategy.',
    members: [
      { id: 'ceo-cr', name: 'Victoria', role: 'CEO', avatar: 'bg-red-600',
        description: 'Crisis-seasoned CEO. Focused on protecting the company reputation, employees, and stakeholders. Will make the hard call under pressure.',
        stats: { agreement: 55, aggression: 60 }, model: 'openai/gpt-4o', voice_id: 'BIvP0GN1cAtSRTxNHnWS' }, // Ellen — Serious, Direct and Confident
      { id: 'legal-cr', name: 'Patrick', role: 'Legal', avatar: 'bg-yellow-600',
        description: 'Crisis legal counsel. Focused on liability, disclosure obligations, and what can and cannot be said publicly. Very cautious.',
        stats: { agreement: 35, aggression: 20 }, model: 'mistralai/mistral-large', voice_id: 'GsfuR3Wo2BACoxELWyEF' }, // Cooper — Nervous, Dramatic and Timid
      { id: 'pr-cr', name: 'Aaliyah', role: 'PR / Comms', avatar: 'bg-pink-600',
        description: 'Veteran communications director. Knows the press, social media cycles, and how a story snowballs. Pushes for fast, transparent messaging.',
        stats: { agreement: 60, aggression: 50 }, model: 'anthropic/claude-3.5-sonnet', voice_id: 'm8ysB8KEJV5BeYQnOtWN' }, // Noor — Expressive, Sassy and Humoristic
      { id: 'cfo-cr', name: 'Raymond', role: 'CFO', avatar: 'bg-blue-600',
        description: "Financially conservative CFO. Worried about settlement costs, insurance exposure, and impact on next quarter's guidance.",
        stats: { agreement: 45, aggression: 30 }, model: 'gemini-1.5-pro', voice_id: 'ChO6kqkVouUn0s7HMunx' }, // Pete — Unhurried and Casual
      { id: 'coo-cr', name: 'Elena', role: 'COO', avatar: 'bg-green-600',
        description: 'Operations-focused COO. Concerned with business continuity, team morale, and immediate operational response steps.',
        stats: { agreement: 58, aggression: 35 }, model: 'meta-llama/llama-3.3-70b-instruct', voice_id: 'kdmDKE6EkgrWrrykO9Qt' }, // Alexandra — Conversational and Natural
    ],
    whiteboard: (timeStr) =>
      `Session Start: ${timeStr} CST\n\nCRISIS BRIEF:\nIncident: [Describe the crisis — data breach, PR scandal, product recall, etc.]\nDiscovered: [When / How]\nCurrent Exposure: [Media, regulatory, financial]\nAffected Parties: [Customers, employees, investors]\n\nImmediate Goals:\n1. Contain damage\n2. Align on public statement\n3. Determine regulatory disclosure obligations`,
    suggestedPrompts: [
      "We have 2 hours before this goes public. What do we say, and who says it?",
      "Legal, what can and cannot be disclosed right now? I need a clear line.",
      "What's our containment strategy for the next 24 hours — step by step?"
    ]
  },
  {
    id: 'ma-due-diligence',
    icon: '🤝',
    name: 'M&A / Due Diligence',
    description: 'CFO, Legal, Strategy, Integration Lead, and CEO evaluate a potential acquisition target.',
    suggestedPurpose: 'We are evaluating a potential acquisition and need to assess the financials, legal risk, integration complexity, and whether the deal price is justified.',
    members: [
      { id: 'ceo-ma', name: 'Franklin', role: 'CEO', avatar: 'bg-red-600',
        description: "Deal-hungry CEO. Sees the strategic vision clearly but needs the team to validate the risks and ensure integration is executable.",
        stats: { agreement: 70, aggression: 50 }, model: 'anthropic/claude-3.5-sonnet', voice_id: 's3TPKV1kjDlVtZbl4Ksh' }, // Adam — Engaging, Friendly and Bright
      { id: 'cfo-ma', name: 'Ingrid', role: 'CFO', avatar: 'bg-blue-600',
        description: "Forensic CFO. Will tear apart the target's financials, valuation assumptions, and earnout structure. Nothing gets past her.",
        stats: { agreement: 40, aggression: 45 }, model: 'openai/gpt-4o', voice_id: 'BIvP0GN1cAtSRTxNHnWS' }, // Ellen — Serious, Direct and Confident
      { id: 'legal-ma', name: 'Kwame', role: 'Legal', avatar: 'bg-yellow-600',
        description: 'M&A counsel. Focused on reps & warranties, IP ownership, pending litigation, and regulatory approvals needed to close the deal.',
        stats: { agreement: 45, aggression: 20 }, model: 'deepseek/deepseek-r1', voice_id: 'jRAAK67SEFE9m7ci5DhD' }, // Ollie — Natural & Relaxed British
      { id: 'strategy-ma', name: 'Mei', role: 'Strategy', avatar: 'bg-purple-600',
        description: 'Corporate strategy lead. Evaluates market fit, competitive moat, synergy projections, and whether this is the right target at the right time.',
        stats: { agreement: 60, aggression: 40 }, model: 'mistralai/mistral-large', voice_id: 'DXFkLCBUTmvXpp2QwZjA' }, // Eryn — Friendly AI Assistant
      { id: 'integration-ma', name: 'Carlos', role: 'Integration Lead', avatar: 'bg-green-600',
        description: 'Veteran integration executive. Has seen failed mergers. Will challenge optimistic synergy assumptions and flag culture/tech stack conflicts.',
        stats: { agreement: 50, aggression: 35 }, model: 'gemini-1.5-pro', voice_id: 'Fahco4VZzobUeiPqni1S' }, // Archer — Conversational (Latin American Spanish)
    ],
    whiteboard: (timeStr) =>
      `Session Start: ${timeStr} CST\n\nTARGET COMPANY: [Name]\nAsking Price / Valuation: $[Amount]\nRevenue (TTM): $[Amount]\nDeal Rationale: [Strategic fit, technology, talent, market share]\nKnown Risks: [e.g. customer concentration, pending litigation]\n\nDue Diligence Focus Areas:\n- Financials & clean room\n- IP & tech stack\n- Regulatory clearance\n- Integration complexity`,
    suggestedPrompts: [
      "Walk me through the valuation — are we overpaying, and what does the comp set look like?",
      "What are the top 3 deal-breakers that would cause us to walk away from this acquisition?",
      "If this closes, what does Year 1 integration look like and what's the realistic synergy timeline?"
    ]
  },
  {
    id: 'tech-stack',
    icon: '💻',
    name: 'Tech Stack Decision',
    description: 'CTO, CISO, COO, CFO, and Engineering Lead evaluate a major technology platform decision.',
    suggestedPurpose: 'We need to decide on our core technology platform for the next 3 years and align on which option best balances cost, security, and developer productivity.',
    members: [
      { id: 'cto-ts', name: 'Sanjay', role: 'CTO', avatar: 'bg-purple-600',
        description: 'Forward-thinking CTO. Pushes for modern, scalable architectures. Excited about the right tech choice and frustrated by legacy constraints.',
        stats: { agreement: 65, aggression: 50 }, model: 'anthropic/claude-3.5-sonnet', voice_id: 'nzeAacJi50IvxcyDnMXa' }, // Marshal — Friendly, Funny Professor
      { id: 'ciso-ts', name: 'Renata', role: 'CISO', avatar: 'bg-red-600',
        description: 'Security-first CISO. Will not approve any platform with unresolved vulnerabilities, unclear data residency, or weak access controls.',
        stats: { agreement: 40, aggression: 30 }, model: 'openai/gpt-4o', voice_id: 'BIvP0GN1cAtSRTxNHnWS' }, // Ellen — Serious, Direct and Confident
      { id: 'coo-ts', name: 'James', role: 'COO', avatar: 'bg-green-600',
        description: 'Operationally-minded COO. Cares about uptime, vendor SLAs, migration risk, and how this affects teams mid-execution.',
        stats: { agreement: 55, aggression: 30 }, model: 'meta-llama/llama-3.3-70b-instruct', voice_id: 'ChO6kqkVouUn0s7HMunx' }, // Pete — Unhurried and Casual
      { id: 'cfo-ts', name: 'Nadia', role: 'CFO', avatar: 'bg-blue-600',
        description: 'Cost-conscious CFO. Scrutinizes licensing costs, total cost of ownership, hidden migration costs, and vendor lock-in risk.',
        stats: { agreement: 45, aggression: 25 }, model: 'mistralai/mistral-large', voice_id: 'kdmDKE6EkgrWrrykO9Qt' }, // Alexandra — Conversational and Natural
      { id: 'eng-ts', name: 'Tyler', role: 'Engineering Lead', avatar: 'bg-pink-600',
        description: 'Senior engineer who has to actually build this. Pragmatic about developer experience, ecosystem maturity, and what the team can realistically adopt.',
        stats: { agreement: 60, aggression: 40 }, model: 'gemini-1.5-pro', voice_id: 'q0IMILNRPxOgtBTS4taI' }, // Drew — Casual, Curious & Fun
    ],
    whiteboard: (timeStr) =>
      `Session Start: ${timeStr} CST\n\nDECISION: [e.g. Choose cloud provider / Migrate to microservices / Adopt new data warehouse]\nOptions on the Table:\n  A. [Option 1]\n  B. [Option 2]\n  C. [Option 3]\n\nEvaluation Criteria:\n- Cost (3yr TCO)\n- Security & compliance\n- Developer productivity\n- Migration risk & timeline\n- Vendor lock-in\n\nDeadline: [When decision must be made]`,
    suggestedPrompts: [
      "Let's score each option against our criteria — which platform wins on total cost of ownership over 3 years?",
      "CISO, what are your non-negotiables from a security standpoint for any platform we choose?",
      "Engineering Lead, which option would your team actually want to work with, and how long would migration realistically take?"
    ]
  },
  {
    id: 'ai-council',
    icon: '🤖',
    name: 'AI Council',
    description: 'Ask a question and get answers from six leading AI models — Claude, GPT-4o, Gemini, Llama, DeepSeek, and Mistral — each powered by their own model.',
    suggestedPurpose: 'Ask any question and hear how different AI models respond.',
    members: [
      { id: 'claude-ac', name: 'Claude', role: 'Claude (Anthropic)', avatar: 'bg-orange-600',
        description: 'Answer the question directly and helpfully.',
        stats: { agreement: 70, aggression: 20 }, model: 'anthropic/claude-3.5-sonnet', voice_id: 'BIvP0GN1cAtSRTxNHnWS' }, // Ellen — Serious, Direct and Confident
      { id: 'gpt-ac', name: 'GPT-4o', role: 'GPT-4o (OpenAI)', avatar: 'bg-slate-600',
        description: 'Answer the question directly and helpfully.',
        stats: { agreement: 70, aggression: 20 }, model: 'openai/gpt-4o', voice_id: 's3TPKV1kjDlVtZbl4Ksh' }, // Adam — Engaging, Friendly and Bright
      { id: 'gemini-ac', name: 'Gemini', role: 'Gemini (Google)', avatar: 'bg-sky-600',
        description: 'Answer the question directly and helpfully.',
        stats: { agreement: 70, aggression: 20 }, model: 'gemini-2.0-flash', voice_id: 'DXFkLCBUTmvXpp2QwZjA' }, // Eryn — Friendly AI Assistant
      { id: 'llama-ac', name: 'Llama', role: 'Llama (Meta)', avatar: 'bg-blue-800',
        description: 'Answer the question directly and helpfully.',
        stats: { agreement: 70, aggression: 20 }, model: 'meta-llama/llama-3.3-70b-instruct', voice_id: 'q0IMILNRPxOgtBTS4taI' }, // Drew — Casual, Curious & Fun
      { id: 'deepseek-ac', name: 'DeepSeek', role: 'DeepSeek', avatar: 'bg-teal-600',
        description: 'Answer the question directly and helpfully.',
        stats: { agreement: 70, aggression: 20 }, model: 'deepseek/deepseek-chat', voice_id: '1SM7GgM6IMuvQlz2BwM3' }, // Mark — Casual, Relaxed and Light
      { id: 'mistral-ac', name: 'Mistral', role: 'Mistral AI', avatar: 'bg-violet-600',
        description: 'Answer the question directly and helpfully.',
        stats: { agreement: 70, aggression: 20 }, model: 'mistralai/mistral-large', voice_id: 'jRAAK67SEFE9m7ci5DhD' }, // Ollie — Natural & Relaxed British
    ],
    whiteboard: (timeStr) => `Session Start: ${timeStr} CST`,
    suggestedPrompts: [
      "What's the best way to learn programming from scratch?",
      "Explain quantum computing in simple terms.",
      "What are the most important things to know about starting a business?"
    ]
  },
  {
    id: 'startup-strategy',
    icon: '🌱',
    name: 'Startup Strategy',
    description: 'Early-stage founding team — CEO, CTO, Head of Growth, Advisor, and Finance — debates direction.',
    suggestedPurpose: 'We are early-stage and need to pressure-test our current strategy, align on our top 3 bets for the next 90 days, and decide what to cut given our runway.',
    members: [
      { id: 'ceo-ss', name: 'Zoe', role: 'CEO', avatar: 'bg-red-600',
        description: 'Founding CEO. Driven, vision-obsessed, and sometimes too optimistic. Needs the team to stress-test the plan and keep her grounded.',
        stats: { agreement: 72, aggression: 65 }, model: 'anthropic/claude-3.5-sonnet', voice_id: 'm8ysB8KEJV5BeYQnOtWN' }, // Noor — Expressive, Sassy and Humoristic
      { id: 'cto-ss', name: 'Raj', role: 'CTO', avatar: 'bg-purple-600',
        description: 'Technical co-founder. Builds fast but protects against technical debt. Will push back on feature promises that outrun engineering capacity.',
        stats: { agreement: 60, aggression: 45 }, model: 'openai/gpt-4o', voice_id: '1SM7GgM6IMuvQlz2BwM3' }, // Mark — Casual, Relaxed and Light
      { id: 'growth-ss', name: 'Tess', role: 'Head of Growth', avatar: 'bg-pink-600',
        description: "Data-driven growth lead. Obsessed with CAC, retention loops, and the fastest path to PMF. Will cut any channel that doesn't convert.",
        stats: { agreement: 65, aggression: 55 }, model: 'gemini-1.5-pro', voice_id: 'kPzsL2i3teMYv0FxEYQ6' }, // Brittney — Social Media Voice, Fun, Youthful
      { id: 'advisor-ss', name: 'Bernard', role: 'Advisor', avatar: 'bg-yellow-600',
        description: "Experienced startup advisor who has seen multiple exits and failures. Asks the hard questions. Doesn't sugarcoat bad ideas.",
        stats: { agreement: 45, aggression: 35 }, model: 'deepseek/deepseek-chat', voice_id: 'goT3UYdM9bhm0n2lmKQx' }, // Edward — British, Dark, Seductive, Low
      { id: 'finance-ss', name: 'Amara', role: 'Finance', avatar: 'bg-blue-600',
        description: 'Early-stage finance lead. Monitors runway, unit economics, and burn rate. Will flag when the team is spending on the wrong things.',
        stats: { agreement: 50, aggression: 30 }, model: 'meta-llama/llama-3.3-70b-instruct', voice_id: 'kdmDKE6EkgrWrrykO9Qt' }, // Alexandra — Conversational and Natural
    ],
    whiteboard: (timeStr) =>
      `Session Start: ${timeStr} CST\n\nCompany: [Name]\nStage: [Pre-seed / Seed / Series A]\nCurrent ARR / MRR: $[Amount]\nRunway: [Months]\nCore Hypothesis: [What you believe to be true about the market]\n\nToday's Agenda:\n- Validate or pivot current strategy\n- Prioritize top 3 bets for next 90 days\n- Identify biggest assumption that needs testing`,
    suggestedPrompts: [
      "Do we actually have product-market fit, or are we just talking ourselves into it?",
      "Given our runway, what's the one bet we must win in the next 90 days?",
      "Advisor, be brutally honest — what are we getting wrong that we can't see from the inside?"
    ]
  }
];
