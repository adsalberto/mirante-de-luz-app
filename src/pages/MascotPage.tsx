import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Play, Pause, RotateCcw, Volume2, VolumeX, Settings, Tv, 
  Plus, Trash2, Pencil, Check, X, ShieldAlert, ArrowRight, ArrowLeft, 
  Smile, Feather, Eye, HelpCircle, MonitorPlay, Sparkle, Heart, Sun, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Standard Interfaces for the Mascot Panel
interface DailyActivity {
  id: string;
  time: string;
  title: string;
  speaker: string;
  description: string;
  available: boolean;
}

interface MascotAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'alta';
}

const DEFAULT_ACTIVITIES: DailyActivity[] = [
  { id: '1', time: '14:00', title: 'Atendimento Fraterno Individual', speaker: 'Equipe de Acolhimento', description: 'Orientação espiritual acolhedora e privativa na Sala de Passes.', available: true },
  { id: '2', time: '14:30', title: 'Passes Coletivos & Fluidificação', speaker: 'Trabalhadores da Escala', description: 'Transmissão de energias regeneradoras e fluidificação de água na garrafa.', available: true },
  { id: '3', time: '15:00', title: 'Palestra Pública Doutrinária', speaker: 'Dr. Roberto Magalhães', description: 'Tema: "O Sermão do Monte e a Cura Interior" baseado no Evangelho Segundo o Espiritismo.', available: true },
  { id: '4', time: '19:30', title: 'Evangelização Infantil & Mocidade', speaker: 'Setor de Infância', description: 'Aulas fraternas e recreativas para crianças de 4 a 14 anos.', available: true }
];

const DEFAULT_ANNOUNCEMENTS: MascotAnnouncement[] = [
  { id: '1', title: 'Campanha do Agasalho CEMIL', content: 'Ajude-nos a esquecer e aquecer corações! Estamos arrecadando cobertores, agasalhos e calçados infantis. Entregue na secretaria.', priority: 'alta' },
  { id: '2', title: 'Novas Turmas de Estudo ESDE', content: 'As inscrições para o Estudo Sistematizado da Doutrina Espírita estão abertas! Aulas às terças-feiras às 20h. Vagas limitadas.', priority: 'normal' },
  { id: '3', title: 'Água Fluidificada', content: 'Amigos, lembrem-se de trazer suas garrafas com água filtrada para ser fluidificada durante as palestras e passes de hoje.', priority: 'normal' }
];

const PREDEFINED_QUOTES = [
  { text: "O bem que fizeres em qualquer lugar, será teu defensor em toda parte.", author: "Emmanuel (Chico Xavier)" },
  { text: "A caridade é o processo de somar alegrias, diminuir dores, multiplicar esperanças e dividir a paz.", author: "Bezerra de Menezes" },
  { text: "Nenhum obstáculo será grande demais se sua vontade de vencer for maior.", author: "Chico Xavier" },
  { text: "Para o homem de bem, o dever cumprido é a maior recompensa.", author: "Allan Kardec" },
  { text: "O amor é a força que transforma o mundo e ilumina os caminhos da alma.", author: "Joanna de Ângelis (Divaldo Franco)" },
  { text: "Auxilia onde estiveres. Quem ajuda o próximo compra paz para si mesmo.", author: "André Luiz" },
  { text: "Guarda a serenidade em todas as tormentas, pois a tempestade de hoje prepara o solo fértil de amanhã.", author: "Emmanuel" }
];

export const MascotPage: React.FC = () => {
  // --- States ---
  const [mascotName, setMascotName] = useState<string>(() => {
    return localStorage.getItem('cemil_mascot_name') || 'Luminho';
  });
  
  const [activities, setActivities] = useState<DailyActivity[]>(() => {
    const saved = localStorage.getItem('cemil_mascot_activities');
    return saved ? JSON.parse(saved) : DEFAULT_ACTIVITIES;
  });

  const [announcements, setAnnouncements] = useState<MascotAnnouncement[]>(() => {
    const saved = localStorage.getItem('cemil_mascot_announcements');
    return saved ? JSON.parse(saved) : DEFAULT_ANNOUNCEMENTS;
  });

  const [activeTab, setActiveTab] = useState<'cronograma' | 'avisos' | 'config'>('cronograma');
  const [selectedQuote, setSelectedQuote] = useState(() => PREDEFINED_QUOTES[0]);
  const [customQuote, setCustomQuote] = useState('');
  
  // Mascot Visual State
  const [mascotMood, setMascotMood] = useState<'happy' | 'serene' | 'studious' | 'loving'>('happy');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechVolume, setSpeechVolume] = useState<number>(0.8);
  const [speechRate, setSpeechRate] = useState<number>(0.85); // slightly slower is better for projection acoustics
  const [speechPitch, setSpeechPitch] = useState<number>(1.2); // friendly high-pitched voice

  // Projection Screens Navigation & State
  const [isProjectionActive, setIsProjectionActive] = useState(false);
  const [projectionTheme, setProjectionTheme] = useState<'stellar' | 'aura' | 'minimalist'>('stellar');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoopingAutomatically, setIsLoopingAutomatically] = useState(true);
  const [ambientSoundActive, setAmbientSoundActive] = useState(false);
  const [subtitleText, setSubtitleText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Forms State
  const [newActivity, setNewActivity] = useState<Omit<DailyActivity, 'id'>>({
    time: '', title: '', speaker: '', description: '', available: true
  });
  const [newAnnouncement, setNewAnnouncement] = useState<Omit<MascotAnnouncement, 'id'>>({
    title: '', content: '', priority: 'normal'
  });
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // Web Speech API Voice Selection
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoPlayTimerRef = useRef<any>(null);
  const synthCleanupRef = useRef<any>(null);

  // --- Initialize TTS and Audio ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Filter for Portuguese voices primarily or just all for settings
        const ptVoices = voices.filter(v => v.lang.startsWith('pt'));
        setAvailableVoices(ptVoices.length > 0 ? ptVoices : voices);
        
        // Select a default friendly voice
        if (ptVoices.length > 0) {
          // Look for "Google" of "Microsoft" pt-BR voices which sound fantastic
          const preferred = ptVoices.find(v => v.name.includes('Google') || v.name.includes('Maria') || v.name.includes('Francisca'));
          setSelectedVoiceName(preferred ? preferred.name : ptVoices[0].name);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      stopSpeaking();
    };
  }, []);

  // Sync state to localstorage
  useEffect(() => {
    localStorage.setItem('cemil_mascot_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('cemil_mascot_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('cemil_mascot_name', mascotName);
  }, [mascotName]);

  // --- Audio Synthesis Engine (Ambient sound loop) ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneOsc1Ref = useRef<OscillatorNode | null>(null);
  const droneOsc2Ref = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const chimeIntervalRef = useRef<any>(null);

  const startAmbientSound = () => {
    try {
      if (typeof window === 'undefined') return;
      
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Solfeggio 528Hz sub-harmonics for peace: 132Hz (C3) & 198Hz (G3)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(132, ctx.currentTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(198, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime); // very low hum

      // breathing amplitude curve
      const breathingLoop = () => {
        if (!gain || !ctx) return;
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.07, t + 4);
        gain.gain.exponentialRampToValueAtTime(0.02, t + 8);
      };

      breathingLoop();
      const intervalId = setInterval(breathingLoop, 8000);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      droneOsc1Ref.current = osc1;
      droneOsc2Ref.current = osc2;
      droneGainRef.current = gain;

      // Bell chimes dynamically
      const playChime = () => {
        if (!ctx) return;
        const now = ctx.currentTime;
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        chimeOsc.type = 'sine';
        // Beautiful high pentatonic spiritual bells (A5, C6, D6, E6, G6)
        const notes = [880.00, 1046.50, 1174.66, 1318.51, 1567.98];
        const pitch = notes[Math.floor(Math.random() * notes.length)];
        chimeOsc.frequency.setValueAtTime(pitch, now);

        chimeGain.gain.setValueAtTime(0, now);
        chimeGain.gain.linearRampToValueAtTime(0.03, now + 0.15); // soft strike
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0); // slow spiritual fade

        chimeOsc.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        
        chimeOsc.start(now);
        chimeOsc.stop(now + 5.5);
      };

      chimeIntervalRef.current = setInterval(playChime, 11000);

      // Save cleanup function
      synthCleanupRef.current = () => {
        clearInterval(intervalId);
        clearInterval(chimeIntervalRef.current);
        try {
          osc1.stop();
          osc2.stop();
        } catch(e){}
        droneOsc1Ref.current = null;
        droneOsc2Ref.current = null;
        droneGainRef.current = null;
      };

      setAmbientSoundActive(true);
    } catch (e) {
      console.error("Web Audio support is blocked or not available in this frame environment.", e);
    }
  };

  const stopAmbientSound = () => {
    if (synthCleanupRef.current) {
      synthCleanupRef.current();
      synthCleanupRef.current = null;
    }
    setAmbientSoundActive(false);
  };

  // Switch sound toggle
  const toggleAmbientSound = () => {
    if (ambientSoundActive) {
      stopAmbientSound();
    } else {
      startAmbientSound();
    }
  };

  // --- Speech Engine Control/Triggers ---
  const speakText = (text: string, onEndCallback?: () => void) => {
    if (!synthRef.current) return;

    // stop prior spoken audio immediately
    synthRef.current.cancel();

    // Friendly mood when speaking
    setMascotMood('happy');
    setIsSpeaking(true);
    setSubtitleText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;

    // Apply voice settings
    const ptVoice = availableVoices.find(v => v.name === selectedVoiceName);
    if (ptVoice) {
      utterance.voice = ptVoice;
    }
    utterance.volume = speechVolume;
    utterance.rate = speechRate * 1.1; // adjust speed slightly for friendliness
    utterance.pitch = speechPitch;

    utterance.onend = () => {
      setIsSpeaking(false);
      setMascotMood('serene');
      if (onEndCallback) {
        onEndCallback();
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech Synthesis error occurred. Proceeding anyway.", e);
      setIsSpeaking(false);
      setMascotMood('serene');
      if (onEndCallback) {
        onEndCallback();
      }
    };

    // Chrome bug workaround for long speech cutting out
    const boundaryHandler = (event: SpeechSynthesisEvent) => {
      // Mouth movement animation matches bounds of spoken word
      setMascotMood('happy');
    };
    utterance.onboundary = boundaryHandler;

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    setMascotMood('serene');
  };

  // Generates greeting sentence for testing
  const triggerTestSpeech = () => {
    const message = `Olá! Que a luz divina e as melhores energias iluminem a nossa jornada! Eu sou o ${mascotName}, o mascotinha virtual do Mirante de Luz. Estarei carregando e apresentando as atividades fraternas e os avisos do dia para nossa acolhedora casa espírita! Tudo pronto!`;
    speakText(message);
  };

  // --- Gemini-API Setup to Generate Messages ---
  const handleGenerateAiMessage = async () => {
    setAiLoading(true);
    try {
      const apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || (process.env.GEMINI_API_KEY as string) || "";
      if (!apiKey) {
        // Mock / simulate local AI generator randomly from high-quality templates if no key
        setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * PREDEFINED_QUOTES.length);
          const quote = PREDEFINED_QUOTES[randomIndex];
          setSelectedQuote(quote);
          setCustomQuote(`"${quote.text}" — ${quote.author}`);
          setAiLoading(false);
          speakText(`Aqui está uma linda reflexão sugerida para as nossas atividades diárias: ${quote.text}, psicografada por ${quote.author}`);
        }, 1200);
        return;
      }

      // If apiKey is available, call Gemini safely server-side style (or using client wrapper as existing parts)
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Gere uma mensagem espírita curta, consoladora e inspiradora em português para ser lida no início das atividades de hoje da casa espírita "Mirante de Luz". Indique o autor espiritual (Ex: Emmanuel, André Luiz, Bezerra de Menezes, Joanna de Ângelis ou Chico Xavier). Responda estritamente no formato JSON: {"text": "conteúdo da mensagem", "author": "autor"}. Limite a mensagem a no máximo duas frases afetuosas.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const parsed = JSON.parse(responseText);
      if (parsed.text && parsed.author) {
        setSelectedQuote({ text: parsed.text, author: parsed.author });
        setCustomQuote(`"${parsed.text}" — ${parsed.author}`);
        speakText(`Excelente! Acabo de receber esta amorosa instrução dos benfeitores espirituais: ${parsed.text}. Assinado por ${parsed.author}.`);
      } else {
        throw new Error("Invalid output format from AI");
      }
    } catch (err) {
      console.error("Gemini connection error, fallback to preset quote: ", err);
      const randomIndex = Math.floor(Math.random() * PREDEFINED_QUOTES.length);
      const quote = PREDEFINED_QUOTES[randomIndex];
      setSelectedQuote(quote);
      setCustomQuote(`"${quote.text}" — ${quote.author}`);
      speakText(`Recebi uma lição fraterna do nosso arquivo de luz: ${quote.text}, por ${quote.author}`);
    } finally {
      setAiLoading(false);
    }
  };

  // --- Projection Automated Player & State Cycles ---
  // Layout slides order:
  // 0: Welcome Slide with Current Date & Time
  // 1: Activities slide (List of available events today)
  // 2: Mural/Notices slide (Active announcements in list)
  // 3: Uplifting Spiritual Message (Spoken by Mascot with lovely particles)

  const stopProjectionPlayer = () => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    stopSpeaking();
  };

  const startProjectionPlayer = (slideIndex: number) => {
    stopProjectionPlayer();
    setCurrentSlideIndex(slideIndex);

    // Build speech text depending on the active slide
    let textToSpeak = '';
    let readingDuration = 9000; // default duration to wait if speech fails

    if (slideIndex === 0) {
      textToSpeak = `Sejam muitíssimo bem-vindos à Casa Espírita Mirante de Luz! Que a paz mansa de Jesus envolva as vossas mentes e propicie um ambiente de profundo equilíbrio físico e espiritual. Sou o ${mascotName}, estarei guiando as atividades e informes das nossas salas doutrinárias hoje.`;
      readingDuration = 18000;
    } else if (slideIndex === 1) {
      const activeActs = activities.filter(a => a.available);
      if (activeActs.length > 0) {
        textToSpeak = `Companheiros, confiram nossa escala de tarefas de hoje: ` +
          activeActs.map(a => `Às ${a.time}, teremos ${a.title}, sob condução de ${a.speaker}.`).join(' ') +
          ` Participe conosco desses momentos redentores de oração e passe.`;
      } else {
        textToSpeak = `Para o dia de hoje, nosso colegiado de voluntários operará as salas de irradiação fluídica interna e passes protetivos normais. Dirija-se à secretaria.`;
      }
      readingDuration = 22000;
    } else if (slideIndex === 2) {
      if (announcements.length > 0) {
        textToSpeak = `Prestem especial atenção aos comunicados fraternos de hoje: ` +
          announcements.map((a, i) => `Aviso número ${i + 1}: ${a.title}. ${a.content}`).join(' ') +
          ` Contamos com vossa generosa colaboração e comparecimento nestas tarefas de luz.`;
      } else {
        textToSpeak = `Não há avisos extraordinários listados para hoje. Lembre-se que o amor é nosso maior escudo da alma em qualquer situação quotidiana.`;
      }
      readingDuration = 24000;
    } else if (slideIndex === 3) {
      const activeQuote = selectedQuote.text ? selectedQuote : PREDEFINED_QUOTES[0];
      textToSpeak = `Estudemos juntos a lição de sabedoria espírita para este momento: ${activeQuote.text}. Palavras reconfortantes recebidas de ${activeQuote.author}. Que as reflexões inspiradoras desse ensinamento fiquem gravadas na sua semana. Muita paz a todos!`;
      readingDuration = 20000;
    }

    // Speak with layout synthesis
    speakText(textToSpeak, () => {
      // Once speaking is complete, wait 4 seconds then transition next slide if loop is active
      if (isLoopingAutomatically && isProjectionActive) {
        autoPlayTimerRef.current = setTimeout(() => {
          const nextIndex = (slideIndex + 1) % 4;
          startProjectionPlayer(nextIndex);
        }, 5000); // 5 seconds of silent calm contemplation before changing screen
      }
    });
  };

  // Sync automated cycle when loop toggle is clicked
  useEffect(() => {
    if (isProjectionActive) {
      if (isLoopingAutomatically) {
        // restart playing active index with loop callback
        startProjectionPlayer(currentSlideIndex);
      } else {
        stopProjectionPlayer();
      }
    }
    return () => stopProjectionPlayer();
  }, [isLoopingAutomatically, isProjectionActive]);

  const launchProjection = () => {
    setIsProjectionActive(true);
    setCurrentSlideIndex(0);
    // Request full screen if allowed/accessible
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } catch(err){}
    
    // Automatically start cycling
    setIsLoopingAutomatically(true);
    startProjectionPlayer(0);
  };

  const closeProjection = () => {
    stopProjectionPlayer();
    stopAmbientSound();
    setIsProjectionActive(false);
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }
    } catch(err){}
  };

  const handleNextSlide = () => {
    const nextIndex = (currentSlideIndex + 1) % 4;
    startProjectionPlayer(nextIndex);
  };

  const handlePrevSlide = () => {
    const prevIndex = (currentSlideIndex - 1 + 4) % 4;
    startProjectionPlayer(prevIndex);
  };

  // --- CRUD Functions for Activities ---
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.time || !newActivity.title) return;
    
    const activity: DailyActivity = {
      ...newActivity,
      id: Date.now().toString()
    };
    setActivities(prev => [...prev, activity].sort((a,b) => a.time.localeCompare(b.time)));
    setNewActivity({ time: '', title: '', speaker: '', description: '', available: true });
    speakText(`Nova palestra de ${activity.title} adicionada ao painel de atividades!`);
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleActivityAvailability = (id: string) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, available: !a.available } : a));
  };

  // --- CRUD Functions for Announcements ---
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    const ann: MascotAnnouncement = {
      ...newAnnouncement,
      id: Date.now().toString()
    };
    setAnnouncements(prev => [...prev, ann]);
    setNewAnnouncement({ title: '', content: '', priority: 'normal' });
    speakText(`Comunicado intitulado ${ann.title} foi incorporado na lousa eletrônica dária!`);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // --- Render Custom Stylings for Glow Animations ---
  const injectionStyles = `
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.95); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
      100% { transform: scale(0.95); opacity: 0.5; }
    }
    @keyframes pulse-aurora {
      0% { opacity: 0.2; transform: scale(0.9) translate(0, 0); }
      50% { opacity: 0.4; transform: scale(1.1) translate(5px, -5px); }
      100% { opacity: 0.2; transform: scale(0.9) translate(0, 0); }
    }
    @keyframes eye-blink {
      0%, 90%, 100% { transform: scaleY(1); }
      92%, 96% { transform: scaleY(0.1); }
    }
    @keyframes mouth-talk {
      0%, 100% { transform: scaleY(0.4); }
      50% { transform: scaleY(1.4); }
    }
    @keyframes float-stars {
      0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
      50% { opacity: 0.8; }
      100% { transform: translateY(-10vh) scale(1.2); opacity: 0; }
    }
    .animate-float {
      animation: float 5s ease-in-out infinite;
    }
    .animate-pulse-ring {
      animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    .animate-pulse-aurora {
      animation: pulse-aurora 10s ease-in-out infinite;
    }
    .eye-blinking {
      animation: eye-blink 4s infinite;
      transform-origin: center;
    }
    .mouth-talking {
      animation: mouth-talk 0.25s infinite;
      transform-origin: center;
    }
    .particle-star {
      position: absolute;
      animation: float-stars 25s linear infinite;
      background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }
  `;

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-x-hidden p-4 md:p-8" id="mascot-root">
      {/* Injected Custom Keyframes */}
      <style>{injectionStyles}</style>

      {/* ----------------- STANDALONE SCREEN: PROJECTION SCREEN MODE ----------------- */}
      <AnimatePresence>
        {isProjectionActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden p-6 md:p-12 text-white ${
              projectionTheme === 'stellar' ? 'bg-slate-950 bg-radial' : 
              projectionTheme === 'aura' ? 'bg-gradient-to-tr from-indigo-950 via-slate-900 to-amber-950' : 
              'bg-[#f4f7f6] text-neutral-800'
            }`}
            id="projection-frame"
          >
            {/* Ambient Background Starfield Particles for the screen */}
            {projectionTheme === 'stellar' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="particle-star" 
                    style={{
                      left: `${Math.random() * 100}%`,
                      width: `${Math.random() * 4 + 2}px`,
                      height: `${Math.random() * 4 + 2}px`,
                      animationDelay: `${Math.random() * 20}s`,
                      animationDuration: `${12 + Math.random() * 20}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Top Bar Status / Digital Signage details */}
            <div className={`flex items-center justify-between border-b pb-4 z-10 ${
              projectionTheme === 'minimalist' ? 'border-neutral-200' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Feather size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className={`font-semibold tracking-wide text-xs md:text-sm uppercase ${
                    projectionTheme === 'minimalist' ? 'text-neutral-500' : 'text-neutral-400'
                  }`}>
                    Centro Espírita Mirante de Luz
                  </h3>
                  <p className={`text-[10px] uppercase font-bold tracking-widest ${
                    projectionTheme === 'minimalist' ? 'text-indigo-600' : 'text-amber-300'
                  }`}>
                    Cotidiano Espírita & Harmonização
                  </p>
                </div>
              </div>

              {/* Display dynamic Date and Clock representing spiritual presence */}
              <div className="text-right">
                <p className={`text-lg md:text-xl font-mono font-semibold ${
                  projectionTheme === 'minimalist' ? 'text-neutral-800' : 'text-slate-100'
                }`}>
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className={`text-[10px] md:text-xs tracking-wider uppercase ${
                  projectionTheme === 'minimalist' ? 'text-neutral-400' : 'text-slate-400'
                }`}>
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>

            {/* Main Interactive Mascot Area of projection */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center my-auto z-10 h-3/5">
              
              {/* Mascot Visual Frame (Takes up substantial screen space on projector for high fidelity view) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                {/* Visual Aura */}
                <div className={`absolute w-64 h-64 md:w-80 md:h-80 rounded-full blur-3xl opacity-30 ${
                  isSpeaking ? 'bg-amber-400 animate-pulse-aurora' : 'bg-indigo-500 animate-pulse'
                }`} />

                <div className="relative animate-float">
                  {/* Glowing Ring Base */}
                  <div className={`absolute -inset-4 rounded-full blur-xl transition-all duration-1000 ${
                    isSpeaking 
                      ? 'bg-gradient-to-t from-amber-400/20 to-orange-400/30 ring-4 ring-amber-400/40 animate-pulse-ring' 
                      : 'bg-indigo-500/10'
                  }`} />
                  
                  {/* Encapsulated Responsive SVG Mascot */}
                  <div className="w-56 h-56 md:w-72 md:h-72 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                      <defs>
                        {/* Radiant Gradients based on emotional state */}
                        <radialGradient id="grad-happy" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="#fff176" />
                          <stop offset="40%" stopColor="#fbc02d" />
                          <stop offset="100%" stopColor="#ef6c00" />
                        </radialGradient>
                        <radialGradient id="grad-serene" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="#e0f7fa" />
                          <stop offset="45%" stopColor="#80deea" />
                          <stop offset="100%" stopColor="#00acc1" />
                        </radialGradient>
                        <radialGradient id="grad-loving" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="#fce4ec" />
                          <stop offset="40%" stopColor="#f48fb1" />
                          <stop offset="100%" stopColor="#c2185b" />
                        </radialGradient>
                        <radialGradient id="grad-studious" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="#e8eaf6" />
                          <stop offset="45%" stopColor="#9fa8da" />
                          <stop offset="100%" stopColor="#3f51b5" />
                        </radialGradient>
                      </defs>

                      {/* Backdrop Aura */}
                      <circle cx="100" cy="100" r="75" fill={
                        mascotMood === 'happy' ? 'rgba(239, 108, 0, 0.15)' :
                        mascotMood === 'loving' ? 'rgba(194, 24, 91, 0.15)' :
                        mascotMood === 'studious' ? 'rgba(63, 81, 181, 0.15)' :
                        'rgba(0, 172, 193, 0.15)'
                      } className="animate-pulse" />

                      {/* Glowing Spiritual "Sparkle" Halo */}
                      <path d="M100 0 L108 30 L138 38 L108 46 L100 76 L92 46 L62 38 L92 30 Z" fill="#ffd54f" className="animate-pulse" opacity="0.8" transform="translate(0, 5) scale(0.4) translate(150, 20)" />

                      {/* Core Spark Body */}
                      <circle cx="100" cy="105" r="50" fill={
                        mascotMood === 'happy' ? 'url(#grad-happy)' :
                        mascotMood === 'loving' ? 'url(#grad-loving)' :
                        mascotMood === 'studious' ? 'url(#grad-studious)' :
                        'url(#grad-serene)'
                      } stroke="#ffffff" strokeWidth="2.5" />

                      {/* Friendly Star Points (Spark of Light) */}
                      <path d="M100 45 L112 105 L155 105 L118 130 L132 175 L100 148 L68 175 L82 130 L45 105 L88 105 Z" fill="none" stroke="#fff" strokeWidth="2" opacity="0.3" />

                      {/* Eyes Component */}
                      {mascotMood === 'serene' ? (
                        // Peaceful Meditative Closed Eyes
                        <g stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round">
                          <path d="M72 105 Q80 115 88 105" />
                          <path d="M112 105 Q120 115 128 105" />
                        </g>
                      ) : mascotMood === 'loving' ? (
                        // Sweet Heart Eyes
                        <g fill="#c2185b" stroke="#fff" strokeWidth="1">
                          <path d="M70 95 C62 82 82 82 80 100 C78 100 75 97 70 95 Z" transform="scale(0.8) translate(18, 25)" />
                          <path d="M120 95 C112 82 132 82 130 100 C128 100 125 97 120 95 Z" transform="scale(0.8) translate(48, 25)" />
                        </g>
                      ) : (
                        // Expressive Shiny Bright Eyes (Blinking)
                        <g className="eye-blinking">
                          {/* Left Eye */}
                          <ellipse cx="80" cy="100" rx="9" ry="14" fill="#1e293b" />
                          <circle cx="77" cy="94" r="3.5" fill="#ffffff" />
                          <circle cx="83" cy="104" r="1.5" fill="#ffffff" />

                          {/* Right Eye */}
                          <ellipse cx="120" cy="100" rx="9" ry="14" fill="#1e293b" />
                          <circle cx="117" cy="94" r="3.5" fill="#ffffff" />
                          <circle cx="123" cy="104" r="1.5" fill="#ffffff" />
                        </g>
                      )}

                      {/* Cheerful Blush Rings */}
                      <circle cx="68" cy="114" r="6" fill="#f87171" opacity="0.5" />
                      <circle cx="132" cy="114" r="6" fill="#f87171" opacity="0.5" />

                      {/* Interactive Mouth (talking keyframe) */}
                      <g className={isSpeaking ? 'mouth-talking' : ''}>
                        {isSpeaking ? (
                          // Speaking Mouth: vertical ellipse scaling
                          <ellipse cx="100" cy="120" rx="5" ry="7" fill="#881337" stroke="#fff" strokeWidth="1" />
                        ) : mascotMood === 'happy' ? (
                          // Cute Happy Smile shape
                          <path d="M93 115 Q100 124 107 115" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
                        ) : (
                          // Neutral tiny line shape
                          <path d="M95 118 L105 118" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
                        )}
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Floating Badge under Mascot */}
                <span className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest shadow-lg ${
                  projectionTheme === 'minimalist' 
                    ? 'bg-neutral-200 text-neutral-800' 
                    : 'bg-white/10 text-amber-200 backdrop-blur-md border border-white/20'
                }`}>
                  {mascotName.toUpperCase()}
                </span>
                <span className="text-[11px] mt-1.5 opacity-60 italic text-center px-10">
                  {isSpeaking ? 'FALANDO..."' : 'EM HARMONIZAÇÃO...'}
                </span>
              </div>

              {/* Information Text Display Area (Widescreen slides) */}
              <div className="lg:col-span-7 flex flex-col justify-center min-h-[300px] h-full">
                <AnimatePresence mode="wait">
                  {currentSlideIndex === 0 && (
                    <motion.div
                      key="welcome-slide"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.6 }}
                      className="space-y-6"
                    >
                      <span className={`px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full ${
                        projectionTheme === 'minimalist' ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/30 text-indigo-300'
                      }`}>
                        Fraternidade e Luz
                      </span>
                      <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight ${
                        projectionTheme === 'minimalist' ? 'text-neutral-900' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-indigo-200'
                      }`}>
                        Seja Bem-vindo!
                      </h1>
                      <p className={`text-base md:text-xl leading-relaxed font-sans ${
                        projectionTheme === 'minimalist' ? 'text-neutral-600' : 'text-slate-300'
                      }`}>
                        O Centro Espírita Mirante de Luz alegra-se com sua presença. Relaxe seus ombros, sintonize com a espiritualidade benfeitora e que a paz deste santuário flua em seu ser hoje.
                      </p>
                      <div className="flex items-center gap-4 text-xs tracking-wide">
                        <span className="flex items-center gap-1.5"><Heart size={14} className="text-red-400" /> Caridade</span>
                        <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-amber-300" /> Iluminação</span>
                        <span className="flex items-center gap-1.5"><Sun size={14} className="text-sky-400" /> Cura Espiritual</span>
                      </div>
                    </motion.div>
                  )}

                  {currentSlideIndex === 1 && (
                    <motion.div
                      key="activities-slide"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.6 }}
                      className="space-y-4"
                    >
                      <span className={`px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full ${
                        projectionTheme === 'minimalist' ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/35 text-amber-300'
                      }`}>
                        Escala de Atividades de Hoje
                      </span>
                      <h2 className={`text-3xl md:text-4xl font-bold ${
                        projectionTheme === 'minimalist' ? 'text-neutral-900' : 'text-amber-200'
                      }`}>
                        Programação do Dia
                      </h2>

                      {/* Horizontal activities timeline map */}
                      <div className="space-y-3 mt-4 max-h-[320px] overflow-y-auto pr-2">
                        {activities.filter(a => a.available).map((act, index) => (
                          <div 
                            key={act.id} 
                            className={`p-4 rounded-2xl flex items-center justify-between gap-4 border transition-colors ${
                              projectionTheme === 'minimalist' 
                                ? 'bg-white border-neutral-100 shadow-sm' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex gap-4 items-center">
                              <span className={`text-lg md:text-xl font-mono font-bold px-3 py-1 rounded-xl flex items-center justify-center ${
                                projectionTheme === 'minimalist' ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {act.time}
                              </span>
                              <div>
                                <h4 className={`font-bold text-sm md:text-base ${
                                  projectionTheme === 'minimalist' ? 'text-neutral-800' : 'text-slate-100'
                                }`}>
                                  {act.title}
                                </h4>
                                <p className={`text-xs ${
                                  projectionTheme === 'minimalist' ? 'text-neutral-500' : 'text-slate-400'
                                }`}>
                                  Facilitador: <strong className="text-indigo-400">{act.speaker}</strong>
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] uppercase tracking-widest opacity-40 hidden md:block">Ativo</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {currentSlideIndex === 2 && (
                    <motion.div
                      key="announcements-slide"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.6 }}
                      className="space-y-4"
                    >
                      <span className={`px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full ${
                        projectionTheme === 'minimalist' ? 'bg-red-100 text-red-700' : 'bg-red-500/30 text-rose-300'
                      }`}>
                        Mural e Avisos Fraternos
                      </span>
                      <h2 className={`text-3xl md:text-4xl font-bold ${
                        projectionTheme === 'minimalist' ? 'text-neutral-900' : 'text-slate-100'
                      }`}>
                        Comunicados Importantes
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 max-h-[320px] overflow-y-auto pr-2">
                        {announcements.map((ann) => (
                          <div 
                            key={ann.id} 
                            className={`p-4 rounded-2xl border ${
                              ann.priority === 'alta' 
                                ? 'bg-amber-500/10 border-amber-400/30' 
                                : projectionTheme === 'minimalist' 
                                  ? 'bg-white border-neutral-100' 
                                  : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {ann.priority === 'alta' && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              )}
                              <h4 className={`font-bold text-sm md:text-base ${
                                ann.priority === 'alta' ? 'text-amber-300' : (projectionTheme === 'minimalist' ? 'text-neutral-800' : 'text-slate-100')
                              }`}>
                                {ann.title}
                              </h4>
                            </div>
                            <p className={`text-xs leading-relaxed ${
                              projectionTheme === 'minimalist' ? 'text-neutral-600' : 'text-slate-300'
                            }`}>
                              {ann.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {currentSlideIndex === 3 && (
                    <motion.div
                      key="quote-slide"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.6 }}
                      className="space-y-6 flex flex-col justify-center text-center py-6"
                    >
                      <div className="mx-auto flex justify-center text-indigo-400 opacity-60">
                        <Feather size={36} className="animate-pulse" />
                      </div>
                      <blockquote className={`text-xl md:text-2xl lg:text-3xl italic font-serif leading-relaxed px-4 md:px-12 ${
                        projectionTheme === 'minimalist' ? 'text-neutral-800' : 'text-slate-100'
                      }`}>
                        "{selectedQuote.text || PREDEFINED_QUOTES[0].text}"
                      </blockquote>
                      <div>
                        <cite className={`text-xs md:text-sm font-bold block uppercase tracking-wide ${
                          projectionTheme === 'minimalist' ? 'text-indigo-600' : 'text-amber-300'
                        }`}>
                          — {selectedQuote.author || PREDEFINED_QUOTES[0].author}
                        </cite>
                        <span className={`text-[10px] tracking-wider block opacity-50 mt-1 uppercase`}>
                          Páginas de Luz Espírita
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Subtitle / Transcription Bar at the very bottom (Critical for accessibility in meeting rooms) */}
            <div className={`mt-auto z-10 px-6 py-3 rounded-2xl flex items-center gap-4 border text-center justify-center transition-all ${
              projectionTheme === 'minimalist' 
                ? 'bg-neutral-100 border-neutral-200 text-neutral-800' 
                : 'bg-black/35 border-white/10 text-amber-100 backdrop-blur-md'
            }`}>
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <p className="text-xs sm:text-sm font-medium leading-relaxed italic text-center max-w-4xl line-clamp-2">
                {subtitleText || 'Sintonizando vibrações elevadas... Toque em play para ouvir o mascote Luminho enunciar!'}
              </p>
              <Volume2 size={16} className={`shrink-0 ${isSpeaking ? 'text-amber-400 animate-bounce' : 'opacity-40'}`} />
            </div>

            {/* Projection Controls Floating Overlay Panel (Triggers on hover) */}
            <div className={`mt-6 p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-4 z-20 ${
              projectionTheme === 'minimalist' 
                ? 'bg-neutral-50/90 border-neutral-200 text-neutral-800' 
                : 'bg-slate-900/80 border-white/10 backdrop-blur-md'
            }`}>
              {/* Slide Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevSlide}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-300 active:scale-95"
                  title="Aviso Anterior"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => startProjectionPlayer(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        idx === currentSlideIndex 
                          ? 'w-6 bg-amber-400' 
                          : 'w-2.5 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                <button 
                  onClick={handleNextSlide}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-300 active:scale-95"
                  title="Próximo Aviso"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Loop and Synthesis State Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLoopingAutomatically(!isLoopingAutomatically)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    isLoopingAutomatically 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white/10 text-slate-400 hover:text-white'
                  }`}
                  title="Alternar reprodução contínua e leitura de telas"
                >
                  {isLoopingAutomatically ? <Check size={14} /> : <Pause size={14} />}
                  <span>{isLoopingAutomatically ? 'Repetindo Telas (Auto)' : 'Manual'}</span>
                </button>

                {/* Ambient Hum Synthesizer Toggle */}
                <button
                  onClick={toggleAmbientSound}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    ambientSoundActive 
                      ? 'bg-amber-500 text-slate-950' 
                      : 'bg-white/10 text-slate-400 hover:text-white'
                  }`}
                  title="Ativar frequências de meditação e sinos ao fundo"
                >
                  {ambientSoundActive ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  <span>Dom: {ambientSoundActive ? 'Ativo (Solfeggio)' : 'Silenciado'}</span>
                </button>

                {/* Theme Selector */}
                <div className="flex items-center gap-1">
                  <select
                    value={projectionTheme}
                    onChange={(e) => setProjectionTheme(e.target.value as any)}
                    className="bg-white/10 border border-white/20 text-xs text-slate-200 px-3 py-1.5 rounded-xl outline-none"
                    title="Selecione o tema visual de exibição na projeção"
                  >
                    <option value="stellar" className="text-slate-800">Tema Celestial (Escuro)</option>
                    <option value="aura" className="text-slate-800">Tema Luz Astral (Misto)</option>
                    <option value="minimalist" className="text-slate-800">Tema Portal da Paz (Claro)</option>
                  </select>
                </div>
              </div>

              {/* Leave Projection Mode and return to Dashboard */}
              <button
                onClick={closeProjection}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all"
              >
                <X size={14} />
                <span>Sair da Projeção</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ----------------- STANDARD SCREEN: EDITOR PANEL MODE ----------------- */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Title & Interactive Launch Board */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-100">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  Gestão do Mascote & Projeção <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Novo</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Controle do mascotinha <strong className="text-indigo-600">{mascotName}</strong> e painel digital signage para projeções na recepção e salão de palestras do Mirante de Luz.
                </p>
              </div>
            </div>
          </div>

          {/* Core Action Button to Cast on project screen */}
          <button 
            onClick={launchProjection}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:opacity-90 active:scale-98 transition-all duration-300 text-white font-black text-sm uppercase rounded-2xl shadow-xl shadow-indigo-100 cursor-pointer"
          >
            <Tv size={18} className="animate-bounce" />
            <span>Transmitir Projeção em Tela Cheia</span>
          </button>
        </div>

        {/* Mascot Face Interactive Sandbox on Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Live Sandbox Preview of Mascot & TTS config */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm uppercase tracking-widest font-black text-slate-400">Preview Interativo</h2>
              <p className="text-xs text-slate-500">Ajuste e clique no rostinho ou botões para testar as falas.</p>
            </div>

            {/* Simulated Frame Preview with floating star */}
            <div className="relative w-full aspect-square md:aspect-auto md:h-64 rounded-2xl bg-slate-950 flex flex-col items-center justify-center overflow-hidden border border-slate-800">
              {/* Stars particles overlay inside sandbox */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%` }} />
                ))}
              </div>

              {/* Encapsulated Tiny Mascot */}
              <div className="w-36 h-36 flex items-center justify-center animate-float">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                  {/* Backdrop glowing sphere */}
                  <circle cx="100" cy="105" r="50" fill={
                    mascotMood === 'happy' ? 'url(#grad-happy)' :
                    mascotMood === 'loving' ? 'url(#grad-loving)' :
                    mascotMood === 'studious' ? 'url(#grad-studious)' :
                    'url(#grad-serene)'
                  } stroke="#ffffff" strokeWidth="2.5" />

                  {/* Eyes Component */}
                  {mascotMood === 'serene' ? (
                    <g stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round">
                      <path d="M72 105 Q80 115 88 105" />
                      <path d="M112 105 Q120 115 128 105" />
                    </g>
                  ) : mascotMood === 'loving' ? (
                    <g fill="#c2185b" stroke="#fff" strokeWidth="1">
                      <path d="M70 95 C62 82 82 82 80 100" transform="scale(0.8) translate(18, 25)" />
                      <path d="M120 95 C112 82 132 82 130 100" transform="scale(0.8) translate(48, 25)" />
                    </g>
                  ) : (
                    <g className="eye-blinking">
                      <ellipse cx="80" cy="100" rx="9" ry="14" fill="#1e293b" />
                      <circle cx="77" cy="94" r="3.5" fill="#ffffff" />
                      <ellipse cx="120" cy="100" rx="9" ry="14" fill="#1e293b" />
                      <circle cx="117" cy="94" r="3.5" fill="#ffffff" />
                    </g>
                  )}

                  <circle cx="68" cy="114" r="6" fill="#f87171" opacity="0.5" />
                  <circle cx="132" cy="114" r="6" fill="#f87171" opacity="0.5" />

                  {/* Mouth and talk oscillation */}
                  <g className={isSpeaking ? 'mouth-talking' : ''}>
                    {isSpeaking ? (
                      <ellipse cx="100" cy="120" rx="5" ry="7" fill="#881337" stroke="#fff" strokeWidth="1" />
                    ) : mascotMood === 'happy' ? (
                      <path d="M93 115 Q100 124 107 115" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
                    ) : (
                      <path d="M95 118 L105 118" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
                    )}
                  </g>
                </svg>
              </div>

              {/* Status display overlay in preview */}
              <div className="absolute bottom-3 left-3 right-3 bg-black/40 border border-white/5 p-2 rounded-xl text-center">
                <p className="text-[10px] text-amber-200 truncate font-mono">
                  {isSpeaking ? `🔊 Falando...` : `💤 Em paz. Toque para testar`}
                </p>
              </div>
            </div>

            {/* Mood selector to customize facial expressions */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mudar Expressão Emocional</label>
              <div className="grid grid-cols-4 gap-2">
                {(['happy', 'serene', 'studious', 'loving'] as const).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setMascotMood(mood)}
                    className={`p-2 rounded-xl border text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                      mascotMood === mood 
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700' 
                        : 'bg-white border-slate-100 hover:border-slate-300 text-slate-500'
                    }`}
                  >
                    {mood === 'happy' ? 'Alegre' : mood === 'serene' ? 'Sereno' : mood === 'studious' ? 'Foco' : 'Amor'}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Sound Control Settings */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-700">Configuração de Voz do Mascote</h3>
                <p className="text-[10px] text-slate-500">Defina o tom amigável do sintetizador brasileirinho.</p>
              </div>

              {/* TTS Voices Listing Selection strictly pt-BR */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500">Selecione o sintetizador</span>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-xl outline-none"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                  {availableVoices.length === 0 && (
                    <option value="">Sintetizador Padrão de Fábrica</option>
                  )}
                </select>
              </div>

              {/* Pitch and Speed Tuning Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block">Tom da Voz</span>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.1"
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[9px] font-mono text-slate-400">Tom: {speechPitch}x (Fino)</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block">Velocidade</span>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[9px] font-mono text-slate-400">Vel: {speechRate}x</span>
                </div>
              </div>

              {/* Action test triggers */}
              <div className="flex gap-2">
                <button
                  onClick={triggerTestSpeech}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 active:scale-95 transition-all"
                >
                  <Volume2 size={14} />
                  <span>Testar Fala Audível</span>
                </button>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 active:scale-95 transition-all animate-pulse"
                  >
                    Mute
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Information editor forms and tables */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Tab Selector Header */}
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex gap-4">
                  {(['cronograma', 'avisos', 'config'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-extrabold uppercase tracking-wider relative transition-all ${
                        activeTab === tab 
                          ? 'text-indigo-600' 
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {tab === 'cronograma' ? '1. Cronograma do Dia' : tab === 'avisos' ? '2. Mural de Avisos' : '3. Config do Mascote'}
                      {activeTab === tab && (
                        <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1 CONTENT: TODAYS SCHEDULE OF TASKS */}
              {activeTab === 'cronograma' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-slate-700 font-extrabold text-base flex items-center gap-2">
                      <Activity size={18} className="text-indigo-600" /> Tarefas e Horários de Hoje
                    </h3>
                    <p className="text-xs text-slate-500">Cadastre e gerencie o cronograma de atividades espíritas que o mascote lerá em voz alta.</p>
                  </div>

                  {/* Horizontal fast addition form */}
                  <form onSubmit={handleAddActivity} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 block">Horário</span>
                      <input 
                        type="time" 
                        required
                        value={newActivity.time}
                        onChange={(e) => setNewActivity(p => ({ ...p, time: e.target.value }))}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-bold text-slate-500 block">Nome da AtividadeDoutrinária</span>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Passe Coletivo e Fluidificação"
                        value={newActivity.title}
                        onChange={(e) => setNewActivity(p => ({ ...p, title: e.target.value }))}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 block">Facilitador / Voluntário</span>
                      <input 
                        type="text" 
                        placeholder="Ex: Roberto Magalhães"
                        value={newActivity.speaker}
                        onChange={(e) => setNewActivity(p => ({ ...p, speaker: e.target.value }))}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none"
                      />
                    </div>

                    <div className="md:col-span-4 flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50">
                      <input 
                        type="text"
                        placeholder="Breve descrição fraterna da atividade que o mascote pode ler..."
                        value={newActivity.description}
                        onChange={(e) => setNewActivity(p => ({ ...p, description: e.target.value }))}
                        className="w-3/4 bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none"
                      />
                      <button 
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus size={14} /> Incorporar
                      </button>
                    </div>
                  </form>

                  {/* List of custom registered activities */}
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                    {activities.map((act) => (
                      <div key={act.id} className="p-3 border border-slate-100 hover:border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                            {act.time}
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">{act.title}</h4>
                            <p className="text-[11px] text-slate-500">Condução: <strong className="text-slate-700">{act.speaker || 'Equipe CEMIL'}</strong></p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle Active Switch */}
                          <button
                            onClick={() => handleToggleActivityAvailability(act.id)}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                              act.available 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {act.available ? 'Ativo na Projeção' : 'Ocultado'}
                          </button>

                          <button
                            onClick={() => handleDeleteActivity(act.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remover Atividade"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {activities.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-xs text-slate-400">Nenhuma tarefa inserida ainda. Adicione acima para testar.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2 CONTENT: BULLET ANNOUNCEMENTS */}
              {activeTab === 'avisos' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-slate-700 font-extrabold text-base flex items-center gap-2">
                      <Feather size={18} className="text-indigo-600" /> Avisos, Mural e Campanhas de Amor
                    </h3>
                    <p className="text-xs text-slate-500">Matenha a frequência de sua casa informada sobre arrecadações de cestas fraternas, ESDE, etc.</p>
                  </div>

                  {/* Announcement addition Form */}
                  <form onSubmit={handleAddAnnouncement} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-bold text-slate-500 block">Título do Comunicado</span>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Campanha do Agasalho CEMIL"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(p => ({ ...p, title: e.target.value }))}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 block">Grau de Emergência/Destaque</span>
                      <select
                        value={newAnnouncement.priority}
                        onChange={(e) => setNewAnnouncement(p => ({ ...p, priority: e.target.value as any }))}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none"
                      >
                        <option value="normal">Normal (Estrela)</option>
                        <option value="alta">Destaque Máximo (Chama piscante)</option>
                      </select>
                    </div>

                    <div className="md:col-span-3 flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50">
                      <input 
                        type="text"
                        required
                        placeholder="O que o mascote lerá do aviso... Ex: Estamos arrecadando cobertores até o dia 30..."
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement(p => ({ ...p, content: e.target.value }))}
                        className="w-5/6 bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none"
                      />
                      <button 
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus size={14} /> Afixar
                      </button>
                    </div>
                  </form>

                  {/* Announcements Listing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                    {announcements.map((ann) => (
                      <div key={ann.id} className={`p-4 border rounded-2xl relative ${
                        ann.priority === 'alta' ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1.5 justify-between">
                          <div className="flex items-center gap-1.5">
                            {ann.priority === 'alta' && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full uppercase">Destaque</span>
                            )}
                            <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1">{ann.title}</h4>
                          </div>

                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="text-slate-300 hover:text-rose-600 p-0.5 transition-colors absolute top-3 right-3"
                            title="Excluir Aviso"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed pr-6">{ann.content}</p>
                      </div>
                    ))}
                  </div>

                  {announcements.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                      <p className="text-xs text-slate-400">Nenhum informe inserido no mural espírita ainda.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3 CONTENT: DETAILED MASCOT CONFIG & AI GENERATOR */}
              {activeTab === 'config' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-slate-700 font-extrabold text-base flex items-center gap-2">
                      <Smile size={18} className="text-indigo-600" /> Identidade Visual e Mensagens Espirituais
                    </h3>
                    <p className="text-xs text-slate-500">Configure o nome do mascote e use inteligência artificial para escolher mensagens edificantes de boas-vindas.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mascot Character naming */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-slate-700">Nome do Mascote da Projeção</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mascotName}
                          onChange={(e) => setMascotName(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 p-2 text-xs rounded-xl outline-none font-bold"
                          placeholder="Ex: Luminho"
                        />
                        <button
                          onClick={() => {
                            speakText(`Maravilha! Agora meu nome oficial é ${mascotName}. Fico muito feliz em adotar esta identidade luminosa!`);
                          }}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                        >
                          Salvar
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        Por padrão chamamos ele de <strong>Luminho</strong>, mas você pode mudar para algo que sintonize com sua comunidade local.
                      </p>
                    </div>

                    {/* Spiritual message settings (Gemini-API hooked) */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-slate-700">Sintonizar Mensagem do Dia</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Escolha ou gere de forma inteligente uma reflexão que será proferida pelo mascote na abertura da projeção do auditório.
                      </p>

                      <div className="space-y-2">
                        {/* Selected quote card */}
                        <div className="p-3 bg-white border border-indigo-100 rounded-xl space-y-1">
                          <p className="text-[11px] italic text-slate-700 line-clamp-2">
                            "{selectedQuote.text}"
                          </p>
                          <span className="text-[10px] font-bold text-indigo-600 block text-right">
                            — {selectedQuote.author}
                          </span>
                        </div>

                        {/* Gemini trigger button */}
                        <button
                          onClick={handleGenerateAiMessage}
                          disabled={aiLoading}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-90 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-100"
                        >
                          <Sparkle size={14} className={aiLoading ? 'animate-spin' : 'animate-bounce'} />
                          <span>{aiLoading ? 'Sintonizando Mentores Inteligência...' : 'Sintonizar Mensagem Espírita via IA'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fast explanation for the physical Projection Screen / Video creation */}
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                      <HelpCircle size={14} /> Como projetar na nossa casa e fazer vídeos?
                    </h4>
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      Para apresentar a animação falada do mascotinha e os informes diários na sua casa física, é muito simples:
                    </p>
                    <ol className="list-decimal pl-4 text-[10px] text-indigo-600 space-y-1">
                      <li>Conecte o computador da recepção/secretaria a um **projetor multimídia** ou **TV grande** via cabo HDMI ou transmissão Wifi.</li>
                      <li>Abra esta tela e clique em **"Transmitir Projeção em Tela Cheia"**. A projeção cobrirá a tela toda, emitindo os sons de meditação e lendo em voz alta as telas sucessivamente!</li>
                      <li>Para gravar como arquivo de vídeo, você pode usar um gravador gratuito de tela (como OBS Studio ou gravadores nativos do Windows/Mac) gravando a janela em tela cheia enquanto as transições acontecem, gerando um clipe incrível para ser enviado em grupos de WhatsApp da casa espírita!</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Helper Banner */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-2">
              <span className="text-[10px] flex items-center gap-1">
                <ShieldAlert size={12} className="text-amber-500" /> Sintonizado com a harmonia e acessibilidade de voluntários
              </span>
              <span className="text-[10px] font-mono">mirantedeluz.org</span>
            </div>
          </div>

        </div>

        {/* Informative Grid/Footer card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <span className="p-1 px-2.5 bg-amber-50 text-amber-700 text-[10px] uppercase font-bold tracking-wider rounded-lg">Acessibilidade Ativa</span>
            <h4 className="text-sm font-extrabold text-slate-800">Inclusão Auditiva</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Durante as apresentações, o mascote virtual dispõe de transcrição de voz automática em tempo real. Isso propicia que deficientes auditivos acompanhem os informes diários sem nenhum óbice.
            </p>
          </div>
          <div className="space-y-2">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold tracking-wider rounded-lg">Frequência Harmônica</span>
            <h4 className="text-sm font-extrabold text-slate-800">Sons Solfeggio 528Hz</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O gerador de ambiente integrado utiliza a frequência solfeggio 528Hz (conhecida como frequência da harmonia e paz). É ideal para preencher auditórios com uma melodia sutil de pré-palestra.
            </p>
          </div>
          <div className="space-y-2">
            <span className="p-1 px-2.5 bg-green-50 text-green-700 text-[10px] uppercase font-bold tracking-wider rounded-lg">100% Personalizado</span>
            <h4 className="text-sm font-extrabold text-slate-800">Independência de Rede</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toda a síntese de áudio eletrônica e geração de ondas de ambientação operam de forma local diretamente no navegador, garantindo que o mascote fale mesmo sob conexões de internet fracas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
