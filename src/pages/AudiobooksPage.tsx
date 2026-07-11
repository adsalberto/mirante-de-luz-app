import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Play,
  Pause,
  Plus,
  X,
  Trash2,
  Pencil,
  Volume2,
  VolumeX,
  RotateCcw,
  SkipForward,
  SkipBack,
  Search,
  ShoppingCart,
  DollarSign,
  Heart,
  TrendingUp,
  FileText,
  User,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  CreditCard,
  Sliders,
  ChevronRight,
  Headphones,
  Music,
  Download,
  AlertCircle,
  Copy,
  Clock,
  Sparkles,
  Award,
  Lock,
  Activity,
  PlusCircle,
  Check,
  Coffee,
  CloudRain,
  Compass,
  FilePieChart
} from 'lucide-react';
import {
  audiobooksService,
  Audiobook,
  AudioTrack,
  AudioPurchase
} from '../services/audiobooksData';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function AudiobooksPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'store' | 'library' | 'admin' | 'dashboard'>('store');
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [purchases, setPurchases] = useState<AudioPurchase[]>([]);
  
  // Search and Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Player state
  const [currentBook, setCurrentBook] = useState<Audiobook | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.8);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Ambient sound state (Craft premium feature)
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'forest' | 'waves'>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.2);

  // Checkout modal state
  const [checkoutBook, setCheckoutBook] = useState<Audiobook | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [activePurchase, setActivePurchase] = useState<AudioPurchase | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [creditCardData, setCreditCardData] = useState({ number: '', name: '', expiry: '', cvc: '' });
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Admin page state
  const [adminModalOpen, setAdminModalOpen] = useState<{ mode: 'add' | 'edit'; item?: Audiobook } | null>(null);
  const [adminFormData, setAdminFormData] = useState<any>({});
  const [tempTrackData, setTempTrackData] = useState<any>({ title: '', duration: '', audioUrl: '' });
  const [tempTracksList, setTempTracksList] = useState<AudioTrack[]>([]);

  // HTML Audio instances refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load user details
  const userEmail = currentUser?.email || 'anonimo@cemil.com';
  const userName = currentUser?.name || 'Visitante Colaborador';
  const isAdminOrSecretary = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || currentUser?.role === 'SECRETARIO';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setAudiobooks(audiobooksService.getAudiobooks());
    setPurchases(audiobooksService.getPurchases());
  };

  // Manage Main Audio elements
  useEffect(() => {
    audioRef.current = new Audio();
    ambientAudioRef.current = new Audio();

    const audio = audioRef.current;
    const ambient = ambientAudioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => handleNextTrack();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      ambient.pause();
    };
  }, []);

  // Sync ambient sound url dynamically
  useEffect(() => {
    if (!ambientAudioRef.current) return;
    const ambient = ambientAudioRef.current;

    if (ambientSound === 'none') {
      ambient.pause();
    } else {
      let url = '';
      if (ambientSound === 'rain') url = 'https://assets.mixkit.co/active_storage/sfx/2533/2533-84.wav'; // Soft rain loop
      if (ambientSound === 'forest') url = 'https://assets.mixkit.co/active_storage/sfx/1250/1250-84.wav'; // Forest atmosphere
      if (ambientSound === 'waves') url = 'https://assets.mixkit.co/active_storage/sfx/2507/2507-84.wav'; // Ocean shore waves

      ambient.src = url;
      ambient.loop = true;
      ambient.volume = ambientVolume;
      if (isPlaying) {
        ambient.play().catch(() => {});
      }
    }
  }, [ambientSound]);

  // Adjust volume of player and ambient sound
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (!audioRef.current || !currentBook) return;

    if (isPlaying) {
      audioRef.current.pause();
      ambientAudioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      if (ambientSound !== 'none') {
        ambientAudioRef.current?.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  // Change Track
  useEffect(() => {
    if (!audioRef.current || !currentBook) return;

    const activeTrack = currentBook.tracks[currentTrackIndex];
    if (activeTrack) {
      audioRef.current.src = activeTrack.audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
        if (ambientSound !== 'none') {
          ambientAudioRef.current?.play().catch(() => {});
        }
      } else {
        setCurrentTime(0);
      }
    }
  }, [currentBook, currentTrackIndex]);

  // Adjust playback speed
  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleNextTrack = () => {
    if (!currentBook) return;
    if (currentTrackIndex < currentBook.tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    } else {
      // Loop to beginning if last track
      setCurrentTrackIndex(0);
    }
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filtered audiobooks of the store
  const filteredBooks = audiobooks.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const myUnlockedBooks = audiobooks.filter(book => 
    audiobooksService.isPurchased(userEmail, book.id) || isAdminOrSecretary
  );

  // Pre-configured tags/categories
  const CATEGORIES = ['Todos', 'Espiritualidade', 'Filosofia', 'Autoconhecimento', 'Meditação', 'Infantil'];

  // Handlers for Checkout flow
  const handleOpenCheckout = (book: Audiobook) => {
    setCheckoutBook(book);
    setPaymentMethod('PIX');
    setCreditCardData({ number: '', name: '', expiry: '', cvc: '' });
  };

  const handleConfirmPurchase = () => {
    if (!checkoutBook) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      // Generate purchase in dataService
      const pur = audiobooksService.createPurchase(userEmail, checkoutBook.id, checkoutBook.price, paymentMethod);
      setActivePurchase(pur);
      setIsProcessingPayment(false);
    }, 1200);
  };

  const handleSimulatePaymentApproval = () => {
    if (!activePurchase) return;
    audiobooksService.approvePurchase(activePurchase.id);
    loadAllData();
    
    // Close modal and show success alert/toast
    setActivePurchase(null);
    setCheckoutBook(null);
    setActiveTab('library');
    alert(`Pagamento aprovado com Sucesso! O Audiobook foi adicionado e já está disponível em sua biblioteca particular "Meus Áudios".`);
  };

  // Admin Handlers
  const handleOpenAdminModal = (mode: 'add' | 'edit', item?: Audiobook) => {
    setAdminModalOpen({ mode, item });
    if (mode === 'edit' && item) {
      setAdminFormData({ ...item });
      setTempTracksList(item.tracks || []);
    } else {
      setAdminFormData({
        title: '',
        author: 'Mirante de Luz',
        description: '',
        narrator: 'Sintetizador de Voz',
        coverUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        price: '29.90',
        category: 'Espiritualidade',
        duration: '1h 30m',
        rating: 4.8
      });
      setTempTracksList([]);
    }
  };

  const handleAddTrackToTempList = () => {
    if (!tempTrackData.title || !tempTrackData.audioUrl) {
      alert('Favor preencher o título e a URL do arquivo de áudio para esta faixa!');
      return;
    }
    const track: AudioTrack = {
      id: `tr_${Date.now()}`,
      title: tempTrackData.title,
      duration: tempTrackData.duration || '05:00',
      audioUrl: tempTrackData.audioUrl
    };
    setTempTracksList([...tempTracksList, track]);
    setTempTrackData({ title: '', duration: '', audioUrl: '' });
  };

  const handleRemoveTrackFromTempList = (id: string) => {
    setTempTracksList(tempTracksList.filter(t => t.id !== id));
  };

  const handleAdminFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminModalOpen) return;
    const { mode, item } = adminModalOpen;

    const readyItem: Audiobook = {
      ...adminFormData,
      id: mode === 'edit' && item ? item.id : `ab_${Date.now()}`,
      price: parseFloat(adminFormData.price) || 0,
      tracks: tempTracksList
    };

    let updatedList = [];
    if (mode === 'add') {
      updatedList = [...audiobooks, readyItem];
    } else {
      updatedList = audiobooks.map(x => x.id === item?.id ? readyItem : x);
    }

    audiobooksService.saveAudiobooks(updatedList);
    setAudiobooks(updatedList);
    setAdminModalOpen(null);
  };

  const handleDeleteAudiobook = (id: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja remover o audiobook "${name}" do catálogo permanentemente?`)) {
      const updated = audiobooks.filter(b => b.id !== id);
      audiobooksService.saveAudiobooks(updated);
      setAudiobooks(updated);
    }
  };

  // BI and reports calculations
  const totalReceived = purchases
    .filter(p => p.status === 'APROVADO')
    .reduce((acc, p) => acc + p.amountPaid, 0);

  const bestSellerCategory = (() => {
    const counts: { [key: string]: number } = {};
    purchases.filter(p => p.status === 'APROVADO').forEach(p => {
      const b = audiobooks.find(x => x.id === p.audiobookId);
      if (b) {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    });
    let best = 'Nenhuma';
    let max = 0;
    Object.entries(counts).forEach(([cat, val]) => {
      if (val > max) {
        max = val;
        best = cat;
      }
    });
    return `${best} (${max} vendas)`;
  })();

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* HEADER CONTROLLER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest leading-none">
            <Headphones size={16} />
            <span>Biblioteca de Áudio Digital</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic leading-none uppercase">
            Audiobooks e Sintonizações
          </h1>
          <p className="text-gray-400 font-medium text-sm sm:text-base">
            Hospedagem, venda integrada e reprodução online para palestras, evangelhos, orações e audiobooks da Fraternidade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (window.confirm('Desitir de todas as compras simuladas e resetar catálogo padrão?')) {
                localStorage.removeItem('cemil_audiobooks');
                localStorage.removeItem('cemil_audio_purchases');
                loadAllData();
              }
            }}
            className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl text-xs font-bold transition-all"
          >
            Resetar Catálogo
          </button>
        </div>
      </header>

      {/* HORIZONTAL MENUS */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-gray-100">
        {[
          { id: 'store', label: 'Catálogo / Livraria', icon: BookOpen },
          { id: 'library', label: 'Meus Áudios Comprados', icon: Headphones },
          ...(isAdminOrSecretary ? [
            { id: 'admin', label: 'Gerenciar Áudios (Upload)', icon: Sliders },
            { id: 'dashboard', label: 'Vendas e Relatório BI', icon: FilePieChart }
          ] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-[0.97]",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600/10"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-950"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* FILTER SEARCH PANEL */}
      {activeTab === 'store' && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-300">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por título, autor, narrador ou tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-indigo-600 text-xs text-gray-800 outline-none transition-all placeholder:text-gray-400 font-medium"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pt-2 sm:pt-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap",
                  selectedCategory === cat 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WORK STATION CONTAINER */}
      <div className="min-h-[450px]">
        {/* VIEW 1: CATALOGUE STORE */}
        {activeTab === 'store' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredBooks.length > 0 ? filteredBooks.map((book) => {
                const isOwned = audiobooksService.isPurchased(userEmail, book.id) || isAdminOrSecretary;
                return (
                  <div key={book.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all gap-4">
                    <div className="space-y-3">
                      {/* Image cover */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 group">
                        <img 
                          src={book.coverUrl} 
                          alt={book.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                        />
                        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white font-extrabold text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
                          {book.category}
                        </div>
                        {isOwned && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white font-extrabold text-[8px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <Check size={10} /> Adquirido
                          </div>
                        )}
                        {/* Play Preview floating circle */}
                        <button 
                          onClick={() => {
                            setCurrentBook(book);
                            setCurrentTrackIndex(0);
                            setIsPlaying(true);
                          }}
                          className="absolute bottom-2 right-2 p-2 bg-white text-indigo-600 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                          title="Ouvir amostra gratuita"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-extrabold tracking-tight block truncate uppercase">Autor: {book.author}</span>
                        <h4 className="font-extrabold text-sm text-gray-800 tracking-tight leading-tight line-clamp-1">{book.title}</h4>
                        <p className="text-[10px] text-gray-400 font-medium italic">Narrador: {book.narrator}</p>
                      </div>
                      
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {book.description}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock size={11} /> {book.duration}</span>
                        <span className="flex items-center gap-1"><Music size={11} /> {book.tracks.length} capítulos</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">Preço</span>
                        <span className="text-sm font-black text-indigo-900">{formatCurrency(book.price)}</span>
                      </div>
                      {isOwned ? (
                        <button
                          onClick={() => {
                            setCurrentBook(book);
                            setCurrentTrackIndex(0);
                            setIsPlaying(true);
                            setActiveTab('library');
                          }}
                          className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[10px] font-extrabold tracking-wider uppercase transition-all flex items-center gap-1"
                        >
                          <Headphones size={12} /> Começar a Ouvir
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenCheckout(book)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95"
                        >
                          <ShoppingCart size={12} /> Comprar Áudio
                        </button>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-gray-100 space-y-3">
                  <AlertCircle size={32} className="text-gray-300 mx-auto" />
                  <p className="text-gray-400 font-bold text-sm">Nenhum audiobook encontrado...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: PURCHASED LIBRARY & PLAYBACK CONTROLS */}
        {activeTab === 'library' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            {/* LHS: Purchased Audiobooks List */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" />
                Minha Biblioteca Adquirida
              </h3>
              
              {myUnlockedBooks.length > 0 ? myUnlockedBooks.map((book) => {
                const isSelected = currentBook?.id === book.id;
                return (
                  <div
                    key={book.id}
                    onClick={() => {
                      setCurrentBook(book);
                      setCurrentTrackIndex(0);
                    }}
                    className={cn(
                      "p-4 bg-white rounded-3xl border [cursor:pointer] hover:shadow-md transition-all flex gap-4 items-center",
                      isSelected ? "ring-2 ring-indigo-600 border-transparent bg-indigo-50/10" : "border-gray-100"
                    )}
                  >
                    <img 
                      src={book.coverUrl} 
                      alt={book.title} 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-cover rounded-xl bg-gray-50" 
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full inline-block">
                        {book.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-gray-800 tracking-tight leading-tight truncate">{book.title}</h4>
                      <p className="text-[10px] text-gray-400 font-medium truncate">Autor: {book.author}</p>
                      <p className="text-[10px] text-gray-400 font-semibold italic">{book.tracks.length} capítulos</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="bg-white p-8 text-center rounded-3xl border border-gray-100 space-y-4">
                  <Headphones size={36} className="text-gray-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-gray-600 font-bold text-xs">Sua biblioteca está vazia</p>
                    <p className="text-[11px] text-gray-400 leading-normal">Escolha um item do catálogo e adquira para ouvi-lo em nosso reprodutor exclusivo.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('store')}
                    className="px-4 py-2 bg-indigo-600 text-white font-extrabold text-[10px] rounded-xl uppercase tracking-wider hover:bg-indigo-700 transition-all"
                  >
                    Ver Catálogo
                  </button>
                </div>
              )}
            </div>

            {/* RHS: Interactive Audio Player Panel */}
            <div className="lg:col-span-8">
              {currentBook ? (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  {/* Title & metadata */}
                  <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-gray-50 pb-6">
                    <img 
                      src={currentBook.coverUrl} 
                      alt={currentBook.title} 
                      referrerPolicy="no-referrer"
                      className="w-32 h-32 object-cover rounded-2xl bg-gray-50 shadow-md" 
                    />
                    <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {currentBook.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-50 text-yellow-700 border border-yellow-100 flex items-center gap-1">
                          <Award size={10} /> {currentBook.rating} ESTRELAS
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{currentBook.title}</h3>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Autor: {currentBook.author} • Narrador: {currentBook.narrator}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{currentBook.description}</p>
                    </div>
                  </div>

                  {/* Active track bar and sound loops */}
                  <div className="bg-gray-50/50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 animate-pulse">
                        <Music size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block leading-none">FAIXA REPRODUZINDO</span>
                        <h4 className="font-extrabold text-sm text-gray-800 leading-tight pt-1">
                          {currentBook.tracks[currentTrackIndex]?.title || 'Carregando capítulo...'}
                        </h4>
                      </div>
                    </div>
                    <span className="text-xs font-black text-gray-500 bg-white border border-gray-100 px-3 py-1 rounded-xl shadow-sm">
                      Cap. {currentTrackIndex + 1} de {currentBook.tracks.length}
                    </span>
                  </div>

                  {/* Core Audio Player Controls */}
                  <div className="space-y-4 py-2">
                    {/* Progress Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(isFinite(duration) ? duration : 0)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={isFinite(duration) ? duration : 100}
                        value={currentTime}
                        onChange={(e) => handleSeek(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Playback speed dials */}
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                        {[1.0, 1.25, 1.5, 2.0].map(s => (
                          <button
                            key={s}
                            onClick={() => handleChangeSpeed(s)}
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all",
                              playbackSpeed === s ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-800"
                            )}
                          >
                            {s.toFixed(2)}x
                          </button>
                        ))}
                      </div>

                      {/* Music actions */}
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handlePrevTrack} 
                          disabled={currentTrackIndex === 0}
                          className="p-2 border border-gray-100 hover:bg-gray-50 rounded-full text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-all active:scale-95"
                        >
                          <SkipBack size={18} fill="currentColor" />
                        </button>
                        
                        <button 
                          onClick={handleTogglePlay}
                          className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                          {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                        </button>

                        <button 
                          onClick={handleNextTrack}
                          className="p-2 border border-gray-100 hover:bg-gray-50 rounded-full text-gray-600 hover:text-gray-900 transition-all active:scale-95"
                        >
                          <SkipForward size={18} fill="currentColor" />
                        </button>
                      </div>

                      {/* Volume selector */}
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-gray-900">
                          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="w-20 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PREMIUM EXTRA: AMBIENT SOUND GENERATOR (Craftsmanship Mandate) */}
                  <div className="bg-indigo-50/40 p-4 sm:p-5 rounded-3xl border border-indigo-100/50 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-indigo-800 font-extrabold text-[11px] uppercase tracking-wider">
                          <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                          <span>Gerador Atmosférico Integrado</span>
                          <span className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black scale-90">STUDIO COZY</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-normal">
                          Gere e mescle uma sutil ambiência acústica complementar para aumentar seu foco e meditação.
                        </p>
                      </div>
                      {ambientSound !== 'none' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Volume Ambiência</span>
                          <input
                            type="range"
                            min="0.1"
                            max="0.8"
                            step="0.05"
                            value={ambientVolume}
                            onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                            className="w-16 h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'Silêncio Puro', icon: VolumeX },
                        { id: 'rain', label: 'Chuva Suave', icon: CloudRain },
                        { id: 'forest', label: 'Ecos da Floresta', icon: Compass },
                        { id: 'waves', label: 'Ondas do Mar', icon: Coffee }
                      ].map(amb => {
                        const AmbIcon = amb.icon;
                        const isAmbSelected = ambientSound === amb.id;
                        return (
                          <button
                            key={amb.id}
                            onClick={() => setAmbientSound(amb.id as any)}
                            className={cn(
                              "p-3 rounded-2xl text-[10px] font-extrabold border flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95",
                              isAmbSelected 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md ring-2 ring-indigo-100" 
                                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                            )}
                          >
                            <AmbIcon size={12} />
                            <span>{amb.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Complete tracks accordion */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Capítulos do Audiobook</h4>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                      {currentBook.tracks.map((track, idx) => {
                        const isActive = currentTrackIndex === idx;
                        return (
                          <div 
                            key={track.id}
                            onClick={() => setCurrentTrackIndex(idx)}
                            className={cn(
                              "flex justify-between items-center p-3 rounded-2xl [cursor:pointer] hover:bg-gray-50 transition-all",
                              isActive ? "bg-indigo-50/50 border border-indigo-100" : "bg-white border border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={cn(
                                "w-6 h-6 rounded-full font-black text-[10px] flex items-center justify-center",
                                isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                              )}>
                                {idx + 1}
                              </span>
                              <span className={cn(
                                "text-xs font-bold truncate",
                                isActive ? "text-indigo-900 font-extrabold" : "text-gray-700 font-medium"
                              )}>
                                {track.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                              <Clock size={11} /> {track.duration}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 flex flex-col justify-center items-center h-full min-h-[300px] space-y-4">
                  <BookOpen size={44} className="text-gray-200 animate-bounce" />
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-gray-600 font-bold text-sm uppercase">Nenhum Áudio Carregado no Reprodutor</h3>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Selecione um audiobook na sua caixa lateral para sintonizar a reprodução, acessar os capítulos e as frequências de ruído branco integradas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: ADMIN UPLOADS & MANAGEMENT */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Mesa do Editor do Selo</span>
                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight uppercase">Uploads e Cadastro de Obras</h3>
              </div>
              <button
                onClick={() => handleOpenAdminModal('add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus size={14} /> Novo Audiobook
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest select-none">
                      <th className="p-4 pl-6">Obra</th>
                      <th className="p-4">Autor / Narrador</th>
                      <th className="p-4">Preço</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Duração total</th>
                      <th className="p-4">Faixas Cadastradas</th>
                      <th className="p-4 pr-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {audiobooks.map((book) => (
                      <tr key={book.id} className="hover:bg-gray-50/50 transition-all duration-150">
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <img 
                            src={book.coverUrl} 
                            alt={book.title} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-xl bg-gray-50" 
                          />
                          <div>
                            <span className="font-extrabold text-sm text-gray-800 tracking-tight block leading-tight">{book.title}</span>
                            <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wide">ID: {book.id}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-800 leading-none">{book.author}</p>
                          <span className="text-[10px] text-gray-400 font-medium italic">Voz: {book.narrator}</span>
                        </td>
                        <td className="p-4 font-extrabold text-indigo-900">{formatCurrency(book.price)}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600">
                            {book.category}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 font-medium">{book.duration}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            {book.tracks.length} capítulos
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAdminModal('edit', book)}
                              className="p-1 px-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil size={11} /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteAudiobook(book.id, book.title)}
                              className="p-1 px-2.5 rounded-lg border border-red-50 hover:bg-red-50 text-[10px] font-bold text-red-600 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={11} /> Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: METRICS & LEADERBOARD BI DE VENDAS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Sales Stats header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">Arrecadação Bruta</span>
                <h3 className="text-3xl font-black text-indigo-950 tracking-tight">{formatCurrency(totalReceived)}</h3>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Repassado ao mirante de luz</span>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">Vendas Concluídas</span>
                <h3 className="text-3xl font-black text-indigo-950 tracking-tight">{purchases.filter(p => p.status === 'APROVADO').length} unidades</h3>
                <span className="text-[10px] text-gray-400 font-medium italic">Simulações de Pix e Cartão</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">Selo mais vendido</span>
                <h3 className="text-lg font-black text-indigo-600 tracking-tight truncate pt-2">{bestSellerCategory}</h3>
                <span className="text-[10px] text-gray-400 font-medium italic">Dividido por categoria temática</span>
              </div>
            </div>

            {/* Purchases and transactions lists */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none">Últimas Transações Registradas</h3>
                {purchases.length > 0 ? (
                  <div className="space-y-3">
                    {purchases.slice().reverse().map((p) => {
                      const book = audiobooks.find(x => x.id === p.audiobookId);
                      return (
                        <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                              <DollarSign size={16} />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-gray-800 tracking-tight">Comprador: {p.userEmail}</h4>
                              <p className="text-[10px] text-gray-400 font-medium">Obra: <strong className="text-gray-600 font-bold">{book?.title || 'Obra Removida'}</strong> • ID: {p.id}</p>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{p.purchaseDate.split('T')[0]} via {p.paymentMethod}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between">
                            <span className="text-sm font-black text-indigo-950">{formatCurrency(p.amountPaid)}</span>
                            
                            <div className="flex gap-1.5">
                              {p.status === 'PENDENTE' ? (
                                <>
                                  <button
                                    onClick={() => {
                                      audiobooksService.approvePurchase(p.id);
                                      loadAllData();
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-extrabold text-[9px] rounded-lg uppercase tracking-wider transition-all"
                                  >
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => {
                                      audiobooksService.cancelPurchase(p.id);
                                      loadAllData();
                                    }}
                                    className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-extrabold text-[9px] rounded-lg uppercase tracking-wider transition-all"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                                  p.status === 'APROVADO' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                )}>
                                  {p.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-6">Nenhuma transação efetuada até o momento...</p>
                )}
              </div>

              {/* Chart visualization */}
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none">Divisão de Faturamento</h3>
                <div className="h-[250px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={CATEGORIES.filter(c => c !== 'Todos').map(cat => ({
                        name: cat,
                        Valor: purchases
                          .filter(p => {
                            const b = audiobooks.find(x => x.id === p.audiobookId);
                            return p.status === 'APROVADO' && b && b.category === cat;
                          })
                          .reduce((sum, p) => sum + p.amountPaid, 0)
                      }))}
                    >
                      <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <ChartTooltip formatter={(value) => [`R$ ${parseFloat(value as string).toFixed(2)}`, 'Arrecadação']} />
                      <Bar dataKey="Valor" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CHECKOUT MODAL FLOW */}
      <AnimatePresence>
        {checkoutBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-y-auto max-h-[90vh] space-y-6 pointer-events-auto"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">SISTEMA INTEGRADO DE PAGAMENTOS</span>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Concluir Adquisição</h3>
                </div>
                <button 
                  onClick={() => {
                    setCheckoutBook(null);
                    setActivePurchase(null);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {!activePurchase ? (
                <>
                  {/* Select payment mode */}
                  <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <img 
                      src={checkoutBook.coverUrl} 
                      alt={checkoutBook.title} 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-cover rounded-xl bg-gray-100 shadow" 
                    />
                    <div className="flex-1 space-y-0.5">
                      <h4 className="font-extrabold text-sm text-gray-800 leading-tight">{checkoutBook.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{checkoutBook.author}</p>
                      <p className="text-xs font-black text-indigo-900 pt-1">Valor Unitário: {formatCurrency(checkoutBook.price)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">Forma de Pagamento</span>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'PIX', label: 'Pix Instantâneo', icon: QrCode },
                        { id: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCard }
                      ].map(meth => {
                        const MIcon = meth.icon;
                        const isChosen = paymentMethod === meth.id;
                        return (
                          <button
                            key={meth.id}
                            type="button"
                            onClick={() => setPaymentMethod(meth.id as any)}
                            className={cn(
                              "p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all shadow-sm",
                              isChosen 
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]" 
                                : "bg-white text-gray-600 hover:bg-gray-50 border-gray-150"
                            )}
                          >
                            <MIcon size={20} />
                            <span className="font-extrabold text-xs">{meth.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {paymentMethod === 'CREDIT_CARD' ? (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in duration-200">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">DADOS DO CARTÃO</span>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Número do Cartão (Simulado)"
                          value={creditCardData.number}
                          onChange={(e) => setCreditCardData({ ...creditCardData, number: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none"
                          required
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Nome Impresso"
                            value={creditCardData.name}
                            onChange={(e) => setCreditCardData({ ...creditCardData, name: e.target.value })}
                            className="col-span-2 px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none"
                            required
                          />
                          <input
                            type="text"
                            placeholder="CVC"
                            value={creditCardData.cvc}
                            onChange={(e) => setCreditCardData({ ...creditCardData, cvc: e.target.value })}
                            className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-3 text-xs text-indigo-800 animate-in fade-in duration-200">
                      <AlertCircle size={16} className="text-indigo-600 flex-shrink-0" />
                      <p className="leading-relaxed">
                        Ao selecionar pagar via <strong>Pix</strong>, nosso sistema gerará uma senha QR Code dinâmica e chave copia e cola em ambiente sandbox para validação imediata.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmPurchase}
                    disabled={isProcessingPayment}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processamento Geral...</span>
                      </>
                    ) : (
                      <span>Gerar Cobrança de Venda</span>
                    )}
                  </button>
                </>
              ) : (
                /* Dynamic invoice step */
                <div className="space-y-6 text-center animate-in fade-in duration-300">
                  {activePurchase.paymentMethod === 'PIX' ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 border border-gray-150 inline-block rounded-2xl shadow-sm mx-auto">
                        <img 
                          src={activePurchase.pixQrCode} 
                          alt="Pix QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="space-y-2 max-w-sm mx-auto">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">Chave Copia e Cola</span>
                        <div className="flex gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 items-center justify-between">
                          <p className="text-[10px] text-gray-500 font-mono truncate text-left flex-1 select-all">{activePurchase.pixCode}</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activePurchase.pixCode || '');
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-white rounded-lg border border-gray-100 shadow-sm"
                            title="Copiar Chave Pix"
                          >
                            {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-6">
                      <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl max-w-md mx-auto flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <span className="text-xs font-bold font-sans">Cobrança lançada com absoluto sucesso.</span>
                      </div>
                      <p className="text-xs text-gray-400">Clique abaixo para homologar a aprovação mockada de seu cartão.</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-50 space-y-2">
                    <button
                      onClick={handleSimulatePaymentApproval}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Simular Aprovação Automática
                    </button>
                    <button
                      onClick={() => {
                        audiobooksService.cancelPurchase(activePurchase.id);
                        setActivePurchase(null);
                        setCheckoutBook(null);
                        alert('A transação foi recusada/cancelada pelo comprador.');
                      }}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Cancelar Transação
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADMIN FORM ADD/EDIT */}
      <AnimatePresence>
        {adminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-y-auto max-h-[90vh] space-y-6 pointer-events-auto"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">Cadastros Digitais</span>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">
                    {adminModalOpen.mode === 'add' ? 'Adicionar Novo Audiobook' : 'Editar Audiobook'}
                  </h3>
                </div>
                <button onClick={() => setAdminModalOpen(null)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdminFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* General settings */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Título da Obra</label>
                      <input
                        type="text"
                        value={adminFormData.title || ''}
                        onChange={(e) => setAdminFormData({ ...adminFormData, title: e.target.value })}
                        className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Autor / Selo</label>
                      <input
                        type="text"
                        value={adminFormData.author || ''}
                        onChange={(e) => setAdminFormData({ ...adminFormData, author: e.target.value })}
                        className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Narrador (Voz)</label>
                      <input
                        type="text"
                        value={adminFormData.narrator || ''}
                        onChange={(e) => setAdminFormData({ ...adminFormData, narrator: e.target.value })}
                        className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Breve Descrição / Sinopse</label>
                      <textarea
                        value={adminFormData.description || ''}
                        onChange={(e) => setAdminFormData({ ...adminFormData, description: e.target.value })}
                        rows={3}
                        className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none resize-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">URL do Capa (Ilustração / Imagem)</label>
                      <input
                        type="url"
                        value={adminFormData.coverUrl || ''}
                        onChange={(e) => setAdminFormData({ ...adminFormData, coverUrl: e.target.value })}
                        className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Preço de Venda (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={adminFormData.price || ''}
                          onChange={(e) => setAdminFormData({ ...adminFormData, price: e.target.value })}
                          className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Duração Estimada</label>
                        <input
                          type="text"
                          value={adminFormData.duration || ''}
                          onChange={(e) => setAdminFormData({ ...adminFormData, duration: e.target.value })}
                          placeholder="e.g. 2h 45m"
                          className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Categoria / Selo Editorial</label>
                      <select
                        value={adminFormData.category || 'Espiritualidade'}
                        onChange={(e) => setAdminFormData({ ...adminFormData, category: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border-0 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        {CATEGORIES.filter(c => c !== 'Todos').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* TRACKS MANAGEMENT */}
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <h4 className="text-xs font-black uppercase text-indigo-600 tracking-widest leading-none">Capítulos / Faixas de Áudio Cadastradas</h4>
                  
                  {/* Inline Audio tracks builder */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Título do Capítulo / Faixa"
                        value={tempTrackData.title}
                        onChange={(e) => setTempTrackData({ ...tempTrackData, title: e.target.value })}
                        className="p-2 text-xs bg-white border border-gray-205 rounded-xl outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Duração (e.g. 10:45)"
                        value={tempTrackData.duration}
                        onChange={(e) => setTempTrackData({ ...tempTrackData, duration: e.target.value })}
                        className="p-2 text-xs bg-white border border-gray-205 rounded-xl outline-none"
                      />
                      <input
                        type="url"
                        placeholder="URL de Áudio (MP3 Hospedado)"
                        value={tempTrackData.audioUrl}
                        onChange={(e) => setTempTrackData({ ...tempTrackData, audioUrl: e.target.value })}
                        className="p-2 text-xs bg-white border border-gray-205 rounded-xl outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTrackToTempList}
                      className="px-4 py-2 bg-indigo-600 text-white font-extrabold text-[10px] rounded-xl uppercase tracking-wider flex items-center gap-1 hover:bg-indigo-700 transition"
                    >
                      <PlusCircle size={14} /> Incluir Faixa à Obra
                    </button>
                  </div>

                  {/* Added Tracks accordion list */}
                  <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
                    {tempTracksList.length > 0 ? tempTracksList.map((tr, i) => (
                      <div key={tr.id} className="flex justify-between items-center p-3 rounded-xl bg-white border border-gray-100 font-bold text-xs text-gray-700 shadow-sm">
                        <span className="truncate flex-1">Capítulo {i + 1}: {tr.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{tr.duration}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTrackFromTempList(tr.id)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <p className="text-[11px] text-gray-400 italic text-center py-2">Nenhum capítulo inserido nesta obra ainda...</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(null)}
                    className="px-4 py-2 border border-gray-150 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
