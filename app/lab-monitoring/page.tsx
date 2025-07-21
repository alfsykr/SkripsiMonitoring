"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { MetricCard } from '@/components/metric-card';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Thermometer, Droplets, Wind, Gauge, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSensor, SensorProvider } from '@/lib/firebase-sensor-context';
import { PcLab1Provider, usePcLab1 } from '@/lib/pc-lab1-context';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AirConditionerControl from '@/components/air-conditioner-control';

function isTenMinuteMark(timeStr: string) {
  if (!timeStr) return false;
  const parts = timeStr.split(":");
  if (parts.length < 2) return false;
  const minute = parseInt(parts[1], 10);
  return [0, 10, 20, 30, 40, 50].includes(minute);
}

function LabMonitoringContent() {
  const { sensorData, sensorHistory, isSensorConnected } = useSensor();
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    currentTemp: 0,
    currentHumidity: 0
  });

  // Tabel utama hanya 10 data terbaru
  const pagedMonitoringData = monitoringData.slice(0, 10);

  // Add PcLab1 context
  const { avgSuhu: avgCpuLab1, isConnected: isPcLab1Connected } = usePcLab1();
  
  // Calculate average temperature and humidity from monitoringData
  const avgTemp = monitoringData.length > 0 ? (monitoringData.reduce((sum, d) => sum + d.temperature, 0) / monitoringData.length).toFixed(1) : '-';
  const avgHumidity = monitoringData.length > 0 ? (monitoringData.reduce((sum, d) => sum + d.humidity, 0) / monitoringData.length).toFixed(1) : '-';

  // Chart/table generator dari sensorHistory
  const generateSensorChartData = () => {
    if (sensorHistory && sensorHistory.length > 0) {
      return sensorHistory.filter(item =>
        isTenMinuteMark(item.time) &&
        typeof item.temperature === 'number' &&
        typeof item.humidity === 'number' &&
        isFinite(item.temperature) &&
        isFinite(item.humidity) &&
        !isNaN(item.temperature) &&
        !isNaN(item.humidity) &&
        item.temperature > -50 && item.temperature < 100 &&
        item.humidity >= 0 && item.humidity <= 100
      ).map((item) => ({
        time: item.time,
        temperature: item.temperature,
        humidity: item.humidity,
      }));
    }
    return [];
  };

  const generateSensorMonitoringTable = useCallback(() => {
    if (sensorHistory && sensorHistory.length > 0) {
      return sensorHistory.filter(item =>
        isTenMinuteMark(item.time) &&
        typeof item.temperature === 'number' &&
        typeof item.humidity === 'number' &&
        isFinite(item.temperature) &&
        isFinite(item.humidity) &&
        !isNaN(item.temperature) &&
        !isNaN(item.humidity) &&
        item.temperature > -50 && item.temperature < 100 &&
        item.humidity >= 0 && item.humidity <= 100
      ).map((item, idx) => ({
        id: idx,
        time: item.time,
        temperature: item.temperature,
        humidity: item.humidity,
        acAction: item.temperature > 25 ? 'AC ON - Cooling' : 'AC OFF - Standby',
        status: item.temperature > 26 ? 'Warning' : item.temperature > 25 ? 'Caution' : 'Normal',
      })).reverse();
    }
    return [];
  }, [sensorHistory]);

  // Update metrics, chart, dan table setiap data sensor berubah
  useEffect(() => {
    if (isSensorConnected && sensorData) {
      setMetrics({
        currentTemp: sensorData.temperature,
        currentHumidity: sensorData.humidity
      });
      setMonitoringData(generateSensorMonitoringTable());
    }
  }, [sensorData, sensorHistory, isSensorConnected, generateSensorMonitoringTable]);

  // Ambil data 24 jam terakhir dari sensorHistory (asumsi data per 10 menit, ambil 144 data terakhir)
  const last24hData = useMemo(() => {
    if (!sensorHistory || sensorHistory.length === 0) return [];
    return sensorHistory.slice(-144);
  }, [sensorHistory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Caution': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Warning': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
            <div>
              <div className="p-6 animate-fadeInUp">
                {/* Page Title */}
                <div
                  className="mb-6"
                >
                  <h1 className="text-3xl font-bold tracking-tight">Temperature Monitoring</h1>
                  <p className="text-muted-foreground mt-2">
                    Real-time monitoring of laboratory environment using ESP32 (Firebase)
                  </p>
                </div>

                {/* Metrics Cards */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6"
                >
                  <MetricCard
                    title="Current Temperature"
                    value={`${metrics.currentTemp}°C`}
                    status={isSensorConnected ? 'Connected to Firebase' : 'Disconnected'}
                    statusColor={isSensorConnected ? 'green' : 'orange'}
                    icon={Thermometer}
                    iconColor="orange"
                  />
                  <MetricCard
                    title="Current Humidity"
                    value={`${metrics.currentHumidity}%`}
                    status={isSensorConnected ? 'Connected to Firebase' : 'Disconnected'}
                    statusColor={isSensorConnected ? 'green' : 'blue'}
                    icon={Droplets}
                    iconColor="blue"
                  />
                </div>

                {/* Chart 24-Hour Temperature & Humidity Trend */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Temperature Chart */}
                  <Card className="border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center justify-between">
                        24-Hour Temperature Trend
                        {isSensorConnected && (
                          <span className="text-xs text-green-600 font-normal">Live Data</span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={last24hData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#F97316" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" className="text-xs fill-muted-foreground" />
                            <YAxis className="text-xs fill-muted-foreground" domain={[27, 35]} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                            <Area type="monotone" dataKey="temperature" stroke="#F97316" fillOpacity={1} fill="url(#tempGradient)" strokeWidth={2} name="Temperature (°C)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Humidity Chart */}
                  <Card className="border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center justify-between">
                        24-Hour Humidity Trend
                        {isSensorConnected && (
                          <span className="text-xs text-green-600 font-normal">Live Data</span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={last24hData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" className="text-xs fill-muted-foreground" />
                            <YAxis className="text-xs fill-muted-foreground" domain={[60, 75]} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                            <Area type="monotone" dataKey="humidity" stroke="#3B82F6" fillOpacity={1} fill="url(#humidityGradient)" strokeWidth={2} name="Humidity (%)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monitoring Table - No margin */}
                <div
                  className="mt-0"
                >
                  <Card className="border-0 bg-card/50 backdrop-blur-sm mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center justify-between">
                        Lab Environment Monitoring (10-Minute Intervals)
                        {isSensorConnected && (
                          <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Real-time Data
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px] border-0">Time</TableHead>
                            <TableHead className="border-0">Temperature (°C)</TableHead>
                            <TableHead className="border-0">Humidity (%)</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedMonitoringData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground border-0">
                                No data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            pagedMonitoringData.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell className="font-mono border-0">{record.time}</TableCell>
                                <TableCell className="font-mono border-0">{record.temperature}°C</TableCell>
                                <TableCell className="font-mono border-0">{record.humidity}%</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${getStatusColor(record.status)}`}
                                  >
                                    {record.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* AC Control UI */}
                <Card className="border-0 bg-card/50 backdrop-blur-sm mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center">AC Control</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AirConditionerControl />
                  </CardContent>
                </Card>

                {/* Footer */}
                <Footer />
              </div>
            </div>
          </main>
      </div>
    </div>
  );
}

export default function LabMonitoringPage() {
  return (
    <PcLab1Provider>
      <SensorProvider>
        <LabMonitoringContent />
      </SensorProvider>
    </PcLab1Provider>
  );
}