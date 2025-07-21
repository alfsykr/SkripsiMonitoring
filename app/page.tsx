"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { MetricCard } from '@/components/metric-card';
import { CPUMonitoringTable } from '@/components/cpu-monitoring-table';
import WeatherDashboard from '@/components/weather-dashboard';
import { Footer } from '@/components/footer';
import { useAIDA64 } from '@/lib/aida64-context';
import { SensorProvider, useSensor } from '@/lib/firebase-sensor-context';
import { useFirebase } from '@/lib/firebase-context';
import { 
  Cpu, 
  Thermometer, 
  Monitor, 
  AlertTriangle,
  Home as HomeIcon,
  Droplet
} from 'lucide-react';
import Image from 'next/image';
import { PcLab1Provider, usePcLab1 } from '@/lib/pc-lab1-context';


// Optimized scroll reveal without Framer Motion
// Remove useScrollReveal function

const DashboardGreetingAndDate = React.memo(() => {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  const greetingData = useMemo(() => {
    if (!mounted) return { greeting: '', day: '', time: '', date: '' };
    
    const hours = now.getHours();
    let greeting = "";
    if (hours < 5) greeting = "Good Night!";
    else if (hours < 12) greeting = "Good Morning!";
    else if (hours < 18) greeting = "Good Afternoon!";
    else greeting = "Good Evening!";
    
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    return { greeting, day, time, date };
  }, [now, mounted]);
  
  if (!mounted) return (
    <>
      <span className="text-4xl font-bold text-white drop-shadow-lg h-12">&nbsp;</span>
      <div className="flex flex-col items-end text-white text-right mt-2 h-16">&nbsp;</div>
    </>
  );
  
  return (
    <>
      <span className="text-4xl font-bold text-white drop-shadow-lg">{greetingData.greeting}</span>
      <div className="flex flex-col items-end text-white text-right mt-2">
        <span className="text-lg font-semibold">{greetingData.day}</span>
        <span className="text-xl font-bold">{greetingData.time}</span>
        <span className="text-base">{greetingData.date}</span>
      </div>
    </>
  );
});

DashboardGreetingAndDate.displayName = 'DashboardGreetingAndDate';

const DashboardLogo = React.memo(() => {
  return (
    <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
      <HomeIcon className="w-8 h-8 text-white drop-shadow-lg" />
      <span className="text-xl font-bold text-white drop-shadow-lg">Lab Room Monitoring</span>
    </div>
  );
});

DashboardLogo.displayName = 'DashboardLogo';

const DashboardTop = React.memo(() => {
  const { metrics } = useAIDA64();
  const { sensorData, isSensorConnected } = useSensor();

  return (
    <div className="relative w-full min-h-[320px] rounded-2xl overflow-hidden flex flex-col items-center justify-center">
      {/* Background image + gradient overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/lab-bg.jpg"
          alt="Lab Background"
          fill
          className="w-full h-full object-cover absolute inset-0 z-0 blur"
          priority
        />
      </div>
      {/* Main content dengan z-index lebih tinggi */}
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-xs md:max-w-4xl justify-between items-center mt-4 md:mt-8 px-2 md:px-8 gap-4 md:gap-0">
        {/* Left: Average CPU Temp */}
        <div className="flex flex-col items-center text-white">
          <Thermometer className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2 opacity-80" strokeWidth={2.2} />
          <span className="text-2xl md:text-4xl font-extrabold drop-shadow-md tracking-tight">
            {metrics.avgTemp ? metrics.avgTemp.toFixed(1) : "-"}
            <span className="text-base md:text-xl align-top">°C</span>
          </span>
          <span className="mt-1 text-xs md:text-base font-semibold tracking-wide opacity-80">AVERAGE CPU TEMP</span>
        </div>
        {/* Center: Inside Temp Circle */}
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center w-28 h-28 md:w-[220px] md:h-[220px]">
            <svg width="100%" height="100%" viewBox="0 0 140 140" className="w-28 h-28 md:w-[220px] md:h-[220px]">
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6EE7B7" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <circle cx="70" cy="70" r="64" stroke="#e5e7eb" strokeWidth="4" fill="none" opacity="0.3" />
              <circle cx="70" cy="70" r="64" stroke="url(#tempGradient)" strokeWidth="6" fill="none" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <HomeIcon className="w-5 h-5 md:w-8 md:h-8 text-white mb-1 md:mb-2 opacity-90 drop-shadow" strokeWidth={2.2} />
              <span className="text-3xl md:text-6xl font-extrabold text-white drop-shadow-md tracking-tight mb-1" style={{letterSpacing: '-2px'}}>
                {sensorData?.temperature ? sensorData.temperature.toFixed(1) : "-"}
                <span className="text-base md:text-2xl align-top">°C</span>
              </span>
              <span className="text-xs md:text-lg font-semibold text-white tracking-wide opacity-90 mt-1">INSIDE TEMP</span>
            </div>
          </div>
        </div>
        {/* Right: Humidity */}
        <div className="flex flex-col items-center text-white">
          <Droplet className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2 opacity-80" strokeWidth={2.2} />
          <span className="text-2xl md:text-4xl font-extrabold drop-shadow-md tracking-tight">
            {sensorData?.humidity ? sensorData.humidity.toFixed(1) : "-"}
            <span className="text-base md:text-xl align-top">%</span>
          </span>
          <span className="mt-1 text-xs md:text-base font-semibold tracking-wide opacity-80">HUMIDITY</span>
        </div>
      </div>
    </div>
  );
});

DashboardTop.displayName = 'DashboardTop';

const DashboardCustomCards = React.memo(() => {
  const { sensorHistory, isSensorConnected } = useSensor();
  const { avgSuhu: avgCpuLab1, isConnected: isPcLab1Connected } = usePcLab1();
  // Ambil 100 data terakhir dari sensorHistory
  const last100 = useMemo(() => sensorHistory.slice(-100), [sensorHistory]);

  // Average temp dari 100 data terakhir sensor
  const avgTemp = useMemo(() => {
    if (!last100 || last100.length === 0) return '-';
    const sum = last100.reduce((a, b) => a + (b.temperature || 0), 0);
    return (sum / last100.length).toFixed(1);
  }, [last100]);

  // Average humidity dari 100 data terakhir sensor
  const avgHumidity = useMemo(() => {
    if (!last100 || last100.length === 0) return '-';
    const sum = last100.reduce((a, b) => a + (b.humidity || 0), 0);
    return (sum / last100.length).toFixed(1);
  }, [last100]);
  
  // Max CPU Temp from AIDA64
  const { metrics } = useAIDA64();
  const maxCpuTemp = metrics?.maxTemp ? metrics.maxTemp.toFixed(1) : '-';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
      <MetricCard
        title="Average Temp"
        value={avgTemp + '°C'}
        status="Temp"
        statusColor="orange"
        icon={Thermometer}
        iconColor="orange"
      />
      <MetricCard
        title="Average Humidity"
        value={avgHumidity + '%'}
        status="Humidity"
        statusColor="blue"
        icon={Droplet}
        iconColor="blue"
      />
      <MetricCard
        title="Average CPU Lab 1"
        value={isPcLab1Connected ? avgCpuLab1 + '°C' : '-'}
        status="CPU Temp"
        statusColor="green"
        icon={Monitor}
        iconColor="green"
      />
      <MetricCard
        title="Max Temperature CPU"
        value={maxCpuTemp + '°C'}
        status="CPU Max"
        statusColor="red"
        icon={AlertTriangle}
        iconColor="red"
      />
    </div>
  );
});

DashboardCustomCards.displayName = 'DashboardCustomCards';

const HomeContent = React.memo(() => {
  const { cpuData, metrics, isConnected } = useAIDA64();
  const { sensorData, isSensorConnected } = useSensor();
  const [localMetrics, setLocalMetrics] = useState({
    cpuCount: 7,
    roomTemp: 24.5,
    totalComputers: 1,
    maxCpuTemp: 78.2,
  });

  // Update local metrics based on AIDA64 data
  useEffect(() => {
    if (cpuData.length > 0) {
      // Get CPU temperatures (exclude HDD)
      const cpuTemps = cpuData.filter(cpu => !cpu.name.includes('HDD')).map(cpu => cpu.temperature);
      const maxCpuTemp = Math.max(...cpuTemps);
      setLocalMetrics(prev => ({
        ...prev,
        cpuCount: cpuData.length,
        maxCpuTemp: maxCpuTemp,
      }));
    }
  }, [cpuData]);

  // Update room temperature from sensor Firebase
  useEffect(() => {
    if (isSensorConnected && sensorData) {
      setLocalMetrics(prev => ({
        ...prev,
        roomTemp: sensorData.temperature,
      }));
    }
  }, [isSensorConnected, sensorData]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="p-6 animate-fadeInUp">
            {/* Dashboard Top Section */}
            <DashboardTop />
            {/* Custom Metrics Cards */}
            <DashboardCustomCards />
            <WeatherDashboard />
            {/* Charts dihapus sesuai permintaan */}
            {/* CPU Monitoring Table dihapus sesuai permintaan */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
});

HomeContent.displayName = 'HomeContent';

export default function HomePage() {
  return (
    <PcLab1Provider>
      <SensorProvider>
        <HomeContent />
      </SensorProvider>
    </PcLab1Provider>
  );
}