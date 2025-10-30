'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

type RiskScoreIndicatorProps = {
  score: number; // 0 to 1
  className?: string;
};

export function RiskScoreIndicator({ score, className }: RiskScoreIndicatorProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setAnimatedScore(score));
    return () => cancelAnimationFrame(animation);
  }, [score]);

  const percentage = Math.round(animatedScore * 100);
  const circumference = 2 * Math.PI * 45; // 2 * pi * r
  const strokeDashoffset = circumference - (animatedScore * circumference);

  const getRiskProps = (s: number) => {
    if (s < 0.4) {
      return {
        label: 'Low Risk',
        colorClass: 'text-green-500',
        strokeClass: 'stroke-green-500',
      };
    }
    if (s < 0.7) {
      return {
        label: 'Medium Risk',
        colorClass: 'text-yellow-500',
        strokeClass: 'stroke-yellow-500',
      };
    }
    return {
      label: 'High Risk',
      colorClass: 'text-red-500',
      strokeClass: 'stroke-red-500',
    };
  };

  const { label, colorClass, strokeClass } = getRiskProps(score);

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div className="relative size-40">
        <svg className="size-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="stroke-current text-border"
            strokeWidth="8"
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            className={cn('transition-[stroke-dashoffset] duration-1000 ease-out', strokeClass)}
            strokeWidth="8"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-headline text-4xl font-bold', colorClass)}>
            {Math.round(score * 100)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">Score</span>
        </div>
      </div>
      <div className={cn('text-lg font-bold font-headline', colorClass)}>{label}</div>
    </div>
  );
}
