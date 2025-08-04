import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DaisyAvatar = ({ children, className, size = 'md', ...props }: AvatarProps) => {
  const sizeClasses = {
    xs: 'w-8',
    sm: 'w-10',
    md: 'w-12',
    lg: 'w-16',
  };

  return (
    <div className={cn('avatar', className)} {...props}>
      <div className={cn('rounded-full', sizeClasses[size])}>{children}</div>
    </div>
  );
};

export const DaisyAvatarImage = ({ className, alt, ...props }: AvatarImageProps) => {
  return <img className={cn(className)} alt={alt} {...props} />;
};

export const DaisyAvatarFallback = ({ children, className, ...props }: AvatarFallbackProps) => {
  return (
    <div className={cn('bg-neutral text-neutral-content', className)} {...props}>
      {children}
    </div>
  );
};
