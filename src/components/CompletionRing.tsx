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
    if (percentage === 100) return 'stroke-status-success';
    if (percentage >= 75) return 'stroke-esg-environmental';
    if (percentage >= 50) return 'stroke-status-warning';
    return 'stroke-status-error';
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
          className="stroke-muted"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          className={cn('transition-all duration-500 ease-out', getColor())}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', config.text)}>{percentage}%</span>
        </div>
      )}
    </div>
  );
};
