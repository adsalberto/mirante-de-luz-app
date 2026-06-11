import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Scissors, Check, RotateCw } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { cn } from '../lib/utils';
import getCroppedImg from '../lib/cropImage';

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
  const [isCropping, setIsCropping] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  
  // Cropper state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_showCroppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem (PNG, JPG, etc).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImage(reader.result as string);
      setIsCropping(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleDone = async () => {
    try {
      if (!tempImage || !croppedAreaPixels) return;
      setIsLoading(true);
      setIsCropping(false);
      
      const croppedImage = await getCroppedImg(
        tempImage,
        croppedAreaPixels,
        rotation
      );
      
      // Check size after crop (max 800KB)
      // Since it's base64, we can check the string length or just trust the jpeg quality
      onChange(croppedImage);
      setTempImage(null);
      setRotation(0);
      setZoom(1);
    } catch (e) {
      console.error(e);
      alert('Não foi possível processar a imagem recortada.');
    } finally {
      setIsLoading(false);
    }
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

  const cropperAspect = aspectRatio === 'square' ? 1 : aspectRatio === 'video' ? 16/9 : 1;

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
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempImage(value);
                    setIsCropping(true);
                  }}
                  className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white hover:bg-white/40 transition-all active:scale-95"
                  title="Ajustar imagem atual"
                >
                  <Scissors size={20} />
                </button>
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white pointer-events-none">
                  <Upload size={20} />
                </div>
                <button 
                  type="button"
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
              <p className="text-[9px] text-gray-400 font-medium mt-1">Ajuste após carregar</p>
            </div>
          </div>
        )}
      </div>

      {/* Cropping Modal */}
      {isCropping && tempImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden flex flex-col shadow-2xl max-h-[95vh]">
            <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight flex items-center gap-1.5 italic">
                  <Scissors size={16} className="text-indigo-600" />
                  Ajustar Foto
                </h3>
                <p className="text-[8px] uppercase font-black tracking-widest text-gray-400 mt-0.5">Posicione e recorte sua imagem</p>
              </div>
              <button 
                onClick={() => { setIsCropping(false); setTempImage(null); }}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative h-[150px] sm:h-[180px] bg-gray-955 shrink-0">
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={cropperAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="p-3 sm:p-4 space-y-3.5 bg-white overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Zoom</span>
                    <span className="text-[9px] font-bold text-indigo-600">{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1 bg-gray-150 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Rotação</span>
                    <span className="text-[9px] font-bold text-indigo-600">{rotation}°</span>
                  </div>
                  <div className="flex items-center gap-1.55">
                    <input
                      type="range"
                      value={rotation}
                      min={0}
                      max={360}
                      step={1}
                      aria-labelledby="Rotation"
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="flex-1 h-1 bg-gray-150 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <button 
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="p-1 px-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors text-[10px] flex items-center justify-center shrink-0"
                    >
                      <RotateCw size={10} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => { setIsCropping(false); setTempImage(null); }}
                  className="flex-1 py-2 py-2.5 bg-gray-100 text-gray-950 rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-gray-200 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex-[1.5] py-2 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <Check size={14} />
                  Confirmar Ajuste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

