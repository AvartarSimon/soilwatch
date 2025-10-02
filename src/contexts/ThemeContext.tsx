import React, { createContext, useEffect, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

// Augment the palette to include a tertiary color
declare module "@mui/material/styles" {
  interface Palette {
    tertiary: Palette["primary"];
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"];
  }
}

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeContextProviderProps {
  children: React.ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeMode;
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setMode(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("theme", newMode);
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "light" ? "#3D31E8" : "#31E8C1",
        light: "#ADA8F5",
        dark: mode === "light" ? "#0016D2" : "#31E8C1",
      },
      secondary: {
        main: "#31E8C1",
        contrastText: "#ffffff",
      },
      tertiary: {
        main: "#329AE9",
        light: "#329AE9",
        dark: "#31E8C1",
      },
      error: {
        main: "#F44336",
        light: "#FFEBEE",
      },
      success: {
        main: "#4CAF50",
        light: "#E8F5E9",
      },
      warning: {
        main: "#FF9800",
        light: "#FFF3E0",
      },
      info: {
        main: "#2196F3",
        light: "#E3F2FD",
      },
      background: {
        default: mode === "light" ? "#fff" : "#000",
        paper: mode === "light" ? "#ECEFF1" : "#263238",
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeMode must be used within a ThemeContextProvider");
  }
  return context;
};
