import { RiskLevel, SeverityLevel, IDepartmentAnswer } from '../models/Case';

export interface SafetyEvaluationResult {
  riskLevel: RiskLevel;
  safetyFlags: string[];
  safetyMessage: string;
}

interface RedFlagPattern {
  flag: string;
  level: RiskLevel;
  keywords: string[];
  description: string;
}

/**
 * Deterministic Red-Flag Ruleset
 * Categorized by urgency level with specific clinical keyword matches.
 */
const RED_FLAG_RULES: RedFlagPattern[] = [
  // 1. Critical Emergencies (Immediate Emergency Response)
  {
    flag: 'chest_pain_severe',
    level: 'EMERGENCY',
    keywords: [
      'chest pain',
      'heart attack',
      'crushing chest',
      'pressure in chest',
      'chest tightness',
      'radiating to left arm',
      'radiating to jaw',
    ],
    description: 'Acute chest pain or discomfort with cardiovascular red flags',
  },
  {
    flag: 'difficulty_breathing_severe',
    level: 'EMERGENCY',
    keywords: [
      'difficulty breathing',
      'cannot breathe',
      'gasping',
      'blue lips',
      'cyanosis',
      'suffocating',
      'severe shortness of breath',
      'stridor',
    ],
    description: 'Acute respiratory distress or airway compromise',
  },
  {
    flag: 'loss_of_consciousness',
    level: 'EMERGENCY',
    keywords: [
      'loss of consciousness',
      'fainted',
      'fainting',
      'passed out',
      'unresponsive',
      'syncope',
      'blacked out',
    ],
    description: 'Loss of consciousness or altered mental status',
  },
  {
    flag: 'stroke_symptoms',
    level: 'EMERGENCY',
    keywords: [
      'sudden weakness',
      'sudden numbness',
      'facial droop',
      'slurred speech',
      'difficulty speaking',
      'cannot speak',
      'paralysis on one side',
      'vision loss sudden',
      'cannot move my left arm',
      'cannot move my right arm',
      'cannot move my arm',
      'cannot move left arm',
      'cannot move arm',
      'cannot move',
    ],
    description: 'Focal neurological deficits or acute stroke indicators',
  },
  {
    flag: 'severe_hemorrhage',
    level: 'EMERGENCY',
    keywords: [
      'severe bleeding',
      'uncontrolled bleeding',
      'vomiting blood',
      'coughing blood',
      'hematemesis',
      'hemoptysis',
      'black tarry stool',
      'blood in vomit',
    ],
    description: 'Active severe hemorrhage or upper GI bleeding',
  },
  {
    flag: 'thunderclap_headache',
    level: 'EMERGENCY',
    keywords: [
      'thunderclap headache',
      'worst headache of my life',
      'sudden severe headache',
      'stiff neck with fever',
    ],
    description: 'Sudden onset maximal headache or meningeal signs',
  },
  {
    flag: 'anaphylaxis_severe',
    level: 'EMERGENCY',
    keywords: [
      'throat swelling',
      'severe allergic reaction',
      'anaphylaxis',
      'swollen tongue',
      'swollen throat',
      'unable to swallow',
    ],
    description: 'Acute anaphylaxis or upper airway angioedema',
  },

  // 2. Potentially Urgent Signals (Prompt Healthcare Provider Review)
  {
    flag: 'high_fever_prolonged',
    level: 'POTENTIALLY_URGENT',
    keywords: [
      'high fever',
      'fever for week',
      'fever 103',
      'fever 104',
      'persistent high fever',
      'shivering uncontrollably',
      'rigors',
    ],
    description: 'Prolonged or very high fever',
  },
  {
    flag: 'acute_severe_abdomen',
    level: 'POTENTIALLY_URGENT',
    keywords: [
      'severe stomach pain',
      'severe abdominal pain',
      'unbearable abdominal pain',
      'rigid abdomen',
      'rebound tenderness',
    ],
    description: 'Acute severe abdominal pain requiring prompt clinical evaluation',
  },
  {
    flag: 'persistent_vomiting_dehydration',
    level: 'POTENTIALLY_URGENT',
    keywords: [
      'cannot keep water down',
      'unable to keep fluids',
      'severe dehydration',
      'vomiting non-stop',
      'extreme dizziness',
    ],
    description: 'Intractable vomiting or significant dehydration risk',
  },
];

const RISK_HIERARCHY: Record<RiskLevel, number> = {
  LOW: 1,
  MODERATE: 2,
  POTENTIALLY_URGENT: 3,
  EMERGENCY: 4,
};

/**
 * Standard triage safety messages based on evaluated risk level
 */
export function getSafetyMessageForRiskLevel(
  level: RiskLevel,
  flags: string[]
): string {
  switch (level) {
    case 'EMERGENCY':
      return 'Critical red-flag symptoms detected. Immediate emergency medical evaluation is strongly advised. Please notify hospital emergency triage or proceed to the nearest emergency department.';
    case 'POTENTIALLY_URGENT':
      return 'Clinical red flags identified indicating potential urgency. Please notify hospital staff for prompt clinical triage and review by the attending physician.';
    case 'MODERATE':
      return 'Symptoms indicate an active clinical complaint requiring consultation. Your case is queued for comprehensive physician review.';
    case 'LOW':
    default:
      return 'Routine case intake completed. No emergency red flags detected during intake screening. Please proceed to consultation with your healthcare provider.';
  }
}

/**
 * Check if a symptom keyword is explicitly negated in the text corpus
 * (e.g., "no chest pain", "don't have difficulty breathing", "without chest pain", "chest pain nahi")
 */
function isKeywordNegated(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefixRegex = new RegExp(
    `(?:no|not|don'?t\\s+have|do\\s+not\\s+have|without|denies|denied|never\\s+had)\\s+(?:any\\s+)?(?:severe\\s+)?${escaped}`,
    'i'
  );
  if (prefixRegex.test(text)) return true;

  const suffixRegex = new RegExp(
    `${escaped}\\s+(?:kuch\\s+)?nahi(?:\\s+hai)?`,
    'i'
  );
  if (suffixRegex.test(text)) return true;

  return false;
}

/**
 * Evaluates patient complaint, symptoms, answers, and severity using deterministic safety rules.
 */
export function evaluateSafety(params: {
  complaintText: string;
  symptoms: string[];
  severity?: SeverityLevel;
  answers?: IDepartmentAnswer[];
  priorRiskLevel?: RiskLevel;
  documentTexts?: string[];
}): SafetyEvaluationResult {
  const { complaintText, symptoms, severity = 'MODERATE', answers = [], priorRiskLevel, documentTexts = [] } = params;

  // Build aggregated text string for deterministic scanning
  const textCorpus = [
    complaintText,
    ...symptoms,
    ...answers.map((a) => `${a.questionText} ${a.answerText}`),
    ...documentTexts,
  ]
    .join(' ')
    .toLowerCase();

  const detectedFlags: Set<string> = new Set();
  let calculatedRisk: RiskLevel = 'LOW';

  // 1. Evaluate Red-Flag Rules against text corpus (respecting explicit negations)
  for (const rule of RED_FLAG_RULES) {
    const matched = rule.keywords.some((keyword) => {
      const lower = keyword.toLowerCase();
      return textCorpus.includes(lower) && !isKeywordNegated(textCorpus, lower);
    });
    if (matched) {
      detectedFlags.add(rule.flag);
      if (RISK_HIERARCHY[rule.level] > RISK_HIERARCHY[calculatedRisk]) {
        calculatedRisk = rule.level;
      }
    }
  }

  // 2. Adjust for explicitly reported SEVERE severity
  if (severity === 'SEVERE' && RISK_HIERARCHY[calculatedRisk] < RISK_HIERARCHY['MODERATE']) {
    calculatedRisk = 'MODERATE';
  }

  // 3. Inspect specific department answers for emergency affirmations
  for (const ans of answers) {
    const ansText = ans.answerText.toLowerCase();
    const qText = ans.questionText.toLowerCase();

    // Check for explicit yes on chest pain or breathing difficulty in safety questions
    if (
      (qText.includes('chest pain') || qText.includes('breathing')) &&
      (ansText === 'yes' || ansText.startsWith('yes'))
    ) {
      if (qText.includes('chest pain')) {
        detectedFlags.add('chest_pain_screening_yes');
        if (RISK_HIERARCHY['EMERGENCY'] > RISK_HIERARCHY[calculatedRisk]) {
          calculatedRisk = 'EMERGENCY';
        }
      }
      if (qText.includes('breathing')) {
        detectedFlags.add('breathing_difficulty_screening_yes');
        if (RISK_HIERARCHY['EMERGENCY'] > RISK_HIERARCHY[calculatedRisk]) {
          calculatedRisk = 'EMERGENCY';
        }
      }
    }
  }

  // 4. Enforce Re-Evaluation Invariance:
  // Risk can NEVER be de-escalated below a previously confirmed level
  if (priorRiskLevel && RISK_HIERARCHY[priorRiskLevel] > RISK_HIERARCHY[calculatedRisk]) {
    calculatedRisk = priorRiskLevel;
  }

  const flagsArray = Array.from(detectedFlags);
  const safetyMessage = getSafetyMessageForRiskLevel(calculatedRisk, flagsArray);

  return {
    riskLevel: calculatedRisk,
    safetyFlags: flagsArray,
    safetyMessage,
  };
}
