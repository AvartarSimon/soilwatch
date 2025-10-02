import { Add, Analytics, ArrowBack, CheckCircle, CleaningServices, ElectricBolt, Timeline, TrendingDown, Warning } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from "chart.js";
import React, { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useConfiguration } from "./hooks/useConfiguration";
import { useResponsiveScale } from "./hooks/useResponsiveScale";
import { useSoilingModelData } from "./hooks/useSoilingModelData";
import { generateIVCurve } from "./utils/ivCurveGenerator";
import { createSeededRandom } from "./utils/seededRandom";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface StringDetailData {
  id: string;
  name: string;
  performance: number;
  status: number;
  powerOutput: number;
  expectedPower: number;
  soilingLoss: number;
  cleaningEfficiency: number;
  faultCount: number;
  lastCleaning: string;
  dailyData: Array<{
    day: number;
    date: string;
    performance: number;
    soilingLoss: number;
    soiledReference: number;
    powerOutput: number;
    cleaningScheduled: number;
    faultEvents: number;
  }>;
  faultHistory: Array<{
    id: string;
    type: string;
    timestamp: string;
    duration: number;
    resolved: boolean;
    description: string;
  }>;
  cleaningHistory: Array<{
    date: string;
    type: string;
    efficiency: number;
    performanceGain: number;
  }>;
}

const StringDetail: React.FC = () => {
  const { stringId } = useParams<{ stringId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { strings, dailyData, loading, error, getDataForDay, getStringPerformanceForDay, getDailyDataUpToDay, getMaxDay } = useSoilingModelData();
  const { config, getCleaningDays, isCleaningDay } = useConfiguration();
  const { scale } = useResponsiveScale({
    baseWidth: 1920,
    baseHeight: 1080,
    minScale: 0.4,
    maxScale: 1.5,
  });

  // Get selectedDay from navigation state, default to latest day
  const maxDay = getMaxDay();
  // Use configuration to determine cleaning days
  const cleaningDays = useMemo(() => {
    // If configuration is loaded, use it to calculate cleaning days
    if (config) {
      return getCleaningDays();
    }
    // Fallback to data from JSON if config not loaded yet
    return dailyData.filter((d) => d.cleaningScheduled === 1).map((d) => d.day);
  }, [config, getCleaningDays, dailyData]);

  // Use a stable today value that doesn't change on re-renders
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []); // Empty dependency array means this only calculates once

  const subtractDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };
  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const [selectedDay, setSelectedDay] = useState(() => (location.state as any)?.selectedDay || maxDay);

  // State for add fault dialog
  const [openAddFault, setOpenAddFault] = useState(false);
  const [newFault, setNewFault] = useState({
    type: "",
    description: "",
    duration: "",
  });
  const [additionalFaults, setAdditionalFaults] = useState<
    Array<{
      id: string;
      type: string;
      timestamp: string;
      duration: number;
      resolved: boolean;
      description: string;
    }>
  >([]);

  // Handlers for add fault dialog
  const handleOpenAddFault = () => {
    setOpenAddFault(true);
  };

  const handleCloseAddFault = () => {
    setOpenAddFault(false);
    setNewFault({ type: "", description: "", duration: "" });
  };

  const handleAddFault = () => {
    if (!newFault.type || !newFault.duration) {
      return; // Basic validation
    }

    const now = new Date();
    const newFaultEntry = {
      id: `fault-${Date.now()}`,
      type: newFault.type,
      timestamp: now.toISOString().replace("T", " ").split(".")[0],
      duration: parseInt(newFault.duration),
      resolved: false,
      description: newFault.description || "No description provided",
    };

    setAdditionalFaults([newFaultEntry, ...additionalFaults]);
    handleCloseAddFault();
  };

  // Find the specific string data
  const stringData = useMemo(() => {
    const foundString = strings.find((s) => s.id === stringId);
    if (!foundString) return null;

    // Create a seeded random generator for this specific string
    // Using stringId as seed ensures consistent data for each string
    const rng = createSeededRandom(stringId || 'default');

    // Check if this string is offline on the selected day
    const dayData = getDataForDay(selectedDay);
    const stringDailyData = dayData?.stringData?.find((sd) => sd.stringId === stringId);
    const isOfflineOnSelectedDay = stringDailyData?.isOffline || false;

    // Generate mock detailed data based on the string's basic info
    // Base date: current date (last day = today, day 60)
    const localToday = new Date(today);
    localToday.setHours(0, 0, 0, 0);

    let accumulatedSoiling = 0;
    const mockDailyData = dailyData.map((day) => {
      // Find this string's data for this day
      const stringDayData = day.stringData?.find((sd) => sd.stringId === stringId);

      // Calculate date
      const dayDate = new Date(localToday);
      dayDate.setDate(localToday.getDate() - (maxDay - day.day));

      // Update accumulated soiling (using seeded random)
      if (day.cleaningScheduled === 1) {
        accumulatedSoiling = 0.2 + rng.nextFloat(0, 0.3); // Reset after cleaning
      } else {
        accumulatedSoiling += 0.25 + rng.nextFloat(0, 0.35); // Daily accumulation
      }

      const soilingLoss = Math.min(accumulatedSoiling, 8);
      const performance = stringDayData?.isOffline ? 0 : Math.max(foundString.performance - soilingLoss, 75);

      return {
        day: day.day,
        date: dayDate.toISOString().split("T")[0],
        performance: performance,
        soilingLoss: soilingLoss,
        soiledReference: 95 + soilingLoss,
        powerOutput: 250 + (performance / 100) * 50,
        cleaningScheduled: day.cleaningScheduled,
        faultEvents: rng.next() > 0.9 ? 1 : 0,
      };
    });

    // Generate fault history with dynamic dates
    const fault1Date = new Date(today);
    fault1Date.setDate(today.getDate() - 7); // 7 days ago
    const fault2Date = new Date(today);
    fault2Date.setDate(today.getDate() - 14); // 14 days ago

    const mockFaultHistory = [
      {
        id: "1",
        type: "Connection Issue",
        timestamp: `${fault1Date.toISOString().split("T")[0]} 14:30:00`,
        duration: 120,
        resolved: true,
        description: "Temporary connection loss detected",
      },
      {
        id: "2",
        type: "Performance Drop",
        timestamp: `${fault2Date.toISOString().split("T")[0]} 09:15:00`,
        duration: 45,
        resolved: true,
        description: "Significant performance reduction",
      },
    ];

    // Find the last cleaning date from mockDailyData
    const lastCleaningData = [...mockDailyData].reverse().find((d) => d.cleaningScheduled === 1);
    const lastCleaningDate = lastCleaningData ? lastCleaningData.date : "N/A";

    // Generate cleaning history based on actual cleaning events (using seeded random)
    const cleaningEvents = mockDailyData.filter((d) => d.cleaningScheduled === 1);
    const mockCleaningHistory = cleaningEvents
      .slice(-5)
      .reverse()
      .map((event, index) => ({
        date: event.date,
        type: index === 0 ? "Automated" : "Manual",
        efficiency: 94 + rng.nextFloat(0, 5),
        performanceGain: 7 + rng.nextFloat(0, 6),
      }));

    // Determine actual status based on multiple factors (using seeded random)
    // Use the offline status from the selected day if available
    const actualFaultCount = isOfflineOnSelectedDay
      ? rng.nextInt(2, 4) // More faults if offline (2-4)
      : foundString.performance < 80
        ? rng.nextInt(1, 3) // 1-3 faults
        : foundString.performance < 90
          ? rng.nextInt(0, 1) // 0-1 faults
          : 0;

    // Status should reflect offline state on selected day
    const isOnline = !isOfflineOnSelectedDay && foundString.performance > 50;

    return {
      id: foundString.id,
      name: foundString.name,
      performance: isOfflineOnSelectedDay ? 0 : foundString.performance,
      status: isOnline ? 1 : 0, // 1 = Online, 0 = Fault
      powerOutput: isOfflineOnSelectedDay ? 0 : 275,
      expectedPower: 300,
      soilingLoss: isOfflineOnSelectedDay ? 0 : 3.2,
      cleaningEfficiency: 94.5,
      faultCount: actualFaultCount,
      lastCleaning: lastCleaningDate,
      dailyData: mockDailyData,
      faultHistory: mockFaultHistory,
      cleaningHistory: mockCleaningHistory,
    } as StringDetailData;
  }, [stringId, strings, dailyData, selectedDay, getDataForDay, maxDay]);

  // Generate IV curve data for selected day performance (must be before early returns)
  const ivData = useMemo(() => {
    if (!stringData) return null;
    const currentDayData = stringData.dailyData.find((d) => d.day === selectedDay) || stringData.dailyData[stringData.dailyData.length - 1];

    // Use configuration for IV curve parameters if available
    const ivConfig = config?.ivCurve ? {
      voc_clean: config.ivCurve.voc_clean,
      isc_clean: config.ivCurve.isc_clean,
      numCurvePoints: config.ivCurve.numCurvePoints
    } : undefined;

    return generateIVCurve(currentDayData.performance, 300, ivConfig);
  }, [stringData, selectedDay, config]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stringData || !ivData) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || `String ${stringId} not found`}
        </Alert>
      </Container>
    );
  }

  // Chart data for soiling status and cleaning reference
  const soilingStatusChartData = {
    labels: stringData.dailyData.slice(-30).map((d) => d.date.split("-").slice(1).join("/")),
    datasets: [
      {
        label: "Soiled Reference (%)",
        data: stringData.dailyData.slice(-30).map((d) => d.soiledReference),
        borderColor: "#8B4513",
        backgroundColor: "rgba(139, 69, 19, 0.2)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Soiling Loss (%)",
        data: stringData.dailyData.slice(-30).map((d) => d.soilingLoss),
        borderColor: "#FF6B35",
        backgroundColor: "rgba(255, 107, 53, 0.2)",
        borderWidth: 3,
        tension: 0.4,
        fill: false,
        yAxisID: "y1",
      },
      {
        label: "Cleaning Events",
        data: stringData.dailyData.slice(-30).map((d) => d.cleaningScheduled * 12), // Scale for visibility
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.3)",
        tension: 0,
        fill: false,
        pointRadius: stringData.dailyData.slice(-30).map((d) => (d.cleaningScheduled === 1 ? 6 : 0)),
        pointBackgroundColor: "#4CAF50",
        pointBorderColor: "#388E3C",
        pointBorderWidth: 2,
        yAxisID: "y1",
      },
    ],
  };

  const soilingStatusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: { display: true, text: "Soiling Level (%)" },
        min: 90,
        max: 105,
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: { display: true, text: "Soiling Loss (%) / Cleaning Events" },
        min: 0,
        max: 15,
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          title: function (context: any) {
            return `Date: ${context[0].label}`;
          },
          label: function (context: any) {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;

            if (datasetLabel === "Cleaning Events") {
              return value > 0 ? "🧽 Cleaning Performed" : "";
            } else if (datasetLabel === "Soiled Reference (%)") {
              return `${datasetLabel}: ${value.toFixed(1)}%`;
            } else {
              return `${datasetLabel}: ${value.toFixed(1)}%`;
            }
          },
        },
      },
    },
  };

  // IV Curve chart data
  const ivCurveChartData = {
    datasets: [
      {
        label: "Clean Condition",
        data: ivData.clean.map((p) => ({ x: p.voltage, y: p.current })),
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Current Condition (Soiled)",
        data: ivData.soiled.map((p) => ({ x: p.voltage, y: p.current })),
        borderColor: "#F44336",
        backgroundColor: "rgba(244, 67, 54, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Clean Power",
        data: ivData.clean.map((p) => ({ x: p.voltage, y: p.power })),
        borderColor: "#2196F3",
        backgroundColor: "rgba(33, 150, 243, 0.1)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.4,
        yAxisID: "y1",
      },
      {
        label: "Soiled Power",
        data: ivData.soiled.map((p) => ({ x: p.voltage, y: p.power })),
        borderColor: "#FF9800",
        backgroundColor: "rgba(255, 152, 0, 0.1)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const ivCurveChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          font: { size: 10 },
          padding: 10,
          color: theme.palette.text.primary,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (label.includes("Power")) {
              return `${label}: ${value.toFixed(1)} kW`;
            }
            return `${label}: ${value.toFixed(1)} A`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear" as const,
        title: {
          display: true,
          text: "Voltage (V)",
          font: { size: 11 },
          color: theme.palette.text.secondary,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
        },
        min: 0,
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Current (A)",
          font: { size: 11 },
          color: theme.palette.text.secondary,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
        },
        min: 0,
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Power (kW)",
          font: { size: 11 },
          color: theme.palette.text.secondary,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
      },
    },
  };

  // PV Curve chart data
  const pvCurveChartData = {
    datasets: [
      {
        label: "Clean Power",
        data: ivData.clean.map((p) => ({ x: p.voltage, y: p.power })),
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4,
      },
      {
        label: "Soiled Power",
        data: ivData.soiled.map((p) => ({ x: p.voltage, y: p.power })),
        borderColor: "#F44336",
        backgroundColor: "rgba(244, 67, 54, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4,
      },
      // MPP markers
      {
        label: "MPP Clean",
        data: [{ x: ivData.Vmp_clean, y: ivData.Pmax_clean }],
        borderColor: "#2E7D32",
        backgroundColor: "#4CAF50",
        pointRadius: 8,
        pointStyle: "star",
        showLine: false,
      },
      {
        label: "MPP Soiled",
        data: [{ x: ivData.Vmp_soiled, y: ivData.Pmax_soiled }],
        borderColor: "#C62828",
        backgroundColor: "#F44336",
        pointRadius: 8,
        pointStyle: "star",
        showLine: false,
      },
    ],
  };

  const pvCurveChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          font: { size: 10 },
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(1)} kW`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear" as const,
        title: {
          display: true,
          text: "Voltage (V)",
          font: { size: 11 },
        },
        min: 0,
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Power (kW)",
          font: { size: 11 },
        },
        min: 0,
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>{stringData.name} - String Performance Details</title>
      </Helmet>

      <Box
        sx={{
          ml: "-5vw",
          mt: -2,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: 1920,
            height: 1080,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            overflow: "visible",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              pt: 4,
              mt: -2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Back button, header, and day slider */}
            <Box
              sx={{
                position: "absolute",
                top: 20,
                left: 20,
                right: 20,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  color: "#1976D2",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                }}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
                {stringData.name}
              </Typography>
              <Chip
                icon={stringData.status === 1 ? <CheckCircle /> : <Warning />}
                label={stringData.status === 1 ? "Online" : "Offline"}
                color={stringData.status === 1 ? "success" : "error"}
                variant="outlined"
                size="small"
              />
              <Box
                sx={{
                  flexGrow: 1,
                  px: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Slider
                  value={selectedDay}
                  onChange={(_, value) => setSelectedDay(value as number)}
                  min={1}
                  max={maxDay}
                  step={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `Day ${value} (${formatDate(subtractDays(today, maxDay - value))})`}
                  marks={cleaningDays.map((day) => ({ value: day, label: "🧽" }))}
                  sx={{
                    color: "#329AE9",
                    flex: 1,
                    mt: 2,
                    mx: "auto",
                    "& .MuiSlider-mark": {
                      height: "8px",
                      width: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#FFA726",
                      transform: "translateY(-50%)",
                      top: "50%",
                    },
                    "& .MuiSlider-markLabel": {
                      display: "none",
                    },
                  }}
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Timeline sx={{ fontSize: 18, color: "#329AE9" }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#329AE9",
                      fontSize: "13px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Day Selector
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={formatDate(subtractDays(today, maxDay - selectedDay))}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: "13px",
                  backgroundColor: "#329AE9",
                  color: "#FFFFFF",
                  "&:hover": {
                    backgroundColor: "#2888D0",
                  },
                }}
              />
            </Box>

            <Grid container spacing={1} sx={{ height: "100%", width: "100%", mt: -1 }}>
              {/* KPI Cards Row - All in first row */}
              <Grid item xs={12} sx={{ mb: -20, mt: 10 }}>
                <Grid container spacing={1}>
                  <Grid item xs={2}>
                    <Card
                      sx={{
                        height: 108,
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        border: "1px solid #E6E8EC",
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Analytics
                            sx={{
                              color: (() => {
                                const performance = stringData.performance;
                                if (performance >= 95) return "#4CAF50"; // Green for excellent
                                if (performance >= 90) return "#8BC34A"; // Light green for good
                                if (performance >= 80) return "#FFC107"; // Yellow for moderate
                                if (performance >= 70) return "#FF9800"; // Orange for poor
                                return "#F44336"; // Red for very poor
                              })(),
                              fontSize: 20,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                            Performance (Current)
                          </Typography>
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            color: (() => {
                              const performance = stringData.performance;
                              if (performance >= 95) return "#4CAF50"; // Green for excellent
                              if (performance >= 90) return "#8BC34A"; // Light green for good
                              if (performance >= 80) return "#FFC107"; // Yellow for moderate
                              if (performance >= 70) return "#FF9800"; // Orange for poor
                              return "#F44336"; // Red for very poor
                            })(),
                          }}
                        >
                          {stringData.performance.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={2}>
                    <Card
                      sx={{
                        height: 108,
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        border: "1px solid #E6E8EC",
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <TrendingDown sx={{ color: "#FF9800", fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                            Soiling Loss (Accumulated)
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: "#FF9800" }}>
                          {stringData.soilingLoss.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={2}>
                    <Card
                      sx={{
                        height: 108,
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        border: "1px solid #E6E8EC",
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <ElectricBolt sx={{ color: "#4CAF50", fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                            Power Output (Real-time)
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: "#4CAF50" }}>
                          {stringData.powerOutput}kW
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "10px" }}>
                          Expected: {stringData.expectedPower}kW
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={2}>
                    <Card
                      sx={{
                        height: 108,
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        border: "1px solid #E6E8EC",
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <CleaningServices sx={{ color: "#2196F3", fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                            Cleaning Efficiency (Avg)
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: "#2196F3" }}>
                          {stringData.cleaningEfficiency.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={2}>
                    <Card
                      sx={{
                        height: 108,
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        border: "1px solid #E6E8EC",
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Warning sx={{ color: "#F44336", fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                            Active Faults
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: "#F44336" }}>
                          {stringData.faultCount}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={2}>
                    <Card
                      sx={{
                        height: 108,
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        border: "1px solid #E6E8EC",
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Timeline sx={{ color: "#9C27B0", fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                            Last Cleaning
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#9C27B0",
                            fontSize: "26px",
                          }}
                        >
                          {stringData.lastCleaning}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Soiling Status & Cleaning Reference Chart */}
              <Grid item xs={12} lg={4} sx={{ mb: -15, mt: -15 }}>
                <Card
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    border: "1px solid #E6E8EC",
                    height: 315,
                  }}
                >
                  <CardContent
                    sx={{
                      p: 1.5,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: "14px" }}>
                      Soiling Status & Cleaning Reference (Last 30 Days)
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                      <Line data={soilingStatusChartData} options={soilingStatusChartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* IV Curve Chart */}
              <Grid item xs={12} lg={4} sx={{ mb: -15, mt: -15 }}>
                <Card
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    border: "1px solid #E6E8EC",
                    height: 315,
                  }}
                >
                  <CardContent
                    sx={{
                      p: 1.5,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "14px" }}>
                        IV Curve (Day {selectedDay})
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip label={`Isc: ${ivData.Isc_soiled.toFixed(1)} A`} size="small" color="info" sx={{ fontSize: "10px" }} />
                        <Chip label={`Voc: ${ivData.Voc_soiled.toFixed(1)} V`} size="small" color="info" sx={{ fontSize: "10px" }} />
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                      <Line data={ivCurveChartData} options={ivCurveChartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* PV Curve Chart */}
              <Grid item xs={12} lg={4} sx={{ mb: -15, mt: -15 }}>
                <Card
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    border: "1px solid #E6E8EC",
                    height: 315,
                  }}
                >
                  <CardContent
                    sx={{
                      p: 1.5,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "14px" }}>
                        PV Curve (Day {selectedDay})
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip label={`Pmax: ${ivData.Pmax_soiled.toFixed(1)} kW`} size="small" color="warning" sx={{ fontSize: "10px" }} />
                        <Chip label={`Loss: ${((1 - ivData.Pmax_soiled / ivData.Pmax_clean) * 100).toFixed(1)}%`} size="small" color="error" sx={{ fontSize: "10px" }} />
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                      <Line data={pvCurveChartData} options={pvCurveChartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Fault History Table */}
              <Grid item xs={12} lg={6} sx={{ mb: -15, mt: -15 }}>
                <Card
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    border: "1px solid #E6E8EC",
                    height: 315,
                  }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Recent Fault History
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Add />}
                        onClick={handleOpenAddFault}
                        sx={{
                          textTransform: "none",
                          backgroundColor: "#329AE9",
                          "&:hover": {
                            backgroundColor: "#2888D0",
                          },
                        }}
                      >
                        ADD
                      </Button>
                    </Box>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Duration (min)</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...additionalFaults, ...stringData.faultHistory].map((fault) => (
                            <TableRow key={fault.id}>
                              <TableCell>{fault.type}</TableCell>
                              <TableCell>{fault.timestamp}</TableCell>
                              <TableCell>{fault.duration}</TableCell>
                              <TableCell>
                                <Chip label={fault.resolved ? "Resolved" : "Active"} color={fault.resolved ? "success" : "error"} size="small" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cleaning History Table */}
              <Grid item xs={12} lg={6} sx={{ mb: -15, mt: -15 }}>
                <Card
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    border: "1px solid #E6E8EC",
                    height: 315,
                  }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Cleaning History
                    </Typography>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Efficiency (%)</TableCell>
                            <TableCell>Performance Gain (%)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stringData.cleaningHistory.map((cleaning, index) => (
                            <TableRow key={index}>
                              <TableCell>{cleaning.date}</TableCell>
                              <TableCell>{cleaning.type}</TableCell>
                              <TableCell>{cleaning.efficiency.toFixed(1)}%</TableCell>
                              <TableCell>+{cleaning.performanceGain.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* Add Fault Dialog */}
      <Dialog open={openAddFault} onClose={handleCloseAddFault} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Fault</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField select label="Fault Type" value={newFault.type} onChange={(e) => setNewFault({ ...newFault, type: e.target.value })} fullWidth required>
              <MenuItem value="Connection Issue">Connection Issue</MenuItem>
              <MenuItem value="Performance Drop">Performance Drop</MenuItem>
              <MenuItem value="Hardware Failure">Hardware Failure</MenuItem>
              <MenuItem value="Communication Error">Communication Error</MenuItem>
              <MenuItem value="Sensor Malfunction">Sensor Malfunction</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            <TextField
              label="Duration (minutes)"
              type="number"
              value={newFault.duration}
              onChange={(e) => setNewFault({ ...newFault, duration: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={newFault.description}
              onChange={(e) => setNewFault({ ...newFault, description: e.target.value })}
              fullWidth
              placeholder="Optional: Describe the fault details"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddFault}>Cancel</Button>
          <Button
            onClick={handleAddFault}
            variant="contained"
            disabled={!newFault.type || !newFault.duration}
            sx={{
              backgroundColor: "#329AE9",
              "&:hover": {
                backgroundColor: "#2888D0",
              },
            }}
          >
            Add Fault
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StringDetail;
