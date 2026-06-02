import React from 'react';

interface CemilLogoProps {
  className?: string;
  size?: number | string;
  showBackground?: boolean;
  variant?: 'full' | 'symbol-only' | 'sun-only';
  sunColor?: string;
  pyramidColor?: string;
  textColorPrimary?: string;
  textColorSecondary?: string;
}

export const CemilLogo: React.FC<CemilLogoProps> = ({
  className = '',
  size = '100%',
  showBackground = true,
  variant = 'full',
  sunColor,
  pyramidColor,
  textColorPrimary,
  textColorSecondary,
}) => {
  // Official Brand Colors:
  // Golden yellow / Orange-gold: #E59A18 (warm gold like the image)
  // Deep Blue: #063994
  const goldColor = '#E59A18';
  const blueColor = '#063994';

  // Adaptive values based on theme / background
  const activeSunColor = sunColor || goldColor;
  const activePyramidColor = pyramidColor || (showBackground && variant === 'full' ? '#FFFFFF' : blueColor);
  const activeTextColorPrimary = textColorPrimary || (showBackground && variant === 'full' ? '#FFFFFF' : blueColor);
  const activeTextColorSecondary = textColorSecondary || (showBackground && variant === 'full' ? goldColor : blueColor);

  if (variant === 'sun-only') {
    return (
      <svg
        id="cemil-logo-sun"
        width={size}
        height={size}
        viewBox="0 0 340 205"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Sun Emblem Central Concentric Circles & Dot */}
        <circle cx="170" cy="115" r="32" fill="none" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        <circle cx="170" cy="115" r="16" fill="none" stroke={activeSunColor} strokeWidth="3" strokeLinecap="round" />
        <circle cx="170" cy="115" r="7" fill={activeSunColor} />

        {/* 8 Sun Rays radiating outwards */}
        {/* Ray 1: Top Left Steep */}
        <line x1="152" y1="67" x2="134" y2="20" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 2: Top Right Steep */}
        <line x1="188" y1="67" x2="206" y2="20" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 3: Middle Left Up */}
        <line x1="128" y1="93" x2="78" y2="67" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 4: Middle Right Up */}
        <line x1="212" y1="93" x2="262" y2="67" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 5: Horizontal Left */}
        <line x1="118" y1="115" x2="58" y2="115" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 6: Horizontal Right */}
        <line x1="222" y1="115" x2="282" y2="115" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 7: Bottom Left Down */}
        <line x1="128" y1="137" x2="78" y2="163" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 8: Bottom Right Down */}
        <line x1="212" y1="137" x2="262" y2="163" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      id="cemil-logo-full"
      width={size}
      height={size}
      viewBox="0 0 340 370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Background Rounded card space (only if full and we want to show background) */}
      {showBackground && variant === 'full' && (
        <rect width="340" height="370" rx="40" fill={blueColor} />
      )}

      {/* Sun Emblem Central Concentric Circles & Dot */}
      <g transform="translate(0, -10)">
        <circle cx="170" cy="115" r="32" fill="none" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        <circle cx="170" cy="115" r="16" fill="none" stroke={activeSunColor} strokeWidth="3" strokeLinecap="round" />
        <circle cx="170" cy="115" r="7" fill={activeSunColor} />

        {/* 8 Sun Rays radiating outwards */}
        {/* Ray 1: Top Left Steep */}
        <line x1="152" y1="67" x2="134" y2="20" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 2: Top Right Steep */}
        <line x1="188" y1="67" x2="206" y2="20" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 3: Middle Left Up */}
        <line x1="128" y1="93" x2="78" y2="67" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 4: Middle Right Up */}
        <line x1="212" y1="93" x2="262" y2="67" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 5: Horizontal Left */}
        <line x1="118" y1="115" x2="58" y2="115" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 6: Horizontal Right */}
        <line x1="222" y1="115" x2="282" y2="115" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 7: Bottom Left Down */}
        <line x1="128" y1="137" x2="78" y2="163" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
        
        {/* Ray 8: Bottom Right Down */}
        <line x1="212" y1="137" x2="262" y2="163" stroke={activeSunColor} strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* Stepped "Mirante" Pyramid Graphics */}
      <g transform="translate(0, -12)">
        {/* Tier 1 - Top Bar */}
        <polygon points="80,165 215,165 235,193 60,193" fill={activePyramidColor} />

        {/* Tier 2 - Middle Bar */}
        <polygon points="40,197 240,197 260,225 20,225" fill={activePyramidColor} />

        {/* Tier 3 - Bottom Bar */}
        <polygon points="25,229 265,229 285,257 5,257" fill={activePyramidColor} />
      </g>

      {/* Brand Text */}
      {variant === 'full' && (
        <g>
          {/* CENTRO ESPÍRITA */}
          <text
            x="170"
            y="298"
            textAnchor="middle"
            fill={activeTextColorPrimary}
            fontSize="15"
            fontWeight="700"
            letterSpacing="5px"
            fontFamily="'Playfair Display', 'Georgia', serif"
          >
            CENTRO ESPÍRITA
          </text>

          {/* MIRANTE DE LUZ */}
          <text
            x="170"
            y="336"
            textAnchor="middle"
            fill={activeTextColorSecondary}
            fontSize="25"
            fontWeight="900"
            letterSpacing="1px"
            fontFamily="'Playfair Display', 'Georgia', serif"
            style={{ textShadow: showBackground ? 'none' : '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            MIRANTE DE LUZ
          </text>
        </g>
      )}
    </svg>
  );
};
