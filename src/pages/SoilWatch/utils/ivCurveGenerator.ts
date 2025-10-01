/**
 * IV Curve Generator for Solar Panels
 * Generates IV curve data based on performance and soiling conditions
 */

export interface IVCurvePoint {
  voltage: number;
  current: number;
  power: number;
}

export interface IVCurveData {
  clean: IVCurvePoint[];
  soiled: IVCurvePoint[];
  Voc_clean: number;
  Isc_clean: number;
  Vmp_clean: number;
  Imp_clean: number;
  Pmax_clean: number;
  Voc_soiled: number;
  Isc_soiled: number;
  Vmp_soiled: number;
  Imp_soiled: number;
  Pmax_soiled: number;
  fillFactor_clean: number;
  fillFactor_soiled: number;
}

/**
 * Generate IV curve based on performance percentage
 * @param performancePct - Current performance percentage (0-100)
 * @param nominalPower - Nominal power rating in kW (default: 300kW for a string)
 * @returns IV curve data for both clean and soiled conditions
 */
export function generateIVCurve(
  performancePct: number,
  nominalPower: number = 300
): IVCurveData {
  // Standard test conditions parameters for a typical solar string
  const Voc_clean = 800; // Open circuit voltage (V) - clean condition
  const Isc_clean = 450; // Short circuit current (A) - clean condition

  // Calculate soiling impact
  // Soiling primarily affects current (Isc) and slightly affects voltage (Voc)
  const soilingFactor = performancePct / 100;
  const currentReduction = 1 - soilingFactor;

  const Isc_soiled = Isc_clean * soilingFactor;
  const Voc_soiled = Voc_clean * (0.95 + soilingFactor * 0.05); // Voltage drops slightly

  // Generate clean IV curve
  const cleanCurve: IVCurvePoint[] = [];
  const numPoints = 100;

  for (let i = 0; i <= numPoints; i++) {
    const v = (Voc_clean * i) / numPoints;
    // IV curve equation: I = Isc * (1 - C1*(exp(V/C2*Voc) - 1))
    // Simplified model
    const normalizedV = v / Voc_clean;
    const current = Isc_clean * (1 - Math.pow(normalizedV, 3)) * (1 - 0.1 * normalizedV);
    const power = v * current / 1000; // Convert to kW

    cleanCurve.push({
      voltage: Math.round(v * 10) / 10,
      current: Math.round(current * 10) / 10,
      power: Math.round(power * 10) / 10
    });
  }

  // Generate soiled IV curve
  const soiledCurve: IVCurvePoint[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const v = (Voc_soiled * i) / numPoints;
    const normalizedV = v / Voc_soiled;
    const current = Isc_soiled * (1 - Math.pow(normalizedV, 3)) * (1 - 0.1 * normalizedV);
    const power = v * current / 1000; // Convert to kW

    soiledCurve.push({
      voltage: Math.round(v * 10) / 10,
      current: Math.round(current * 10) / 10,
      power: Math.round(power * 10) / 10
    });
  }

  // Find maximum power points
  const Pmax_clean = Math.max(...cleanCurve.map(p => p.power));
  const mppClean = cleanCurve.find(p => p.power === Pmax_clean)!;
  const Vmp_clean = mppClean.voltage;
  const Imp_clean = mppClean.current;

  const Pmax_soiled = Math.max(...soiledCurve.map(p => p.power));
  const mppSoiled = soiledCurve.find(p => p.power === Pmax_soiled)!;
  const Vmp_soiled = mppSoiled.voltage;
  const Imp_soiled = mppSoiled.current;

  // Calculate fill factors
  const fillFactor_clean = Pmax_clean / (Voc_clean * Isc_clean / 1000);
  const fillFactor_soiled = Pmax_soiled / (Voc_soiled * Isc_soiled / 1000);

  return {
    clean: cleanCurve,
    soiled: soiledCurve,
    Voc_clean,
    Isc_clean,
    Vmp_clean,
    Imp_clean,
    Pmax_clean,
    Voc_soiled,
    Isc_soiled,
    Vmp_soiled,
    Imp_soiled,
    Pmax_soiled,
    fillFactor_clean,
    fillFactor_soiled
  };
}
