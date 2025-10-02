import { CalendarToday, Event } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Slider,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";

interface DaySelectorProps {
  selectedDay: number;
  maxDay: number;
  onDayChange: (day: number) => void;
  cleaningDays?: number[];
}

const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDay,
  maxDay,
  onDayChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayInput, setDayInput] = useState<string>(selectedDay.toString());
  const [isSliding, setIsSliding] = useState<boolean>(false);

  // Helper functions for date calculations
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const subtractDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };

  // Calculate today's date and date for selected day
  const today = useMemo(() => new Date(), []);
  const selectedDate_calculated = useMemo(() => {
    return subtractDays(today, maxDay - selectedDay);
  }, [today, selectedDay, maxDay]);

  // Update internal state when selectedDay prop changes
  React.useEffect(() => {
    setDayInput(selectedDay.toString());
    setSelectedDate(selectedDate_calculated);
  }, [selectedDay, selectedDate_calculated]);

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    const day = Array.isArray(newValue) ? newValue[0] : newValue;
    onDayChange(day);
  };

  const handleSliderMouseDown = () => {
    setIsSliding(true);
  };

  const handleSliderChangeCommitted = () => {
    setIsSliding(false);
  };

  const handleDayInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDayInput(value);

    const dayNumber = parseInt(value);
    if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= maxDay) {
      onDayChange(dayNumber);
    }
  };

  const handleDayInputBlur = () => {
    // Reset to current selected day if invalid input
    setDayInput(selectedDay.toString());
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      // Calculate day based on selected date
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const day = maxDay - diffDays;

      if (day >= 1 && day <= maxDay) {
        onDayChange(day);
      }
    }
  };

  // Use maxDay as the slider's maximum range
  const currentMaxDay = maxDay;

  const formatSliderValue = (value: number) => {
    const date = subtractDays(today, maxDay - value);
    return `Day ${value} (${formatDate(date)})`;
  };

  return (
    <Box
      sx={{
        minHeight: "20px",
        maxHeight: "6.87vh",
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        pt: 1,
        borderBottom: "1px solid #E6E8EC",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        borderRadius: "8px",
      }}
    >
      {/* Left side - Time range indicators */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 120 }}
      >
        <CalendarToday sx={{ color: "#1976D2", fontSize: 16 }} />
        <Typography
          variant="body2"
          sx={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#5A5F6A",
          }}
        >
          Day {selectedDay}
        </Typography>
      </Box>

      {/* Center - Timeline slider */}
      <Box sx={{ flex: 1, px: 2, position: "relative" }}>
        <Slider
          value={selectedDay}
          onChange={handleSliderChange}
          onMouseDown={handleSliderMouseDown}
          onChangeCommitted={handleSliderChangeCommitted}
          min={1}
          max={currentMaxDay}
          step={1}
          valueLabelDisplay={isSliding ? "auto" : "off"}
          valueLabelFormat={formatSliderValue}
          marks={[]}
          sx={{
            color: "#1976D2",
            height: 4,
            "& .MuiSlider-thumb": {
              height: 16,
              width: 16,
              backgroundColor: "#1976D2",
              border: "2px solid #E3F2FD",
              "&:hover": {
                boxShadow: "0 0 0 6px rgba(33, 150, 243, 0.16)",
              },
            },
            "& .MuiSlider-track": {
              height: 4,
              borderRadius: 2,
            },
            "& .MuiSlider-rail": {
              height: 4,
              borderRadius: 2,
              backgroundColor: "#E0E0E0",
            },
            "& .MuiSlider-mark": {
              backgroundColor: "#BDBDBD",
              height: 6,
              width: 1,
              "&.MuiSlider-markActive": {
                backgroundColor: "#1976D2",
              },
            },
            "& .MuiSlider-markLabel": {
              fontSize: "9px",
              lineHeight: 1.2,
              color: "#757575",
              whiteSpace: "pre-line",
              textAlign: "center",
              transform: "translateX(-50%)",
              "&.MuiSlider-markLabelActive": {
                color: "#1976D2",
                fontWeight: 500,
              },
            },
            "& .MuiSlider-valueLabel": {
              backgroundColor: "#1976D2",
              fontSize: "11px",
              margin: "11px 4px",
              borderRadius: "4px",
              "&::before": {
                display: "none",
              },
            },
          }}
        />
      </Box>

      {/* Right side - Date input and calendar */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 200 }}
      >
        <TextField
          size="small"
          label="Day"
          type="number"
          value={dayInput}
          onChange={handleDayInputChange}
          onBlur={handleDayInputBlur}
          inputProps={{
            min: 1,
            max: maxDay,
            style: { fontSize: "12px", padding: "4px 8px" },
          }}
          sx={{
            width: 60,
            "& .MuiInputLabel-root": { fontSize: "10px" },
            "& .MuiOutlinedInput-root": { height: 28 },
          }}
        />

        <TextField
          size="small"
          label="Date"
          type="date"
          value={
            selectedDate
              ? formatDate(selectedDate)
              : formatDate(selectedDate_calculated)
          }
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            handleDateChange(newDate);
          }}
          inputProps={{
            min: formatDate(subtractDays(today, maxDay - 1)),
            max: formatDate(today),
          }}
          sx={{
            width: 120,
            "& .MuiInputLabel-root": { fontSize: "10px" },
            "& .MuiOutlinedInput-root": { height: 28 },
            "& .MuiOutlinedInput-input": {
              fontSize: "11px",
              padding: "4px 6px",
            },
          }}
        />

        <Tooltip title="Select date">
          <IconButton size="small" sx={{ color: "#1976D2" }}>
            <Event fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DaySelector;
