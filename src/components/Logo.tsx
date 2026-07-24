import clsx from 'clsx';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showDistrict?: boolean;
  variant?: 'default' | 'white';
  className?: string;
};

const sizes = {
  sm: { box: 'w-10 h-10', title: 'text-[15px]', sub: 'text-[11px]' },
  md: { box: 'w-12 h-12', title: 'text-base', sub: 'text-xs' },
  lg: { box: 'w-14 h-14', title: 'text-[1.35rem]', sub: 'text-sm' },
  xl: { box: 'w-16 h-16', title: 'text-[1.75rem]', sub: 'text-lg' },
};

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo-icon.png"
      alt=""
      className={clsx('w-full h-full object-cover', className)}
      draggable={false}
    />
  );
}

export function Logo({
  size = 'md',
  showText = true,
  showDistrict = false,
  variant = 'default',
  className,
}: LogoProps) {
  const s = sizes[size];
  const isWhite = variant === 'white';

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className={clsx(s.box, 'rounded-[22%] overflow-hidden flex-shrink-0 shadow-sm')}>
        <LogoMark />
      </div>
      {showText && (
        <div>
          <h1
            className={clsx(
              s.title,
              'font-semibold leading-tight tracking-tight',
              isWhite ? 'text-white' : 'text-dark'
            )}
          >
            Kelajak Markazi
          </h1>
          {showDistrict && (
            <p className={clsx(s.sub, isWhite ? 'text-white/80' : 'text-muted')}>Qamashi tumani</p>
          )}
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <div className={clsx('rounded-[22%] overflow-hidden flex-shrink-0', className)}>
      <LogoMark />
    </div>
  );
}
