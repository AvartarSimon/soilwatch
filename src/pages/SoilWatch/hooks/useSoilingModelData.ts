import { useState, useCallback } from "react";
import { useSoilingData } from "../../../contexts/SoilingDataContext";

// Re-export types from context
export type {
  SoilingModelParameter,
  StringPerformance,
  CleaningUnitStatus,
  ArrayPerformance,
  StringDailyData,
  DailyData,
  SoilingModelData,
} from "../../../contexts/SoilingDataContext";

export const useSoilingModelData = () => {
  const { data, loading, error } = useSoilingData();
  const [selectedDay, setSelectedDay] = useState(30);

  const getDataForDay = useCallback(
    (day: number) => {
      if (!data) return null;
      return data.dailyData.find((d) => d.day === day) || null;
    },
    [data],
  );

  const getAvgSoilingLoss = useCallback(() => {
    if (!data) return 0;
    const selectedData = getDataForDay(selectedDay);
    return selectedData?.soilingLoss || 0;
  }, [data, selectedDay, getDataForDay]);

  const getAvgCleaningGain = useCallback(() => {
    if (!data) return 0;
    const selectedData = getDataForDay(selectedDay);
    return selectedData?.cleaningGain || 0;
  }, [data, selectedDay, getDataForDay]);

  const getProaWaspUnits = useCallback(() => {
    if (!data) return 0;
    const selectedData = getDataForDay(selectedDay);
    return selectedData?.onlineUnits || 0;
  }, [data, selectedDay, getDataForDay]);

  const getStringFaults = useCallback(() => {
    return data?.cleaningUnitStatus.faults || 0;
  }, [data]);

  const getCleaningUnitStatusForDay = useCallback(
    (day: number) => {
      if (!data)
        return { online: 0, offline: 0, total: 0, cleaning: 0, faults: 0 };

      const dayData = getDataForDay(day);
      if (!dayData) return data.cleaningUnitStatus;

      return {
        online: dayData.onlineUnits,
        offline: dayData.totalUnits - dayData.onlineUnits,
        total: dayData.totalUnits,
        cleaning: dayData.cleaningScheduled,
        faults: data.cleaningUnitStatus.faults,
      };
    },
    [data, getDataForDay],
  );

  const getDailyDataUpToDay = useCallback(
    (day: number): DailyData[] => {
      if (!data) return [];
      return data.dailyData.filter((d) => d.day <= day);
    },
    [data],
  );

  const getMaxDay = useCallback(() => {
    if (!data) return 60;
    return Math.max(...data.dailyData.map((d) => d.day));
  }, [data]);

  const getParameterByName = useCallback(
    (parameterName: string): SoilingModelParameter | null => {
      if (!data?.parameters) return null;
      return (
        data.parameters.find((param) => param.name === parameterName) || null
      );
    },
    [data],
  );

  const getArrayPerformanceForDay = useCallback(
    (day: number) => {
      if (!data) return { dirty: 0, cleaningGain: 0, residualLoss: 0 };

      const dayData = getDataForDay(day);
      if (!dayData) return data.arrayPerformance;

      return {
        dirty: dayData.soilingReference,
        cleaningGain: dayData.cleaningGain,
        residualLoss: 100 - dayData.avgArraySoilingRatio,
      };
    },
    [data, getDataForDay],
  );

  const getStringPerformanceForDay = useCallback(
    (day: number): StringPerformance[] => {
      if (!data) return [];

      const dayData = getDataForDay(day);
      if (!dayData) return data.strings;

      // Update performance based on daily soiling data
      return data.strings.map((string) => {
        const stringDailyData = dayData.stringData.find(
          (sd) => sd.stringId === string.id
        );

        // If no data for this string on this day, return baseline
        if (!stringDailyData) {
          return string;
        }

        // Handle offline status
        if (stringDailyData.isOffline) {
          return {
            ...string,
            performance: 0,
            status: -1, // Use -1 to indicate offline
          };
        }

        // Calculate actual performance based on soiling percentage
        // Formula: actualPerformance = basePerformance × (1 - soilingPercentage / 100)
        return {
          ...string,
          performance: string.performance * (1 - stringDailyData.soilingPercentage / 100),
          status: 1, // Online
        };
      });
    },
    [data, getDataForDay],
  );

  return {
    // Data
    data,
    parameters: data?.parameters || [],
    strings: data?.strings || [],
    cleaningUnitStatus: data?.cleaningUnitStatus || {
      online: 0,
      offline: 0,
      total: 0,
      cleaning: 0,
      faults: 0,
    },
    arrayPerformance: data?.arrayPerformance || {
      dirty: 0,
      cleaningGain: 0,
      residualLoss: 0,
    },
    dailyData: data?.dailyData || [],

    // State
    loading,
    error,
    selectedDay,
    setSelectedDay,

    // Computed values for selected day
    avgSoilingLoss: getAvgSoilingLoss(),
    avgCleaningGain: getAvgCleaningGain(),
    proaWaspUnits: getProaWaspUnits(),
    stringFaults: getStringFaults(),

    // Methods
    getDataForDay,
    getCleaningUnitStatusForDay,
    getDailyDataUpToDay,
    getMaxDay,
    getParameterByName,
    getStringPerformanceForDay,
    getArrayPerformanceForDay,
  };
};
