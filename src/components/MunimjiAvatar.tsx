import React from 'react';

interface VantaAvatarProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<VantaAvatarProps['size']>, string> = {
  sm: 'w-11 h-11',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

/**
 * VANTA — Your AI Financial Assistant emblem.
 * Cream-and-forest-green Indian Bahi-Khata crest with dynamic acoustic bars
 * that respond to speaking/listening states while respecting prefers-reduced-motion.
 */
export const VantaAvatar: React.FC<VantaAvatarProps> = ({
  isSpeaking = false,
  isListening = false,
  size = 'md',
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${SIZE_CLASSES[size]} ${className}`}
      aria-label={
        isListening
          ? 'VANTA is listening'
          : isSpeaking
          ? 'VANTA is speaking'
          : 'VANTA AI Financial Assistant'
      }
    >
      {(isSpeaking || isListening) && (
        <span
          className={`absolute -inset-1 rounded-2xl pointer-events-none ${
            isListening
              ? 'ring-2 ring-[#D97706] bg-[#D97706]/10 urgent-days-pulse'
              : 'ring-2 ring-[#14532D]/50 bg-[#14532D]/10 urgent-days-pulse'
          }`}
        />
      )}

      <svg
        viewBox="0 0 96 96"
        className="w-full h-full"
        role="img"
        aria-hidden="true"
      >
        {/* Outer Khata Crest */}
        <rect
          x="4"
          y="4"
          width="88"
          height="88"
          rx="22"
          fill="#14532D"
          stroke="#D97706"
          strokeWidth="2.5"
        />
        {/* Inner Parchment Ring */}
        <rect
          x="11"
          y="11"
          width="74"
          height="74"
          rx="16"
          fill="none"
          stroke="#FDE68A"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />

        {/* Stylized 'V' + Rupee Monogram */}
        <path
          d="M28 28 L48 64 L68 28"
          fill="none"
          stroke="#FAF1DF"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="34"
          y1="38"
          x2="62"
          y2="38"
          stroke="#FDE68A"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Acoustic Status Bars at Base */}
        <g className={isSpeaking || isListening ? 'vanta-wave-speaking' : ''}>
          <rect
            x="34"
            y={isSpeaking || isListening ? '70' : '73'}
            width="4"
            height={isSpeaking || isListening ? '9' : '4'}
            rx="2"
            fill={isListening ? '#FBBF24' : '#86EFAC'}
          />
          <rect
            x="42"
            y={isSpeaking || isListening ? '67' : '72'}
            width="4"
            height={isSpeaking || isListening ? '13' : '6'}
            rx="2"
            fill="#FDE68A"
          />
          <rect
            x="50"
            y={isSpeaking || isListening ? '68' : '72'}
            width="4"
            height={isSpeaking || isListening ? '11' : '6'}
            rx="2"
            fill="#FDE68A"
          />
          <rect
            x="58"
            y={isSpeaking || isListening ? '70' : '73'}
            width="4"
            height={isSpeaking || isListening ? '9' : '4'}
            rx="2"
            fill={isListening ? '#FBBF24' : '#86EFAC'}
          />
        </g>
      </svg>
    </div>
  );
};

// Alias export to preserve compatibility across existing component imports
export const MunimjiAvatar = VantaAvatar;
