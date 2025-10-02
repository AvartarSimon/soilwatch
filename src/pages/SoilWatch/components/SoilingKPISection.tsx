import {
  Assessment,
  CheckCircle,
  DevicesOther,
  Widgets,
  TrendingDown,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

interface SoilingKPISectionProps {
  avgSoilingLoss: number;
  arrayPerformance: {
    dirty: number;
    cleaningGain: number;
    residualLoss: number;
  };
  proaWaspUnits: number;
  stringFaults: number;
  strings: Array<{
    id: string;
    name: string;
    performance: number;
    status: number;
  }>;
  cleaningUnitStatus: {
    online: number;
    offline: number;
    total: number;
  };
  selectedDay?: number;
}

const SoilingKPISection: React.FC<SoilingKPISectionProps> = ({
  avgSoilingLoss,
  arrayPerformance,
  proaWaspUnits,
  stringFaults,
  strings,
  cleaningUnitStatus,
  selectedDay,
}) => {
  const navigate = useNavigate();

  // Handle string click navigation
  const handleStringClick = (stringId: string) => {
    navigate(`/soilwatch/string/${stringId}`, {
      state: { selectedDay },
    });
  };
  // Sort strings by performance for top/bottom ranking
  const sortedStrings = [...strings].sort(
    (a, b) => b.performance - a.performance,
  );
  const topStrings = sortedStrings.slice(0, 5);
  const bottomStrings = sortedStrings.slice(-5).reverse();

  // Cleaning Gain Bar Chart Data
  const cleaningGainData = {
    labels: ["Array Performance", "Soiled Reference"],
    datasets: [
      {
        label: "Dirty",
        data: [arrayPerformance.dirty, arrayPerformance.dirty],
        backgroundColor: "#1565C0",
        stack: "stack1",
        barPercentage: 0.4,
        categoryPercentage: 0.7,
      },
      {
        label: "Cleaning Gain",
        data: [arrayPerformance.cleaningGain, 0],
        backgroundColor: "#4CAF50",
        stack: "stack1",
        barPercentage: 0.4,
        categoryPercentage: 0.7,
      },
      {
        label: "Residual Loss",
        data: [arrayPerformance.residualLoss, 0],
        backgroundColor: "#F44336",
        stack: "stack1",
        barPercentage: 0.4,
        categoryPercentage: 0.7,
      },
    ],
  };

  const cleaningGainOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        title: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          display: true,
          color: "#333",
          font: {
            size: 12,
            weight: "bold" as const,
          },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        stacked: true,
        min: 75,
        max: 100,
        title: {
          display: false,
        },
        grid: {
          color: "#E0E0E0",
        },
        ticks: {
          stepSize: 5,
          color: "#666",
          font: {
            size: 10,
          },
          callback: function (value: any) {
            return `${value}`;
          },
        },
      },
    },
    layout: {
      padding: {
        bottom: 1,
        left: 10,
        right: 10,
      },
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: true,
        position: "bottom" as const,
        align: "center" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "rect" as const,
          padding: 10,
          font: {
            size: 11,
          },
          color: "#000",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
          },
        },
      },
    },
  };

  // Cleaning Unit Status Donut Chart
  const donutData = {
    labels: ["Online", "Offline"],
    datasets: [
      {
        data: [cleaningUnitStatus.online, cleaningUnitStatus.offline],
        backgroundColor: ["#1565C0", "#FF9800"],
        borderColor: ["#0D47A1", "#F57C00"],
        borderWidth: 1,
        cutout: "65%",
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "rect" as const,
          padding: 15,
          font: {
            size: 11,
            weight: 500,
          },
          color: "#000",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Grid container spacing={1}>
      {/* Combined Three Metrics */}
      <Grid item xs={12} md={6} lg={2.4}>
        <Card
          sx={{
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            border: "1px solid #E6E8EC",
            height: "280px",
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
            {/* Title */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Assessment sx={{ color: "#2196F3", fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#1C1C1C",
                  fontSize: "16px",
                }}
              >
                Key Metrics
              </Typography>
            </Box>

            {/* Average Soiling Loss */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                mb: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <TrendingDown sx={{ color: "#FF9800", fontSize: 20 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "13px", fontWeight: 500 }}
                >
                  Average Soiling Loss
                </Typography>
              </Box>
              <Box sx={{ position: "absolute", bottom: 0, right: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#FF9800",
                    fontSize: "28px",
                    lineHeight: 1,
                  }}
                >
                  {avgSoilingLoss.toFixed(2)}%
                </Typography>
              </Box>
            </Box>

            {/* Divider */}
            <Box sx={{ height: "1px", backgroundColor: "#E0E0E0", my: 0.5 }} />

            {/* ProaWasp Units */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                mb: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <DevicesOther sx={{ color: "#4CAF50", fontSize: 20 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "13px", fontWeight: 500 }}
                >
                  ProaWasp Units
                </Typography>
              </Box>
              <Box sx={{ position: "absolute", bottom: 0, right: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#4CAF50",
                    fontSize: "28px",
                    lineHeight: 1,
                  }}
                >
                  {proaWaspUnits}
                </Typography>
              </Box>
            </Box>

            {/* Divider */}
            <Box sx={{ height: "1px", backgroundColor: "#E0E0E0", my: 0.5 }} />

            {/* String Faults Detected */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Warning
                  sx={{
                    color: stringFaults > 0 ? "#F44336" : "#4CAF50",
                    fontSize: 20,
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "13px", fontWeight: 500 }}
                >
                  String Faults Detected
                </Typography>
              </Box>
              <Box sx={{ position: "absolute", bottom: 0, right: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: stringFaults > 0 ? "#F44336" : "#4CAF50",
                    fontSize: "28px",
                    lineHeight: 1,
                  }}
                >
                  {stringFaults}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Rated Performance */}
      <Grid item xs={12} md={6} lg={2.4}>
        <Card
          sx={{
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            border: "1px solid #E6E8EC",
            height: "280px",
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
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.5,
                mt: -0.5,
              }}
            >
              <CheckCircle sx={{ color: "#6CBF6C", fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{ fontSize: "16px", fontWeight: 600, color: "#1C1C1C" }}
              >
                Top Rated Performance
              </Typography>
            </Box>

            {/* Top Performers List */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
            >
              {topStrings.map((string, index) => (
                <Box
                  key={`top-${string.id}`}
                  onClick={() => handleStringClick(string.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1,
                    borderRadius: "8px",
                    backgroundColor:
                      index === 0
                        ? "#D4EDD5"
                        : index === 1
                          ? "#E3F1E4"
                          : "#F5FBF5",
                    border: "1px solid #B8DDB9",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateX(4px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  {/* Rank Badge */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      minWidth: "60px",
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor:
                          index === 0
                            ? "#FFE033"
                            : index === 1
                              ? "#CCCCCC"
                              : index === 2
                                ? "#D69955"
                                : "#6CBF6C",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: index < 3 ? "#FFF" : "#FFF",
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#4A8F4A",
                      }}
                    >
                      {string.name}
                    </Typography>
                  </Box>

                  {/* Performance Value */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#336B33",
                      }}
                    >
                      {string.performance.toFixed(2)}%
                    </Typography>
                    {index === 0 && (
                      <CheckCircle sx={{ color: "#6CBF6C", fontSize: 16 }} />
                    )}
                  </Box>

                  {/* Progress Bar Background */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: `${(string.performance / 100) * 100}%`,
                      height: "3px",
                      backgroundColor: "#6CBF6C",
                      opacity: 0.3,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Bottom Rated Performance */}
      <Grid item xs={12} md={6} lg={2.4}>
        <Card
          sx={{
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            border: "1px solid #E6E8EC",
            height: "280px",
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
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.5,
                mt: -0.5,
              }}
            >
              <Warning sx={{ color: "#F66659", fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{ fontSize: "16px", fontWeight: 600, color: "#1C1C1C" }}
              >
                Bottom Rated Performance
              </Typography>
            </Box>

            {/* Bottom Performers List */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
            >
              {bottomStrings.map((string, index) => (
                <Box
                  key={`bottom-${string.id}`}
                  onClick={() => handleStringClick(string.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1,
                    borderRadius: "8px",
                    backgroundColor:
                      index === 0
                        ? "#FFB8B8"
                        : index === 1
                          ? "#FFCCCC"
                          : "#FFE6E6",
                    border: "1px solid #FFB8A4",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateX(4px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  {/* Rank Badge */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      minWidth: "60px",
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "#F66659",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#FFF",
                      }}
                    >
                      {strings.length - bottomStrings.length + index + 1}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#D14343",
                      }}
                    >
                      {string.name}
                    </Typography>
                  </Box>

                  {/* Performance Value */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#C23030",
                      }}
                    >
                      {string.performance.toFixed(2)}%
                    </Typography>
                    {index === 0 && (
                      <Warning sx={{ color: "#F66659", fontSize: 16 }} />
                    )}
                  </Box>

                  {/* Progress Bar Background */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: `${(string.performance / 100) * 100}%`,
                      height: "3px",
                      backgroundColor: "#F66659",
                      opacity: 0.3,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Average Cleaning Gain */}
      <Grid item xs={12} md={6} lg={2.4}>
        <Card
          sx={{
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            border: "1px solid #E6E8EC",
            height: "280px",
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingUp sx={{ color: "#4CAF50", fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#1C1C1C",
                  fontSize: "16px",
                }}
              >
                Average Cleaning Gain
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <Bar data={cleaningGainData} options={cleaningGainOptions} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Cleaning Unit Status */}
      <Grid item xs={12} md={6} lg={2.4}>
        <Card
          sx={{
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            border: "1px solid #E6E8EC",
            height: "280px",
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Widgets sx={{ color: "#1565C0", fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#1C1C1C",
                  fontSize: "16px",
                }}
              >
                String Units Status
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
              <Doughnut data={donutData} options={donutOptions} />

              {/* Online Arrow and Label */}
              <Box
                sx={{
                  position: "absolute",
                  top: "15%",
                  right: "5%",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 0,
                    height: 0,
                    borderLeft: "12px solid #1565C0",
                    borderTop: "2px solid transparent",
                    borderBottom: "2px solid transparent",
                  }}
                />
                <Box
                  sx={{
                    backgroundColor: "#1565C0",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Online: {cleaningUnitStatus.online}
                </Box>
              </Box>

              {/* Offline Arrow and Label */}
              <Box
                sx={{
                  position: "absolute",
                  top: "5%",
                  left: "5%",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "#FF9800",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Offline: {cleaningUnitStatus.offline}
                </Box>
                <Box
                  sx={{
                    width: 0,
                    height: 0,
                    borderRight: "12px solid #FF9800",
                    borderTop: "2px solid transparent",
                    borderBottom: "2px solid transparent",
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SoilingKPISection;
