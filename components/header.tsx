"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Bell, Sun, Moon, Thermometer, Home } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';

const GreetingText = React.memo(() => {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute instead of 30 seconds
    return () => clearInterval(timer);
  }, []);
  
  const greeting = useMemo(() => {
    const hours = now.getHours();
    if (hours < 5) return "Good Night!";
    if (hours < 12) return "Good Morning!";
    if (hours < 18) return "Good Afternoon!";
    return "Good Evening!";
  }, [now]);
  
  return <span className="text-lg font-semibold text-gray-800 dark:text-white drop-shadow-lg">{greeting}</span>;
});

GreetingText.displayName = 'GreetingText';

const DateText = React.memo(() => {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  const formattedTime = useMemo(() => {
    if (!mounted) return { time: '', day: '', date: '' };
    
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const date = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    
    return { time, day, date };
  }, [now, mounted]);
  
  if (!mounted) return <span className="text-base font-medium text-gray-700 dark:text-gray-200">&nbsp;</span>;
  
  return (
    <span className="text-base font-medium text-gray-700 dark:text-gray-200 flex items-center gap-4">
      {formattedTime.time}
      <span>{formattedTime.day}, {formattedTime.date}</span>
    </span>
  );
});

DateText.displayName = 'DateText';

export const Header = React.memo(() => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      {/* Greeting on the left */}
      <div className="flex-1 flex items-center justify-start">
        <GreetingText />
      </div>

      {/* Actions in the center */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Home className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Date/time on the right */}
      <div className="flex-1 flex items-center justify-end">
        <DateText />
      </div>
    </header>
  );
});

Header.displayName = 'Header';