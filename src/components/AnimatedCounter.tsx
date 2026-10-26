import React, { useState, useEffect } from 'react';
import { AppLanguage } from '../types/munimji';
import { formatIndianNumber } from '../utils/translations';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  language?: AppLanguage;
  formatter?: (val: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 600,
  prefix = '',
  suffix = '',
  className = '',
  language = 'en',
  formatter,
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplayValue(value);
      return;
    }

    const startValue = displayValue;
    const diff = value - startValue;
    if (diff === 0) return;

    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * ease);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  const formattedText = formatter
    ? formatter(displayValue)
    : formatIndianNumber(displayValue, language);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {formattedText}
      {suffix}
    </span>
  );
};
