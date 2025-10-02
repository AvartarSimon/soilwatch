import React, { createContext, useContext, useState, useMemo } from "react";
import { useConfiguration } from "../pages/SoilWatch/hooks/useConfiguration";
import { createSeededRandom, hashString } from "../pages/SoilWatch/utils/seededRandom";

export interface SoilingModelParameter {
  name: string;
  currentValue: number;
  units: string;
}

export interface StringPerformance {
  id: string;
  name: string;
  performance: number;
  status: number;
}

export interface CleaningUnitStatus {
  online: number;
  offline: number;
  total: number;
  cleaning: number;
  faults: number;
}

export interface ArrayPerformance {
  dirty: number;
  cleaningGain: number;
  residualLoss: number;
}

export interface StringDailyData {
  stringId: string;
  soilingPercentage: number;
  isOffline: boolean;
}

export interface DailyData {
  day: number;
  dailySoiling: number;
  soilingReference: number;
  avgArraySoilingRatio: number;
  soilingLoss: number;
  cleaningGain: number;
  daysSinceClean: number;
  cleaningScheduled: number;
  onlineUnits: number;
  totalUnits: number;
  offline: number;
  stringData: StringDailyData[];
}

export interface SoilingModelData {
  parameters: SoilingModelParameter[];
  strings: StringPerformance[];
  cleaningUnitStatus: CleaningUnitStatus;
  arrayPerformance: ArrayPerformance;
  dailyData: DailyData[];
}

interface SoilingDataContextType {
  data: SoilingModelData | null;
  loading: boolean;
  error: string | null;
}

const SoilingDataContext = createContext<SoilingDataContextType | undefined>(undefined);

/**
 * Generate mock soiling model data dynamically from configuration
 */
const generateMockData = (config: any, configHash: string): SoilingModelData => {
  // Create seeded random generator based on config hash
  const seed = hashString(configHash);
  const rng = createSeededRandom(seed);
  const totalDays = config?.simulation.totalDays || 60;
  const totalStrings = config?.simulation.totalStrings || 20;
  const cleaningInterval = config?.cleaning.intervalDays || 14;
  const dailyAccumulationMin = config?.soiling.dailyAccumulationMin || 0.25;
  const dailyAccumulationMax = config?.soiling.dailyAccumulationMax || 0.6;
  const postCleaningMin = config?.soiling.postCleaningMin || 0.2;
  const postCleaningMax = config?.soiling.postCleaningMax || 0.5;
  const maxSoilingLoss = config?.soiling.maxSoilingLoss || 8.0;
  const offlineProbability = config?.simulation.offlineProbability || 0.05;
  const basePerformanceMin = config?.simulation.basePerformanceMin || 64.3;
  const basePerformanceMax = config?.simulation.basePerformanceMax || 99.1;

  // Generate strings with random baseline performance (using seeded random)
  const strings: StringPerformance[] = Array.from({ length: totalStrings }, (_, i) => ({
    id: `string-${i + 1}`,
    name: `String ${i + 1}`,
    performance: basePerformanceMin + rng.next() * (basePerformanceMax - basePerformanceMin),
    status: 1,
  }));

  // Track soiling accumulation for each string
  const stringSoiling: number[] = new Array(totalStrings).fill(0);

  // Generate daily data
  const dailyData: DailyData[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const isCleaningDay = day === 1 || (day - 1) % cleaningInterval === 0;

    // Update soiling for each string
    const stringData: StringDailyData[] = strings.map((string, index) => {
      const stringId = string.id;

      // Random offline status (using seeded random)
      const isOffline = rng.next() < offlineProbability;

      if (isCleaningDay) {
        // Reset soiling to post-cleaning residual (using seeded random)
        stringSoiling[index] = postCleaningMin + rng.next() * (postCleaningMax - postCleaningMin);
      } else {
        // Accumulate daily soiling (using seeded random)
        const dailyIncrease = dailyAccumulationMin + rng.next() * (dailyAccumulationMax - dailyAccumulationMin);
        stringSoiling[index] = Math.min(stringSoiling[index] + dailyIncrease, maxSoilingLoss);
      }

      return {
        stringId,
        soilingPercentage: stringSoiling[index],
        isOffline,
      };
    });

    // Calculate aggregate metrics
    const onlineStrings = stringData.filter(s => !s.isOffline);
    const avgSoilingPercentage = onlineStrings.length > 0
      ? onlineStrings.reduce((sum, s) => sum + s.soilingPercentage, 0) / onlineStrings.length
      : 0;

    const soilingLoss = avgSoilingPercentage;
    const cleaningGain = isCleaningDay ? rng.next() * 2 + 1 : 0; // 1-3% gain on cleaning days (using seeded random)
    const soilingReference = 95 + rng.next() * 2; // 95-97% (using seeded random)
    const avgArraySoilingRatio = soilingReference + cleaningGain;

    const daysSinceLastClean = isCleaningDay ? 0 : ((day - 1) % cleaningInterval);

    dailyData.push({
      day,
      dailySoiling: avgSoilingPercentage,
      soilingReference,
      avgArraySoilingRatio,
      soilingLoss,
      cleaningGain,
      daysSinceClean: daysSinceLastClean,
      cleaningScheduled: isCleaningDay ? 1 : 0,
      onlineUnits: onlineStrings.length,
      totalUnits: totalStrings,
      offline: totalStrings - onlineStrings.length,
      stringData,
    });
  }

  // Calculate array performance from latest day
  const latestDay = dailyData[dailyData.length - 1];
  const arrayPerformance: ArrayPerformance = {
    dirty: latestDay.soilingReference,
    cleaningGain: latestDay.cleaningGain,
    residualLoss: 100 - latestDay.avgArraySoilingRatio,
  };

  // Cleaning unit status
  const cleaningUnitStatus: CleaningUnitStatus = {
    online: latestDay.onlineUnits,
    offline: latestDay.offline,
    total: totalStrings,
    cleaning: latestDay.cleaningScheduled,
    faults: Math.floor(rng.next() * 3), // 0-2 random faults (using seeded random)
  };

  // Parameters
  const parameters: SoilingModelParameter[] = [
    { name: "Nominal Soiling Rate", currentValue: config?.soiling.nominalRatePerDay || 0.15, units: "%/day" },
    { name: "Cleaning Interval", currentValue: cleaningInterval, units: "days" },
    { name: "Average Soiling Loss", currentValue: latestDay.soilingLoss, units: "%" },
  ];

  return {
    parameters,
    strings,
    cleaningUnitStatus,
    arrayPerformance,
    dailyData,
  };
};

/**
 * Create a stable hash of configuration values for comparison
 */
const getConfigHash = (config: any): string => {
  if (!config) return "";

  const relevantValues = {
    totalDays: config?.simulation?.totalDays,
    totalStrings: config?.simulation?.totalStrings,
    cleaningInterval: config?.cleaning?.intervalDays,
    dailyAccumulationMin: config?.soiling?.dailyAccumulationMin,
    dailyAccumulationMax: config?.soiling?.dailyAccumulationMax,
    postCleaningMin: config?.soiling?.postCleaningMin,
    postCleaningMax: config?.soiling?.postCleaningMax,
    maxSoilingLoss: config?.soiling?.maxSoilingLoss,
    offlineProbability: config?.simulation?.offlineProbability,
    basePerformanceMin: config?.simulation?.basePerformanceMin,
    basePerformanceMax: config?.simulation?.basePerformanceMax,
  };

  return JSON.stringify(relevantValues);
};

export const SoilingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config, loading: configLoading } = useConfiguration();
  const [error, setError] = useState<string | null>(null);

  // Use useMemo with config hash to only regenerate when actual values change
  const configHash = useMemo(() => getConfigHash(config), [config]);

  const data = useMemo(() => {
    if (!config || !configHash) return null;

    try {
      console.log("Generating new mock data with hash:", configHash);
      const newData = generateMockData(config, configHash);
      setError(null);
      return newData;
    } catch (err) {
      console.error("Failed to generate mock data:", err);
      setError("Failed to generate soiling model data");
      return null;
    }
  }, [configHash]);

  const contextValue = useMemo(() => ({
    data,
    loading: configLoading || !data,
    error,
  }), [data, configLoading, error]);

  return (
    <SoilingDataContext.Provider value={contextValue}>
      {children}
    </SoilingDataContext.Provider>
  );
};

export const useSoilingData = () => {
  const context = useContext(SoilingDataContext);
  if (context === undefined) {
    throw new Error("useSoilingData must be used within a SoilingDataProvider");
  }
  return context;
};
