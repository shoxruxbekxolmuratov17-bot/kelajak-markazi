import clsx from 'clsx';
import { useEffect, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store/useStore';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, padding = true, onClick }: CardProps) {
  return (
    <div
      className={clsx('card', padding && 'p-5', onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
    secondary: 'bg-card text-dark border border-border hover:bg-surface',
    ghost: 'bg-transparent text-muted hover:text-dark hover:bg-surface',
    danger: 'bg-danger text-white hover:opacity-90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-button)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = '#9588E8', className }: BadgeProps) {
  return (
    <span
      className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {children}
    </span>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  chart?: ReactNode;
  highlight?: boolean;
  onClick?: () => void;
}

export function StatCard({ title, value, subtitle, icon, trend, chart, highlight, onClick }: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={clsx('flex flex-col gap-3', highlight && 'bg-primary text-white border-primary', onClick && 'hover:border-primary/40')}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={clsx('text-sm font-medium', highlight ? 'text-white/80' : 'text-muted')}>{title}</p>
          <p className={clsx('text-2xl font-bold mt-1', highlight ? 'text-white' : 'text-dark')}>{value}</p>
          {subtitle && (
            <p className={clsx('text-xs mt-1', highlight ? 'text-white/70' : 'text-muted')}>{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={clsx('p-2 rounded-xl', highlight ? 'bg-white/20' : 'bg-primary/10')}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <span className={clsx('font-semibold', trend.value >= 0 ? 'text-success' : 'text-danger')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className={highlight ? 'text-white/70' : 'text-muted'}>{trend.label}</span>
        </div>
      )}
      {chart && <div className="mt-2">{chart}</div>}
    </Card>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, max = 100, color = '#9588E8', showLabel = false, size = 'md' }: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Progress</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-surface rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const authUser = useStore((s) => s.authUser);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const inAdminShell = !!authUser && authUser.role !== 'parent';

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  const overlayClass = inAdminShell
    ? clsx(
        'fixed top-16 bottom-0 right-0 z-50 overflow-y-auto overscroll-contain max-lg:left-0',
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      )
    : 'fixed inset-0 z-50 overflow-y-auto overscroll-contain';

  const panelWrapClass = inAdminShell
    ? 'flex w-full min-h-full items-start justify-center px-4 py-6 sm:px-6'
    : 'flex w-full min-h-full items-start justify-center px-4 py-10 sm:px-6 sm:pt-[12vh]';

  return createPortal(
    <div className={overlayClass} role="presentation">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className={clsx('relative z-10', panelWrapClass)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={clsx(
            'card w-full animate-fade-in shadow-xl p-5',
            'max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain',
            sizes[size]
          )}
        >
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-card z-10 -mx-5 px-5 py-2 border-b border-border/60">
            <h2 id="modal-title" className="text-lg font-semibold text-dark">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface text-muted"
              aria-label="Yopish"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

export function Input({ label, value, onChange, placeholder, type = 'text', required }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-dark">{label}{required && ' *'}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
    </div>
  );
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}

export function Select({ label, value, onChange, options, required }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-dark">{label}{required && ' *'}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Qidirish...' }: SearchInputProps) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-muted mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-dark">{title}</h3>
      {description && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
