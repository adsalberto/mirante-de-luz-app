import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (base64: string) => void;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  value, 
  onChange, 
  label = "Upload de Imagem", 
  className,
  aspectRatio = 'square'
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem (PNG, JPG, etc).');
      return;
    }

    // Validate size (max 800KB for Firestore base64 safety)
    if (file.size > 800 * 1024) {
      alert('A imagem é muito grande. Por favor, escolha uma imagem menor que 800KB.');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onChange(base64String);
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert('Erro ao carregar imagem.');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'aspect-auto min-h-[150px]'
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider ml-1">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
        onDragLeave={() => setIsHovering(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsHovering(false);
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
            const fakeEvent = { target: { files: [file] } } as any;
            handleFileChange(fakeEvent);
          }
        }}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center bg-gray-50",
          aspectClasses[aspectRatio],
          isHovering ? "border-indigo-400 bg-indigo-50/50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-100",
          value ? "border-solid border-indigo-100 bg-white" : ""
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-bold text-indigo-400 uppercase">Processando...</p>
          </div>
        ) : value ? (
          <>
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-cover transition-transform group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white">
                  <Upload size={20} />
                </div>
                <button 
                  onClick={clearImage}
                  className="bg-red-500/80 backdrop-blur-md p-2 rounded-xl text-white hover:bg-red-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto text-gray-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
              <ImageIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600">Clique ou arraste uma foto</p>
              <p className="text-[9px] text-gray-400 font-medium mt-1">PNG, JPG ou GIF (Max. 800KB)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
