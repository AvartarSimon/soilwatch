import { Timeline, TrendingDown } from "@mui/icons-material";
import { Box, Card, CardContent, Typography, useTheme } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  BarElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import React from "react";
import type { DailyPerformancePoint } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface PowerLossTrendChartProps {
  dailyPerformance: DailyPerformancePoint[];
}

const PowerLossTrendChart: React.FC<PowerLossTrendChartProps> = ({ dailyPerformance }) => {
  const theme = useTheme();

  const chartData = {
    labels: dailyPerformance.map(point => point.date),
    datasets: [
      {
        label: 'Actual Power Output (MW)',
        data: dailyPerformance.map(point => point.totalPowerMW),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Maximum Possible Power (MW)',
        data: dailyPerformance.map(point => point.maxPossibleMW),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Power Loss Due to Soiling (MW)',
        data: dailyPerformance.map(point => point.soilLossMW),
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Average Soil Coverage (%)',
        data: dailyPerformance.map(point => point.avgSoilCoverage),
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          font: {
            size: 11,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        callbacks: {
          title: function(context: any) {
            return new Date(context[0].parsed.x).toLocaleDateString();
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Coverage')) {
              return `${label}: ${value.toFixed(1)}%`;
            }
            return `${label}: ${value.toFixed(1)} MW`;
          },
          afterBody: function(context: any) {
            if (context.length > 0) {
              const dataIndex = context[0].dataIndex;
              const performance = dailyPerformance[dataIndex];
              return [
                `Weather: ${performance.weatherConditions}`,
                `Irradiance: ${performance.irradiance} W/m²`,
                `Temperature: ${performance.temperature}°C`,
                performance.cleaningEvents > 0 ? `Cleaning Events: ${performance.cleaningEvents}` : ''
              ].filter(Boolean);
            }
            return [];
          }
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'MMM dd',
          },
        },
        title: {
          display: true,
          text: 'Date',
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Power (MW)',
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        min: 0,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Soil Coverage (%)',
          color: theme.palette.text.secondary,
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        min: 0,
        max: 50,
      },
    },
  };

  const totalLoss = dailyPerformance.reduce((sum, point) => sum + point.soilLossMW, 0);
  const avgLoss = dailyPerformance.length > 0 ? totalLoss / dailyPerformance.length : 0;

  return (
    <Card
      sx={{
        borderRadius: "12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        border: "1px solid #E6E8EC",
        height: 500,
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline sx={{ color: '#2196F3' }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '16px',
              }}
            >
              Power Output & Soiling Trend
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '11px' }}>
              Avg Daily Loss
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingDown sx={{ fontSize: 16, color: '#F44336' }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#F44336',
                  fontSize: '16px',
                }}
              >
                {avgLoss.toFixed(1)} MW
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: '#5A5F6A',
            fontSize: '13px',
            mb: 3
          }}
        >
          Track daily power output performance and identify soiling impact on energy generation
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Line data={chartData} options={options} />
        </Box>

        {/* Summary metrics */}
        <Box sx={{
          mt: 2,
          pt: 2,
          borderTop: '1px solid #E6E8EC',
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          justifyContent: 'space-around'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '11px' }}>
              Total Capacity Loss
            </Typography>
            <Typography variant="h6" sx={{ color: '#F44336', fontWeight: 600 }}>
              {totalLoss.toFixed(1)} MW
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '11px' }}>
              Peak Performance Day
            </Typography>
            <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 600 }}>
              {Math.max(...dailyPerformance.map(p => p.totalPowerMW)).toFixed(1)} MW
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '11px' }}>
              Cleaning Events
            </Typography>
            <Typography variant="h6" sx={{ color: '#2196F3', fontWeight: 600 }}>
              {dailyPerformance.reduce((sum, p) => sum + p.cleaningEvents, 0)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PowerLossTrendChart;