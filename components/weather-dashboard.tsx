"use client";

import { useState, useEffect, useCallback } from "react";
import { Cloud, Sun, CloudRain, Wind, Eye, Gauge, Thermometer, Droplets } from "lucide-react";

interface WeatherData {
  location: {
    name: string
    region: string
    country: string
  }
  current: {
    temp_c: number
    temp_f: number
    condition: {
      text: string
      icon: string
    }
    feelslike_c: number
    feelslike_f: number
    humidity: number
    pressure_mb: number
    pressure_in: number
    wind_kph: number
    wind_mph: number
    vis_km: number
    vis_miles: number
  }
}

export default function WeatherDashboard() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Gunakan useCallback untuk memastikan fungsi fetch tidak berubah antara render
  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=2d73fff0540548698c8153240251607&q=Jakarta&aqi=no&_=${Date.now()}`, // Tambahkan timestamp untuk menghindari cache
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWeatherData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching weather data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch data pertama kali
    fetchWeatherData();

    // Set interval untuk fetch setiap 3 menit (180000 ms)
    const intervalId = setInterval(fetchWeatherData, 180000);

    // Bersihkan interval saat komponen unmount
    return () => clearInterval(intervalId);
  }, [fetchWeatherData]); // Tambahkan fetchWeatherData sebagai dependency

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes("sunny") || conditionLower.includes("clear")) {
      return <Sun className="w-20 h-20 text-yellow-400" />
    } else if (conditionLower.includes("partly") || conditionLower.includes("cloudy")) {
      return <Cloud className="w-20 h-20 text-blue-300" />
    } else if (conditionLower.includes("rain")) {
      return <CloudRain className="w-20 h-20 text-blue-400" />
    }
    return <Cloud className="w-20 h-20 text-blue-300" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-black text-xl backdrop-blur-md bg-white/20 p-8 rounded-3xl border border-white/30 shadow-xl">
          Loading weather data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-black text-xl backdrop-blur-md bg-white/20 p-8 rounded-3xl border border-white/30 shadow-xl">
          <div className="text-red-600 mb-2">Error loading weather data</div>
          <div className="text-sm text-black/70">{error}</div>
          <button
            onClick={fetchWeatherData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!weatherData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-black text-xl backdrop-blur-md bg-white/20 p-8 rounded-3xl border border-white/30 shadow-xl">
          No weather data available
        </div>
      </div>
    )
  }

  const temp = unit === "C" ? weatherData.current.temp_c : weatherData.current.temp_f
  const humidity = Math.min(Math.max(weatherData.current.humidity, 0), 100)

  return (
    <div className="min-h-screen bg-gradient-to-br p-4">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounceGentle {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        @keyframes widthExpand {
          from { width: 0; }
          to { width: var(--target-width); }
        }
        
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          25% { opacity: 0.5; }
        }
        
        @keyframes countUp {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out;
        }
        
        .animate-slide-in-up {
          animation: slideInUp 0.6s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.5s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out 0.2s;
          animation-fill-mode: both;
        }
        
        .animate-bounce-gentle {
          animation: bounceGentle 2s ease-in-out infinite;
        }
        
        .animate-width-expand {
          animation: widthExpand 1.5s ease-out 0.3s;
          animation-fill-mode: both;
        }
        
        .animate-spin-slow {
          animation: spinSlow 3s linear infinite;
        }
        
        .animate-blink {
          animation: blink 2s ease-in-out infinite;
        }
        
        .animate-count-up {
          animation: countUp 0.8s ease-out;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-2 transition-colors duration-300">
            Jakarta Weather
          </h1>
          <p className="text-black/70 dark:text-white/80 text-lg transition-colors duration-300">
            {weatherData.location.name}, {weatherData.location.region}
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Weather Card - Takes up more space */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-8 border shadow-xl animate-slide-in-left">
            <div className="mb-6">
              <div className="text-black text-xl font-semibold mb-2">Current Weather</div>
              <div className="text-black/70 text-base">
                Last updated: {lastUpdated.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>

            <div className="flex items-center gap-12 mb-8">
              <div className="animate-bounce-gentle">
                {getWeatherIcon(weatherData.current.condition.text)}
              </div>
              <div className="animate-slide-in-right">
                <div className="text-black text-8xl font-light mb-2">
                  {Math.round(temp)}°{unit}
                </div>
                <div className="text-black text-3xl font-medium mb-2">{weatherData.current.condition.text}</div>
                <div className="text-black/70 text-xl">
                  Feels like{" "}
                  {Math.round(unit === "C" ? weatherData.current.feelslike_c : weatherData.current.feelslike_f)}°{unit}
                </div>
              </div>
            </div>

            <div className="text-black/80 text-lg leading-relaxed animate-fade-in-up">
              Expect {weatherData.current.condition.text.toLowerCase()} The temperature will reach{" "}
              {Math.round(temp + 2)}°{unit} .
            </div>

            {/* Mini stats within main card */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-blue-50 rounded-2xl p-4 animate-scale-in" style={{animationDelay: '0.3s'}}>
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-4 h-4 text-blue-500" />
                  <span className="text-black/70 text-sm font-medium">Temperature Range</span>
                </div>
                <div className="text-black text-lg font-semibold">
                  {Math.round(temp - 3)}° - {Math.round(temp + 3)}°{unit}
                </div>
              </div>
              <div className="bg-green-50 rounded-2xl p-4 animate-scale-in" style={{animationDelay: '0.4s'}}>
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-4 h-4 text-green-500" />
                  <span className="text-black/70 text-sm font-medium">Wind Condition</span>
                </div>
                <div className="text-black text-lg font-semibold">
                  {weatherData.current.wind_mph < 10 ? "Light breeze" : weatherData.current.wind_mph < 20 ? "Moderate" : "Strong"}
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel - Unit Control & Quick Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Unit Toggle Card - Bigger */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl animate-slide-in-right">
              <div className="text-black text-lg font-semibold mb-4">Temperature Unit</div>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setUnit("C")}
                  className={`flex-1 px-6 py-3 rounded-xl text-base font-medium transition-all transform hover:scale-105 ${
                    unit === "C" ? "bg-blue-500 text-white shadow-lg" : "bg-gray-100 text-black/70 hover:bg-gray-200"
                  }`}
                >
                  Celsius
                </button>
                <button
                  onClick={() => setUnit("F")}
                  className={`flex-1 px-6 py-3 rounded-xl text-base font-medium transition-all transform hover:scale-105 ${
                    unit === "F" ? "bg-blue-500 text-white shadow-lg" : "bg-gray-100 text-black/70 hover:bg-gray-200"
                  }`}
                >
                  Fahrenheit
                </button>
              </div>
              <div className="text-black/70 text-sm">
                Data refreshes every 3 minutes automatically
              </div>
            </div>

            {/* Humidity Card - Bigger with more detail */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl animate-slide-in-right" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="w-5 h-5 text-blue-500 animate-pulse" />
                <div className="text-black text-lg font-semibold">Humidity</div>
              </div>
              <div className="text-black text-4xl font-light mb-4">{humidity}%</div>
              <div className="relative mb-4">
                <div className="w-full h-3 bg-black/20 rounded-full">
                  <div
                    className="h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 animate-width-expand"
                    style={{ width: `${humidity}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-black/70 text-sm">
                {humidity > 70 ? "High humidity - feels muggy" : humidity > 40 ? "Comfortable humidity" : "Low humidity"}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Larger Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {/* Wind Speed Card - Bigger */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl animate-slide-in-up hover:shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-2 mb-4">
              <Wind className="w-5 h-5 text-gray-600 animate-spin-slow" />
              <div className="text-black text-lg font-semibold">Wind Speed</div>
            </div>
            <div className="text-black text-4xl font-light mb-2 animate-count-up">{Math.round(weatherData.current.wind_mph)}</div>
            <div className="text-black/70 text-base mb-2">mph</div>
            <div className="text-black/70 text-sm">
              {weatherData.current.wind_kph.toFixed(1)} km/h
            </div>
          </div>

          {/* Visibility Card - Bigger */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl animate-slide-in-up hover:shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-gray-600 animate-blink" />
              <div className="text-black text-lg font-semibold">Visibility</div>
            </div>
            <div className="text-black text-4xl font-light mb-2 animate-count-up">{weatherData.current.vis_miles}</div>
            <div className="text-black/70 text-base mb-2">miles</div>
            <div className="text-black/70 text-sm">
              {weatherData.current.vis_km} km
            </div>
          </div>

          {/* Pressure Card - Bigger */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl animate-slide-in-up hover:shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-5 h-5 text-gray-600 animate-pulse" />
              <div className="text-black text-lg font-semibold">Pressure</div>
            </div>
            <div className="text-black text-4xl font-light mb-2 animate-count-up">{weatherData.current.pressure_in.toFixed(1)}</div>
            <div className="text-black/70 text-base mb-2">inHg</div>
            <div className="text-black/70 text-sm">
              {Math.round(weatherData.current.pressure_mb)} mb
            </div>
          </div>

          {/* Feels Like Card - Bigger */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl animate-slide-in-up hover:shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-2 mb-4">
              <Thermometer className="w-5 h-5 text-gray-600 animate-pulse" />
              <div className="text-black text-lg font-semibold">Feels Like</div>
            </div>
            <div className="text-black text-4xl font-light mb-2 animate-count-up">
              {Math.round(unit === "C" ? weatherData.current.feelslike_c : weatherData.current.feelslike_f)}°
            </div>
            <div className="text-black/70 text-base mb-2">{unit === "C" ? "Celsius" : "Fahrenheit"}</div>
            <div className="text-black/70 text-sm">
              Heat index perception
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}