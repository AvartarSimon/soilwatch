import { DevicesOther } from "@mui/icons-material";
import { Alert, Box, Card, CardContent, CircularProgress, Container, Grid, Typography } from "@mui/material";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DaySelector from "./components/DaySelector";
import HistoricalCleaningPerformanceChart from "./components/HistoricalCleaningPerformanceChart";
import HistoricalSoilingLossChart from "./components/HistoricalSoilingLossChart";
import SoilingKPISection from "./components/SoilingKPISection";
import { useSoilingModelData } from "./hooks/useSoilingModelData";

const SoilWatchOverview: React.FC = () => {
  const navigate = useNavigate();

  const {
    strings,
    arrayPerformance,
    dailyData,
    selectedDay,
    setSelectedDay,
    avgSoilingLoss,
    proaWaspUnits,
    stringFaults,
    loading,
    error,
    getCleaningUnitStatusForDay,
    getDailyDataUpToDay,
    getMaxDay,
    getStringPerformanceForDay,
    getArrayPerformanceForDay,
  } = useSoilingModelData();

  // Get string performance for the selected day
  const stringsForSelectedDay = useMemo(() => {
    return getStringPerformanceForDay(selectedDay);
  }, [selectedDay, getStringPerformanceForDay]);

  // Get array performance for the selected day
  const arrayPerformanceForSelectedDay = useMemo(() => {
    return getArrayPerformanceForDay(selectedDay);
  }, [selectedDay, getArrayPerformanceForDay]);

  // Get cleaning days for the day selector
  const cleaningDays = useMemo(() => {
    return dailyData.filter((d) => d.cleaningScheduled === 1).map((d) => d.day);
  }, [dailyData]);

  // Handle string click navigation
  const handleStringClick = (stringId: string) => {
    navigate(`/soilwatch/string/${stringId}`, {
      state: { selectedDay },
    });
  };

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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      {/* <Helmet>
        <title>SoilWatch Dashboard - Soiling Modeling & Performance</title>
      </Helmet> */}

      <Box
        sx={{
          width: "100%",
          p: 2,
        }}
      >
        <Grid container spacing={2}>
          {/* Day Selector */}
          <Grid item xs={12}>
            <DaySelector selectedDay={selectedDay} maxDay={getMaxDay()} onDayChange={setSelectedDay} cleaningDays={cleaningDays} />
          </Grid>

          {/* KPI Header Section - 5 Tiles */}
          <Grid item xs={12}>
            <SoilingKPISection
              avgSoilingLoss={avgSoilingLoss}
              arrayPerformance={arrayPerformanceForSelectedDay}
              proaWaspUnits={proaWaspUnits}
              stringFaults={stringFaults}
              strings={stringsForSelectedDay}
              cleaningUnitStatus={getCleaningUnitStatusForDay(selectedDay)}
              selectedDay={selectedDay}
            />
          </Grid>

          {/* Historical Soiling Loss Chart */}
          <Grid item xs={12} lg={9}>
            <HistoricalSoilingLossChart dailyData={getDailyDataUpToDay(selectedDay)} selectedDay={selectedDay} />
          </Grid>

          {/* String Performance Group 1 (Strings 1-10) */}
          <Grid item xs={12} md={6} lg={3}>
            <Card
              sx={{
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                border: "1px solid #E6E8EC",
                height: 300,
                backgroundColor: "#FFFFFF",
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
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DevicesOther sx={{ color: "#1976D2", fontSize: 20 }} />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: "#1C1C1C",
                        fontSize: "16px",
                      }}
                    >
                      Strings 1-10
                    </Typography>
                  </Box>
                  {/* Color Legend */}
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 8, backgroundColor: "hsl(0, 90%, 45%)", borderRadius: "2px" }} />
                      <Typography sx={{ fontSize: "8px", color: "#666" }}>Low</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 8, backgroundColor: "hsl(120, 70%, 30%)", borderRadius: "2px" }} />
                      <Typography sx={{ fontSize: "8px", color: "#666" }}>High</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 8, backgroundColor: "hsl(0, 0%, 50%)", borderRadius: "2px" }} />
                      <Typography sx={{ fontSize: "8px", color: "#666" }}>Offline</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 1,
                    flex: 1,
                    alignContent: "center",
                  }}
                >
                  {stringsForSelectedDay.slice(0, 10).map((string, index) => {
                    const performance = string.performance;
                    const isOffline = string.status === -1;

                    // Enhanced color mapping with more dramatic changes
                    let hue, saturation, lightness;
                    if (isOffline) {
                      // Gray color for offline units
                      hue = 0;
                      saturation = 0;
                      lightness = 50;
                    } else if (performance >= 95) {
                      hue = 120; // Pure green for excellent performance
                      saturation = 70;
                      lightness = 30;
                    } else if (performance >= 90) {
                      hue = 100; // Yellow-green for good performance
                      saturation = 65;
                      lightness = 32;
                    } else if (performance >= 80) {
                      hue = 60; // Yellow for moderate performance
                      saturation = 60;
                      lightness = 35;
                    } else if (performance >= 70) {
                      hue = 30; // Orange for poor performance
                      saturation = 85;
                      lightness = 50;
                    } else {
                      hue = 0; // Red for very poor performance
                      saturation = 90;
                      lightness = 45;
                    }

                    const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

                    return (
                      <Box
                        key={string.id}
                        onClick={() => handleStringClick(string.id)}
                        sx={{
                          backgroundColor,
                          borderRadius: "6px",
                          padding: "8px 4px",
                          textAlign: "center",
                          border: isOffline ? "2px solid #666" : "1px solid rgba(255,255,255,0.3)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: isOffline ? "0 0 12px 3px rgba(0,0,0,0.25), inset 0 0 8px rgba(0,0,0,0.15)" : "none",
                          "&:hover": {
                            transform: "scale(1.05)",
                            boxShadow: isOffline ? "0 0 16px 4px rgba(0,0,0,0.35), inset 0 0 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.15)",
                          },
                        }}
                        title={`${string.name}: ${isOffline ? "OFFLINE" : `${performance.toFixed(1)}%`} - Click for details`}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "10px",
                            fontWeight: "bold",
                            color: "white",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          Str{index + 1}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "8px",
                            color: "white",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                            mt: 0.5,
                          }}
                        >
                          {isOffline ? "OFFLINE" : `${performance.toFixed(1)}%`}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Historical Cleaning Performance Chart */}
          <Grid item xs={12} lg={9}>
            <HistoricalCleaningPerformanceChart dailyData={getDailyDataUpToDay(selectedDay)} selectedDay={selectedDay} />
          </Grid>

          {/* String Performance Group 2 (Strings 11-20) */}
          <Grid item xs={12} md={6} lg={3}>
            <Card
              sx={{
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                border: "1px solid #E6E8EC",
                height: 300,
                backgroundColor: "#FFFFFF",
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
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DevicesOther sx={{ color: "#1976D2", fontSize: 20 }} />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: "#1C1C1C",
                        fontSize: "16px",
                      }}
                    >
                      Strings 11-20
                    </Typography>
                  </Box>
                  {/* Color Legend */}
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 8, backgroundColor: "hsl(0, 90%, 45%)", borderRadius: "2px" }} />
                      <Typography sx={{ fontSize: "8px", color: "#666" }}>Low</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 8, backgroundColor: "hsl(120, 70%, 30%)", borderRadius: "2px" }} />
                      <Typography sx={{ fontSize: "8px", color: "#666" }}>High</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 8, backgroundColor: "hsl(0, 0%, 50%)", borderRadius: "2px" }} />
                      <Typography sx={{ fontSize: "8px", color: "#666" }}>Offline</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 1,
                    flex: 1,
                    alignContent: "center",
                  }}
                >
                  {stringsForSelectedDay.slice(10, 20).map((string, index) => {
                    const performance = string.performance;
                    const isOffline = string.status === -1;

                    // Create performance-based colors with enhanced precisio

                    // Enhanced color mapping with more dramatic changes
                    let hue, saturation, lightness;
                    if (isOffline) {
                      // Gray color for offline units
                      hue = 0;
                      saturation = 0;
                      lightness = 50;
                    } else if (performance >= 95) {
                      hue = 120; // Pure green for excellent performance
                      saturation = 70;
                      lightness = 30;
                    } else if (performance >= 90) {
                      hue = 100; // Yellow-green for good performance
                      saturation = 65;
                      lightness = 32;
                    } else if (performance >= 80) {
                      hue = 60; // Yellow for moderate performance
                      saturation = 60;
                      lightness = 35;
                    } else if (performance >= 70) {
                      hue = 30; // Orange for poor performance
                      saturation = 85;
                      lightness = 50;
                    } else {
                      hue = 0; // Red for very poor performance
                      saturation = 90;
                      lightness = 45;
                    }

                    const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

                    return (
                      <Box
                        key={string.id}
                        onClick={() => handleStringClick(string.id)}
                        sx={{
                          backgroundColor,
                          borderRadius: "6px",
                          padding: "8px 4px",
                          textAlign: "center",
                          border: isOffline ? "2px solid #666" : "1px solid rgba(255,255,255,0.3)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: isOffline ? "0 0 12px 3px rgba(0,0,0,0.25), inset 0 0 8px rgba(0,0,0,0.15)" : "none",
                          "&:hover": {
                            transform: "scale(1.05)",
                            boxShadow: isOffline ? "0 0 16px 4px rgba(0,0,0,0.35), inset 0 0 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.15)",
                          },
                        }}
                        title={`${string.name}: ${isOffline ? "OFFLINE" : `${performance.toFixed(1)}%`} - Click for details`}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "10px",
                            fontWeight: "bold",
                            color: "white",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          Str{index + 11}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "8px",
                            color: "white",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                            mt: 0.5,
                          }}
                        >
                          {isOffline ? "OFFLINE" : `${performance.toFixed(1)}%`}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default SoilWatchOverview;
