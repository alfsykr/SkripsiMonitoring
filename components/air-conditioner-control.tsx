import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { database } from '../lib/firebaseConfig';
import { ref, set, onValue } from 'firebase/database';
import { useSensor } from '../lib/firebase-sensor-context';

interface AirConditionerControlProps { }

interface ACCommand {
  command: number; // 1: toggle power, 2: temp up, 3: temp down
  timestamp: number;
}

const AirConditionerControl: React.FC<AirConditionerControlProps> = () => {
  const [isOn, setIsOn] = useState(false);
  const [temperature, setTemperature] = useState(24);
  const [fanSpeed, setFanSpeed] = useState(2);
  const [airSwing, setAirSwing] = useState(false);
  const [pidMode, setPidMode] = useState(false);
  const [commandStatus, setCommandStatus] = useState<string>('');
  const { sensorData } = useSensor();

  // Mengambil status AC dari Firebase jika ada
  useEffect(() => {
    const acStatusRef = ref(database, 'ac_status');
    const unsubscribe = onValue(acStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.power !== undefined) {
          setIsOn(data.power);
        }
        if (data.temperature !== undefined) {
          setTemperature(data.temperature);
        }
      }
    });

    return () => {
      // Cleanup subscription
      unsubscribe();
    };
  }, []);

  // Fungsi untuk mengirim perintah ke Firebase
  const sendCommand = (commandNumber: number) => {
    const commandRef = ref(database, 'ac_command');
    const command: ACCommand = {
      command: commandNumber,
      timestamp: Date.now()
    };

    set(commandRef, command)
      .then(() => {
        setCommandStatus(`Perintah ${commandNumber} berhasil dikirim`);
        setTimeout(() => setCommandStatus(''), 3000); // Clear status after 3 seconds
      })
      .catch((error) => {
        setCommandStatus(`Error: ${error.message}`);
        console.error('Error sending command:', error);
      });
  };

  const togglePower = () => {
    setIsOn((v) => !v);
    sendCommand(1); // Kirim perintah 1 untuk toggle power
  };

  const toggleAirSwing = () => setAirSwing((v) => !v);
  const togglePidMode = () => setPidMode((v) => !v);
  const adjustFanSpeed = () => setFanSpeed((prev) => (prev === 3 ? 1 : prev + 1));
  
  const adjustTemperature = (increment: boolean) => {
    setTemperature((prev) => {
      const newTemp = increment ? prev + 1 : prev - 1;
      return Math.max(16, Math.min(30, newTemp));
    });
    
    // Kirim perintah 2 untuk naik suhu atau 3 untuk turun suhu
    sendCommand(increment ? 2 : 3);
  };

  return (
    <div className="h-auto bg-gradient-to-br ">
      <div className="max-w-5xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-300">PANASONIC AIR</h1>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-700 dark:text-white/80 transition-colors duration-300">CONDITIONER</h2>
        </div>

        {/* Main Control Panel */}
        <div className="bg-gradient-to-br rounded-3xl p-4 sm:p-8 shadow-2xl">
          {/* Control Buttons Row */}
          

          {/* AC Unit and Temperature Control */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-8 sm:mb-12">
            {/* Left Side - AC Image */}
            <div className="flex justify-center">
              <div className="relative w-[250px] h-[120px] sm:w-[300px] sm:h-[150px] flex items-center justify-center">
                <Image src="/ac-unit.png" alt="AC Unit" fill className="object-contain" priority />
              </div>
            </div>

            {/* Right Side - Temperature Control */}
            <div className="flex flex-col items-center">
              <div className="text-center mb-2">
                <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 sm:px-4 py-1 sm:py-2 rounded-full">
                  Naikkan Suhu
                </div>
              </div>
              <button
                onClick={() => adjustTemperature(true)}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-gray-400 flex items-center justify-center mb-4 hover:bg-blue-500 hover:border-blue-500 hover:shadow-lg hover:scale-105 transition-all duration-200 group"
              >
                <ChevronUp className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 group-hover:text-white transition-colors duration-200" />
              </button>
              {/* Removed temperature display */}
              <button
                onClick={() => adjustTemperature(false)}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-gray-400 flex items-center justify-center mt-4 hover:bg-blue-500 hover:border-blue-500 hover:shadow-lg hover:scale-105 transition-all duration-200 group"
              >
                <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 group-hover:text-white transition-colors duration-200" />
              </button>
              <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 sm:px-4 py-1 sm:py-2 rounded-full mt-2">
                Turunkan Suhu
              </div>
            </div>
          </div>

          {/* Power Toggle and PID Mode Buttons - Made More Responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 sm:gap-0 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <button
                onClick={togglePower}
                className={`relative inline-flex h-12 w-24 sm:h-14 sm:w-28 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isOn ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-10 w-10 sm:h-12 sm:w-12 transform rounded-full bg-white shadow-lg transition-transform ${isOn ? 'translate-x-12 sm:translate-x-14' : 'translate-x-1'
                    }`}
                />
              </button>
              <div className="text-center sm:text-left">
                <p className="text-sm sm:text-lg font-medium text-white bg-blue-500 px-4 sm:px-6 py-2 rounded-full whitespace-nowrap">
                  {isOn ? 'TURN ON DEVICE' : 'TURN OFF DEVICE'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Current Temperature Display from Sensor - Made More Responsive */}
          {sensorData && (
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-2 text-center sm:text-left">Sensor Data:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center sm:text-left bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Suhu Ruangan:</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{sensorData.temperature}°C</p>
                </div>
                <div className="text-center sm:text-left bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Kelembaban:</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{sensorData.humidity}%</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Command Status - Made More Responsive */}
          {commandStatus && (
            <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-lg text-sm sm:text-base text-center sm:text-left">
              {commandStatus}
            </div>
          )}
        </div>

        {/* Footer */}

      </div>
    </div>
  );
};

export default AirConditionerControl;