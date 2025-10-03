import { TrendingDown } from "@mui/icons-material";
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
  soilingLoss: number;
  cleaningScheduled: number;
}

interface HistoricalSoilingLossChartProps {
  dailyData: DailyData[];
  selectedDay: number;
}

const HistoricalSoilingLossChart: React.FC<HistoricalSoilingLossChartProps> = ({
  dailyData,
  selectedDay,
}) => {
  const theme = useTheme();

  // Filter data up to selected day, showing more time span
  const filteredData = dailyData.filter((d) => d.day <= selectedDay);

  const chartData = {
    labels: filteredData.map((point) => point.day.toString()),
    datasets: [
      {
        label: "Average Soiling Loss (%)",
        data: filteredData.map((point) => point.soilingLoss),
        backgroundColor: filteredData.map(
          (point) => (point.cleaningScheduled === 1 ? "#2196F3" : "#FF9800"), // Blue for cleaning days, orange for normal
        ),
        borderColor: filteredData.map((point) =>
          point.cleaningScheduled === 1 ? "#1976D2" : "#F57C00",
        ),
        borderWidth: 1,
        borderRadius: 2,
        borderSkipped: false,
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
        borderColor: "#E0E0E0",
        borderWidth: 1,
        callbacks: {
          title: function (context: any) {
            return `Day ${context[0].label}`;
          },
          label: function (context: any) {
            const value = context.parsed.y;
            const dataPoint = filteredData[context.dataIndex];
            const lines = [`Soiling Loss: ${value.toFixed(2)}%`];
            if (dataPoint.cleaningScheduled === 1) {
              lines.push("🧽 Cleaning scheduled");
            }
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
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
        title: {
          display: true,
          text: "Average Soiling Loss (%)",
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
        min: 0,
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
  };

  const maxLoss = Math.max(...filteredData.map((d) => d.soilingLoss));
  const avgLoss =
    filteredData.length > 0
      ? filteredData.reduce((sum, d) => sum + d.soilingLoss, 0) /
        filteredData.length
      : 0;
  const cleaningDays = filteredData.filter(
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
            <TrendingDown sx={{ color: "#FF9800", fontSize: 20 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#1C1C1C",
                fontSize: "16px",
              }}
            >
              Historical Soiling Loss
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#666666", fontSize: "14px", fontWeight: 400, ml: 1 }}
            >
              Day 1-{selectedDay}
            </Typography>
          </Box>

          {/* Summary Statistics - moved from bottom */}
          <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "#666666", fontSize: "10px" }}
              >
                Average Loss
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#FF9800", fontWeight: 600, fontSize: "12px" }}
              >
                {avgLoss.toFixed(2)}%
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "#666666", fontSize: "10px" }}
              >
                Peak Loss
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#F44336", fontWeight: 600, fontSize: "12px" }}
              >
                {maxLoss.toFixed(2)}%
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "#666666", fontSize: "10px" }}
              >
                Cleaning Events
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#2196F3", fontWeight: 600, fontSize: "12px" }}
              >
                {cleaningDays}
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
                    backgroundColor: "#FF9800",
                    borderRadius: 0.5,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "9px", color: "#666666" }}
                >
                  Soiling
                </Typography>
              </Box>
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
                  Cleaning
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

export default HistoricalSoilingLossChart;
