/**
 * Scheme App (AI Welfare Assistant)
 * Conversational AI Advisor Mock Responses & Intent Generator
 * Supports English & Hinglish for citizen welfare queries across India.
 */

export type AdvisorIntentKey =
  | 'GREETING'
  | 'AGRICULTURE'
  | 'EDUCATION'
  | 'HEALTHCARE'
  | 'BUSINESS'
  | 'PENSION'
  | 'DOCUMENTS'
  | 'OUT_OF_SCOPE';

export interface DocumentChecklistItem {
  id: string;
  name: string;
  mandatory: boolean;
  description?: string;
}

export interface AdvisorResponsePayload {
  intent: AdvisorIntentKey;
  text: string;
  followUpPrompts: string[];
  documents?: DocumentChecklistItem[];
  suggestedAction?: {
    type: 'NAVIGATE_CHECK' | 'NAVIGATE_VAULT' | 'BROWSE_SCHEMES' | 'OPEN_SUPPORT';
    targetRoute?: string;
    label: string;
  };
}

export interface IntentDefinition {
  intent: AdvisorIntentKey;
  keywords: string[];
  en: AdvisorResponsePayload;
  hinglish: AdvisorResponsePayload;
}

export const STANDARD_WELFARE_DOCUMENTS: DocumentChecklistItem[] = [
  {
    id: 'doc-aadhaar',
    name: 'Aadhaar Card (linked with active mobile number)',
    mandatory: true,
    description: 'Required for biometric eKYC and identity verification across all central/state portals.',
  },
  {
    id: 'doc-bank-passbook',
    name: 'DBT-Enabled Bank Passbook / Statement',
    mandatory: true,
    description: 'Bank account seeded with Aadhaar via NPCI mapping to receive Direct Benefit Transfer.',
  },
  {
    id: 'doc-income-cert',
    name: 'Income Certificate (Aamdani Praman Patra)',
    mandatory: true,
    description: 'Issued by Tehsildar / Revenue Authority within the last 12 months verifying family income.',
  },
  {
    id: 'doc-domicile-cert',
    name: 'Domicile / Residence Certificate (Niwas Praman Patra)',
    mandatory: true,
    description: 'Proof of permanent state residency for regional quota and state-funded schemes.',
  },
  {
    id: 'doc-caste-cert',
    name: 'Caste / Category Certificate (SC/ST/OBC/EWS)',
    mandatory: false,
    description: 'Issued by competent district authority for affirmative action quotas and special grants.',
  },
  {
    id: 'doc-ration-card',
    name: 'Ration Card / NFSA / BPL / Samagra Card',
    mandatory: false,
    description: 'Proof of household composition, Antyodaya/BPL status, and subsidized grain eligibility.',
  },
  {
    id: 'doc-land-records',
    name: 'Land Ownership Records (Khasra / Khatauni / RoR)',
    mandatory: false,
    description: 'Certified revenue land records for agricultural subsidies and PM-Kisan verification.',
  },
  {
    id: 'doc-photographs',
    name: 'Passport Size Photographs (2-4 copies)',
    mandatory: true,
    description: 'Recent color passport photos for physical form submission at CSC / Block offices.',
  },
];

export const MOCK_ADVISOR_INTENT_MAP: Record<AdvisorIntentKey, IntentDefinition> = {
  GREETING: {
    intent: 'GREETING',
    keywords: ['hello', 'namaste', 'hi', 'who are you', 'hey', 'pranam', 'kya kar sakte ho', 'help'],
    en: {
      intent: 'GREETING',
      text: 'Namaste! I am your Scheme App AI Welfare Advisor, your official guide to discovering and applying for Indian central and state government benefits. Whether you need farmer subsidies, student scholarships, free medical treatment, or business loans, I can evaluate your profile and guide you through the verified paperwork. How may I assist you or your family today?',
      followUpPrompts: [
        'Check schemes I qualify for',
        'Find farmer & agriculture subsidies',
        'Search student scholarships',
        'Explore business & MSME loans',
      ],
      suggestedAction: {
        type: 'NAVIGATE_CHECK',
        targetRoute: '/check',
        label: 'Check My Eligibility',
      },
    },
    hinglish: {
      intent: 'GREETING',
      text: 'Namaste! Main hoon aapka Scheme App AI Welfare Advisor, jo Bharat sarkar aur sabhi rajyon ki sarkari yojanaon ki sahi jaankari aur aavedan mein aapki sahayata karta hai. Chahe aap kheti-kisani ke labh, student scholarship, muft ilaaj, ya business loan dhoondh rahe hon, main aapki eligibility check karke sahi rasta bataunga. Aaj main aapki ya aapke parivar ki kya madad kar sakta hoon?',
      followUpPrompts: [
        'Mere liye eligible schemes check karein',
        'Kisan yojanaon ki jaankari chahiye',
        'Student scholarship schemes batayein',
        'Business aur Mudra loan ki detail',
      ],
      suggestedAction: {
        type: 'NAVIGATE_CHECK',
        targetRoute: '/check',
        label: 'Apni Patrata Check Karein',
      },
    },
  },

  AGRICULTURE: {
    intent: 'AGRICULTURE',
    keywords: ['agriculture', 'farmer', 'crop', 'irrigation', 'kisan', 'kheti', 'fasal', 'zameen', 'boring', 'beej', 'khad'],
    en: {
      intent: 'AGRICULTURE',
      text: 'We have identified high-priority agricultural programs tailored for you, including PM-Kisan Samman Nidhi (₹6,000/year direct support), PM Fasal Bima Yojana for crop loss protection, and up to 90% capital subsidy on solar pumps under PM-KUSUM. These initiatives provide direct financial relief and subsidized farming equipment to significantly reduce your seasonal input costs. Share your state and land holding size, and I will fetch the active state-specific schemes and local Krishi Vigyan Kendra details for you.',
      followUpPrompts: [
        'Check PM-Kisan payment status & eKYC',
        'How do I apply for solar pump subsidy?',
        'What documents are needed for Kisan Credit Card (KCC)?',
        'Find state-specific crop loss assistance',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-land-records')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-bank-passbook')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Agriculture',
        label: 'Browse Agriculture Schemes',
      },
    },
    hinglish: {
      intent: 'AGRICULTURE',
      text: 'Aapke liye PM-Kisan Samman Nidhi (₹6,000 varshik DBT sahayata), PM Fasal Bima Yojana aur PM-KUSUM solar pump subsidy jaise pramukh kisan kalyan programs uplabdh hain. Ye yojanaayein beej-khad ki lagat kam karne, fasal nuksan par compensation aur sasti sinchai suvidha pradan karti hain. Aap apna rajya aur zameen ka aakar (acres) batayein taaki main aapko exact local schemes aur aavedan link pradan kar sakun.',
      followUpPrompts: [
        'PM-Kisan kist aur eKYC kaise check karein?',
        'Solar pump subsidy ke liye kaise apply karein?',
        'Kisan Credit Card (KCC) ke zaroori documents',
        'Fasal bima claim karne ka process',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-land-records')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-bank-passbook')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Agriculture',
        label: 'Kisan Yojanaayein Dekhein',
      },
    },
  },

  EDUCATION: {
    intent: 'EDUCATION',
    keywords: ['education', 'scholarship', 'student', 'college', 'school', 'fees', 'padhai', 'chhatravritti', 'hostel', 'degree'],
    en: {
      intent: 'EDUCATION',
      text: 'Government educational assistance provides pre-matric and post-matric scholarships via the National Scholarship Portal (NSP), full tuition fee waivers, and interest-subsidized education loans via the Vidya Lakshmi portal. These programs award financial grants ranging from ₹10,000 up to ₹1,50,000 annually based on student merit, household income, and category criteria. Tell me your current educational level and annual family income so we can shortlist the open scholarships you can apply for today.',
      followUpPrompts: [
        'How do I apply on National Scholarship Portal (NSP)?',
        'Check eligibility for Post-Matric Scholarship',
        'Which documents are needed for fee concession?',
        'Find education loans with interest subsidy',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-income-cert')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-caste-cert')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-bank-passbook')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Education',
        label: 'Explore Student Scholarships',
      },
    },
    hinglish: {
      intent: 'EDUCATION',
      text: 'Chhatron ke liye National Scholarship Portal (NSP) ke antargat Pre-Matric, Post-Matric scholarships, college fee reimbursement aur saste Vidya Lakshmi education loans ki suvidha uplabdh hai. Ye schemes parivar ki aamdani aur category ke aadhar par padhai ka kharcha aur monthly stipend provide karti hain. Aap apni class/degree aur annual family income share karein, taaki main aapke liye best scholarship shortlist kar sakun.',
      followUpPrompts: [
        'NSP scholarship ke liye registration kaise karein?',
        'Post-Matric scholarship eligibility kya hai?',
        'College fee concession ke liye kaunse documents chahiye?',
        'Vidya Lakshmi education loan kaise lein?',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-income-cert')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-caste-cert')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-bank-passbook')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Education',
        label: 'Scholarship Schemes Dekhein',
      },
    },
  },

  HEALTHCARE: {
    intent: 'HEALTHCARE',
    keywords: ['healthcare', 'health', 'ayushman', 'medical', 'hospital', 'maternal', 'mother', 'ilaaj', 'dawa', 'delivery', 'bimaar', 'card'],
    en: {
      intent: 'HEALTHCARE',
      text: 'Under Ayushman Bharat (PM-JAY), eligible families and all citizens aged 70 and above receive up to ₹5,00,000 per year for cashless hospitalization across thousands of empaneled hospitals. Expectant mothers are also entitled to direct cash support of ₹5,000 to ₹6,000 under the Pradhan Mantri Matru Vandana Yojana (PMMVY) alongside free delivery services under Janani Suraksha Yojana. Please mention whether you require immediate hospitalization coverage or maternal welfare benefits so I can pinpoint the nearest centers and card issuance steps.',
      followUpPrompts: [
        'How do I download my Ayushman Card (PM-JAY)?',
        'Find empaneled hospitals near me',
        'What are the benefits under PM Matru Vandana Yojana (PMMVY)?',
        'Check documents needed for free medical treatment',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-ration-card')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Healthcare',
        label: 'Find Healthcare Schemes',
      },
    },
    hinglish: {
      intent: 'HEALTHCARE',
      text: 'Ayushman Bharat (PM-JAY) ke tehat eligible parivaron aur 70 varsh se adhik aayu ke sabhi buzurgon ko prati varsh ₹5,00,000 tak ka cashless hospital ilaaj muft milta hai. Saath hi, garbhvati aur dhyatri mataon ke liye Pradhan Mantri Matru Vandana Yojana (PMMVY) ke zariye ₹6,000 tak ki seedhi aarthik sahayata di jaati hai. Batayein ki aapko family hospital treatment ke liye check karna hai ya maternal care ke liye, taaki main aapko Ayushman card aur najdeeki hospital list dikha sakun.',
      followUpPrompts: [
        'Ayushman card kaise download karein?',
        'Mera najdeeki Ayushman hospital kaunsa hai?',
        'PM Matru Vandana Yojana ke labh kya hain?',
        'Free ilaaj ke liye zaroori documents kya hain?',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-ration-card')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Healthcare',
        label: 'Healthcare Yojanaayein Dekhein',
      },
    },
  },

  BUSINESS: {
    intent: 'BUSINESS',
    keywords: ['business', 'loan', 'msme', 'mudra', 'shop', 'startup', 'vyapar', 'dukan', 'subsidy', 'karobar', 'rojgar', 'svanidhi'],
    en: {
      intent: 'BUSINESS',
      text: 'Entrepreneurs and shopkeepers can access collateral-free institutional financing up to ₹20 Lakhs under Pradhan Mantri MUDRA Yojana (Shishu, Kishore, and Tarun brackets) and up to ₹50,000 micro-credit under PM SVANidhi. For setting up new manufacturing or service units, the Prime Minister Employment Generation Programme (PMEGP) grants up to 35% margin money capital subsidies. Tell me your venture type and required funding amount so I can outline the exact bank proposal guidelines and subsidy paperwork.',
      followUpPrompts: [
        'How do I apply for a PM MUDRA loan without collateral?',
        'Check eligibility for PMEGP 35% subsidy',
        'What documents are needed for MSME Udyam registration?',
        'How to get a PM SVANidhi vendor loan?',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-bank-passbook')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Business',
        label: 'Explore Business Schemes',
      },
    },
    hinglish: {
      intent: 'BUSINESS',
      text: 'Apna vyapar shuru karne ya badhane ke liye aap PM MUDRA Yojana ke tehat bina collateral ke ₹20 Lakh tak ka loan (Shishu, Kishore, Tarun) aur street vendors/dukaandaron ke liye PM SVANidhi loan prapt kar sakte hain. Iske alawa PMEGP scheme ke zariye naye business setup par 35% tak ki government subsidy milti hai. Aap apne business ka type aur required loan amount batayein, taaki main aapko sahi scheme aur bank process samjha sakun.',
      followUpPrompts: [
        'Bina guarantee ke MUDRA loan kaise apply karein?',
        'PMEGP 35% subsidy ke liye eligibility kya hai?',
        'MSME Udyam registration ke zaroori documents',
        'PM SVANidhi loan kaise sanction karwayein?',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-bank-passbook')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Business',
        label: 'Business Loan Schemes Dekhein',
      },
    },
  },

  PENSION: {
    intent: 'PENSION',
    keywords: ['pension', 'senior', 'elderly', 'old age', 'vridha', 'bujurg', 'retire', 'varishta', '60 saal', '70 saal', 'widow'],
    en: {
      intent: 'PENSION',
      text: 'Senior citizens can receive guaranteed social security pensions under the Indira Gandhi National Old Age Pension Scheme (IGNOAPS) as well as contributory pensions through the Atal Pension Yojana (APY). These programs disburse direct monthly payments ranging between ₹1,000 to ₹5,000 into the senior’s bank account, complemented by comprehensive ₹5,00,000 health insurance under Ayushman Bharat for seniors aged 70+. Please specify the applicant’s age, state of residence, and economic category so I can calculate the exact monthly pension payout and application venue.',
      followUpPrompts: [
        'What is the age criteria for Old Age Pension (Vridha Pension)?',
        'How to apply for Atal Pension Yojana (APY)?',
        'Check documents needed for senior citizen pension',
        'Find monthly pension amount in my state',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-bank-passbook')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-income-cert')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-domicile-cert')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Pension',
        label: 'View Senior Citizen Schemes',
      },
    },
    hinglish: {
      intent: 'PENSION',
      text: 'Senior citizens ke liye Indira Gandhi National Old Age Pension (Vridha Pension) aur Atal Pension Yojana (APY) ke madhyam se masik pension uplabdh hai. In yojanaon mein ₹1,000 se ₹3,000+ tak ki monthly pension seedhe bank account mein aati hai, aur 70+ varsh ke buzurgon ko ₹5 Lakh tak ka muft Ayushman health cover bhi milta hai. Applicant ki umar, rajya aur aamdani batayein taaki main aapko unke rajya ki exact monthly pension aur aavedan kendra ki jaankari de sakun.',
      followUpPrompts: [
        'Vridha Pension ke liye aayu seema kya hai?',
        'Atal Pension Yojana (APY) mein account kaise kholein?',
        'Senior citizen pension ke liye kaunse documents chahiye?',
        'Mere rajya mein vridha pension kitni milti hai?',
      ],
      documents: [
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-aadhaar')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-bank-passbook')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-income-cert')!,
        STANDARD_WELFARE_DOCUMENTS.find((d) => d.id === 'doc-domicile-cert')!,
      ],
      suggestedAction: {
        type: 'BROWSE_SCHEMES',
        targetRoute: '/schemes?category=Pension',
        label: 'Pension Yojanaayein Dekhein',
      },
    },
  },

  DOCUMENTS: {
    intent: 'DOCUMENTS',
    keywords: ['documents', 'required', 'apply', 'eligibility', 'kaagaz', 'praman patra', 'dastavez', 'kya chahiye', 'shartein', 'rules'],
    en: {
      intent: 'DOCUMENTS',
      text: 'Government welfare schemes in India utilize a standardized document stack to approve Direct Benefit Transfer (DBT) and subsidy disbursements without leakage. The four foundational records are your Aadhaar card linked with an active mobile number, an NPCI/DBT-seeded bank account passbook, a valid Income Certificate, and your Domicile Certificate. You can store and verify these documents securely in your Scheme App Document Vault to check 100% eligibility before submitting any application.',
      followUpPrompts: [
        'How do I check if my bank account is Aadhaar DBT-seeded?',
        'Where can I get an Income Certificate issued locally?',
        'Add documents to Scheme App Vault',
        'Can I apply offline through Common Service Center (CSC)?',
      ],
      documents: STANDARD_WELFARE_DOCUMENTS,
      suggestedAction: {
        type: 'NAVIGATE_VAULT',
        targetRoute: '/vault',
        label: 'Open Document Vault',
      },
    },
    hinglish: {
      intent: 'DOCUMENTS',
      text: 'Government welfare schemes mein DBT (Direct Benefit Transfer) ke zariye seedhe paise paane ke liye standard documents ki zaroorat hoti hai. Sabse zaroori documents hain: mobile-linked Aadhaar Card, DBT-seeded bank account ki passbook, aamdani praman patra (Income Certificate) aur niwas praman patra (Domicile). Aap in documents ko Scheme App Document Vault mein upload karke apni scheme readiness aur eligibility turant verify kar sakte hain.',
      followUpPrompts: [
        'Mera bank account DBT-seeded hai ya nahi kaise check karein?',
        'Income certificate kahan se aur kaise banta hai?',
        'Scheme App Vault mein document kaise jodein?',
        'Kya Jan Seva Kendra (CSC) par offline aavedan ho sakta hai?',
      ],
      documents: STANDARD_WELFARE_DOCUMENTS,
      suggestedAction: {
        type: 'NAVIGATE_VAULT',
        targetRoute: '/vault',
        label: 'Document Vault Kholein',
      },
    },
  },

  OUT_OF_SCOPE: {
    intent: 'OUT_OF_SCOPE',
    keywords: ['weather', 'sports', 'movies', 'cricket', 'recipe', 'game', 'joke', 'coding', 'film', 'cinema', 'score', 'match', 'song', 'weather in'],
    en: {
      intent: 'OUT_OF_SCOPE',
      text: 'I am your dedicated Sovereign Citizen Welfare AI Advisor, focused solely on assisting citizens with government welfare schemes, scholarships, citizen health benefits, and subsidies. I cannot provide answers for non-welfare inquiries such as weather forecasts, entertainment, or general trivia. Please let me know which government support program, category, or document requirement you would like assistance with!',
      followUpPrompts: [
        'Check welfare schemes for my family',
        'Explore student scholarships',
        'How do I get an Ayushman Card?',
        'Find business loans & subsidies',
      ],
      suggestedAction: {
        type: 'NAVIGATE_CHECK',
        targetRoute: '/check',
        label: 'Check Available Welfare Schemes',
      },
    },
    hinglish: {
      intent: 'OUT_OF_SCOPE',
      text: 'Main ek samarpit Sovereign Citizen Welfare AI Advisor hoon aur mera uddeshya sirf nagrikon ko sarkari yojanaon, scholarships, healthcare benefits aur subsidies mein madad karna hai. Main mausam, sports, filmon ya anya general topics par jaankari nahi de sakta. Kripya mujhe sarkari yojanaon, kisan labh, ya ration/pension se juda koi prashn poochein, main poori madad karunga!',
      followUpPrompts: [
        'Mere parivar ke liye sarkari yojanaayein batayein',
        'Scholarship schemes kaise check karein?',
        'Ayushman card kaise banwayein?',
        'Vyapar ke liye sarkari loan schemes',
      ],
      suggestedAction: {
        type: 'NAVIGATE_CHECK',
        targetRoute: '/check',
        label: 'Sarkari Yojanaayein Check Karein',
      },
    },
  },
};

/**
 * Detect language script / dialect: Hinglish vs clean English
 */
export function detectLanguage(text: string): 'en' | 'hinglish' {
  const hinglishMarkers = [
    'namaste', 'kya', 'hai', 'kaise', 'batao', 'chahiye', 'kisan', 'yojana',
    'paise', 'kheti', 'madad', 'padhai', 'ilaaj', 'dukan', 'vyapar', 'karen',
    'chhatra', 'buzurg', 'parivar', 'niwas', 'aamdani', 'praman', 'zaroori'
  ];
  const lower = text.toLowerCase();
  const hasHinglish = hinglishMarkers.some((word) => lower.includes(word));
  return hasHinglish ? 'hinglish' : 'en';
}

/**
 * Match query to an intent and generate the corresponding mock response.
 */
export function generateMockAdvisorResponse(
  query: string,
  preferredLanguage?: 'en' | 'hinglish'
): AdvisorResponsePayload {
  const cleanQuery = query.toLowerCase().trim();
  const lang = preferredLanguage || detectLanguage(cleanQuery);

  const priorityOrder: AdvisorIntentKey[] = [
    'OUT_OF_SCOPE',
    'DOCUMENTS',
    'AGRICULTURE',
    'EDUCATION',
    'HEALTHCARE',
    'BUSINESS',
    'PENSION',
    'GREETING',
  ];

  for (const key of priorityOrder) {
    const entry = MOCK_ADVISOR_INTENT_MAP[key];
    const matched = entry.keywords.some((kw) => cleanQuery.includes(kw));
    if (matched) {
      return entry[lang];
    }
  }

  return MOCK_ADVISOR_INTENT_MAP.GREETING[lang];
}
