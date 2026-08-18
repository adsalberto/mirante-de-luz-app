import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Tv, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Heart, 
  Maximize2, 
  Minimize2, 
  RefreshCw,
  X,
  Radio,
  FileText
} from 'lucide-react';
import { DoutrinarioPalestra } from '../../types';

// Curated passages from Kardec for the preparatory reading
const GOSPEL_READINGS = [
  {
    book: 'O Evangelho Segundo o Espiritismo',
    chapter: 'Cap. XVII - Sede Perfeitos',
    item: 'Item 3 - O Homem de Bem',
    text: 'O verdadeiro homem de bem é o que pratica a lei de justiça, amor e caridade na sua maior pureza. Se interroga a sua consciência sobre seus próprios atos, perguntará a si mesmo se não violou essa lei, se não cometeu o mal, se fez todo o bem que podia, se ninguém teve motivos de se queixar dele, enfim se fez aos outros o que desejava que os outros lhe fizessem.'
  },
  {
    book: 'O Evangelho Segundo o Espiritismo',
    chapter: 'Cap. VI - O Cristo Consolador',
    item: 'Item 4 - O jugo leve',
    text: 'Vinde a mim, todos vós que estais aflitos e sobrecarregados, que eu vos aliviarei. Tomai sobre vós o meu jugo e aprendei de mim que sou brando e humilde de coração, e achareis repouso para as vossas almas; pois é suave o meu jugo e leve o meu fardo.'
  },
  {
    book: 'O Evangelho Segundo o Espiritismo',
    chapter: 'Cap. XIII - Não saiba a vossa mão esquerda o que faz a vossa mão direita',
    item: 'Item 1 - Fazer o bem sem ostentação',
    text: 'A beneficência praticada sem ostentação tem duplo mérito; além de ser caridade material, é caridade moral, pois resguarda a suscetibilidade do assistido e não o humilha aos olhos do mundo.'
  },
  {
    book: 'O Livro dos Espíritos',
    chapter: 'Livro Terceiro - Das Leis Morais',
    item: 'Questão 625 - O Guia e Modelo',
    text: 'Qual o tipo mais perfeito que Deus tem oferecido ao homem, para lhe servir de guia e modelo? — Vede Jesus. Para o homem, Jesus constitui o tipo da perfeição moral a que a Humanidade pode aspirar na Terra.'
  },
  {
    book: 'O Evangelho Segundo o Espiritismo',
    chapter: 'Cap. IX - Bem-aventurados os que são brandos e pacíficos',
    item: 'Item 7 - A paciência',
    text: 'A cólera não resolve os problemas; apenas turva a visão e atrai companhias espirituais em desarmonia. Sede mansos de coração e encontrareis a serenidade nas provas mais difíceis.'
  }
];

interface MesaDirigenteTabProps {
  currentPalestra?: DoutrinarioPalestra;
  isProjectorOpen: boolean;
  onCloseProjector: () => void;
  onOpenProjector: () => void;
}

export const MesaDirigenteTab: React.FC<MesaDirigenteTabProps> = ({
  currentPalestra,
  isProjectorOpen,
  onCloseProjector,
  onOpenProjector
}) => {
  // Timer State (default 40 minutes = 2400 seconds)
  const [targetMinutes, setTargetMinutes] = useState<number>(40);
  const [secondsLeft, setSecondsLeft] = useState<number>(40 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(3); // Step 3 = Palestra

  // Gospel Reader State
  const [selectedReadingIndex, setSelectedReadingIndex] = useState<number>(0);

  // Digital Clock for TV
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = (mins = targetMinutes) => {
    setIsRunning(false);
    setTargetMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const handleAddMinutes = (mins: number) => {
    setSecondsLeft((prev) => prev + mins * 60);
  };

  const handleRandomReading = () => {
    const nextIdx = Math.floor(Math.random() * GOSPEL_READINGS.length);
    setSelectedReadingIndex(nextIdx);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Status color based on time remaining
  const getTimeStatus = () => {
    const minsLeft = Math.floor(secondsLeft / 60);
    if (secondsLeft === 0) return { label: 'Tempo Esgotado!', color: 'bg-rose-500 text-white animate-pulse' };
    if (minsLeft <= 5) return { label: 'Aviso Final: 5 Minutos!', color: 'bg-rose-600 text-white' };
    if (minsLeft <= 10) return { label: 'Atenção: 10 Minutos Restantes', color: 'bg-amber-500 text-slate-950 font-bold' };
    return { label: 'Palestra no Tempo Previsto', color: 'bg-emerald-500 text-white' };
  };

  const currentReading = GOSPEL_READINGS[selectedReadingIndex];
  const timeStatus = getTimeStatus();

  return (
    <div className="space-y-6">
      {/* 1. MESA DIRETORA: CONDUÇÃO AO VIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Meeting Steps & Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                Roteiro Canônico da Noite
              </h2>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                Mesa Diretora
              </span>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-2">
              {[
                { step: 1, title: '1. Harmonização Musical', desc: 'Músicas instrumentais e elevação dos pensamentos', time: '10 min' },
                { step: 2, title: '2. Leitura & Prece Inicial', desc: 'Página do Evangelho e rogativa aos benfeitores', time: '5 min' },
                { step: 3, title: '3. Exposição Doutrinária', desc: 'Desenvolvimento do tema evangélico/doutrinário', time: '35-45 min' },
                { step: 4, title: '4. Vibrações Fraternas', desc: 'Vibrações pelos enfermos, lares, planeta e necessitados', time: '5 min' },
                { step: 5, title: '5. Prece Final & Avisos', desc: 'Agradecimento a Jesus e informes da Casa Espírita', time: '3 min' },
                { step: 6, title: '6. Fluidoterapia & Passe', desc: 'Encaminhamento sereno para as câmaras fluídicas', time: 'Contínuo' },
              ].map((item) => {
                const isCurrent = activeStep === item.step;
                const isPassed = activeStep > item.step;
                return (
                  <button
                    key={item.step}
                    onClick={() => setActiveStep(item.step)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                        : isPassed
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 opacity-80'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                          {item.step}
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-400 text-slate-500 text-xs flex items-center justify-center font-medium">
                          {item.step}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isCurrent ? 'text-blue-900 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Lecture Timer & Stage Conductor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Controle de Tempo do Expositor
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentPalestra ? currentPalestra.title : 'Palestra Doutrinária da Noite'}
                </h2>
                <p className="text-xs text-slate-500">
                  Expositor(a): <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPalestra?.speakerName || 'Convidado'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProjector}
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Tv className="w-4 h-4 text-blue-600" />
                  Abrir Telão
                </button>
              </div>
            </div>

            {/* Big Digital Display */}
            <div className="bg-slate-950 rounded-2xl p-8 text-center text-white relative overflow-hidden shadow-inner border border-slate-800">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${timeStatus.color}`}>
                  {timeStatus.label}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                  Tempo Restante
                </span>
                <p className="text-6xl md:text-7xl font-mono font-black tracking-tight text-white select-none">
                  {formatTime(secondsLeft)}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full mt-6 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    secondsLeft <= 300 ? 'bg-rose-500' : secondsLeft <= 600 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, (secondsLeft / (targetMinutes * 60)) * 100)}%` }}
                />
              </div>

              {/* Quick Warning Alerts for the Speaker */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className={`p-2 rounded-xl text-center border ${
                  secondsLeft > 600 
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400 font-bold' 
                    : 'border-slate-800 bg-slate-900/50 text-slate-500'
                }`}>
                  <span className="text-xs font-semibold block">Tempo Normal</span>
                  <span className="text-[10px] text-slate-400">Desenvolvimento</span>
                </div>

                <div className={`p-2 rounded-xl text-center border ${
                  secondsLeft <= 600 && secondsLeft > 300 
                    ? 'border-amber-500 bg-amber-950/50 text-amber-300 font-bold ring-2 ring-amber-500/30' 
                    : 'border-slate-800 bg-slate-900/50 text-slate-500'
                }`}>
                  <span className="text-xs font-semibold block">10 Minutos</span>
                  <span className="text-[10px] text-slate-400">Iniciar Conclusão</span>
                </div>

                <div className={`p-2 rounded-xl text-center border ${
                  secondsLeft <= 300 
                    ? 'border-rose-500 bg-rose-950/50 text-rose-300 font-bold ring-2 ring-rose-500/40 animate-pulse' 
                    : 'border-slate-800 bg-slate-900/50 text-slate-500'
                }`}>
                  <span className="text-xs font-semibold block">5 Minutos / Fim</span>
                  <span className="text-[10px] text-slate-400">Encerrar com Prece</span>
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  id="btn-timer-start-pause"
                  onClick={handleStartPause}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isRunning ? 'Pausar Cronômetro' : 'Iniciar Contagem'}</span>
                </button>

                <button
                  id="btn-timer-reset"
                  onClick={() => handleReset()}
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Resetar</span>
                </button>
              </div>

              {/* Time Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium mr-1">Duração:</span>
                {[30, 40, 45].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleReset(mins)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      targetMinutes === mins
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
                <button
                  onClick={() => handleAddMinutes(5)}
                  className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 cursor-pointer"
                >
                  +5 min
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LEITOR PREPARATÓRIO DO EVANGELHO */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Página Preparatória de Abertura (Kardec)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Texto para reflexão antes da prece inicial e início da exposição doutrinária
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-sortear-pagina"
              onClick={handleRandomReading}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Abrir Outra Página Aleatória</span>
            </button>
          </div>
        </div>

        {/* Selected Reading Card */}
        <div className="bg-amber-50/50 dark:bg-slate-900/60 border border-amber-200/70 dark:border-slate-700 rounded-xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/50 dark:border-slate-700 pb-3">
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                {currentReading.book}
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {currentReading.chapter} • <span className="text-slate-600 dark:text-slate-400 font-normal">{currentReading.item}</span>
              </p>
            </div>
            <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium px-2.5 py-1 rounded-full">
              Página {selectedReadingIndex + 1} de {GOSPEL_READINGS.length}
            </span>
          </div>

          <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed italic font-serif">
            "{currentReading.text}"
          </p>
        </div>
      </div>

      {/* 3. FULLSCREEN PROJECTOR / TV MODAL */}
      {isProjectorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-8 md:p-12 animate-in fade-in duration-200">
          {/* Top Bar of Projector */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-400" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                  Centro Espírita • Reunião Pública Doutrinária
                </span>
                <h2 className="text-xl font-bold text-white">
                  Boas-vindas ao Salão Doutrinário
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 uppercase">Horário Oficial</span>
                <p className="text-2xl font-bold text-emerald-400">{currentTime}</p>
              </div>
              <button
                onClick={onCloseProjector}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                title="Fechar Telão"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Center Main Stage Content */}
          <div className="my-auto max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-3">
              <span className="inline-block bg-blue-500/20 text-blue-300 border border-blue-400/30 text-sm font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Palestra Doutrinária da Noite
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {currentPalestra?.title || 'O Evangelho como Roteiro de Luz e Esperança'}
              </h1>
              <p className="text-lg md:text-xl text-blue-200/90 font-medium">
                Referência: <span className="text-white font-semibold">{currentPalestra?.bookReference || 'O Evangelho Segundo o Espiritismo'}</span>
              </p>
            </div>

            <div className="inline-flex items-center gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 px-8 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center shadow-lg">
                {(currentPalestra?.speakerName || 'E')[0]}
              </div>
              <div className="text-left">
                <span className="text-xs uppercase tracking-wider text-slate-400">Expositor(a)</span>
                <p className="text-xl font-bold text-white">
                  {currentPalestra?.speakerName || 'Irmão(ã) Expositor(a)'}
                </p>
                <p className="text-xs text-indigo-300">
                  {currentPalestra?.speakerIsGuest ? 'Expositor Convidado' : 'Trabalhador da Casa'}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Broadcast Bar: Notices & Fluidotherapy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-6 text-slate-300 text-xs">
            <div className="flex items-center gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Passe & Fluidoterapia</span>
                <span>Ao término da palestra, os passes serão ministrados na câmara fluídica.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <Volume2 className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Harmonia do Ambiente</span>
                <span>Por gentileza, mantenha seus aparelhos celulares no modo silencioso.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <Heart className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Atendimento Fraterno</span>
                <span>Diálogo acolhedor e privativo disponível na recepção da Casa.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
