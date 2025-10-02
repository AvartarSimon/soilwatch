# SoilWatch Configuration Guide

## Overview

The SoilWatch system now supports centralized configuration through a JSON file. All chart parameters, cleaning intervals, IV curve settings, and visual thresholds can be modified in one place.

**Configuration File**: `src/pages/SoilWatch/mock/configuration.json`

---

## Quick Start

### 1. Change Cleaning Interval

**File**: `src/pages/SoilWatch/mock/configuration.json`

Find the `cleaning` section:

```json
{
  "cleaning": {
    "intervalDays": 14,  // ← Change this number
    "efficiency": 0.97,
    "efficiencyVariation": 0.03
  }
}
```

**Effect**:
- Slider markers will automatically update to show new cleaning days
- Performance charts will reset on new cleaning days

**Example**: Change from 14 days to 10 days
```json
"intervalDays": 10
```

**Result**: Cleaning will occur on Days 1, 11, 21, 31, 41, 51 (instead of 1, 15, 29, 43, 57)

---

### 2. Adjust IV Curve Parameters

**File**: `src/pages/SoilWatch/mock/configuration.json`

Find the `ivCurve` section:

```json
{
  "ivCurve": {
    "voc_clean": 800,           // Open Circuit Voltage (V)
    "isc_clean": 450,           // Short Circuit Current (A)
    "voltageRangeMin": 0,       // Chart X-axis min
    "voltageRangeMax": 850,     // Chart X-axis max
    "currentRangeMin": 0,       // Chart Y-axis min (IV curve)
    "currentRangeMax": 500,     // Chart Y-axis max (IV curve)
    "powerRangeMin": 0,         // Chart Y-axis min (PV curve)
    "powerRangeMax": 300,       // Chart Y-axis max (PV curve)
    "numCurvePoints": 100       // Number of points in curve
  }
}
```

**Example**: Model a high-voltage string
```json
{
  "voc_clean": 1000,  // Increase from 800V to 1000V
  "isc_clean": 400,   // Decrease from 450A to 400A
  "voltageRangeMax": 1100
}
```

---

### 3. Change Performance Color Thresholds

**File**: `src/pages/SoilWatch/mock/configuration.json`

Find the `performance` section:

```json
{
  "performance": {
    "thresholds": {
      "excellent": 95,  // Green if performance >= 95%
      "good": 90,       // Yellow-green if >= 90%
      "moderate": 85,   // Yellow if >= 85%
      "poor": 80,       // Orange if >= 80%
      "critical": 0     // Red if < 80%
    },
    "colors": {
      "excellent": { "hue": 120, "label": "Green" },
      "good": { "hue": 100, "label": "Yellow-Green" },
      "moderate": { "hue": 60, "label": "Yellow" },
      "poor": { "hue": 30, "label": "Orange" },
      "critical": { "hue": 0, "label": "Red" },
      "offline": { "color": "#9E9E9E", "label": "Gray" }
    }
  }
}
```

**Example**: Make "excellent" threshold stricter
```json
"thresholds": {
  "excellent": 98,  // Only green if >= 98% (was 95%)
  "good": 95,
  "moderate": 90,
  // ...
}
```

---

### 4. Adjust Soiling Accumulation Rate

**File**: `src/pages/SoilWatch/mock/configuration.json`

Find the `soiling` section:

```json
{
  "soiling": {
    "nominalRatePerDay": 0.15,      // Nominal rate (%/day)
    "rateVariance": 0.05,           // Variance in rate
    "dailyAccumulationMin": 0.25,   // Min soiling added per day (%)
    "dailyAccumulationMax": 0.6,    // Max soiling added per day (%)
    "postCleaningMin": 0.2,         // Min residual after cleaning
    "postCleaningMax": 0.5,         // Max residual after cleaning
    "maxSoilingLoss": 8.0           // Maximum total soiling (%)
  }
}
```

**Example**: Faster soiling accumulation (dustier environment)
```json
{
  "dailyAccumulationMin": 0.5,   // Increase from 0.25
  "dailyAccumulationMax": 1.0    // Increase from 0.6
}
```

**Result**: Panels will get dirtier faster, requiring more frequent cleaning.

---

### 5. Customize Chart Display Ranges

**File**: `src/pages/SoilWatch/mock/configuration.json`

Find the `charts` section:

```json
{
  "charts": {
    "soilingLossChart": {
      "yAxisMin": 0,
      "yAxisMax": 8,
      "showThresholdLine": false,    // Enable warning line
      "thresholdValue": 5.0,          // Threshold at 5%
      "thresholdColor": "#F44336"     // Red line
    },
    "cleaningGainChart": {
      "yAxisMin": 0,
      "yAxisMax": 5
    },
    "stringPerformanceChart": {
      "yAxisMin": 70,
      "yAxisMax": 100,
      "showCleaningMarkers": true
    }
  }
}
```

**Example**: Add warning threshold line
```json
{
  "soilingLossChart": {
    "yAxisMin": 0,
    "yAxisMax": 10,        // Increase max range
    "showThresholdLine": true,  // ← Enable
    "thresholdValue": 6.0,      // Warning at 6%
    "thresholdColor": "#FF9800" // Orange line
  }
}
```

---

## Configuration Structure

```
configuration.json
├── systemName           - System identification
├── version              - Configuration version
├── lastUpdated          - Last modification date
├── cleaning             - Cleaning cycle parameters
│   ├── intervalDays     - ⭐ Days between cleanings
│   ├── efficiency       - Cleaning effectiveness
│   └── efficiencyVariation
├── soiling              - Soiling accumulation parameters
│   ├── nominalRatePerDay
│   ├── dailyAccumulationMin - ⭐ Daily soiling increase
│   ├── dailyAccumulationMax
│   └── maxSoilingLoss
├── ivCurve              - IV/PV curve parameters
│   ├── voc_clean        - ⭐ Open circuit voltage
│   ├── isc_clean        - ⭐ Short circuit current
│   ├── voltageRangeMin  - ⭐ Chart X-axis range
│   ├── voltageRangeMax
│   ├── currentRangeMin  - ⭐ Chart Y-axis range
│   ├── currentRangeMax
│   └── numCurvePoints
├── performance          - Performance thresholds & colors
│   ├── thresholds       - ⭐ Color breakpoints
│   └── colors           - HSL hue values
├── charts               - Chart display settings
│   ├── soilingLossChart
│   ├── cleaningGainChart
│   └── stringPerformanceChart
├── simulation           - Data generation parameters
└── display              - UI preferences

⭐ = Most commonly modified parameters
```

---

## How It Works

### 1. Configuration Loading

The `useConfiguration` hook loads the configuration file:

```typescript
import { useConfiguration } from "./hooks/useConfiguration";

const { config, getCleaningDays, isCleaningDay } = useConfiguration();
```

### 2. Cleaning Days Calculation

Cleaning days are automatically calculated based on `intervalDays`:

```typescript
// If intervalDays = 14
const cleaningDays = getCleaningDays();
// Returns: [1, 15, 29, 43, 57]

// If intervalDays = 10
// Returns: [1, 11, 21, 31, 41, 51]
```

### 3. IV Curve Generation

IV curves use configuration parameters:

```typescript
const ivData = generateIVCurve(
  performance,
  nominalPower,
  {
    voc_clean: config.ivCurve.voc_clean,
    isc_clean: config.ivCurve.isc_clean,
    numCurvePoints: config.ivCurve.numCurvePoints
  }
);
```

### 4. Performance Colors

Heatmap colors are determined by configuration thresholds:

```typescript
const hue = getPerformanceHue(performance);
// Returns: 120 (green) if performance >= 95%
//          60 (yellow) if performance >= 85%, etc.
```

---

## Common Scenarios

### Scenario 1: Increase Cleaning Frequency

**Goal**: Clean every 7 days instead of 14 days

**Steps**:
1. Open `configuration.json`
2. Change: `"intervalDays": 7`
3. Save and refresh browser

**Result**: Cleaning markers appear on Days 1, 8, 15, 22, 29, 36, 43, 50, 57

---

### Scenario 2: Simulate Dustier Environment

**Goal**: Panels get dirtier faster

**Steps**:
1. Open `configuration.json`
2. Find `soiling` section
3. Change:
   ```json
   "dailyAccumulationMin": 0.5,
   "dailyAccumulationMax": 1.0
   ```

**Result**: Performance degrades faster between cleanings

---

### Scenario 3: Different Solar Panel Type

**Goal**: Model 1000V high-voltage panels

**Steps**:
1. Open `configuration.json`
2. Find `ivCurve` section
3. Change:
   ```json
   "voc_clean": 1000,
   "isc_clean": 380,
   "voltageRangeMax": 1100
   ```

**Result**: IV/PV curves show higher voltage characteristics

---

### Scenario 4: Stricter Performance Standards

**Goal**: Only show green for panels >= 98%

**Steps**:
1. Open `configuration.json`
2. Find `performance.thresholds`
3. Change:
   ```json
   "excellent": 98,
   "good": 95,
   "moderate": 90
   ```

**Result**: Fewer panels will show as "excellent" green

---

## Testing Changes

After modifying `configuration.json`:

1. **Save the file**
2. **Refresh browser** (Ctrl+R or Cmd+R)
3. **Verify changes**:
   - Check day slider markers moved
   - Check IV curve range adjusted
   - Check heatmap colors changed

**Note**: No rebuild required - changes take effect immediately on browser refresh!

---

## Advanced: Adding New Parameters

To add a new configurable parameter:

### 1. Update `configuration.json`

```json
{
  "myNewFeature": {
    "param1": 100,
    "param2": "enabled"
  }
}
```

### 2. Update `useConfiguration.ts` Types

```typescript
export interface Configuration {
  // ... existing interfaces
  myNewFeature: {
    param1: number;
    param2: string;
  };
}
```

### 3. Use in Components

```typescript
const { config } = useConfiguration();
const myParam = config?.myNewFeature.param1 ?? 100; // with fallback
```

---

## Troubleshooting

### Q: Configuration changes not appearing?

**A**: Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)

### Q: Application crashes after changing config?

**A**: Check JSON syntax - common errors:
- Missing comma
- Trailing comma in last item
- Mismatched brackets

**Tip**: Use a JSON validator: [jsonlint.com](https://jsonlint.com)

### Q: How do I reset to defaults?

**A**: See the default values in this document or the original `configuration.json`

---

## Summary

The configuration system allows you to:

✅ **Change cleaning interval** → Affects cleaning schedule
✅ **Adjust IV curve parameters** → Changes voltage/current characteristics
✅ **Modify performance thresholds** → Affects heatmap colors
✅ **Control soiling rates** → Changes degradation speed
✅ **Customize chart ranges** → Adjusts axis limits

**All changes take effect immediately after browser refresh!**

---

**Last Updated**: 2025-10-02
**Configuration Version**: 1.0.0
