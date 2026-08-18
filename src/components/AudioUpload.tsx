import React, { useState, useRef } from 'react';
import { Music, Play, Pause, Trash2, Volume2, Upload, Sparkles, Check, AlertCircle } from 'lucide-react';

interface AudioUploadProps {
  value?: string;
  audioName?: string;
  onChange: (audioBase64: string, filename?: string) => void;
  onRemove: () => void;
  label?: string;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({
  value,
  audioName = 'audio_logos.mp3',
  onChange,
  onRemove,
  label = 'Áudio / Voz Oficial do Logos'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Limit to 15MB for audio files in local/storage state
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('O arquivo de áudio excede o limite de 15MB. Por favor, envie um áudio mais leve.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = () => {
      const base64Data = reader.result as string;
      onChange(base64Data, file.name);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
      setErrorMsg('Erro ao ler o arquivo de áudio. Tente outro formato (.mp3, .wav, .m4a).');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const togglePlay = () => {
    if (!value) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(value);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setErrorMsg('Erro ao reproduzir o arquivo de áudio.');
      };
    } else if (audioRef.current.src !== value) {
      audioRef.current.src = value;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          setErrorMsg('Não foi possível reproduzir o áudio no navegador.');
        });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Music size={14} className="text-cyan-600" />
          {label}
        </label>
        {value && (
          <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check size={10} /> Carregado
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/m4a,audio/ogg,audio/aac,audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              title={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate font-mono">
                {audioName || 'audio_voz_logos.mp3'}
              </p>
              <p className="text-[10px] text-cyan-700 font-semibold">
                {isPlaying ? '🔊 Reproduzindo som original...' : 'Áudio oficial do vídeo pronto'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
              title="Substituir arquivo de áudio"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                }
                setIsPlaying(false);
                onRemove();
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Remover áudio gravado"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-cyan-300/80 hover:border-cyan-500 bg-cyan-50/40 hover:bg-cyan-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-cyan-100 group-hover:bg-cyan-200 text-cyan-700 flex items-center justify-center mb-2 transition-colors">
            <Upload size={18} />
          </div>
          <p className="text-xs font-bold text-slate-700 group-hover:text-cyan-900">
            {isUploading ? 'Carregando áudio...' : 'Clique para carregar o arquivo de áudio (.mp3, .wav, .m4a)'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Extraia o áudio do vídeo do Logos e suba aqui para tocar a saudação oficial!
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-rose-600 text-[11px] p-2 bg-rose-50 rounded-lg border border-rose-200">
          <AlertCircle size={13} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
