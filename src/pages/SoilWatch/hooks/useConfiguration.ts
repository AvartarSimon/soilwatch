import { useState, useEffect } from "react";
import configurationJson from "../mock/configuration.json";

export interface CleaningConfig {
  intervalDays: number;
  efficiency: number;
  efficiencyVariation: number;
}

export interface SoilingConfig {
  nominalRatePerDay: number;
  rateVariance: number;
  dailyAccumulationMin: number;
  dailyAccumulationMax: number;
  postCleaningMin: number;
  postCleaningMax: number;
  maxSoilingLoss: number;
}

export interface IVCurveConfig {
  voc_clean: number;
  isc_clean: number;
  voltageRangeMin: number;
  voltageRangeMax: number;
  currentRangeMin: number;
  currentRangeMax: number;
  powerRangeMin: number;
  powerRangeMax: number;
  numCurvePoints: number;
  units: {
    voltage: string;
    current: string;
    power: string;
  };
}

export interface PerformanceThresholds {
  excellent: number;
  good: number;
  moderate: number;
  poor: number;
  critical: number;
}

export interface PerformanceColors {
  excellent: { hue: number; label: string };
  good: { hue: number; label: string };
  moderate: { hue: number; label: string };
  poor: { hue: number; label: string };
  critical: { hue: number; label: string };
  offline: { color: string; label: string };
}

export interface PerformanceConfig {
  thresholds: PerformanceThresholds;
  colors: PerformanceColors;
}

export interface ChartConfig {
  soilingLossChart: {
    yAxisMin: number;
    yAxisMax: number;
    showThresholdLine: boolean;
    thresholdValue: number;
    thresholdColor: string;
  };
  cleaningGainChart: {
    yAxisMin: number;
    yAxisMax: number;
  };
  stringPerformanceChart: {
    yAxisMin: number;
    yAxisMax: number;
    showCleaningMarkers: boolean;
  };
}

export interface SimulationConfig {
  totalDays: number;
  totalStrings: number;
  basePerformanceMin: number;
  basePerformanceMax: number;
  offlineProbability: number;
  faultProbability: number;
}

export interface DisplayConfig {
  dateFormat: string;
  decimalPlaces: number;
  showTooltips: boolean;
  animationDuration: number;
  defaultSelectedDay: number;
}

export interface Configuration {
  systemName: string;
  version: string;
  lastUpdated: string;
  cleaning: CleaningConfig;
  soiling: SoilingConfig;
  ivCurve: IVCurveConfig;
  performance: PerformanceConfig;
  charts: ChartConfig;
  simulation: SimulationConfig;
  display: DisplayConfig;
}

export const useConfiguration = () => {
  const [config, setConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setConfig(configurationJson as Configuration);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load configuration:", error);
      setLoading(false);
    }
  }, []);

  /**
   * Calculate cleaning days based on cleaning interval
   * @returns Array of day numbers when cleaning is scheduled
   */
  const getCleaningDays = (): number[] => {
    if (!config) return [];

    const { intervalDays } = config.cleaning;
    const { totalDays } = config.simulation;
    const cleaningDays: number[] = [1]; // Always clean on Day 1

    let nextCleaningDay = 1 + intervalDays;
    while (nextCleaningDay <= totalDays) {
      cleaningDays.push(nextCleaningDay);
      nextCleaningDay += intervalDays;
    }

    return cleaningDays;
  };

  /**
   * Check if a specific day is a cleaning day
   */
  const isCleaningDay = (day: number): boolean => {
    const cleaningDays = getCleaningDays();
    return cleaningDays.includes(day);
  };

  /**
   * Get performance color hue based on performance value
   */
  const getPerformanceHue = (performance: number): number => {
    if (!config) return 60; // Default yellow

    const { thresholds, colors } = config.performance;

    if (performance >= thresholds.excellent) return colors.excellent.hue;
    if (performance >= thresholds.good) return colors.good.hue;
    if (performance >= thresholds.moderate) return colors.moderate.hue;
    if (performance >= thresholds.poor) return colors.poor.hue;
    return colors.critical.hue;
  };

  /**
   * Get offline color
   */
  const getOfflineColor = (): string => {
    return config?.performance.colors.offline.color || "#9E9E9E";
  };

  return {
    config,
    loading,

    // Cleaning helpers
    getCleaningDays,
    isCleaningDay,

    // Performance helpers
    getPerformanceHue,
    getOfflineColor,
  };
};
