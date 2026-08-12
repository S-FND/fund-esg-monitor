import { cn } from '@/lib/utils';

interface CompletionRingProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const CompletionRing = ({ 
  percentage, 
  size = 'md', 
  showLabel = true,
  className 
}: CompletionRingProps) => {
  const sizes = {
    sm: { container: 'w-12 h-12', stroke: 3, text: 'text-xs' },
    md: { container: 'w-20 h-20', stroke: 4, text: 'text-lg' },
    lg: { container: 'w-28 h-28', stroke: 5, text: 'text-2xl' },
  };

  const config = sizes[size];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 75) return '#22c55e';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={cn('relative', config.container, className)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          stroke="#e5e7eb"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            stroke: getColor(),
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', config.text)} style={{ color: getColor() }}>
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
};