import { Badge } from '@/components/ui/badge';
import { ESGCategory, CoreLevel } from '@/types/esg';
import { Leaf, Users, Scale } from 'lucide-react';

interface ESGBadgeProps {
  category: ESGCategory;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const esgConfig = {
  E: {
    label: 'Environmental',
    icon: Leaf,
    variant: 'esg_e' as const,
  },
  S: {
    label: 'Social',
    icon: Users,
    variant: 'esg_s' as const,
  },
  G: {
    label: 'Governance',
    icon: Scale,
    variant: 'esg_g' as const,
  },
};

export const ESGBadge = ({ category, showLabel = false, size = 'md' }: ESGBadgeProps) => {
  const config = esgConfig[category];
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className={size === 'sm' ? 'text-[10px] px-1.5 py-0' : ''}>
      <Icon className={size === 'sm' ? 'w-3 h-3 mr-0.5' : 'w-3.5 h-3.5 mr-1'} />
      {showLabel ? config.label : category}
    </Badge>
  );
};

interface CoreBadgeProps {
  level: CoreLevel;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const CoreBadge = ({ level, size = 'md', showLabel = false }: CoreBadgeProps) => {
  const variants = {
    1: 'core1',
    2: 'core2',
  } as const;
  
  const labels = {
    1: 'Mandatory',
    2: 'Optional',
  };
  
  const shortLabels = {
    1: 'M',
    2: 'O',
  };

  return (
    <Badge variant={variants[level]} className={size === 'sm' ? 'text-[10px] px-1.5 py-0' : ''}>
      {showLabel ? labels[level] : shortLabels[level]}
    </Badge>
  );
};

// For backward compatibility and clearer display
export const MandatoryBadge = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <Badge variant="core1" className={size === 'sm' ? 'text-[10px] px-1.5 py-0' : ''}>
    Mandatory
  </Badge>
);

export const OptionalBadge = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <Badge variant="core2" className={size === 'sm' ? 'text-[10px] px-1.5 py-0' : ''}>
    Optional
  </Badge>
);
