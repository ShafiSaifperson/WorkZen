import { Rocket } from 'lucide-react';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  light?: boolean;
}

export function Logo({ className = '', showWordmark = true, light = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
        <Rocket className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      {showWordmark && (
        <span
          className={`font-display text-lg font-extrabold tracking-tight ${
            light ? 'text-white' : 'text-ink-900'
          }`}
        >
          WorkZen
        </span>
      )}
    </div>
  );
}
