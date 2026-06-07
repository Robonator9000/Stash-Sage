import { HTMLAttributes } from 'react';

export function Avatar({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative flex shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    />
  );
}

export function AvatarImage({ className = '', src, alt }: { className?: string; src?: string; alt?: string }) {
  if (!src) return null;
  return <img className={`aspect-square h-full w-full object-cover ${className}`} src={src} alt={alt} />;
}

export function AvatarFallback({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
