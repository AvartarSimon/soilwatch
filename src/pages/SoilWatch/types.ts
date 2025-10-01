export interface StringBlock {
  id: string;
  name: string;
  polygon: string;
  panelsCount: number;
  installedCapacityMW: number;
  currentPowerMW: number;
  maxPowerMW: number;
  efficiencyPct: number;
  soilCoveragePct: number;
  status: string;
  predictedCleanDate: string;
  lastCleanDate: string;
  soilAccumulationRate: number;
  weatherImpact: string;
  irradiance: number;
  temperature: number;
  performanceRatio: number;
  energyLoss: number;
  cleaningCost: number;
  cleaningFrequency: number;
}

export interface DailyPerformancePoint {
  date: string;
  totalPowerMW: number;
  maxPossibleMW: number;
  soilLossMW: number;
  avgSoilCoverage: number;
  irradiance: number;
  temperature: number;
  weatherConditions: string;
  cleaningEvents: number;
}

export interface CleaningSchedule {
  stringId: string;
  scheduledDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedCost: number;
  estimatedDuration: number; // hours
  reason: string;
}

export interface CostAnalysis {
  monthlyCleaningCost: number;
  energyLossValue: number;
  totalSavingsFromCleaning: number;
  roi: number;
  paybackPeriod: number; // days
}

export interface WeatherData {
  date: string;
  dustLevel: "Low" | "Medium" | "High";
  windSpeed: number; // km/h
  humidity: number; // %
  precipitation: number; // mm
  temperature: number; // °C
  soilAccumulationFactor: number;
}

export interface SoilingData {
  strings: StringBlock[];
  dailyPerformance: DailyPerformancePoint[];
  cleaningSchedule: CleaningSchedule[];
  costAnalysis: CostAnalysis;
  weatherData: WeatherData[];
}
