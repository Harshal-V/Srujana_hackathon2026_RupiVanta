import React from 'react';

interface RupiVantaLogoProps {
  className?: string;
  size?: number;
}

export const RupiVantaLogo: React.FC<RupiVantaLogoProps> = ({
  className = 'w-9 h-9',
  size,
}) => {
  const logoSrc = '/assets/aistudio/WhatsApp_Image_2026-10-25_at_10.16.10_AM_98db2179.jpeg';

  return (
    <div
      style={size ? { width: size, height: size } : undefined}
      className={`${className} shrink-0 relative flex items-center justify-center rounded-xl overflow-hidden bg-[#FAF1DF] border border-[#E5D9C3] shadow-sm`}
    >
      <img
        src={logoSrc}
        alt="RupiVanta — Cash Command Center Logo"
        className="w-full h-full object-contain p-0.5"
        loading="eager"
      />
    </div>
  );
};
