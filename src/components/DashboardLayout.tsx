import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { Avatar, Box, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import React from "react";
import ProaLogo from "../assets/Proalogo.png";
import { useThemeMode } from "../contexts/ThemeContext";
import Sidebar from "./Sidebar";
interface DashboardLayoutProps {
  children: React.ReactNode;
  skycamPageAccess?: boolean;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { mode, toggleTheme } = useThemeMode();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", md: "112px 1fr" }}
      gridTemplateRows={{
        xs: "56px calc(100vh - 56px)",
        md: "64px calc(100vh - 64px)",
      }}
      overflow="hidden"
      minHeight="100vh"
    >
      <Box component="header" gridColumn={{ xs: "1", md: "1 / span 2" }} bgcolor="background.default" height="100%">
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2, md: 3 },
            height: "100%",
            minHeight: { xs: "56px", md: "64px" },
            position: "relative"
          }}
        >
          <IconButton
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            sx={{
              display: { xs: "inline-flex", md: "none" },
              color: "text.disabled",
              position: "absolute",
              left: 16
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{
              display: { xs: "none", md: "inline-flex" },
              position: "absolute",
              left: 24
            }}
          >
            <img
              src={ProaLogo}
              alt="Proa Logo"
              style={{
                height: "48px",
                width: "auto",
                maxWidth: "135px",
                objectFit: "contain",
              }}
            />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#329AE9", // Option 1: Exact Proa logo blue
              // color: "#1976D2", // Option 2: Material-UI primary blue
              // color: "#0288D1", // Option 3: Darker professional blue
              // color: "#00A100", // Option 4: Green (Proa logo secondary)
              // color: "#2196F3", // Option 5: Light bright blue
              // color: "#3D52E8", // Option 6: Original color
              fontSize: { xs: "18px", md: "24px" },
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
              letterSpacing: "0.5px"
            }}
          >
            Soil Watch
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              position: "absolute",
              right: 24
            }}
          >
            <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: "text.primary",
                  "&:hover": {
                    backgroundColor: "action.hover"
                  }
                }}
              >
                {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
              </IconButton>
            </Tooltip>

            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#329AE9",
                cursor: "pointer",
                "&:hover": {
                  opacity: 0.8
                }
              }}
            >
              U
            </Avatar>
          </Box>
        </Toolbar>
      </Box>

      <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />

      <Box
        paddingInlineStart={{ xs: 2, md: 0 }}
        paddingInlineEnd={{ xs: 2, md: 3 }}
        sx={{
          overflowY: "auto",
        }}
      >
        <Box
          minHeight="100%"
          bgcolor="background.paper"
          padding={{ xs: 2, sm: 2, md: 3 }}
          sx={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            boxSizing: "border-box",
            overflowX: "hidden",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
