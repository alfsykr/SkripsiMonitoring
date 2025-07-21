import React, { useState } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';

interface AirConditionerControlProps { }

const AirConditionerControl: React.FC<AirConditionerControlProps> = () => {
  const [isOn, setIsOn] = useState(false);
  const [temperature, setTemperature] = useState(24);
  const [fanSpeed, setFanSpeed] = useState(2);
  const [airSwing, setAirSwing] = useState(false);
  const [pidMode, setPidMode] = useState(false);

  const togglePower = () => setIsOn((v) => !v);
  const toggleAirSwing = () => setAirSwing((v) => !v);
  const togglePidMode = () => setPidMode((v) => !v);
  const adjustFanSpeed = () => setFanSpeed((prev) => (prev === 3 ? 1 : prev + 1));
  const adjustTemperature = (increment: boolean) => {
    setTemperature((prev) => {
      const newTemp = increment ? prev + 1 : prev - 1;
      return Math.max(16, Math.min(30, newTemp));
    });
  };

  return (
    <div className="h-auto bg-gradient-to-br ">
      <div className="max-w-5xl mx-auto px-2">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-300">PANASONIC AIR</h1>
          <h2 className="text-3xl font-bold text-gray-700 dark:text-white/80 transition-colors duration-300">CONDITIONER</h2>
        </div>

        {/* Main Control Panel */}
        <div className="bg-gradient-to-br rounded-3xl p-8 shadow-2xl">
          {/* Control Buttons Row */}
          

          {/* AC Unit and Temperature Control */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            {/* Left Side - AC Image */}
            <div className="flex justify-center">
              <div className="relative w-[300px] h-[150px] flex items-center justify-center">
                <Image src="/ac-unit.png" alt="AC Unit" fill className="object-contain" priority />
              </div>
            </div>

            {/* Right Side - Temperature Control */}
            <div className="flex flex-col items-center">
              <div className="text-center mb-2">
                <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                  Naikkan Suhu
                </div>
              </div>
              <button
                onClick={() => adjustTemperature(true)}
                className="w-16 h-16 rounded-full border-2 border-gray-400 flex items-center justify-center mb-4 hover:bg-blue-500 hover:border-blue-500 hover:shadow-lg hover:scale-105 transition-all duration-200 group"
              >
                <ChevronUp className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors duration-200" />
              </button>
              {/* Removed temperature display */}
              <button
                onClick={() => adjustTemperature(false)}
                className="w-16 h-16 rounded-full border-2 border-gray-400 flex items-center justify-center mt-4 hover:bg-blue-500 hover:border-blue-500 hover:shadow-lg hover:scale-105 transition-all duration-200 group"
              >
                <ChevronDown className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors duration-200" />
              </button>
              <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full mt-2">
                Turunkan Suhu
              </div>
            </div>
          </div>

          {/* Power Toggle and PID Mode Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={togglePower}
                className={`relative inline-flex h-14 w-28 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isOn ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-12 w-12 transform rounded-full bg-white shadow-lg transition-transform ${isOn ? 'translate-x-14' : 'translate-x-1'
                    }`}
                />
              </button>
              <div className="ml-6">
                <p className="text-lg font-medium text-white bg-blue-500 px-6 py-2 rounded-full">
                  {isOn ? 'TURN ON DEVICE' : 'TURN OFF DEVICE'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}

      </div>
    </div>
  );
};

export default AirConditionerControl;