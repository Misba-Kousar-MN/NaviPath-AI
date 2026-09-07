import { SupportedLanguage } from '../types/recommendation';

export interface Translations {
  appName: string;
  appSubtitle: string;
  tagline: string;
  heroHeading: string;
  heroSubheading: string;
  heroSupporting: string;
  findMyPathway: string;
  howItWorks: string;
  trustBanner: string;
  selectLanguage: string;
  selectLanguageSubtitle: string;
  voiceMode: string;
  voiceComingSoon: string;
  stepIndicator: string;
  stepWorkGoal: string;
  stepLocation: string;
  stepReview: string;
  occupationHeading: string;
  occupationSubheading: string;
  occupationPlaceholder: string;
  goalHeading: string;
  goalSubheading: string;
  goalPlaceholder: string;
  districtHeading: string;
  districtSubheading: string;
  districtSelectPlaceholder: string;
  searchDistrict: string;
  optionalDetails: string;
  optionalHint: string;
  pincodeLabel: string;
  pincodePlaceholder: string;
  ageLabel: string;
  agePlaceholder: string;
  genderLabel: string;
  genderSelect: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  genderPreferNot: string;
  continueBtn: string;
  backBtn: string;
  reviewHeading: string;
  reviewSubheading: string;
  editBtn: string;
  confirmBtn: string;
  loadingTitle: string;
  loadingStep1: string;
  loadingStep2: string;
  loadingStep3: string;
  loadingStep4: string;
  resultsHeading: string;
  currentWork: string;
  suggestedNextSkill: string;
  recommendedCourse: string;
  skillsToBuild: string;
  skillsToBuildSub: string;
  recommendedCourses: string;
  coursesSub: string;
  trainingCentres: string;
  centresSub: string;
  governmentSupport: string;
  supportSub: string;
  whyThisPathway: string;
  whySub: string;
  evidenceBacked: string;
  evidenceSub: string;
  nextSteps: string;
  nextStepsSub: string;
  distanceExact: string;
  distanceApprox: string;
  distanceUnavailable: string;
  statusEligible: string;
  statusNotEligible: string;
  statusUncertain: string;
  requiredDocs: string;
  viewCourseDetails: string;
  startOver: string;
  errorTitle: string;
  errorMessage: string;
  tryAgain: string;
  demoModeBadge: string;
  demoScenarioSelect: string;
  talkToSkillNavigator: string;
  speakLanguageHint: string;
  tapToSpeak: string;
  listeningState: string;
  processingState: string;
  speakingState: string;
  voiceErrorState: string;
  typeInstead: string;
  sendText: string;
  typeMessagePlaceholder: string;
  closeVoiceAssistant: string;
  listenRecommendations: string;
  voiceModeDevBadge: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'AI Skill Navigator',
    appSubtitle: 'Karnataka Informal Workers Platform',
    tagline: 'Find your next skill. Discover your pathway.',
    heroHeading: 'Find the right skill, course and opportunity for your next step.',
    heroSubheading: 'Built to help informal workers discover practical training opportunities and government support.',
    heroSupporting: 'Grounded in verified training, scheme and institutional information across Karnataka.',
    findMyPathway: 'Find My Pathway',
    howItWorks: 'How It Works',
    trustBanner: 'Grounded in verified government vocational curricula & official welfare schemes.',
    selectLanguage: 'Choose Your Preferred Language',
    selectLanguageSubtitle: 'You can change this at any time during your journey.',
    voiceMode: 'Voice Mode',
    voiceComingSoon: 'Voice mode will be available soon with native speech support.',
    stepIndicator: 'Step',
    stepWorkGoal: 'Work & Goal',
    stepLocation: 'Location',
    stepReview: 'Review',
    occupationHeading: 'What work do you do now?',
    occupationSubheading: 'Tell us in your own words.',
    occupationPlaceholder: 'e.g., I work as a delivery rider, domestic helper, or construction worker...',
    goalHeading: 'What would you like to learn or do next?',
    goalSubheading: 'You can describe your career goal in your own words.',
    goalPlaceholder: 'e.g., I want to learn electrician work, tailoring, or EV repair...',
    districtHeading: 'Which district in Karnataka do you live or work in?',
    districtSubheading: 'Helps find authorized training centres near you.',
    districtSelectPlaceholder: 'Select your district...',
    searchDistrict: 'Search district...',
    optionalDetails: 'Add more details (optional)',
    optionalHint: 'Providing these helps verify specific government welfare schemes.',
    pincodeLabel: 'Pincode (6 digits)',
    pincodePlaceholder: 'e.g. 560001',
    ageLabel: 'Age',
    agePlaceholder: 'e.g. 26',
    genderLabel: 'Gender',
    genderSelect: 'Select gender...',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    genderPreferNot: 'Prefer not to say',
    continueBtn: 'Continue',
    backBtn: 'Back',
    reviewHeading: "Let's make sure we got that right.",
    reviewSubheading: 'Review your details below before generating your verified pathway.',
    editBtn: 'Edit',
    confirmBtn: 'Looks good — Find my pathway',
    loadingTitle: 'Finding the best options for you...',
    loadingStep1: 'Checking your skill pathway...',
    loadingStep2: 'Looking for relevant courses...',
    loadingStep3: 'Finding nearby training options...',
    loadingStep4: 'Checking available support schemes...',
    resultsHeading: 'Your Skill Pathway',
    currentWork: 'Current Work',
    suggestedNextSkill: 'Suggested Next Skill',
    recommendedCourse: 'Recommended Course',
    skillsToBuild: 'Skills to Build',
    skillsToBuildSub: 'Key competencies needed to transition successfully.',
    recommendedCourses: 'Recommended Courses',
    coursesSub: 'Certified vocational qualifications mapped to your trade.',
    trainingCentres: 'Authorized Training Centres',
    centresSub: 'Verified government and empanelled vocational institutes.',
    governmentSupport: 'Government Support & Schemes',
    supportSub: 'Welfare schemes and training subsidies matching your profile.',
    whyThisPathway: 'Why this pathway?',
    whySub: 'Grounded explanation based on state qualification registers.',
    evidenceBacked: 'Evidence-Backed Information',
    evidenceSub: 'Verified official documentation citations and regulatory references.',
    nextSteps: 'Your Next Steps',
    nextStepsSub: 'Simple sequential actions to start your transition.',
    distanceExact: 'away',
    distanceApprox: 'Approximate distance',
    distanceUnavailable: 'Distance unavailable',
    statusEligible: 'Eligible',
    statusNotEligible: 'Not eligible',
    statusUncertain: 'Verification needed',
    requiredDocs: 'Required Documents',
    viewCourseDetails: 'View Curriculum & Details',
    startOver: 'Check Another Profile',
    errorTitle: "Couldn't retrieve recommendations",
    errorMessage: "We couldn't find your recommendations right now. Please check your details and try again.",
    tryAgain: 'Try Again',
    demoModeBadge: 'DEMO MODE',
    demoScenarioSelect: 'Quick Demo Scenario:',
    talkToSkillNavigator: 'Talk to Skill Navigator',
    speakLanguageHint: 'Speak in Kannada, Hindi or English.',
    tapToSpeak: 'Tap to speak',
    listeningState: "I'm listening...",
    processingState: 'Understanding you...',
    speakingState: 'Speaking...',
    voiceErrorState: "I couldn't hear that. Please try again.",
    typeInstead: 'Type instead',
    sendText: 'Send',
    typeMessagePlaceholder: 'Type your message here...',
    closeVoiceAssistant: 'Close Voice Assistant',
    listenRecommendations: 'Listen to Recommendations',
    voiceModeDevBadge: 'Voice Companion',
  },
  kn: {
    appName: 'ಎಐ ಕೌಶಲ್ಯ ಮಾರ್ಗದರ್ಶಿ',
    appSubtitle: 'ಕರ್ನಾಟಕದ ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರ ವೇದಿಕೆ',
    tagline: 'ನಿಮ್ಮ ಮುಂದಿನ ಕೌಶಲ್ಯ ಕಂಡುಕೊಳ್ಳಿ. ಉಜ್ವಲ ಭವಿಷ್ಯ ನಿರ್ಮಿಸಿ.',
    heroHeading: 'ನಿಮ್ಮ ಮುಂದಿನ ಹಂತಕ್ಕೆ ಸರಿಯಾದ ಕೌಶಲ್ಯ, ತರಬೇತಿ ಮತ್ತು ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ.',
    heroSubheading: 'ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರಿಗೆ ಉಚಿತ ತರಬೇತಿ ಮತ್ತು ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳನ್ನು ತಲುಪಿಸಲು ನಿರ್ಮಿಸಲಾಗಿದೆ.',
    heroSupporting: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಅಧಿಕೃತ ತರಬೇತಿ ಸಂಸ್ಥೆಗಳು ಮತ್ತು ಯೋಜನೆಗಳ ಮಾಹಿತಿಯೊಂದಿಗೆ.',
    findMyPathway: 'ನನ್ನ ಮಾರ್ಗ ಕಂಡುಕೊಳ್ಳಿ',
    howItWorks: 'ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
    trustBanner: 'ಅಧಿಕೃತ ವೃತ್ತಿಪರ ಪಠ್ಯಕ್ರಮ ಮತ್ತು ಸರ್ಕಾರಿ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳ ಆಧಾರಿತ ಮಾಹಿತಿ.',
    selectLanguage: 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    selectLanguageSubtitle: 'ನಿಮ್ಮ ಪ್ರಯಾಣದ ಯಾವುದೇ ಹಂತದಲ್ಲೂ ಭಾಷೆ ಬದಲಾಯಿಸಬಹುದು.',
    voiceMode: 'ಧ್ವನಿ ಮಾದರಿ (Voice Mode)',
    voiceComingSoon: 'ಧ್ವನಿ ಮೂಲಕ ಸಂಭಾಷಣೆ ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯವಾಗಲಿದೆ.',
    stepIndicator: 'ಹಂತ',
    stepWorkGoal: 'ಕೆಲಸ ಮತ್ತು ಗುರಿ',
    stepLocation: 'ಸ್ಥಳ',
    stepReview: 'ಪರಿಶೀಲನೆ',
    occupationHeading: 'ನೀವು ಪ್ರಸ್ತುತ ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ?',
    occupationSubheading: 'ನಿಮ್ಮ ಸ್ವಂತ ಮಾತುಗಳಲ್ಲಿ ತಿಳಿಸಿ.',
    occupationPlaceholder: 'ಉದಾ: ಡೆಲಿವರಿ ಬಾಯ್, ಮನೆ ಕೆಲಸ, ಕಟ್ಟಡ ಕಾರ್ಮಿಕ, ಚಾಲಕ...',
    goalHeading: 'ನೀವು ಮುಂದೆ ಏನನ್ನು ಕಲಿಯಲು ಅಥವಾ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',
    goalSubheading: 'ನಿಮ್ಮ ಗುರಿಯನ್ನು ನಿಮ್ಮದೇ ಮಾತುಗಳಲ್ಲಿ ವಿವರಿಸಿ.',
    goalPlaceholder: 'ಉದಾ: ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಕೆಲಸ ಕಲಿಯಬೇಕು, ಟೈಲರಿಂಗ್, ಇವಿ ರಿಪೇರಿ...',
    districtHeading: 'ನೀವು ಕರ್ನಾಟಕದ ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದೀರಿ ಅಥವಾ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ?',
    districtSubheading: 'ನಿಮ್ಮ ಸಮೀಪದ ಅಧಿಕೃತ ತರಬೇತಿ ಕೇಂದ್ರಗಳನ್ನು ಹುಡುಕಲು ನೆರವಾಗುತ್ತದೆ.',
    districtSelectPlaceholder: 'ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ...',
    searchDistrict: 'ಜಿಲ್ಲೆಯನ್ನು ಹುಡುಕಿ...',
    optionalDetails: 'ಹೆಚ್ಚಿನ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)',
    optionalHint: 'ಈ ವಿವರಗಳನ್ನು ನೀಡುವುದರಿಂದ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸಲು ಸುಲಭವಾಗುತ್ತದೆ.',
    pincodeLabel: 'ಪಿನ್‌ಕೋಡ್ (೬ ಅಂಕಿಗಳು)',
    pincodePlaceholder: 'ಉದಾ: ೫೬೦೦೦೧',
    ageLabel: 'ವಯಸ್ಸು',
    agePlaceholder: 'ಉದಾ: ೨೬',
    genderLabel: 'ಲಿಂಗ',
    genderSelect: 'ಲಿಂಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ...',
    genderMale: 'ಪುರುಷ',
    genderFemale: 'ಮಹಿಳೆ',
    genderOther: 'ಇತರೆ',
    genderPreferNot: 'ತಿಳಿಸಲು ಇಚ್ಛಿಸುವುದಿಲ್ಲ',
    continueBtn: 'ಮುಂದೆ',
    backBtn: 'ಹಿಂದೆ',
    reviewHeading: 'ನೀವು ನಮೂದಿಸಿದ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ.',
    reviewSubheading: 'ನಿಮ್ಮ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯುವ ಮೊದಲು ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ.',
    editBtn: 'ತಿದ್ದುಪಡಿ ಮಾಡಿ',
    confirmBtn: 'ಸರಿಯಾಗಿದೆ — ನನ್ನ ಮಾರ್ಗ ತೋರಿಸಿ',
    loadingTitle: 'ನಿಮಗಾಗಿ ಸೂಕ್ತ ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    loadingStep1: 'ನಿಮ್ಮ ಕೌಶಲ್ಯ ಮಾರ್ಗವನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    loadingStep2: 'ಸೂಕ್ತ ತರಬೇತಿ ಕೋರ್ಸ್‌ಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    loadingStep3: 'ಸಮೀಪದ ಅಧಿಕೃತ ತರಬೇತಿ ಸಂಸ್ಥೆಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    loadingStep4: 'ಲಭ್ಯವಿರುವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    resultsHeading: 'ನಿಮ್ಮ ಕೌಶಲ್ಯ ಮಾರ್ಗ',
    currentWork: 'ಪ್ರಸ್ತುತ ಕೆಲಸ',
    suggestedNextSkill: 'ಮುಂದಿನ ಕೌಶಲ್ಯ',
    recommendedCourse: 'ಶಿಫಾರಸು ಮಾಡಿದ ತರಬೇತಿ',
    skillsToBuild: 'ಕಲಿಯಬೇಕಾದ ಕೌಶಲ್ಯಗಳು',
    skillsToBuildSub: 'ಉನ್ನತ ಕೆಲಸಕ್ಕೆ ತೆರಳಲು ಅಗತ್ಯವಾದ ಪ್ರಮುಖ ಸಾಮರ್ಥ್ಯಗಳು.',
    recommendedCourses: 'ಅಧಿಕೃತ ತರಬೇತಿ ಕೋರ್ಸ್‌ಗಳು',
    coursesSub: 'ಸರ್ಕಾರದಿಂದ ಪ್ರಮಾಣೀಕರಿಸಲಾದ ವೃತ್ತಿಪರ ಕೋರ್ಸ್‌ಗಳು.',
    trainingCentres: 'ಅಧಿಕೃತ ತರಬೇತಿ ಕೇಂದ್ರಗಳು',
    centresSub: 'ಸರ್ಕಾರಿ ಐಟಿಐ ಮತ್ತು ಮಾನ್ಯತೆ ಪಡೆದ ತರಬೇತಿ ಸಂಸ್ಥೆಗಳು.',
    governmentSupport: 'ಸರ್ಕಾರಿ ನೆರವು ಮತ್ತು ಯೋಜನೆಗಳು',
    supportSub: 'ನಿಮ್ಮ ವಿವರಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಕಲ್ಯಾಣ ಮತ್ತು ಧನಸಹಾಯ ಯೋಜನೆಗಳು.',
    whyThisPathway: 'ಈ ಮಾರ್ಗವನ್ನು ಏಕೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ?',
    whySub: 'ಅಧಿಕೃತ ಶೈಕ್ಷಣಿಕ ದಾಖಲೆಗಳು ಮತ್ತು ಉದ್ಯೋಗ ಮಾರುಕಟ್ಟೆ ಆಧಾರಿತ ವಿವರಣೆ.',
    evidenceBacked: 'ಅಧಿಕೃತ ಆಧಾರಿತ ಮಾಹಿತಿ',
    evidenceSub: 'ಸರ್ಕಾರಿ ಗೆಜೆಟ್‌ಗಳು ಮತ್ತು ಅಧಿಕೃತ ಮೂಲಗಳಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ.',
    nextSteps: 'ನಿಮ್ಮ ಮುಂದಿನ ಹಂತಗಳು',
    nextStepsSub: 'ನಿಮ್ಮ ತರಬೇತಿ ಆರಂಭಿಸಲು ಸರಳ ಕ್ರಮಗಳು.',
    distanceExact: 'ದೂರದಲ್ಲಿದೆ',
    distanceApprox: 'ಅಂದಾಜು ದೂರ',
    distanceUnavailable: 'ದೂರ ಲಭ್ಯವಿಲ್ಲ',
    statusEligible: 'ಅರ್ಹರು',
    statusNotEligible: 'ಅರ್ಹರಲ್ಲ',
    statusUncertain: 'ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ',
    requiredDocs: 'ಅಗತ್ಯ ದಾಖಲೆಗಳು',
    viewCourseDetails: 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    startOver: 'ಮತ್ತೊಂದು ಪ್ರೊಫೈಲ್ ಪರೀಕ್ಷಿಸಿ',
    errorTitle: 'ಮಾಹಿತಿ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ',
    errorMessage: 'ಪ್ರಸ್ತುತ ವಿವರಗಳನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.',
    tryAgain: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    demoModeBadge: 'ಡೆಮೊ ಮೋಡ್',
    demoScenarioSelect: 'ಶೀಘ್ರ ಡೆಮೊ ಉದಾಹರಣೆ:',
    talkToSkillNavigator: 'ಸ್ಕಿಲ್ ನ್ಯಾವಿಗೇಟರ್ ಜೊತೆ ಮಾತನಾಡಿ',
    speakLanguageHint: 'ಕನ್ನಡ, ಹಿಂದಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ.',
    tapToSpeak: 'ಮಾತನಾಡಲು ಒತ್ತಿರಿ',
    listeningState: 'ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ...',
    processingState: 'ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ...',
    speakingState: 'ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ...',
    voiceErrorState: 'ನನಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.',
    typeInstead: 'ಬರೆಯಿರಿ',
    sendText: 'ಕಳುಹಿಸಿ',
    typeMessagePlaceholder: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...',
    closeVoiceAssistant: 'ಧ್ವನಿ ಸಹಾಯಕವನ್ನು ಮುಚ್ಚಿ',
    listenRecommendations: 'ಶಿಫಾರಸುಗಳನ್ನು ಆಲಿಸಿ',
    voiceModeDevBadge: 'ಧ್ವನಿ ಸಹಾಯಕ',
  },
  hi: {
    appName: 'एआई स्किल नेविगेटर',
    appSubtitle: 'कर्नाटक अनौपचारिक श्रमिक मंच',
    tagline: 'अपना अगला हुनर खोजें। अपनी राह बनाएं।',
    heroHeading: 'अपने अगले कदम के लिए सही कौशल, पाठ्यक्रम और अवसर खोजें।',
    heroSubheading: 'अनौपचारिक श्रमिकों को व्यावहारिक प्रशिक्षण अवसर और सरकारी सहायता खोजने में मदद करने के लिए निर्मित।',
    heroSupporting: 'कर्नाटक भर में सत्यापित प्रशिक्षण और सरकारी योजनाओं की जानकारी पर आधारित।',
    findMyPathway: 'मेरी राह खोजें',
    howItWorks: 'यह कैसे काम करता है',
    trustBanner: 'सत्यापित सरकारी व्यावसायिक पाठ्यक्रम और कल्याण योजनाओं पर आधारित जानकारी।',
    selectLanguage: 'अपनी पसंदीदा भाषा चुनें',
    selectLanguageSubtitle: 'आप इसे कभी भी बदल सकते हैं।',
    voiceMode: 'वॉइस मोड',
    voiceComingSoon: 'मूल भाषा में वॉइस मोड जल्द ही उपलब्ध होगा।',
    stepIndicator: 'चरण',
    stepWorkGoal: 'कार्य और लक्ष्य',
    stepLocation: 'स्थान',
    stepReview: 'समीक्षा',
    occupationHeading: 'आप अभी क्या काम करते हैं?',
    occupationSubheading: 'अपने शब्दों में बताएं।',
    occupationPlaceholder: 'जैसे: डिलीवरी राइडर, घरेलू काम, निर्माण कार्य, ऑटो चालक...',
    goalHeading: 'आप आगे क्या सीखना या करना चाहते हैं?',
    goalSubheading: 'अपने लक्ष्य का अपने शब्दों में वर्णन करें।',
    goalPlaceholder: 'जैसे: इलेक्ट्रीशियन का काम सीखना, सिलाई, ईवी रिपेयर...',
    districtHeading: 'आप कर्नाटक के किस जिले में रहते या काम करते हैं?',
    districtSubheading: 'आपके पास अधिकृत प्रशिक्षण केंद्र खोजने में मदद करता है।',
    districtSelectPlaceholder: 'अपना जिला चुनें...',
    searchDistrict: 'जिला खोजें...',
    optionalDetails: 'अधिक विवरण जोड़ें (वैकल्पिक)',
    optionalHint: 'इनसे विशिष्ट सरकारी कल्याण योजनाओं की पात्रता जांचने में मदद मिलती है।',
    pincodeLabel: 'पिनकोड (6 अंक)',
    pincodePlaceholder: 'उदा. 560001',
    ageLabel: 'उम्र',
    agePlaceholder: 'उदा. 26',
    genderLabel: 'लिंग',
    genderSelect: 'लिंग चुनें...',
    genderMale: 'पुरुष',
    genderFemale: 'महिला',
    genderOther: 'अन्य',
    genderPreferNot: 'बताना नहीं चाहते',
    continueBtn: 'आगे बढ़ें',
    backBtn: 'पीछे',
    reviewHeading: 'आइए सुनिश्चित करें कि सब सही है।',
    reviewSubheading: 'सिफारिशें देखने से पहले अपने विवरण की समीक्षा करें।',
    editBtn: 'संशोधित करें',
    confirmBtn: 'सब सही है — मेरी राह दिखाएं',
    loadingTitle: 'आपके लिए सर्वश्रेष्ठ विकल्प खोज रहे हैं...',
    loadingStep1: 'आपके कौशल मार्ग की जांच हो रही है...',
    loadingStep2: 'प्रासंगिक पाठ्यक्रमों की खोज जारी है...',
    loadingStep3: 'नजदीकी प्रशिक्षण केंद्र ढूंढे जा रहे हैं...',
    loadingStep4: 'उपलब्ध सरकारी योजनाओं की जांच हो रही है...',
    resultsHeading: 'आपकी कौशल राह',
    currentWork: 'वर्तमान कार्य',
    suggestedNextSkill: 'सुझाया गया अगला कौशल',
    recommendedCourse: 'अनुशंसित कोर्स',
    skillsToBuild: 'सीखने योग्य कौशल',
    skillsToBuildSub: 'सफल करियर बदलाव के लिए आवश्यक मुख्य क्षमताएं।',
    recommendedCourses: 'अनुशंसित पाठ्यक्रम',
    coursesSub: 'सत्यापित और मान्यता प्राप्त व्यावसायिक योग्यताएं।',
    trainingCentres: 'अधिकृत प्रशिक्षण केंद्र',
    centresSub: 'सरकारी आईटीआई और सूचीबद्ध संस्थान।',
    governmentSupport: 'सरकारी सहायता एवं योजनाएं',
    supportSub: 'आपकी प्रोफाइल से मेल खाने वाली कल्याणकारी योजनाएं।',
    whyThisPathway: 'यह रास्ता क्यों?',
    whySub: 'सत्यापित दस्तावेजों और सरकारी नियमों पर आधारित स्पष्टीकरण।',
    evidenceBacked: 'प्रमाण-आधारित जानकारी',
    evidenceSub: 'सरकारी राजपत्रों और आधिकारिक स्रोतों से सत्यापित उद्धरण।',
    nextSteps: 'आपके अगले कदम',
    nextStepsSub: 'अपनी यात्रा शुरू करने के लिए सरल चरणबद्ध कार्य।',
    distanceExact: 'दूरी पर',
    distanceApprox: 'अनुमानित दूरी',
    distanceUnavailable: 'दूरी उपलब्ध नहीं',
    statusEligible: 'पात्र',
    statusNotEligible: 'अपात्र',
    statusUncertain: 'सत्यापन आवश्यक',
    requiredDocs: 'आवश्यक दस्तावेज',
    viewCourseDetails: 'पाठ्यक्रम विवरण देखें',
    startOver: 'अन्य प्रोफाइल जांचें',
    errorTitle: 'जानकारी प्राप्त नहीं हो सकी',
    errorMessage: 'हम अभी सिफारिशें प्राप्त नहीं कर सके। कृपया विवरण जांचकर पुनः प्रयास करें।',
    tryAgain: 'पुनः प्रयास करें',
    demoModeBadge: 'डेमो मोड',
    demoScenarioSelect: 'त्वरित डेमो परिदृश्य:',
    talkToSkillNavigator: 'स्किल नेविगेटर से बात करें',
    speakLanguageHint: 'कन्नड़, हिंदी या अंग्रेजी में बोलें।',
    tapToSpeak: 'बोलने के लिए टैप करें',
    listeningState: 'मैं सुन रहा हूँ...',
    processingState: 'समझ रहा हूँ...',
    speakingState: 'बोल रहा हूँ...',
    voiceErrorState: 'मैं ठीक से सुन नहीं पाया। कृपया पुनः प्रयास करें।',
    typeInstead: 'टाइप करें',
    sendText: 'भेजें',
    typeMessagePlaceholder: 'अपना संदेश यहाँ लिखें...',
    closeVoiceAssistant: 'वॉइस सहायक बंद करें',
    listenRecommendations: 'सिफारिशें सुनें',
    voiceModeDevBadge: 'वॉइस साथी',
  },
};
