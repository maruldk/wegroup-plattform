
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type UserStatusType = 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';

interface UserStatusProps {
  status: UserStatusType;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  ONLINE: {
    color: 'bg-green-500',
    text: 'Online',
    textColor: 'text-green-600'
  },
  AWAY: {
    color: 'bg-yellow-500',
    text: 'Away',
    textColor: 'text-yellow-600'
  },
  BUSY: {
    color: 'bg-red-500',
    text: 'Busy',
    textColor: 'text-red-600'
  },
  OFFLINE: {
    color: 'bg-gray-400',
    text: 'Offline',
    textColor: 'text-gray-500'
  }
};

const sizeConfig = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
};

export function UserStatus({ 
  status, 
  showText = false, 
  size = 'md', 
  className 
}: UserStatusProps) {
  const config = statusConfig[status];
  
  if (showText) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className={cn(
          "rounded-full border-2 border-background",
          config.color,
          sizeConfig[size]
        )} />
        <span className={cn("text-sm font-medium", config.textColor)}>
          {config.text}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "rounded-full border-2 border-background",
        config.color,
        sizeConfig[size],
        className
      )}
      title={config.text}
    />
  );
}

// Hook for managing user status
export function useUserStatus(initialStatus: UserStatusType = 'OFFLINE') {
  const [status, setStatus] = React.useState<UserStatusType>(initialStatus);

  // Auto-detect user activity
  React.useEffect(() => {
    let activityTimer: NodeJS.Timeout;
    let awayTimer: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(activityTimer);
      clearTimeout(awayTimer);
      
      if (status === 'AWAY') {
        setStatus('ONLINE');
      }

      // Set to away after 5 minutes of inactivity
      awayTimer = setTimeout(() => {
        if (status === 'ONLINE') {
          setStatus('AWAY');
        }
      }, 5 * 60 * 1000);
    };

    const handleActivity = () => {
      if (status !== 'BUSY' && status !== 'OFFLINE') {
        resetTimers();
      }
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Handle page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(activityTimer);
        clearTimeout(awayTimer);
      } else {
        resetTimers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial timer setup
    if (status === 'ONLINE') {
      resetTimers();
    }

    return () => {
      clearTimeout(activityTimer);
      clearTimeout(awayTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);

  const setUserStatus = (newStatus: UserStatusType) => {
    setStatus(newStatus);
  };

  return {
    status,
    setStatus: setUserStatus,
    isOnline: status === 'ONLINE',
    isAway: status === 'AWAY',
    isBusy: status === 'BUSY',
    isOffline: status === 'OFFLINE'
  };
}
