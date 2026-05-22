import React from 'react';

interface CemilLogoProps {
  className?: string;
  size?: number | string;
  showBackground?: boolean;
  variant?: 'full' | 'symbol-only' | 'sun-only';
}

export const CemilLogo: React.FC<CemilLogoProps> = ({
  className = '',
  size = '100%',
  showBackground = true,
  variant = 'full',
}) => {
  // Original Aspect Ratio is 340x360 for full tile, or we can use custom sizing
  // Primary Golden color: #FED02F, Deep Blue: #063994
  const goldColor = '#FED02F';
  const blueColor = '#063994';

  if (variant === 'sun-only') {
    return (
      <svg
        id="cemil-logo-sun"
        width={size}
        height={size}
        viewBox="0 0 340 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Sun Emblem Central circle & dot */}
        <circle cx="170" cy="130" r="26" fill="none" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        <circle cx="170" cy="130" r="7" fill={goldColor} />

        {/* 8 Sun Rays radiating outwards */}
        {/* Ray 1: Top Left Steep */}
        <line x1="152" y1="82" x2="134" y2="35" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 2: Top Right Steep */}
        <line x1="188" y1="82" x2="206" y2="35" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 3: Middle Left Up */}
        <line x1="128" y1="108" x2="78" y2="82" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 4: Middle Right Up */}
        <line x1="212" y1="108" x2="262" y2="82" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 5: Horizontal Left */}
        <line x1="118" y1="130" x2="58" y2="130" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 6: Horizontal Right */}
        <line x1="222" y1="130" x2="282" y2="130" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 7: Bottom Left Down */}
        <line x1="128" y1="152" x2="78" y2="178" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 8: Bottom Right Down */}
        <line x1="212" y1="152" x2="262" y2="178" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
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

      {/* Sun Emblem Central circle & dot */}
      <g transform="translate(0, 5)">
        <circle cx="170" cy="130" r="26" fill="none" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        <circle cx="170" cy="130" r="7" fill={goldColor} />

        {/* 8 Sun Rays radiating outwards */}
        {/* Ray 1: Top Left Steep */}
        <line x1="152" y1="82" x2="134" y2="35" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 2: Top Right Steep */}
        <line x1="188" y1="82" x2="206" y2="35" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 3: Middle Left Up */}
        <line x1="128" y1="108" x2="78" y2="82" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 4: Middle Right Up */}
        <line x1="212" y1="108" x2="262" y2="82" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 5: Horizontal Left */}
        <line x1="118" y1="130" x2="58" y2="130" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 6: Horizontal Right */}
        <line x1="222" y1="130" x2="282" y2="130" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 7: Bottom Left Down */}
        <line x1="128" y1="152" x2="78" y2="178" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
        
        {/* Ray 8: Bottom Right Down */}
        <line x1="212" y1="152" x2="262" y2="178" stroke={goldColor} strokeWidth="8" strokeLinecap="round" />
      </g>

      {/* Date 1997-2026 */}
      <text
        x="170"
        y="218"
        textAnchor="middle"
        fill={goldColor}
        fontSize="17"
        fontWeight="600"
        letterSpacing="1px"
        fontFamily="'Plus Jakarta Sans', sans-serif"
      >
        1997-2026
      </text>

      {/* Branding CEMIL */}
      <text
        x="170"
        y="278"
        textAnchor="middle"
        fill={goldColor}
        fontSize="54"
        fontWeight="900"
        letterSpacing="3px"
        fontFamily="'Plus Jakarta Sans', 'Playfair Display', sans-serif"
        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
      >
        CEMIL
      </text>

      {/* Slogan "Fora da Caridade não há salvação" */}
      <text
        x="170"
        y="322"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="22"
        fontWeight="bold"
        fontStyle="italic"
        fontFamily="'Dancing Script', 'Caveat', 'Playfair Display', 'Plus Jakarta Sans', Georgia, cursive"
      >
        Fora da Caridade não há salvação
      </text>
    </svg>
  );
};
