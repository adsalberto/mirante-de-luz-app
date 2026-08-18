import React from 'react';
import { Sparkles, BookOpen, MessageSquare, Heart, Compass, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export interface LogosMascotProps {
  mood?: 'happy' | 'serene' | 'studious' | 'loving';
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'projection';
  customImageUrl?: string;
  mascotName?: string;
  showHologramPad?: boolean;
  showFloatingBadges?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LogosMascot: React.FC<LogosMascotProps> = ({
  mood = 'happy',
  isSpeaking = false,
  size = 'lg',
  customImageUrl,
  mascotName = 'Logos',
  showHologramPad = true,
  showFloatingBadges = true,
  className = '',
  onClick
}) => {
  // Size dimensions mapping
  const sizeMap = {
    sm: { container: 'w-24 h-28', svg: 'w-20 h-20', padScale: 0.6 },
    md: { container: 'w-40 h-48', svg: 'w-36 h-36', padScale: 0.8 },
    lg: { container: 'w-64 h-72', svg: 'w-56 h-56', padScale: 1.0 },
    xl: { container: 'w-80 h-96', svg: 'w-72 h-72', padScale: 1.2 },
    projection: { container: 'w-72 md:w-96 lg:w-[420px] h-80 md:h-[440px]', svg: 'w-64 md:w-80 lg:w-96 h-64 md:h-80 lg:h-96', padScale: 1.4 }
  };

  const currentSize = sizeMap[size] || sizeMap.lg;

  // Mood color accents
  const moodGlowColors = {
    happy: '#00f0ff',     // Bright Cyan Blue
    serene: '#38bdf8',    // Sky Peaceful Blue
    studious: '#6366f1',  // Deep Indigo
    loving: '#ec4899'     // Fraternal Pink/Magenta
  };

  const primaryGlow = moodGlowColors[mood] || '#00f0ff';

  return (
    <div 
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      onClick={onClick}
      id="logos-mascot-container"
    >
      {/* Background Volumetric Blue Cyber Aura */}
      <div 
        className="absolute rounded-full blur-3xl transition-all duration-700 pointer-events-none"
        style={{
          width: size === 'projection' ? '380px' : '240px',
          height: size === 'projection' ? '380px' : '240px',
          background: isSpeaking 
            ? `radial-gradient(circle, ${primaryGlow}40 0%, rgba(14, 165, 233, 0.15) 50%, transparent 80%)`
            : `radial-gradient(circle, ${primaryGlow}25 0%, rgba(59, 130, 246, 0.1) 60%, transparent 80%)`,
          transform: isSpeaking ? 'scale(1.15)' : 'scale(1.0)'
        }}
      />

      {/* Floating Futuristic Spiritual HUD Badges (Orbiting around Logos like in the video) */}
      {showFloatingBadges && (size === 'lg' || size === 'xl' || size === 'projection') && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Top Left: Biblioteca Digital */}
          <motion.div 
            animate={{ y: [0, -8, 0], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-2 -left-6 md:-left-10 bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 p-2 md:p-2.5 rounded-2xl shadow-lg shadow-cyan-950/50 flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookOpen size={13} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Biblioteca Digital</span>
          </motion.div>

          {/* Top Right: Mensagens de Luz */}
          <motion.div 
            animate={{ y: [0, 8, 0], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -top-1 -right-6 md:-right-10 bg-slate-900/80 backdrop-blur-md border border-sky-500/40 text-sky-300 p-2 md:p-2.5 rounded-2xl shadow-lg shadow-sky-950/50 flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
              <MessageSquare size={13} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Mensagens de Luz</span>
          </motion.div>

          {/* Mid Right: Estudos Espíritas / Globo */}
          <motion.div 
            animate={{ y: [0, -6, 0], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/2 -right-8 md:-right-12 bg-slate-900/80 backdrop-blur-md border border-blue-500/40 text-blue-300 p-2 rounded-2xl shadow-lg shadow-blue-950/50 flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Globe size={13} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider hidden md:inline">Obras Kardec</span>
          </motion.div>

          {/* Bottom Left: Caridade & Fraternidade */}
          <motion.div 
            animate={{ y: [0, 6, 0], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            className="absolute bottom-12 -left-6 md:-left-8 bg-slate-900/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 p-2 md:p-2.5 rounded-2xl shadow-lg shadow-emerald-950/50 flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Heart size={13} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Caridade & Amor</span>
          </motion.div>
        </div>
      )}

      {/* Main Character Body (Vector Rendering or Custom Photo) */}
      <div className={`relative z-10 flex flex-col items-center justify-center ${currentSize.container}`}>
        
        {/* If user uploaded a custom image / photograph of Logos, frame it in a high-tech holographic sphere */}
        {customImageUrl ? (
          <motion.div 
            animate={{ 
              y: isSpeaking ? [0, -4, 0, -2, 0] : [0, -8, 0],
              scale: isSpeaking ? [1, 1.02, 1] : [1, 1]
            }}
            transition={{ duration: isSpeaking ? 1.5 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex flex-col items-center justify-center"
          >
            {/* Holographic Glowing Ring around the photo */}
            <div 
              className="relative rounded-3xl overflow-hidden border-2 shadow-2xl transition-all duration-500 bg-slate-950/60 backdrop-blur-sm"
              style={{
                borderColor: primaryGlow,
                boxShadow: `0 0 45px ${primaryGlow}60, inset 0 0 20px ${primaryGlow}40`
              }}
            >
              <img 
                src={customImageUrl} 
                alt={mascotName}
                referrerPolicy="no-referrer"
                className="w-52 h-60 md:w-72 md:h-80 lg:w-84 lg:h-96 object-contain p-2 transition-transform duration-500 hover:scale-105"
              />
              
              {/* Overlay Hologram scanline effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/15 via-transparent to-blue-900/30 pointer-events-none" />
              
              {/* Speaking audio wave indicator on image */}
              {isSpeaking && (
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md border border-cyan-400/60 py-1.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/80">
                  <span className="w-1.5 h-3 bg-cyan-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="text-[11px] font-black text-cyan-300 uppercase tracking-widest ml-1 font-mono">Logos Falando...</span>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* High-Fidelity SVG Rendering of the exact "Logos" Robot from the video */
          <motion.div 
            animate={{ 
              y: isSpeaking ? [0, -4, 0, -2, 0] : [0, -8, 0],
              rotate: isSpeaking ? [0, 0.5, -0.5, 0] : [0, 0]
            }}
            transition={{ duration: isSpeaking ? 1.5 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`flex items-center justify-center drop-shadow-[0_15px_30px_rgba(0,240,255,0.25)] ${currentSize.svg}`}
          >
            <svg viewBox="0 0 300 360" className="w-full h-full">
              <defs>
                {/* Robot Helmet & Body White Ceramic Gradient */}
                <linearGradient id="logos-white-body" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>

                {/* Shading for 3D depth */}
                <linearGradient id="logos-shade" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.8" />
                </linearGradient>

                {/* Glossy Black Visor */}
                <radialGradient id="logos-visor-glass" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="70%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>

                {/* Cyan Glowing LED Filter */}
                <filter id="cyan-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Ground Holographic Pedestal Radial */}
                <radialGradient id="holo-pad-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#0284c7" stopOpacity="0.5" />
                  <stop offset="80%" stopColor="#0369a1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* ======================================================== */}
              {/* ROBOT LEGS & LOWER JOINTS                                */}
              {/* ======================================================== */}
              <g id="logos-legs">
                {/* Left Leg */}
                <rect x="110" y="270" width="28" height="42" rx="14" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                <ellipse cx="124" cy="285" rx="10" ry="3" fill="#00f0ff" opacity="0.7" filter="url(#soft-glow)" />
                {/* Left Foot */}
                <path d="M102 310 C102 305 112 302 124 302 C136 302 144 305 144 310 L146 322 C146 326 138 328 124 328 C110 328 102 326 102 322 Z" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                <ellipse cx="124" cy="320" rx="14" ry="4" fill="#00f0ff" opacity="0.8" filter="url(#cyan-glow)" />

                {/* Right Leg */}
                <rect x="162" y="270" width="28" height="42" rx="14" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                <ellipse cx="176" cy="285" rx="10" ry="3" fill="#00f0ff" opacity="0.7" filter="url(#soft-glow)" />
                {/* Right Foot */}
                <path d="M154 310 C154 305 164 302 176 302 C188 302 196 305 196 310 L198 322 C198 326 190 328 176 328 C162 328 154 326 154 322 Z" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                <ellipse cx="176" cy="320" rx="14" ry="4" fill="#00f0ff" opacity="0.8" filter="url(#cyan-glow)" />
              </g>

              {/* ======================================================== */}
              {/* ROBOT TORSO & CHEST EMBLEM ("Logos")                    */}
              {/* ======================================================== */}
              <g id="logos-torso">
                {/* Pelvis/Waist Joint */}
                <ellipse cx="150" cy="265" rx="34" ry="14" fill="#64748b" />
                <rect x="126" y="258" width="48" height="12" rx="6" fill="#334155" />

                {/* Main Chest Armor */}
                <path d="M110 175 C110 160 130 156 150 156 C170 156 190 160 190 175 L184 250 C184 258 170 264 150 264 C130 264 116 258 116 250 Z" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="2" />
                
                {/* Abdomen Tech Crease */}
                <path d="M125 235 Q150 242 175 235" stroke="#94a3b8" strokeWidth="2" fill="none" />
                <path d="M128 245 Q150 252 172 245" stroke="#94a3b8" strokeWidth="1.5" fill="none" />

                {/* Chest Emblem Badge (Glowing Ring + WiFi Arc + "Logos") */}
                <circle cx="150" cy="195" r="24" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" filter="url(#soft-glow)" />
                
                {/* WiFi / Radiating Wave Symbol */}
                <path d="M142 184 Q150 179 158 184" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" fill="none" filter="url(#cyan-glow)" />
                <path d="M145 188 Q150 185 155 188" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" fill="none" filter="url(#cyan-glow)" />
                <circle cx="150" cy="192" r="1.5" fill="#00f0ff" filter="url(#cyan-glow)" />

                {/* "Logos" Text on Chest */}
                <text x="150" y="207" textAnchor="middle" fill="#00f0ff" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.8" filter="url(#soft-glow)">
                  Logos
                </text>
              </g>

              {/* ======================================================== */}
              {/* ROBOT ARMS & HANDS (Welcoming Gestures)                  */}
              {/* ======================================================== */}
              <g id="logos-arms">
                {/* Left Arm (Reaching forward/welcoming like in the video) */}
                <g id="left-arm">
                  {/* Shoulder Joint */}
                  <circle cx="100" cy="175" r="14" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                  <circle cx="100" cy="175" r="6" fill="#00f0ff" opacity="0.8" filter="url(#soft-glow)" />
                  {/* Bicep */}
                  <path d="M96 182 L72 215 C69 220 74 225 79 222 L103 192 Z" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Elbow */}
                  <circle cx="74" cy="220" r="9" fill="#334155" />
                  {/* Forearm extending towards viewer */}
                  <path d="M72 225 L45 242 C40 246 44 252 50 250 L80 230 Z" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Left Hand / Palm Open gesture */}
                  <ellipse cx="40" cy="250" rx="9" ry="7" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                  <circle cx="34" cy="246" r="3" fill="#cbd5e1" />
                  <circle cx="32" cy="252" r="3" fill="#cbd5e1" />
                  <circle cx="36" cy="257" r="3" fill="#cbd5e1" />
                  <circle cx="44" cy="258" r="3" fill="#cbd5e1" />
                  {/* Blue palm light */}
                  <circle cx="40" cy="250" r="3" fill="#00f0ff" opacity="0.9" filter="url(#cyan-glow)" />
                </g>

                {/* Right Arm (Slightly relaxed at side with inviting curve) */}
                <g id="right-arm">
                  {/* Shoulder Joint */}
                  <circle cx="200" cy="175" r="14" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                  <circle cx="200" cy="175" r="6" fill="#00f0ff" opacity="0.8" filter="url(#soft-glow)" />
                  {/* Bicep */}
                  <path d="M204 182 L228 215 C231 220 226 225 221 222 L197 192 Z" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Elbow */}
                  <circle cx="226" cy="220" r="9" fill="#334155" />
                  {/* Forearm */}
                  <path d="M228 225 L242 258 C244 263 238 266 234 262 L220 230 Z" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Right Hand */}
                  <ellipse cx="244" cy="268" rx="8" ry="8" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="1.5" />
                  <circle cx="244" cy="268" r="3" fill="#00f0ff" opacity="0.9" filter="url(#cyan-glow)" />
                </g>
              </g>

              {/* ======================================================== */}
              {/* ROBOT HEAD, HEADPHONES & FACE VISOR                      */}
              {/* ======================================================== */}
              <g id="logos-head">
                {/* Neck */}
                <rect x="138" y="142" width="24" height="18" rx="6" fill="#475569" stroke="#334155" strokeWidth="1" />
                <ellipse cx="150" cy="148" rx="10" ry="2.5" fill="#00f0ff" opacity="0.7" />

                {/* Left Ear Ring Headphone */}
                <g id="left-ear">
                  <ellipse cx="64" cy="95" rx="16" ry="24" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="2" />
                  <ellipse cx="64" cy="95" rx="11" ry="18" fill="#0f172a" />
                  <circle cx="64" cy="95" r="7" fill="#00f0ff" opacity={isSpeaking ? "1" : "0.75"} filter="url(#cyan-glow)" />
                  {isSpeaking && (
                    <circle cx="64" cy="95" r="12" fill="none" stroke="#00f0ff" strokeWidth="1.5" opacity="0.8" className="animate-ping origin-center" />
                  )}
                </g>

                {/* Right Ear Ring Headphone */}
                <g id="right-ear">
                  <ellipse cx="236" cy="95" rx="16" ry="24" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="2" />
                  <ellipse cx="236" cy="95" rx="11" ry="18" fill="#0f172a" />
                  <circle cx="236" cy="95" r="7" fill="#00f0ff" opacity={isSpeaking ? "1" : "0.75"} filter="url(#cyan-glow)" />
                  {isSpeaking && (
                    <circle cx="236" cy="95" r="12" fill="none" stroke="#00f0ff" strokeWidth="1.5" opacity="0.8" className="animate-ping origin-center" />
                  )}
                </g>

                {/* Helmet Head Shell (White Rounded Outer Dome) */}
                <path d="M72 95 C72 45 105 32 150 32 C195 32 228 45 228 95 C228 140 195 152 150 152 C105 152 72 140 72 95 Z" fill="url(#logos-white-body)" stroke="#94a3b8" strokeWidth="2.5" />

                {/* Top Forehead Badge Banner ("Logos" + Wifi Wave on Headband) */}
                <path d="M115 42 Q150 38 185 42" stroke="#0284c7" strokeWidth="2" fill="none" opacity="0.4" />
                <g transform="translate(150, 48)">
                  <rect x="-24" y="-7" width="48" height="14" rx="7" fill="#0f172a" stroke="#00f0ff" strokeWidth="1" filter="url(#soft-glow)" />
                  <text x="0" y="3.5" textAnchor="middle" fill="#00f0ff" fontSize="8" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.5">
                    Logos
                  </text>
                </g>

                {/* Top Antenna/Signal Disc */}
                <circle cx="150" cy="30" r="4.5" fill="#00f0ff" stroke="#ffffff" strokeWidth="1" filter="url(#cyan-glow)" />

                {/* Black Glossy Curved Screen Visor */}
                <path d="M85 92 C85 58 110 52 150 52 C190 52 215 58 215 92 C215 125 190 134 150 134 C110 134 85 125 85 92 Z" fill="url(#logos-visor-glass)" stroke="#38bdf8" strokeWidth="1.5" filter="url(#soft-glow)" />

                {/* Visor Glass Highlight / Reflection Arc */}
                <path d="M96 68 Q150 56 204 68" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />

                {/* ======================================================== */}
                {/* EXPRESSIVE GLOWING CYAN LED EYES                         */}
                {/* ======================================================== */}
                {mood === 'serene' ? (
                  // Peaceful Curved Meditative Eyes
                  <g filter="url(#cyan-glow)" stroke={primaryGlow} strokeWidth="4.5" fill="none" strokeLinecap="round">
                    <path d="M110 94 Q125 106 138 94" />
                    <path d="M162 94 Q175 106 188 94" />
                  </g>
                ) : mood === 'loving' ? (
                  // Heart-Shaped Glowing LED Eyes
                  <g filter="url(#cyan-glow)" fill="#ec4899" stroke="#ffffff" strokeWidth="0.8">
                    <path d="M124 94 C116 82 134 82 132 100 C130 100 127 97 124 94 Z" transform="scale(0.9) translate(14, 8)" />
                    <path d="M174 94 C166 82 184 82 182 100 C180 100 177 97 174 94 Z" transform="scale(0.9) translate(20, 8)" />
                  </g>
                ) : mood === 'studious' ? (
                  // Focused Analytical Blue Eyes
                  <g filter="url(#cyan-glow)" className="eye-blinking">
                    {/* Left Eye */}
                    <circle cx="124" cy="92" r="14" fill="#00f0ff" />
                    <circle cx="124" cy="92" r="9" fill="#0f172a" />
                    <circle cx="120" cy="88" r="3" fill="#ffffff" />
                    {/* Right Eye */}
                    <circle cx="176" cy="92" r="14" fill="#00f0ff" />
                    <circle cx="176" cy="92" r="9" fill="#0f172a" />
                    <circle cx="172" cy="88" r="3" fill="#ffffff" />
                  </g>
                ) : (
                  // Standard Happy Smiling Curved Cyan LED Eyes (Exactly like the video!)
                  <g filter="url(#cyan-glow)" className="eye-blinking">
                    {/* Left Eye: Thick curved joyful arc with glowing iris */}
                    <path d="M110 95 C110 82 138 82 138 95" stroke="#00f0ff" strokeWidth="6" strokeLinecap="round" fill="none" />
                    <circle cx="124" cy="90" r="3.5" fill="#ffffff" />
                    
                    {/* Right Eye: Thick curved joyful arc with glowing iris */}
                    <path d="M162 95 C162 82 190 82 190 95" stroke="#00f0ff" strokeWidth="6" strokeLinecap="round" fill="none" />
                    <circle cx="176" cy="90" r="3.5" fill="#ffffff" />
                  </g>
                )}

                {/* Cheerful Cyan/Pink Cheek Blush Highlights */}
                <ellipse cx="102" cy="108" rx="8" ry="4" fill="#38bdf8" opacity="0.3" filter="url(#soft-glow)" />
                <ellipse cx="198" cy="108" rx="8" ry="4" fill="#38bdf8" opacity="0.3" filter="url(#soft-glow)" />

                {/* ======================================================== */}
                {/* ANIMATED LED MOUTH (Synchronized with speech)             */}
                {/* ======================================================== */}
                <g filter="url(#cyan-glow)">
                  {isSpeaking ? (
                    // Speaking Mouth: Pulsing cheerful vertical opening
                    <g className="mouth-talking">
                      <ellipse cx="150" cy="116" rx="9" ry="6" fill="#00f0ff" />
                      <ellipse cx="150" cy="116" rx="6" ry="4" fill="#0f172a" />
                    </g>
                  ) : mood === 'happy' ? (
                    // Cute Happy Smile Curve
                    <path d="M138 114 Q150 124 162 114" stroke="#00f0ff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  ) : mood === 'loving' ? (
                    // Sweet Grin
                    <path d="M140 115 Q150 122 160 115" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" fill="none" />
                  ) : (
                    // Calm Line
                    <path d="M142 116 L158 116" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  )}
                </g>
              </g>
            </svg>
          </motion.div>
        )}
      </div>

      {/* ======================================================== */}
      {/* GLOWING BLUE NEON HOLOGRAPHIC PROJECTION FLOOR PAD        */}
      {/* (Identical to the video with circuit tracks & pulse)     */}
      {/* ======================================================== */}
      {showHologramPad && (
        <div className="relative w-full flex items-center justify-center -mt-6 md:-mt-10 pointer-events-none">
          <svg viewBox="0 0 340 100" className="w-64 md:w-80 lg:w-[360px] h-20 md:h-24">
            <defs>
              <filter id="pad-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ambient Base Light Ellipse */}
            <ellipse cx="170" cy="50" rx="150" ry="40" fill="url(#holo-pad-grad)" />

            {/* Outer Cyan Ring */}
            <ellipse cx="170" cy="50" rx="145" ry="36" fill="none" stroke="#00f0ff" strokeWidth="2.5" opacity="0.8" filter="url(#pad-glow)" />

            {/* Inner Concentric Rings */}
            <ellipse cx="170" cy="50" rx="115" ry="28" fill="none" stroke="#38bdf8" strokeWidth="1.8" opacity="0.6" strokeDasharray="8 4" className="animate-spin origin-center [animation-duration:20s]" />
            <ellipse cx="170" cy="50" rx="75" ry="18" fill="none" stroke="#00f0ff" strokeWidth="2" opacity="0.9" filter="url(#pad-glow)" />
            <ellipse cx="170" cy="50" rx="40" ry="10" fill="#00f0ff" opacity="0.4" filter="url(#pad-glow)" />

            {/* Radiating Cyber Circuit Lines */}
            <g stroke="#00f0ff" strokeWidth="1.5" opacity="0.6" filter="url(#pad-glow)">
              <line x1="25" y1="50" x2="65" y2="50" />
              <circle cx="25" cy="50" r="2.5" fill="#00f0ff" />

              <line x1="315" y1="50" x2="275" y2="50" />
              <circle cx="315" cy="50" r="2.5" fill="#00f0ff" />

              <line x1="60" y1="30" x2="95" y2="40" />
              <circle cx="60" cy="30" r="2" fill="#00f0ff" />

              <line x1="280" y1="30" x2="245" y2="40" />
              <circle cx="280" cy="30" r="2" fill="#00f0ff" />

              <line x1="75" y1="72" x2="110" y2="60" />
              <circle cx="75" cy="72" r="2" fill="#00f0ff" />

              <line x1="265" y1="72" x2="230" y2="60" />
              <circle cx="265" cy="72" r="2" fill="#00f0ff" />
            </g>

            {/* Glowing Vertical Light Pillars */}
            <g opacity="0.3">
              <line x1="95" y1="50" x2="95" y2="10" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="245" y1="50" x2="245" y2="10" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3 3" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};
