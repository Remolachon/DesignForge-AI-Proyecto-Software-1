'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const didMountRef = useRef(false);
  const lastRouteRef = useRef(`${pathname}?${searchParams.toString()}`);

  const clearTimers = useCallback(() => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const complete = useCallback(() => {
    clearTimers();
    setValue(100);
    setVisible(false);
    setValue(0);
    startedAtRef.current = null;
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    startedAtRef.current = Date.now();
    setVisible(true);
    setValue(14);

    progressTimerRef.current = window.setInterval(() => {
      setValue((currentValue) => {
        if (currentValue >= 92) return currentValue;
        const remaining = 92 - currentValue;
        const increment = Math.max(remaining * 0.16, 2.5);
        return Math.min(92, currentValue + increment);
      });
    }, 120);

    safetyTimerRef.current = window.setTimeout(() => {
      if (startedAtRef.current) {
        complete();
      }
    }, 8000);
  }, [clearTimers, complete]);

  useEffect(() => {
    const currentRoute = `${pathname}?${searchParams.toString()}`;

    if (!didMountRef.current) {
      didMountRef.current = true;
      lastRouteRef.current = currentRoute;
      return;
    }

    if (currentRoute !== lastRouteRef.current) {
      lastRouteRef.current = currentRoute;
      if (!startedAtRef.current) {
        start();
      }
      complete();
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('http')) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }

      start();
    };

    const handlePopState = () => {
      start();
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearTimers();
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 z-[90] h-1.5 w-full pointer-events-none">
      <div className="h-full w-full bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b border-border/30">
        <Progress
          value={value}
          className="h-1.5 w-full rounded-none border-0 bg-transparent"
          indicatorClassName="bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_18px_rgba(171,100,45,0.55)]"
        />
      </div>
    </div>
  );
}
