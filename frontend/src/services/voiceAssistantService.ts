/**
 * Voice Assistant Service — AI Skill Navigator (Phase 7)
 *
 * Implements:
 * 1. Adaptive conversational state machine (one question at a time).
 * 2. Strict conceptual voice states: IDLE, LISTENING, PROCESSING, SPEAKING, ERROR.
 * 3. Natural speech intent parsing (affirmation, negation, "I don't know", repeat, go back, correction, language switch, simplify, stop).
 * 4. Progressive recommendation explanation (Options -> Course -> Centre -> Scheme -> Next steps).
 * 5. Audio engine abstraction: Whisper STT (/api/voice/transcribe) + Gemini TTS (/api/voice/synthesize) + Browser/Mock fallback + Text fallback.
 * 6. Low-literacy design: 1-3 short sentences, zero technical jargon.
 */

import { SupportedLanguage, WorkerProfileIn, RecommendationResponse } from '../types/recommendation';

export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export type DialogueStep =
  | 'WELCOME'
  | 'LANGUAGE'
  | 'OCCUPATION'
  | 'OCCUPATION_CONFIRM'
  | 'GOAL'
  | 'GOAL_CONFIRM'
  | 'DISTRICT'
  | 'DISTRICT_CONFIRM'
  | 'REVIEW'
  | 'RECOMMENDING'
  | 'PROGRESSIVE_OVERVIEW'
  | 'PROGRESSIVE_COURSE'
  | 'PROGRESSIVE_CENTRE'
  | 'PROGRESSIVE_SCHEME'
  | 'PROGRESSIVE_NEXT_STEPS'
  | 'COMPLETED'
  | 'STOPPED';

export interface VoiceAssistantMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  audioBase64?: string;
  timestamp: number;
}

export interface VoiceAssistantState {
  voiceState: VoiceState;
  dialogueStep: DialogueStep;
  messages: VoiceAssistantMessage[];
  currentTranscript: string;
  lastAssistantSpeech: string;
  pendingValue?: string;
  profile: WorkerProfileIn;
  recommendation: RecommendationResponse | null;
  errorMessage?: string;
  quickReplies: string[];
}

export type StateListener = (state: VoiceAssistantState) => void;

// Canonical Karnataka districts for fuzzy matching
const KARNATAKA_DISTRICTS = [
  'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagara', 'Chikkaballapura', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Vijayapura', 'Yadgir'
];

export class VoiceAssistantService {
  private state: VoiceAssistantState;
  private listeners: Set<StateListener> = new Set();
  private language: SupportedLanguage = 'en';
  private speechRecognition: any = null;
  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private isSynthesisSpeaking: boolean = false;
  private onRequestRecommendations?: (profile: WorkerProfileIn) => Promise<RecommendationResponse>;

  constructor(
    initialLanguage: SupportedLanguage = 'en',
    initialProfile?: Partial<WorkerProfileIn>,
    onRequestRecommendations?: (profile: WorkerProfileIn) => Promise<RecommendationResponse>
  ) {
    this.language = initialLanguage;
    this.onRequestRecommendations = onRequestRecommendations;

    this.state = {
      voiceState: 'IDLE',
      dialogueStep: 'WELCOME',
      messages: [],
      currentTranscript: '',
      lastAssistantSpeech: '',
      profile: {
        occupation: initialProfile?.occupation || '',
        career_goal_text: initialProfile?.career_goal_text || '',
        district: initialProfile?.district || '',
        pincode: initialProfile?.pincode || null,
        age: initialProfile?.age || null,
        gender: initialProfile?.gender || null,
        latitude: null, // Strictly null - never fabricate
        longitude: null, // Strictly null - never fabricate
        session_id: initialProfile?.session_id || `sess_voice_${Date.now()}`,
      },
      recommendation: null,
      quickReplies: ['Start', 'ಕನ್ನಡ', 'हिन्दी'],
    };

    this.initWebSpeech();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  public setLanguage(lang: SupportedLanguage) {
    this.language = lang;
    this.state.profile.language = lang === 'kn' ? 'Kannada' : lang === 'hi' ? 'Hindi' : 'English';
    this.notify();
  }

  public getLanguage(): SupportedLanguage {
    return this.language;
  }

  public getState(): VoiceAssistantState {
    return { ...this.state };
  }

  /**
   * Initialize browser SpeechRecognition if available (for Development / Demo mode)
   */
  private initWebSpeech() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.speechRecognition = new SpeechRecognition();
          this.speechRecognition.continuous = false;
          this.speechRecognition.interimResults = true;

          this.speechRecognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcript += event.results[i][0].transcript;
            }
            this.state.currentTranscript = transcript;
            this.notify();

            if (event.results[0].isFinal) {
              this.handleUserInput(transcript.trim());
            }
          };

          this.speechRecognition.onerror = (event: any) => {
            console.warn('[VoiceAssistant] Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
              this.state.voiceState = 'ERROR';
              this.state.errorMessage = this.getLocalizedText({
                en: "I couldn't hear that clearly. Please try again or type below.",
                kn: "ನನಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಬರೆಯಿರಿ.",
                hi: "मैं ठीक से सुन नहीं पाया। कृपया पुनः प्रयास करें या नीचे टाइप करें।",
              });
              this.notify();
            } else {
              this.state.voiceState = 'IDLE';
              this.notify();
            }
          };

          this.speechRecognition.onend = () => {
            if (this.state.voiceState === 'LISTENING') {
              this.state.voiceState = 'IDLE';
              this.notify();
            }
          };
        } catch (e) {
          console.warn('[VoiceAssistant] Web speech recognition init failed:', e);
        }
      }
    }
  }

  /**
   * Start initial greeting and dialogue flow
   */
  public startConversation() {
    this.state.dialogueStep = 'WELCOME';
    this.state.messages = [];
    const welcomeMsg = this.getLocalizedText({
      en: "Namaskara! I am your Skill Navigator. I can help you find suitable skills, training centres near you, and government support. What work do you currently do?",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸ್ಕಿಲ್ ನ್ಯಾವಿಗೇಟರ್. ಸೂಕ್ತವಾದ ಕೌಶಲ್ಯಗಳು, ಹತ್ತಿರದ ತರಬೇತಿ ಕೇಂದ್ರಗಳು ಮತ್ತು ಸರ್ಕಾರಿ ಬೆಂಬಲವನ್ನು ಹುಡುಕಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನೀವು ಪ್ರಸ್ತುತ ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ?",
      hi: "नमस्कार! मैं आपका स्किल नेविगेटर हूँ। मैं आपके लिए सही कौशल, नजदीکی प्रशिक्षण केंद्र और सरकारी योजनाएं खोजने में मदद कर सकता हूँ। आप अभी कौन सा काम करते हैं?",
    });

    this.speakAndRecord(welcomeMsg, 'OCCUPATION', [
      'Delivery Rider',
      'Auto Driver',
      'Construction Labourer',
      'Domestic Worker',
    ]);
  }

  /**
   * Primary voice interaction button handler: Toggle Listening
   */
  public toggleListening() {
    if (this.state.voiceState === 'LISTENING') {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  public async startListening() {
    if (this.isSynthesisSpeaking) {
      if (this.currentAudioElement) {
        try {
          this.currentAudioElement.pause();
          this.currentAudioElement = null;
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      this.isSynthesisSpeaking = false;
    }

    this.state.voiceState = 'LISTENING';
    this.state.currentTranscript = '';
    this.state.errorMessage = undefined;
    this.notify();

    // 1. Try MediaRecorder for Whisper STT
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof (window as any).MediaRecorder !== 'undefined'
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioChunks = [];
        const recorder = new (window as any).MediaRecorder(stream);
        this.mediaRecorder = recorder;

        recorder.ondataavailable = (event: any) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          try {
            stream.getTracks().forEach((track) => track.stop());
          } catch (e) {}

          if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            await this.sendAudioToWhisper(audioBlob);
          } else {
            this.state.voiceState = 'IDLE';
            this.notify();
          }
        };

        recorder.start(250);
        return;
      } catch (err) {
        console.warn('[VoiceAssistant] MediaRecorder unavailable or microphone denied, using fallback:', err);
      }
    }

    // 2. Fallback via browser SpeechRecognition (for environments without MediaRecorder)
    if (this.speechRecognition) {
      try {
        const langMap: Record<SupportedLanguage, string> = {
          en: 'en-IN',
          kn: 'kn-IN',
          hi: 'hi-IN',
        };
        this.speechRecognition.lang = langMap[this.language] || 'en-IN';
        this.speechRecognition.start();
      } catch (err) {}
    } else {
      this.state.voiceState = 'IDLE';
      this.state.errorMessage = this.getLocalizedText({
        en: 'Microphone is unavailable. You can use the text input below.',
        kn: 'ಮೈಕ್ರೊಫೋನ್ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಪಠ್ಯ ಇನ್‌ಪುಟ್ ಬಳಸಿ.',
        hi: 'माइक उपलब्ध नहीं है। कृपया नीचे टेक्स्ट इनपुट का उपयोग करें।',
      });
      this.notify();
    }
  }

  public stopListening() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
        this.state.voiceState = 'PROCESSING';
        this.notify();
        return;
      } catch (err) {}
    }

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (err) {}
    }
    this.state.voiceState = 'IDLE';
    this.notify();
  }

  private async sendAudioToWhisper(blob: Blob) {
    this.state.voiceState = 'PROCESSING';
    this.notify();

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resultStr = (reader.result as string) || '';
        const base64Audio = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;

        try {
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio_base64: base64Audio,
              language: this.language,
              session_id: this.state.profile.session_id,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.transcript && data.transcript.trim()) {
              await this.handleUserInput(data.transcript.trim());
              return;
            }
          }
        } catch (apiErr) {
          console.warn('[VoiceAssistant] Whisper API call failed:', apiErr);
        }

        // Graceful error state with text fallback
        this.state.voiceState = 'ERROR';
        this.state.errorMessage = this.getLocalizedText({
          en: "I couldn't hear that clearly. Please try again or type below.",
          kn: "ನನಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಬರೆಯಿರಿ.",
          hi: "मैं ठीक से सुन नहीं पाया। कृपया पुनः प्रयास करें या नीचे टाइप करें।",
        });
        this.notify();
      };
      reader.readAsDataURL(blob);
    } catch (readErr) {
      this.state.voiceState = 'IDLE';
      this.notify();
    }
  }

  /**
   * Receive user input either from SpeechRecognition or direct text fallback
   */
  public async handleUserInput(rawText: string) {
    if (!rawText || !rawText.trim()) return;
    const text = rawText.trim();

    // 1. Visually record user speech / input
    this.state.messages.push({
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    });
    this.state.currentTranscript = '';
    this.state.voiceState = 'PROCESSING';
    this.notify();

    // Small processing pause for natural conversational cadence
    await new Promise((r) => setTimeout(r, 400));

    // 2. Global Conversational Commands (Language, Repeat, Go Back, Stop, Simplify)
    const lower = text.toLowerCase();

    // Stop / Exit
    if (
      lower === 'stop' ||
      lower === 'exit' ||
      lower === 'later' ||
      lower.includes('stop') ||
      lower.includes('nillisi') ||
      lower.includes('bandh')
    ) {
      const stopMsg = this.getLocalizedText({
        en: 'Sure, we can pause here. Whenever you are ready, tap the microphone to continue.',
        kn: 'ಖಂಡಿತ, ನಾವು ಇಲ್ಲಿ ನಿಲ್ಲಿಸಬಹುದು. ನೀವು ಸಿದ್ಧರಾದಾಗ ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿರಿ.',
        hi: 'ज़रूर, हम यहाँ रुक सकते हैं। जब भी आप तैयार हों, जारी रखने के लिए माइक दबाएँ।',
      });
      this.speakAndRecord(stopMsg, 'STOPPED', ['Start Again']);
      return;
    }

    // Language Switching (Preserves profile data completely)
    if (
      lower.includes('speak kannada') ||
      lower.includes('kannada alli') ||
      lower === 'kannada' ||
      lower === 'ಕನ್ನಡ'
    ) {
      this.setLanguage('kn');
      const switchMsg = 'ಖಂಡಿತ, ನಾವು ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಸೋಣ. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಿವರಗಳನ್ನು ಉಳಿಸಿಕೊಳ್ಳಲಾಗಿದೆ.';
      this.speakAndRecord(switchMsg, this.state.dialogueStep, this.state.quickReplies);
      return;
    }
    if (
      lower.includes('speak hindi') ||
      lower.includes('hindi mein') ||
      lower === 'hindi' ||
      lower === 'हिन्दी' ||
      lower === 'हिंदी'
    ) {
      this.setLanguage('hi');
      const switchMsg = 'ज़रूर, अब हम हिंदी में बात करेंगे। आपकी पिछली जानकारी सुरक्षित है।';
      this.speakAndRecord(switchMsg, this.state.dialogueStep, this.state.quickReplies);
      return;
    }
    if (
      lower.includes('speak english') ||
      lower === 'english' ||
      lower.includes('in english')
    ) {
      this.setLanguage('en');
      const switchMsg = 'Sure, let us continue in English. Your profile information is preserved.';
      this.speakAndRecord(switchMsg, this.state.dialogueStep, this.state.quickReplies);
      return;
    }

    // Repeat last speech
    if (
      lower.includes('repeat') ||
      lower.includes('again') ||
      lower === 'what' ||
      lower.includes("didn't understand") ||
      lower.includes('motte heli') ||
      lower.includes('phir se')
    ) {
      if (this.state.lastAssistantSpeech) {
        this.speak(this.state.lastAssistantSpeech);
      }
      this.state.voiceState = 'IDLE';
      this.notify();
      return;
    }

    // Go Back
    if (
      lower.includes('go back') ||
      lower.includes('previous') ||
      lower === 'back' ||
      lower.includes('hinde') ||
      lower.includes('peeche')
    ) {
      this.handleGoBack();
      return;
    }

    // Simplify explanation
    if (
      lower.includes('simplify') ||
      lower.includes('easy words') ||
      lower.includes('samajh nahi') ||
      lower.includes('arthavaglilla')
    ) {
      this.handleSimplify();
      return;
    }

    // 3. Step-by-Step Adaptive Dialogue Handling
    switch (this.state.dialogueStep) {
      case 'WELCOME':
      case 'LANGUAGE':
        this.askOccupation();
        break;

      case 'OCCUPATION':
        this.handleOccupationInput(text);
        break;

      case 'OCCUPATION_CONFIRM':
        this.handleOccupationConfirm(text);
        break;

      case 'GOAL':
        this.handleGoalInput(text);
        break;

      case 'GOAL_CONFIRM':
        this.handleGoalConfirm(text);
        break;

      case 'DISTRICT':
        this.handleDistrictInput(text);
        break;

      case 'DISTRICT_CONFIRM':
        this.handleDistrictConfirm(text);
        break;

      case 'REVIEW':
        this.handleReviewConfirm(text);
        break;

      case 'PROGRESSIVE_OVERVIEW':
        this.handleProgressiveNext('PROGRESSIVE_COURSE', text);
        break;

      case 'PROGRESSIVE_COURSE':
        this.handleProgressiveNext('PROGRESSIVE_CENTRE', text);
        break;

      case 'PROGRESSIVE_CENTRE':
        this.handleProgressiveNext('PROGRESSIVE_SCHEME', text);
        break;

      case 'PROGRESSIVE_SCHEME':
        this.handleProgressiveNext('PROGRESSIVE_NEXT_STEPS', text);
        break;

      case 'PROGRESSIVE_NEXT_STEPS':
      case 'COMPLETED':
      case 'STOPPED':
        if (this.isAffirmative(text) || lower.includes('start') || lower.includes('again')) {
          this.startConversation();
        } else {
          this.state.voiceState = 'IDLE';
          this.notify();
        }
        break;

      default:
        this.state.voiceState = 'IDLE';
        this.notify();
        break;
    }
  }

  // --- Step Handlers ---

  private askOccupation() {
    const prompt = this.getLocalizedText({
      en: 'What work are you currently doing? For example: delivery rider, auto driver, or construction worker.',
      kn: 'ನೀವು ಪ್ರಸ್ತುತ ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ? ಉದಾಹರಣೆಗೆ: ಡೆಲಿವರಿ ರೈಡರ್, ಆಟೋ ಚಾಲಕ ಅಥವಾ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕ.',
      hi: 'आप वर्तमान में क्या काम करते हैं? जैसे: डिलीवरी राइडर, ऑटो चालक, या निर्माण श्रमिक।',
    });
    this.speakAndRecord(prompt, 'OCCUPATION', [
      'Delivery Rider',
      'Auto Driver',
      'Construction Labourer',
      'Domestic Worker',
    ]);
  }

  private handleOccupationInput(text: string) {
    const normalized = this.normalizeOccupation(text);
    this.state.pendingValue = normalized;

    const confirmPrompt = this.getLocalizedText({
      en: `I understood that you work as a ${normalized}. Is that correct?`,
      kn: `ನೀವು ${normalized} ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ ಎಂದು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ. ಇದು ಸರಿಯೇ?`,
      hi: `मैं समझा कि आप ${normalized} का काम करते हैं। क्या यह सही है?`,
    });

    this.speakAndRecord(confirmPrompt, 'OCCUPATION_CONFIRM', ['Yes', 'No', 'Change Work']);
  }

  private handleOccupationConfirm(text: string) {
    if (this.isAffirmative(text)) {
      this.state.profile.occupation = this.state.pendingValue || this.state.profile.occupation;
      this.state.pendingValue = undefined;

      const goalPrompt = this.getLocalizedText({
        en: "What would you like to learn or do next? If you are not sure, you can say 'I don't know'.",
        kn: "ಮುಂದೆ ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಅಥವಾ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? ನಿಮಗೆ ಖಚಿತವಿಲ್ಲದಿದ್ದರೆ, 'ಗೊತ್ತಿಲ್ಲ' ಎಂದು ಹೇಳಬಹುದು.",
        hi: "आगे आप क्या सीखना या करना चाहते हैं? यदि आपको पता नहीं है, तो आप 'मुझे नहीं पता' कह सकते हैं।",
      });

      this.speakAndRecord(goalPrompt, 'GOAL', [
        'Electrician',
        'EV Service Technician',
        "I don't know",
      ]);
    } else {
      const retryPrompt = this.getLocalizedText({
        en: 'No problem. Please tell me what work you do.',
        kn: 'ಪರವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ನೀವು ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ ಎಂದು ಹೇಳಿ.',
        hi: 'कोई बात नहीं। कृपया मुझे बताएं कि आप क्या काम करते हैं।',
      });
      this.speakAndRecord(retryPrompt, 'OCCUPATION', [
        'Delivery Rider',
        'Auto Driver',
        'Construction Labourer',
      ]);
    }
  }

  private handleGoalInput(text: string) {
    // CRITICAL: "I don't know" handling
    if (this.isDontKnow(text)) {
      this.state.profile.career_goal_text = 'I want suggestions based on my current work';
      const dontKnowMsg = this.getLocalizedText({
        en: "That's okay. I can suggest options based on the work you do now. Which district in Karnataka are you located in?",
        kn: 'ಪರವಾಗಿಲ್ಲ. ನೀವು ಈಗ ಮಾಡುತ್ತಿರುವ ಕೆಲಸದ ಆಧಾರದ ಮೇಲೆ ನಾನು ಆಯ್ಕೆಗಳನ್ನು ಸೂಚಿಸುತ್ತೇನೆ. ನೀವು ಕರ್ನಾಟಕದ ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದ್ದೀರಿ?',
        hi: 'कोई बात नहीं। आप अभी जो काम करते हैं, उसके आधार पर मैं विकल्प सुझा सकता हूँ। आप कर्नाटक के किस जिले में हैं?',
      });
      this.speakAndRecord(dontKnowMsg, 'DISTRICT', [
        'Bengaluru Urban',
        'Mysuru',
        'Belagavi',
        'Dakshina Kannada',
      ]);
      return;
    }

    const normalizedGoal = this.normalizeGoal(text);
    this.state.pendingValue = normalizedGoal;

    const confirmGoalPrompt = this.getLocalizedText({
      en: `I understood that you want to learn ${normalizedGoal}. Is that correct?`,
      kn: `ನೀವು ${normalizedGoal} ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ. ಇದು ಸರಿಯೇ?`,
      hi: `मैं समझा कि आप ${normalizedGoal} सीखना चाहते हैं। क्या यह सही है?`,
    });

    this.speakAndRecord(confirmGoalPrompt, 'GOAL_CONFIRM', ['Yes', 'No', 'Change Goal']);
  }

  private handleGoalConfirm(text: string) {
    if (this.isAffirmative(text)) {
      this.state.profile.career_goal_text = this.state.pendingValue || this.state.profile.career_goal_text;
      this.state.pendingValue = undefined;

      const districtPrompt = this.getLocalizedText({
        en: 'Which district in Karnataka are you in?',
        kn: 'ನೀವು ಕರ್ನಾಟಕದ ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದ್ದೀರಿ?',
        hi: 'आप कर्नाटक के किस जिले में हैं?',
      });

      this.speakAndRecord(districtPrompt, 'DISTRICT', [
        'Bengaluru Urban',
        'Mysuru',
        'Belagavi',
        'Dakshina Kannada',
      ]);
    } else {
      const retryGoalPrompt = this.getLocalizedText({
        en: "What would you like to learn or do? You can also say 'I don't know'.",
        kn: "ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ? ನೀವು 'ಗೊತ್ತಿಲ್ಲ' ಎಂದೂ ಹೇಳಬಹುದು.",
        hi: "आप क्या सीखना चाहते हैं? आप 'मुझे नहीं पता' भी कह सकते हैं।",
      });
      this.speakAndRecord(retryGoalPrompt, 'GOAL', [
        'Electrician',
        'EV Service Technician',
        "I don't know",
      ]);
    }
  }

  private handleDistrictInput(text: string) {
    const matchedDistrict = this.findMatchingDistrict(text);
    this.state.pendingValue = matchedDistrict;

    const confirmDistrictPrompt = this.getLocalizedText({
      en: `I heard ${matchedDistrict}. Is that correct?`,
      kn: `ನಾನು ${matchedDistrict} ಎಂದು ಕೇಳಿದೆ. ಇದು ಸರಿಯೇ?`,
      hi: `मैंने ${matchedDistrict} सुना। क्या यह सही है?`,
    });

    this.speakAndRecord(confirmDistrictPrompt, 'DISTRICT_CONFIRM', ['Yes', 'No', 'Change District']);
  }

  private handleDistrictConfirm(text: string) {
    if (this.isAffirmative(text)) {
      this.state.profile.district = this.state.pendingValue || this.state.profile.district;
      this.state.pendingValue = undefined;

      this.presentProfileReview();
    } else {
      const retryDistrictPrompt = this.getLocalizedText({
        en: 'Which district in Karnataka do you live or work in?',
        kn: 'ನೀವು ಕರ್ನಾಟಕದ ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದೀರಿ ಅಥವಾ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ?',
        hi: 'आप कर्नाटक के किस जिले में रहते हैं या काम करते हैं?',
      });
      this.speakAndRecord(retryDistrictPrompt, 'DISTRICT', [
        'Bengaluru Urban',
        'Mysuru',
        'Belagavi',
      ]);
    }
  }

  private presentProfileReview() {
    const occ = this.state.profile.occupation;
    const goal = this.state.profile.career_goal_text;
    const dist = this.state.profile.district;

    const reviewPrompt = this.getLocalizedText({
      en: `You told me: You work as a ${occ}. Your goal is ${goal}. You are in ${dist}. Is this information correct?`,
      kn: `ನಿಮ್ಮ ವಿವರ: ಕೆಲಸ: ${occ}. ಗುರಿ: ${goal}. ಜಿಲ್ಲೆ: ${dist}. ಇದು ಸರಿಯಾಗಿದೆಯೇ?`,
      hi: `आपकी जानकारी: काम: ${occ}, लक्ष्य: ${goal}, जिला: ${dist}। क्या यह सही है?`,
    });

    this.speakAndRecord(reviewPrompt, 'REVIEW', ['Yes, Find Options', 'Change Work', 'Change Goal', 'Change District']);
  }

  private async handleReviewConfirm(text: string) {
    const lower = text.toLowerCase();
    if (lower.includes('work') || lower.includes('occupation') || lower.includes('kelasa')) {
      this.askOccupation();
      return;
    }
    if (lower.includes('goal') || lower.includes('learn') || lower.includes('guri')) {
      const goalPrompt = this.getLocalizedText({
        en: 'What would you like to learn or do?',
        kn: 'ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಅಥವಾ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',
        hi: 'आप क्या सीखना या करना चाहते हैं?',
      });
      this.speakAndRecord(goalPrompt, 'GOAL', ['Electrician', 'EV Service Technician', "I don't know"]);
      return;
    }
    if (lower.includes('district') || lower.includes('location') || lower.includes('jille')) {
      const distPrompt = this.getLocalizedText({
        en: 'Which district are you in?',
        kn: 'ನೀವು ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದ್ದೀರಿ?',
        hi: 'आप किस जिले में हैं?',
      });
      this.speakAndRecord(distPrompt, 'DISTRICT', ['Bengaluru Urban', 'Mysuru', 'Belagavi']);
      return;
    }

    if (this.isAffirmative(text) || lower.includes('find') || lower.includes('options')) {
      // Transition to loading & trigger backend/mock recommendations
      this.state.dialogueStep = 'RECOMMENDING';
      this.state.voiceState = 'PROCESSING';
      const findingMsg = this.getLocalizedText({
        en: 'Looking for verified skill pathways and training options for you...',
        kn: 'ನಿಮಗಾಗಿ ಪರಿಶೀಲಿಸಿದ ಕೌಶಲ್ಯ ಮಾರ್ಗಗಳು ಮತ್ತು ತರಬೇತಿ ಆಯ್ಕೆಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
        hi: 'आपके लिए सत्यापित कौशल मार्ग और प्रशिक्षण विकल्प खोजे जा रहे हैं...',
      });
      this.speakAndRecord(findingMsg, 'RECOMMENDING', []);

      try {
        if (this.onRequestRecommendations) {
          const rec = await this.onRequestRecommendations(this.state.profile);
          this.state.recommendation = rec;
          this.startProgressiveExplanation(rec);
        } else {
          this.state.voiceState = 'IDLE';
          this.notify();
        }
      } catch (err: any) {
        this.state.voiceState = 'ERROR';
        this.state.errorMessage = err.message || 'Error fetching recommendations';
        const errVoice = this.getLocalizedText({
          en: "I couldn't load recommendations right now. You can try again or check your details.",
          kn: "ಈಗ ಶಿಫಾರಸುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
          hi: "अभी सिफारिशें लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।",
        });
        this.speakAndRecord(errVoice, 'STOPPED', ['Try Again', 'Go Back']);
      }
    } else {
      this.presentProfileReview();
    }
  }

  // --- Progressive Recommendation Flow ---

  public startProgressiveExplanation(rec: RecommendationResponse) {
    this.state.recommendation = rec;
    const pathways = rec.recommended_pathways || [];
    const topPathway = pathways[0];

    if (!topPathway || !topPathway.target_skill) {
      const noPathwayMsg = this.getLocalizedText({
        en: "I couldn't find a verified skill pathway for that specific goal yet in our state records. Would you like to try another work goal?",
        kn: "ಆ ಗುರಿಗೆ ಇನ್ನೂ ನಮ್ಮ ದಾಖಲೆಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಕೌಶಲ್ಯ ಮಾರ್ಗ ದೊರೆತಿಲ್ಲ. ನೀವು ಬೇರೆ ಗುರಿಯನ್ನು ಪ್ರಯತ್ನಿಸಲು ಬಯಸುತ್ತೀರಾ?",
        hi: "उस लक्ष्य के लिए अभी कोई सत्यापित कौशल मार्ग उपलब्ध नहीं है। क्या आप कोई अन्य लक्ष्य आज़माना चाहेंगे?",
      });
      this.speakAndRecord(noPathwayMsg, 'COMPLETED', ['Try Another Goal', 'Start Over']);
      return;
    }

    const bridgePathways = rec.skill_bridge?.pathways || [];
    const topBridge = bridgePathways[0];
    const skillName = topBridge?.target_occupation?.name_en || topPathway.target_skill.name_en;

    let extraContextEn = '';
    if (topBridge) {
      const overlap = topBridge.skill_overlap.overlap_percentage.toFixed(0);
      const lift = topBridge.wage_lift.absolute_lift_inr;
      if (lift && lift > 0) {
        extraContextEn = ` You already have ${overlap}% of the needed skills, with an estimated earnings lift of ₹${lift.toLocaleString('en-IN')} a month.`;
      } else {
        extraContextEn = ` You already have ${overlap}% of the needed skills.`;
      }
    }

    const msg = this.getLocalizedText({
      en: `I found some career options for you. One promising option is ${skillName}.${extraContextEn} Would you like to know about the course?`,
      kn: `ನಾನು ನಿಮಗಾಗಿ ಉತ್ತಮ ವೃತ್ತಿ ಆಯ್ಕೆಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ. ಒಂದು ಆಯ್ಕೆ ${skillName}. ಕೋರ್ಸ್ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುವಿರಾ?`,
      hi: `मुझे आपके लिए करियर के विकल्प मिले हैं। एक विकल्प ${skillName} है। क्या आप पाठ्यक्रम के बारे में जानना चाहते हैं?`,
    });

    this.speakAndRecord(msg, 'PROGRESSIVE_OVERVIEW', ['Yes, Tell Me About Course', 'No, Next Option']);
  }

  private handleProgressiveNext(nextStep: DialogueStep, userResponse: string) {
    const rec = this.state.recommendation;
    if (!rec) return;

    const lower = userResponse.toLowerCase();
    const isAffirm = this.isAffirmative(userResponse) || lower.includes('tell') || lower.includes('yes');

    if (!isAffirm && !lower.includes('next')) {
      // Worker skipped or said no
      this.concludeProgressive();
      return;
    }

    if (nextStep === 'PROGRESSIVE_COURSE') {
      const courses = rec.courses || [];
      if (courses.length > 0) {
        const c = courses[0];
        const dur = c.duration_value && c.duration_unit ? `${c.duration_value} ${c.duration_unit}` : 'standard duration';
        const msg = this.getLocalizedText({
          en: `The course is ${c.title}, which takes about ${dur}. Would you like to know where you can learn it near you?`,
          kn: `ಈ ಕೋರ್ಸ್ ${c.title}, ಇದು ಸುಮಾರು ${dur} ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ. ನಿಮ್ಮ ಹತ್ತಿರ ಎಲ್ಲಿ ಕಲಿಯಬಹುದು ಎಂದು ತಿಳಿಯಲು ಬಯಸುವಿರಾ?`,
          hi: `यह पाठ्यक्रम ${c.title} है, जिसमें लगभग ${dur} लगता है। क्या आप जानना चाहते हैं कि इसे अपने पास कहाँ सीख सकते हैं?`,
        });
        this.speakAndRecord(msg, 'PROGRESSIVE_COURSE', ['Yes, Find Centres', 'Skip']);
      } else {
        this.handleProgressiveNext('PROGRESSIVE_CENTRE', 'yes');
      }
    } else if (nextStep === 'PROGRESSIVE_CENTRE') {
      const centres = rec.nearby_centres || [];
      if (centres.length > 0) {
        const centre = centres[0];
        let distancePhrase = '';
        if (centre.distance_km != null) {
          distancePhrase = this.getLocalizedText({
            en: `The centre is about ${centre.distance_km.toFixed(1)} kilometres away.`,
            kn: `ಈ ಕೇಂದ್ರ ಸುಮಾರು ${centre.distance_km.toFixed(1)} ಕಿಲೋಮೀಟರ್ ದೂರದಲ್ಲಿದೆ.`,
            hi: `यह केंद्र लगभग ${centre.distance_km.toFixed(1)} किलोमीटर दूर है।`,
          });
        } else {
          distancePhrase = this.getLocalizedText({
            en: `I found a centre in ${centre.district || this.state.profile.district}, but I don't have a verified distance.`,
            kn: `ನಾನು ${centre.district || this.state.profile.district} ನಲ್ಲಿ ಕೇಂದ್ರ ಕಂಡುಕೊಂಡಿದ್ದೇನೆ, ಆದರೆ ಪರಿಶೀಲಿಸಿದ ದೂರ ಲಭ್ಯವಿಲ್ಲ.`,
            hi: `मुझे ${centre.district || this.state.profile.district} में एक केंद्र मिला है, लेकिन सटीक दूरी उपलब्ध नहीं है।`,
          });
        }

        const msg = `You can train at ${centre.name}. ${distancePhrase} ` + this.getLocalizedText({
          en: 'Would you like to know about government financial support?',
          kn: 'ಸರ್ಕಾರಿ ಆರ್ಥಿಕ ನೆರವಿನ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುವಿರಾ?',
          hi: 'क्या आप सरकारी सहायता के बारे में जानना चाहते हैं?',
        });
        this.speakAndRecord(msg, 'PROGRESSIVE_CENTRE', ['Yes, Tell Me Schemes', 'Skip']);
      } else {
        const noCentreMsg = this.getLocalizedText({
          en: `I found no active training centres listed in ${this.state.profile.district} currently. Would you like to check government support?`,
          kn: `ಪ್ರಸ್ತುತ ${this.state.profile.district} ನಲ್ಲಿ ಸಕ್ರಿಯ ತರಬೇತಿ ಕೇಂದ್ರಗಳಿಲ್ಲ. ಸರ್ಕಾರಿ ನೆರವು ತಿಳಿಯಲು ಬಯಸುವಿರಾ?`,
          hi: `वर्तमान में ${this.state.profile.district} में कोई सक्रिय केंद्र नहीं मिला। क्या सरकारी सहायता देखना चाहते हैं?`,
        });
        this.speakAndRecord(noCentreMsg, 'PROGRESSIVE_CENTRE', ['Yes, Check Schemes', 'Skip']);
      }
    } else if (nextStep === 'PROGRESSIVE_SCHEME') {
      const eligibilityList = rec.eligibility || [];
      const eligible = eligibilityList.find((e) => e.verdict === 'eligible');
      const anyScheme = eligible || eligibilityList[0];

      if (anyScheme) {
        let statusPhrase = '';
        if (anyScheme.verdict === 'eligible') {
          statusPhrase = this.getLocalizedText({
            en: `Under ${anyScheme.scheme_name}, you may be eligible for support.`,
            kn: `${anyScheme.scheme_name} ಅಡಿಯಲ್ಲಿ, ನೀವು ನೆರವಿಗೆ ಅರ್ಹರಾಗಿರಬಹುದು.`,
            hi: `${anyScheme.scheme_name} के तहत आप सहायता के लिए पात्र हो सकते हैं।`,
          });
        } else if (anyScheme.verdict === 'not_eligible') {
          statusPhrase = this.getLocalizedText({
            en: `Based on available criteria, you are not currently eligible for ${anyScheme.scheme_name}.`,
            kn: `ಲಭ್ಯವಿರುವ ಮಾನದಂಡಗಳ ಆಧಾರದ ಮೇಲೆ, ನೀವು ಪ್ರಸ್ತುತ ${anyScheme.scheme_name} ಗೆ ಅರ್ಹರಲ್ಲ.`,
            hi: `उपलब्ध जानकारी के अनुसार, आप अभी ${anyScheme.scheme_name} के पात्र नहीं हैं।`,
          });
        } else {
          statusPhrase = this.getLocalizedText({
            en: `For ${anyScheme.scheme_name}, eligibility requires more information.`,
            kn: `${anyScheme.scheme_name} ಗಾಗಿ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ.`,
            hi: `${anyScheme.scheme_name} के लिए अतिरिक्त जानकारी आवश्यक है।`,
          });
        }

        const msg = `${statusPhrase} ` + this.getLocalizedText({
          en: 'Would you like to know what to do next?',
          kn: 'ಮುಂದೆ ಏನು ಮಾಡಬೇಕೆಂದು ತಿಳಿಯಲು ಬಯಸುವಿರಾ?',
          hi: 'क्या आप जानना चाहते हैं कि आगे क्या करना है?',
        });
        this.speakAndRecord(msg, 'PROGRESSIVE_SCHEME', ['Yes, Next Steps', 'Done']);
      } else {
        this.handleProgressiveNext('PROGRESSIVE_NEXT_STEPS', 'yes');
      }
    } else if (nextStep === 'PROGRESSIVE_NEXT_STEPS') {
      const nextSteps = rec.explanation?.next_steps || [
        'Visit the training centre with your identification documents.',
        'Apply for admission during the upcoming batch intake.'
      ];
      const stepSummary = nextSteps.slice(0, 2).join(' ');
      const msg = this.getLocalizedText({
        en: `Here is what to do next: ${stepSummary} You can also review all details visually on your screen.`,
        kn: `ಮುಂದಿನ ಹಂತ: ${stepSummary} ನೀವು ನಿಮ್ಮ ಪರದೆಯ ಮೇಲೆ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಸಹ ನೋಡಬಹುದು.`,
        hi: `आगे का कदम: ${stepSummary} आप अपनी स्क्रीन पर भी सभी विवरण देख सकते हैं।`,
      });
      this.speakAndRecord(msg, 'PROGRESSIVE_NEXT_STEPS', ['Start Over', 'Close Voice']);
    }
  }

  private concludeProgressive() {
    const msg = this.getLocalizedText({
      en: 'You can see the complete recommendations, training centres, and documents on your screen.',
      kn: 'ನಿಮ್ಮ ಪರದೆಯ ಮೇಲೆ ನೀವು ಸಂಪೂರ್ಣ ಶಿಫಾರಸುಗಳು, ಕೇಂದ್ರಗಳು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ನೋಡಬಹುದು.',
      hi: 'आप अपनी स्क्रीन पर पूरी सिफारिशें, केंद्र और आवश्यक दस्तावेज देख सकते हैं।',
    });
    this.speakAndRecord(msg, 'COMPLETED', ['Start Over', 'Close Voice']);
  }

  // --- Go Back & Simplify Helpers ---

  private handleGoBack() {
    switch (this.state.dialogueStep) {
      case 'OCCUPATION_CONFIRM':
        this.askOccupation();
        break;
      case 'GOAL':
      case 'GOAL_CONFIRM':
        this.handleOccupationInput(this.state.profile.occupation);
        break;
      case 'DISTRICT':
      case 'DISTRICT_CONFIRM':
        const goalPrompt = this.getLocalizedText({
          en: 'What would you like to learn or do?',
          kn: 'ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಅಥವಾ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',
          hi: 'आप क्या सीखना या करना चाहते हैं?',
        });
        this.speakAndRecord(goalPrompt, 'GOAL', ['Electrician', 'EV Service Technician', "I don't know"]);
        break;
      case 'REVIEW':
        const distPrompt = this.getLocalizedText({
          en: 'Which district in Karnataka are you in?',
          kn: 'ನೀವು ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದ್ದೀರಿ?',
          hi: 'आप किस जिले में हैं?',
        });
        this.speakAndRecord(distPrompt, 'DISTRICT', ['Bengaluru Urban', 'Mysuru', 'Belagavi']);
        break;
      default:
        this.startConversation();
        break;
    }
  }

  private handleSimplify() {
    const simple = this.getLocalizedText({
      en: 'In simple words: We help you find a course to earn more, a school near you, and government help to pay for it.',
      kn: 'ಸರಳವಾಗಿ ಹೇಳುವುದಾದರೆ: ಹೆಚ್ಚು ಸಂಪಾದಿಸಲು ಕೋರ್ಸ್, ಹತ್ತಿರದ ಶಾಲೆ ಮತ್ತು ಸರ್ಕಾರಿ ನೆರವು ಹುಡುಕಲು ನಾವು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇವೆ.',
      hi: 'आसान शब्दों में: हम आपको बेहतर कमाई के लिए कोर्स, नजदीकी केंद्र और सरकारी सहायता खोजने में मदद करते हैं।',
    });
    this.speakAndRecord(simple, this.state.dialogueStep, this.state.quickReplies);
  }

  // --- Speech & Audio Output ---

  private speakAndRecord(text: string, nextStep: DialogueStep, quickReplies: string[] = []) {
    this.state.dialogueStep = nextStep;
    this.state.quickReplies = quickReplies;
    this.state.lastAssistantSpeech = text;
    this.state.messages.push({
      id: `msg_a_${Date.now()}`,
      sender: 'assistant',
      text,
      timestamp: Date.now(),
    });
    this.state.voiceState = 'SPEAKING';
    this.notify();

    this.speak(text, () => {
      this.state.voiceState = 'IDLE';
      this.notify();
    });
  }

  private async speak(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined') {
      if (onEnd) onEnd();
      return;
    }

    // 1. Try Gemini TTS endpoint first
    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: this.language,
          session_id: this.state.profile.session_id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio_base64) {
          const audio = new Audio(`data:audio/${data.audio_format || 'wav'};base64,${data.audio_base64}`);
          this.currentAudioElement = audio;
          this.isSynthesisSpeaking = true;

          audio.onended = () => {
            this.isSynthesisSpeaking = false;
            this.currentAudioElement = null;
            if (onEnd) onEnd();
          };

          audio.onerror = () => {
            this.isSynthesisSpeaking = false;
            this.currentAudioElement = null;
            if (onEnd) onEnd();
          };

          await audio.play();
          return;
        }
      }
    } catch (err) {
      // Offline / network failure / mock mode: fall through to browser or mock synthesis
    }

    // 2. Fallback to browser SpeechSynthesis (if available)
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap: Record<SupportedLanguage, string> = {
          en: 'en-IN',
          kn: 'kn-IN',
          hi: 'hi-IN',
        };
        utterance.lang = langMap[this.language] || 'en-IN';
        utterance.rate = 0.95; // Slightly slower for low-literacy clarity

        this.isSynthesisSpeaking = true;

        utterance.onend = () => {
          this.isSynthesisSpeaking = false;
          if (onEnd) onEnd();
        };

        utterance.onerror = () => {
          this.isSynthesisSpeaking = false;
          if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (e) {
        this.isSynthesisSpeaking = false;
      }
    }

    if (onEnd) onEnd();
  }

  // --- Natural Speech Normalization & Intent Detectors ---

  private isAffirmative(text: string): boolean {
    const t = text.toLowerCase().trim();
    return (
      t === 'yes' ||
      t === 'ha' ||
      t === 'haan' ||
      t === 'sari' ||
      t === 'houdu' ||
      t === 'correct' ||
      t === 'right' ||
      t === 'sahi hai' ||
      t === 'theek hai' ||
      t === 'ಹೌದು' ||
      t === 'ಸರಿ' ||
      t === 'हाँ' ||
      t.startsWith('yes') ||
      t.includes('correct') ||
      t.includes('right')
    );
  }

  private isDontKnow(text: string): boolean {
    const t = text.toLowerCase().trim();
    return (
      t.includes("don't know") ||
      t.includes('dont know') ||
      t.includes('not sure') ||
      t.includes('you tell me') ||
      t.includes('suggest me') ||
      t.includes('what should i learn') ||
      t.includes('gottilla') ||
      t.includes('ಗೊತ್ತಿಲ್ಲ') ||
      t.includes('ಯಾವುದಾದರೂ') ||
      t.includes('nahi pata') ||
      t.includes('pata nahi') ||
      t.includes('पता नहीं') ||
      t.includes('मुझे नहीं पता')
    );
  }

  private normalizeOccupation(text: string): string {
    const t = text.toLowerCase();
    if (t.includes('deliver') || t.includes('courier') || t.includes('rider') || t.includes('swiggy') || t.includes('zomato')) {
      return 'Delivery / Courier Rider';
    }
    if (t.includes('auto') || t.includes('rickshaw') || t.includes('driver')) {
      return 'Auto Rickshaw Driver';
    }
    if (t.includes('construct') || t.includes('labour') || t.includes('mason') || t.includes('building') || t.includes('helper')) {
      return 'Construction Labourer';
    }
    if (t.includes('domestic') || t.includes('house') || t.includes('maid') || t.includes('clean') || t.includes('home work')) {
      return 'Domestic Worker';
    }
    if (t.includes('vendor') || t.includes('market') || t.includes('shop') || t.includes('vegetable') || t.includes('sell')) {
      return 'Street / Market Vendor';
    }
    if (t.includes('tailor') || t.includes('garment') || t.includes('sewing') || t.includes('stitch')) {
      return 'Tailor / Garment Worker';
    }
    if (t.includes('electric') || t.includes('wire')) {
      return 'Electrician';
    }
    if (t.includes('mechanic') || t.includes('garage') || t.includes('bike repair')) {
      return 'Automotive Mechanic';
    }
    // Clean and capitalize user's original speech if no keyword match
    return text.trim().replace(/^(i work as a|i am a|i do|i work as)\s+/i, '');
  }

  private normalizeGoal(text: string): string {
    const t = text.toLowerCase();
    if (t.includes('electrician') || t.includes('electrical') || t.includes('wiring')) {
      return 'Electrician';
    }
    if (t.includes('ev') || t.includes('electric vehicle') || t.includes('battery')) {
      return 'EV Service Technician';
    }
    if (t.includes('fitter') || t.includes('pipe') || t.includes('plumbing')) {
      return 'Construction Fitter';
    }
    if (t.includes('health') || t.includes('nurse') || t.includes('hospital') || t.includes('assistant')) {
      return 'General Duty Assistant';
    }
    if (t.includes('mechanic') || t.includes('motor')) {
      return 'Motor Vehicle Mechanic';
    }
    return text.trim().replace(/^(i want to learn|i want to become|i want to do)\s+/i, '');
  }

  private findMatchingDistrict(text: string): string {
    const t = text.toLowerCase().trim();
    for (const dist of KARNATAKA_DISTRICTS) {
      if (t.includes(dist.toLowerCase())) {
        return dist;
      }
    }
    // Check common aliases / cities
    if (t.includes('bangalore') || t.includes('bengaluru')) {
      return 'Bengaluru Urban';
    }
    if (t.includes('mysore') || t.includes('mysuru')) {
      return 'Mysuru';
    }
    if (t.includes('belgaum') || t.includes('belagavi')) {
      return 'Belagavi';
    }
    if (t.includes('mangalore') || t.includes('dakshina')) {
      return 'Dakshina Kannada';
    }
    if (t.includes('hubli') || t.includes('dharwad')) {
      return 'Dharwad';
    }
    if (t.includes('gulbarga') || t.includes('kalaburagi')) {
      return 'Kalaburagi';
    }
    return text.trim() || 'Bengaluru Urban';
  }

  private getLocalizedText(translations: Record<SupportedLanguage, string>): string {
    return translations[this.language] || translations['en'];
  }
}
