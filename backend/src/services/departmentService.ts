/**
 * Deterministic Clinical Department Mapping Engine
 * Maps patient symptoms, chief complaint, and clinical categories to recommended hospital OPD departments.
 * Note: Department recommendation is a clinical routing suggestion, NOT a disease diagnosis.
 */

interface DepartmentRule {
  department: string;
  keywords: string[];
}

const DEPARTMENT_RULES: DepartmentRule[] = [
  {
    department: 'Gastroenterology',
    keywords: [
      'stomach pain',
      'pet dard',
      'pet me dard',
      'pet ke right side',
      'pet ke left side',
      'abdominal pain',
      'abdomen',
      'nausea',
      'vomit',
      'vomiting',
      'diarrhea',
      'loose motion',
      'constipation',
      'acidity',
      'heartburn',
      'gastric',
      'indigestion',
      'bloating',
      'jaundice',
      'liver',
    ],
  },
  {
    department: 'Dermatology',
    keywords: [
      'skin',
      'rash',
      'itching',
      'khujli',
      'eczema',
      'allergy',
      'hives',
      'boil',
      'mole',
      'acne',
      'blister',
      'dry skin',
      'dermatitis',
      'scaling',
    ],
  },
  {
    department: 'Ophthalmology',
    keywords: [
      'eye',
      'aankh',
      'vision',
      'blurry vision',
      'red eye',
      'eye pain',
      'cornea',
      'watering eye',
      'double vision',
      'light sensitivity',
    ],
  },
  {
    department: 'ENT',
    keywords: [
      'ear',
      'kaan',
      'earache',
      'hearing loss',
      'throat',
      'gala',
      'sore throat',
      'tonsil',
      'nose',
      'runny nose',
      'sinus',
      'nasal congestion',
      'sneezing',
    ],
  },
  {
    department: 'General Medicine',
    keywords: [
      'headache',
      'sar dard',
      'sir dard',
      'fever',
      'bukhar',
      'cough',
      'khansi',
      'body ache',
      'body toot rahi',
      'weakness',
      'fatigue',
      'chills',
      'cold',
      'chest pain',
      'dizziness',
      'malaise',
    ],
  },
];

const DEFAULT_DEPARTMENT = 'General Medicine';

/**
 * Deterministically maps a patient complaint, extracted symptoms, and category to a clinical department.
 */
export function mapToDepartment(params: {
  complaintText: string;
  symptoms?: string[];
  categoryHint?: string;
}): string {
  const { complaintText, symptoms = [], categoryHint } = params;

  // Direct check if category hint already matches a known department
  if (categoryHint) {
    const hintLower = categoryHint.toLowerCase();
    for (const rule of DEPARTMENT_RULES) {
      if (rule.department.toLowerCase() === hintLower) {
        return rule.department;
      }
    }
  }

  const normalizedInput = [complaintText, ...symptoms].join(' ').toLowerCase();

  for (const rule of DEPARTMENT_RULES) {
    for (const keyword of rule.keywords) {
      if (normalizedInput.includes(keyword)) {
        return rule.department;
      }
    }
  }

  return DEFAULT_DEPARTMENT;
}
