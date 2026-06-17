import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
  return (
    <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-0 min-w-0 flex-shrink-0">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
