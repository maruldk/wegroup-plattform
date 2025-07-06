
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'destructive' | 'secondary';
  showZero?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: 'text-xs min-w-[16px] h-4 px-1',
  md: 'text-xs min-w-[20px] h-5 px-1.5',
  lg: 'text-sm min-w-[24px] h-6 px-2'
};

const variantConfig = {
  default: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  secondary: 'bg-secondary text-secondary-foreground'
};

export function NotificationBadge({
  count,
  maxCount = 99,
  size = 'md',
  variant = 'default',
  showZero = false,
  className
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        sizeConfig[size],
        variantConfig[variant],
        className
      )}
    >
      {displayCount}
    </div>
  );
}

// Animated notification badge for real-time updates
export function AnimatedNotificationBadge({
  count,
  maxCount = 99,
  size = 'md',
  variant = 'default',
  showZero = false,
  className
}: NotificationBadgeProps) {
  const [prevCount, setPrevCount] = React.useState(count);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (count !== prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPrevCount(count);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [count, prevCount]);

  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300",
        sizeConfig[size],
        variantConfig[variant],
        isAnimating && "scale-125 animate-pulse",
        className
      )}
    >
      {displayCount}
    </div>
  );
}

// Notification dot (simple indicator without count)
export function NotificationDot({
  show = true,
  size = 'md',
  variant = 'default',
  pulse = false,
  className
}: {
  show?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'destructive' | 'secondary';
  pulse?: boolean;
  className?: string;
}) {
  if (!show) return null;

  const dotSizeConfig = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div
      className={cn(
        "rounded-full",
        dotSizeConfig[size],
        variantConfig[variant],
        pulse && "animate-pulse",
        className
      )}
    />
  );
}

// Hook for managing notification state
export function useNotificationBadge(initialCount: number = 0) {
  const [count, setCount] = React.useState(initialCount);
  const [hasNewNotifications, setHasNewNotifications] = React.useState(false);

  const increment = (amount: number = 1) => {
    setCount(prev => prev + amount);
    setHasNewNotifications(true);
  };

  const decrement = (amount: number = 1) => {
    setCount(prev => Math.max(0, prev - amount));
  };

  const reset = () => {
    setCount(0);
    setHasNewNotifications(false);
  };

  const markAsRead = () => {
    setHasNewNotifications(false);
  };

  return {
    count,
    hasNewNotifications,
    increment,
    decrement,
    reset,
    markAsRead,
    setCount
  };
}
