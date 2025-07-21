"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { database } from "./firebaseConfig";
import { ref, onValue, off } from "firebase/database";

interface FirebaseCPUData {
  id: string;
  laptopId: string;
  suhu: number;
  tanggal: string;
  waktu: string;
  timestamp: string;
  status: string;
}

interface FirebaseContextType {
  firebaseCPUData: FirebaseCPUData[];
  isFirebaseConnected: boolean;
  lastFirebaseUpdate: Date;
  connectedLaptops: string[];
  allFirebaseTemperatures: number[];
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [rawFirebaseData, setRawFirebaseData] = useState<any>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [lastFirebaseUpdate, setLastFirebaseUpdate] = useState(new Date());

  // Memoized data processing for better performance
  const { firebaseCPUData, connectedLaptops, allFirebaseTemperatures } = useMemo(() => {
    if (!rawFirebaseData) {
      return { firebaseCPUData: [], connectedLaptops: [], allFirebaseTemperatures: [] };
    }

    const formattedData: FirebaseCPUData[] = [];
    const laptopIds = new Set<string>();
    const allTemps: number[] = [];

    Object.keys(rawFirebaseData).forEach((laptopId) => {
      laptopIds.add(laptopId);
      const laptopData = rawFirebaseData[laptopId];

      // Ambil data terakhir dari setiap laptop
      const latestEntry = Object.keys(laptopData).reduce(
        (latest: any, key) => {
          const current = laptopData[key];
          const latestTime = latest
            ? new Date(latest.timestamp)
            : new Date(0);
          const currentTime = new Date(current.timestamp);
          return currentTime > latestTime ? current : latest;
        },
        null
      );

      // Kumpulkan semua suhu dari semua record
      Object.keys(laptopData).forEach((key) => {
        const entry = laptopData[key];
        if (typeof entry.suhu === 'number') {
          allTemps.push(entry.suhu);
        }
      });

      if (latestEntry) {
        const temp = latestEntry.suhu;
        let status = "Normal";
        if (temp > 80) status = "Critical";
        else if (temp > 70) status = "Warning";
        else if (temp < 50) status = "Cool";

        formattedData.push({
          id: `${laptopId}-firebase`,
          laptopId,
          suhu: temp,
          tanggal: latestEntry.tanggal,
          waktu: latestEntry.waktu,
          timestamp: latestEntry.timestamp,
          status,
        });
      }
    });

    // Limit to 50 records for better performance
    const limitedData = formattedData.slice(0, 50);

    return { 
      firebaseCPUData: limitedData, 
      connectedLaptops: Array.from(laptopIds),
      allFirebaseTemperatures: allTemps
    };
  }, [rawFirebaseData]);

  // Optimized Firebase connection with throttling
  const handleFirebaseUpdate = useCallback((snapshot: any) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      setRawFirebaseData(data);
      setIsFirebaseConnected(true);
      setLastFirebaseUpdate(new Date());
    } else {
      setIsFirebaseConnected(false);
      setRawFirebaseData(null);
    }
  }, []);

  useEffect(() => {
    const dataRef = ref(database, "data_suhu");

    const unsubscribe = onValue(
      dataRef,
      handleFirebaseUpdate,
      (error) => {
        console.error("Firebase connection error:", error);
        setIsFirebaseConnected(false);
      }
    );

    return () => off(dataRef, "value", unsubscribe);
  }, [handleFirebaseUpdate]);

  return (
    <FirebaseContext.Provider
      value={{
        firebaseCPUData,
        isFirebaseConnected,
        lastFirebaseUpdate,
        connectedLaptops,
        allFirebaseTemperatures,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}
