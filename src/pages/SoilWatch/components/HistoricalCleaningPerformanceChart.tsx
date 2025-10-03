import { Analytics } from "@mui/icons-material";
import { Box, Card, CardContent, Typography, useTheme } from "@mui/material";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import React from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface DailyData {
  day: number;
  soilingReference: number;
  cleaningGain: number;
  avgArraySoilingRatio: number;
  cleaningScheduled: number;
}

interface HistoricalCleaningPerformanceChartProps {
  dailyData: DailyData[];
  selectedDay: number;
}

const HistoricalCleaningPerformanceChart: React.FC<
  HistoricalCleaningPerformanceChartProps
> = ({ dailyData, selectedDay }) => {
  const theme = useTheme();

  // Filter data up to selected day
  const filteredData = dailyData.filter(
    (d) => d.day >= 1 && d.day <= selectedDay,
  );

  const chartData = {
    labels: filteredData.map((point) => point.day.toString()),
    datasets: [
      {
        label: "Soiling Reference",
        data: filteredData.map((point) => point.soilingReference),
        backgroundColor: "#2196F3",
        borderColor: "#1976D2",
        borderWidth: 0,
        stack: "stack1",
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: "Cleaning Gain",
        data: filteredData.map((point) => point.cleaningGain),
        backgroundColor: "#4CAF50",
        borderColor: "#388E3C",
        borderWidth: 0,
        stack: "stack1",
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#FFFFFF",
        titleColor: "#1C1C1C",
        bodyColor: "#1C1C1C",
        footerColor: "#1C1C1C",
        borderColor: "#E0E0E0",
        borderWidth: 1,
        callbacks: {
          title: function (context: any) {
            return `Day ${context[0].label}`;
          },
          label: function (context: any) {
            const value = context.parsed.y;
            const dataPoint = filteredData[context.dataIndex];
            if (context.datasetIndex === 0) {
              return `Soiling Reference: ${value.toFixed(2)}%`;
            } else {
              const lines = [`Cleaning Gain: ${value.toFixed(2)}%`];
              if (dataPoint.cleaningScheduled === 1) {
                lines.push("🧽 Cleaning performed");
              }
              lines.push(
                `Array Ratio: ${dataPoint.avgArraySoilingRatio.toFixed(2)}%`,
              );
              return lines;
            }
          },
          footer: function (context: any) {
            const dataPoint = filteredData[context[0].dataIndex];
            return `Total Performance: ${(dataPoint.soilingReference + dataPoint.cleaningGain).toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: false,
        },
        grid: {
          color: "#E0E0E0",
          drawOnChartArea: true,
        },
        ticks: {
          display: true,
          maxTicksLimit: selectedDay,
          color: "#666666",
          font: {
            size: 10,
          },
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "Average Soiling Ratio (%)",
          color: "#666666",
          font: {
            size: 12,
            weight: 500,
          },
        },
        grid: {
          color: "#E0E0E0",
          drawOnChartArea: true,
        },
        ticks: {
          color: "#666666",
          font: {
            size: 11,
          },
          callback: function (value: any) {
            return `${value}%`;
          },
        },
        min: 90,
        max: 105,
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
  };

  const avgSoilingReference =
    filteredData.length > 0
      ? filteredData.reduce((sum, d) => sum + d.soilingReference, 0) /
        filteredData.length
      : 0;
  const avgCleaningGain =
    filteredData.length > 0
      ? filteredData.reduce((sum, d) => sum + d.cleaningGain, 0) /
        filteredData.length
      : 0;
  const cleaningEvents = filteredData.filter(
    (d) => d.cleaningScheduled === 1,
  ).length;

  return (
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
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Analytics sx={{ color: "#2196F3", fontSize: 20 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#1C1C1C",
                fontSize: "16px",
              }}
            >
              Historical Cleaning Performance
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#666666", fontSize: "14px", fontWeight: 400, ml: 1 }}
            >
              Day 1-{selectedDay}
            </Typography>
          </Box>

          {/* Summary Statistics - moved from bottom */}
          <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "#666666", fontSize: "10px" }}
              >
                Avg Soiling Ref
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#2196F3", fontWeight: 600, fontSize: "12px" }}
              >
                {avgSoilingReference.toFixed(2)}%
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "#666666", fontSize: "10px" }}
              >
                Avg Cleaning Gain
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#4CAF50", fontWeight: 600, fontSize: "12px" }}
              >
                {avgCleaningGain.toFixed(2)}%
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "#666666", fontSize: "10px" }}
              >
                Total Performance
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#1976D2", fontWeight: 600, fontSize: "12px" }}
              >
                {(avgSoilingReference + avgCleaningGain).toFixed(2)}%
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "#666666", fontSize: "10px" }}
              >
                Cleaning Cycles
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#FF9800", fontWeight: 600, fontSize: "12px" }}
              >
                {cleaningEvents}
              </Typography>
            </Box>

            {/* Legend */}
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 0.5, ml: 1 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 6,
                    backgroundColor: "#2196F3",
                    borderRadius: 0.5,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "9px", color: "#666666" }}
                >
                  Soiling Ref
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 6,
                    backgroundColor: "#4CAF50",
                    borderRadius: 0.5,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "9px", color: "#666666" }}
                >
                  Cleaning Gain
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
          <Bar data={chartData} options={options} />

          {/* Day label at top right */}
          <Box
            sx={{
              position: "absolute",
              bottom: -15,
              right: 2,
              display: "flex",
              alignItems: "center",
              padding: "2px 4px",
              height: "20px",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: "10px",
                color: "#666666",
                fontWeight: 500,
              }}
            >
              Day
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HistoricalCleaningPerformanceChart;
