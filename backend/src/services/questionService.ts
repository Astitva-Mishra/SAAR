export interface DepartmentQuestionConfig {
  id: string;
  text: string;
  type: 'radio' | 'text';
  options?: string[];
  placeholder?: string;
}

/**
 * Controlled Question Banks by Clinical Domain
 */
export const QUESTION_BANKS: Record<string, DepartmentQuestionConfig[]> = {
  Gastroenterology: [
    {
      id: 'pain_location',
      text: '1. Where exactly is the abdominal discomfort located?',
      type: 'radio',
      options: [
        'Upper abdomen (below ribs)',
        'Lower abdomen (near navel)',
        'Right side',
        'Left side',
        'Generalized across entire stomach',
      ],
    },
    {
      id: 'pain_severity',
      text: '2. How would you rate the severity of the discomfort?',
      type: 'radio',
      options: [
        'Mild (Noticeable but manageable)',
        'Moderate (Interferes with daily tasks)',
        'Severe (Intense discomfort)',
      ],
    },
    {
      id: 'meal_relation',
      text: '3. Does the discomfort occur before or after meals?',
      type: 'radio',
      options: [
        'Worse 30-60 minutes after eating',
        'Worse on an empty stomach / before meals',
        'Constant throughout the day',
        'Unrelated to food intake',
      ],
    },
    {
      id: 'vomiting_status',
      text: '4. Have you experienced vomiting or nausea?',
      type: 'radio',
      options: [
        'No vomiting (Nausea only)',
        'Yes, vomited once or twice',
        'Frequent vomiting',
        'No nausea or vomiting',
      ],
    },
    {
      id: 'bowel_changes',
      text: '5. Have you noticed any changes in bowel habits or stools?',
      type: 'radio',
      options: [
        'Normal bowel movements',
        'Loose stools / Diarrhea',
        'Constipation',
        'Dark or black colored stools',
      ],
    },
  ],

  Headache: [
    {
      id: 'headache_onset',
      text: '1. Did the headache start suddenly or develop gradually?',
      type: 'radio',
      options: [
        'Suddenly (like a thunderclap)',
        'Gradually over hours',
        'Started several days ago',
      ],
    },
    {
      id: 'headache_location',
      text: '2. Where is the headache located?',
      type: 'radio',
      options: [
        'One side of head only',
        'Forehead / Frontal',
        'Back of head / Neck',
        'Entire head / Throbbing all over',
      ],
    },
    {
      id: 'headache_vision',
      text: '3. Are you experiencing any visual changes, light sensitivity, or dizziness?',
      type: 'radio',
      options: [
        'Sensitivity to bright light or sound',
        'Blurry vision or visual aura',
        'Dizziness / Vertigo',
        'No visual changes or light sensitivity',
      ],
    },
    {
      id: 'headache_nausea',
      text: '4. Do you have associated nausea or vomiting?',
      type: 'radio',
      options: ['No nausea', 'Mild nausea without vomiting', 'Nausea with vomiting'],
    },
    {
      id: 'headache_fever',
      text: '5. Do you have a stiff neck or high fever accompanying the headache?',
      type: 'radio',
      options: [
        'No neck stiffness or fever',
        'Fever present, no neck stiffness',
        'Both fever and neck stiffness present',
      ],
    },
  ],

  Cough: [
    {
      id: 'cough_type',
      text: '1. What type of cough are you experiencing?',
      type: 'radio',
      options: [
        'Dry, hacking cough',
        'Productive cough with clear or white phlegm',
        'Productive cough with yellow or green phlegm',
        'Cough with blood-tinged mucus',
      ],
    },
    {
      id: 'cough_duration',
      text: '2. How long has the cough persisted?',
      type: 'radio',
      options: [
        'Less than 1 week',
        '1 to 3 weeks',
        'More than 3 weeks (chronic)',
      ],
    },
    {
      id: 'breathing_difficulty',
      text: '3. Do you experience shortness of breath or wheezing during activity or rest?',
      type: 'radio',
      options: [
        'No breathing difficulty',
        'Mild breathlessness only on exertion',
        'Difficulty breathing even at rest',
        'Wheezing or whistling sound',
      ],
    },
    {
      id: 'fever_chills',
      text: '4. Have you measured a fever or experienced night chills?',
      type: 'radio',
      options: ['No fever', 'Mild low-grade fever', 'High fever with shaking chills'],
    },
    {
      id: 'chest_discomfort',
      text: '5. Do you have pain in the chest when coughing or taking a deep breath?',
      type: 'radio',
      options: [
        'No chest pain',
        'Sharp pain in ribs/chest when coughing deeply',
        'Constant dull chest ache',
      ],
    },
  ],

  Dermatology: [
    {
      id: 'rash_location',
      text: '1. Where is the skin rash or lesion located?',
      type: 'radio',
      options: [
        'Localized to hands or arms',
        'Localized to face or neck',
        'Trunk (chest/back/abdomen)',
        'Lower legs or feet',
        'Spread across whole body',
      ],
    },
    {
      id: 'rash_symptoms',
      text: '2. What sensations accompany the rash?',
      type: 'radio',
      options: [
        'Intense itching',
        'Burning or stinging sensation',
        'Painful to touch',
        'No itching or pain',
      ],
    },
    {
      id: 'rash_appearance',
      text: '3. What does the rash look like?',
      type: 'radio',
      options: [
        'Red raised bumps / hives',
        'Dry, flaky, or peeling patches',
        'Blisters with fluid',
        'Flat red discoloration',
      ],
    },
    {
      id: 'new_exposures',
      text: '4. Any recent exposure to new medications, plants, soaps, cosmetics, or insect bites?',
      type: 'radio',
      options: ['Yes, started new medication or skincare', 'Insect bite suspected', 'No known new exposures'],
    },
  ],

  GeneralMedicine: [
    {
      id: 'symptom_progression',
      text: '1. Are your symptoms improving, worsening, or staying the same?',
      type: 'radio',
      options: ['Getting progressively worse', 'Staying about the same', 'Gradually improving'],
    },
    {
      id: 'daily_activity_impact',
      text: '2. How much does this complaint interfere with your normal daily routine?',
      type: 'radio',
      options: [
        'Minimal interference (able to work/study)',
        'Moderate interference (struggling with regular tasks)',
        'Severe interference (confined to bed / resting)',
      ],
    },
    {
      id: 'chronic_conditions',
      text: '3. Do you have any chronic medical conditions (e.g. Diabetes, Hypertension, Asthma)?',
      type: 'radio',
      options: [
        'None',
        'Diabetes or Blood Pressure',
        'Asthma or Respiratory condition',
        'Heart disease',
        'Multiple chronic conditions',
      ],
    },
    {
      id: 'current_medications',
      text: '4. Have you taken any over-the-counter medications for this complaint?',
      type: 'radio',
      options: [
        'No medications taken',
        'Paracetamol or pain relievers taken',
        'Antacids or digestive medicines taken',
        'Antibiotics or other prescription drugs taken',
      ],
    },
  ],
};

/**
 * Returns controlled questions tailored to the case's department and symptoms.
 */
export function getQuestionsForCase(params: {
  department: string;
  symptoms?: string[];
  chiefComplaint?: string;
}): DepartmentQuestionConfig[] {
  const { department, symptoms = [], chiefComplaint = '' } = params;
  const combined = [chiefComplaint, ...symptoms].join(' ').toLowerCase();

  // Specific domain detection
  if (department === 'Gastroenterology' || combined.includes('stomach') || combined.includes('abdomen')) {
    return QUESTION_BANKS.Gastroenterology;
  }

  if (combined.includes('headache') || combined.includes('sar dard') || combined.includes('migraine')) {
    return QUESTION_BANKS.Headache;
  }

  if (combined.includes('cough') || combined.includes('khansi') || combined.includes('phlegm')) {
    return QUESTION_BANKS.Cough;
  }

  if (department === 'Dermatology' || combined.includes('rash') || combined.includes('skin') || combined.includes('itch')) {
    return QUESTION_BANKS.Dermatology;
  }

  return QUESTION_BANKS.GeneralMedicine;
}
