import SolarPowerIcon from "@mui/icons-material/SolarPower";
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import proaLogo from "../assets/Proalogo.png";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  skycamPageAccess?: boolean;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      to: "/soilwatch",
      label: t("soilwatch"),
      icon: <SolarPowerIcon sx={{ fontSize: "42px", color: "#E1B62D" }} />, // +10% yellow +10% bright (current)
      // icon: <SolarPowerIcon sx={{ fontSize: "42px", color: "#E5C033" }} />, // +20% yellow +15% bright
      // icon: <SolarPowerIcon sx={{ fontSize: "42px", color: "#DAA520" }} />, // Goldenrod (base)
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const drawerContent = (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      bgcolor="background.default"
      sx={{
        width: { xs: 240, md: 112 },
      }}
    >
      {/* Navigation items */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.to} disablePadding>
            <ListItemButton
              selected={location.pathname === item.to}
              onClick={() => handleNavigation(item.to)}
              sx={{
                minHeight: 48,
                justifyContent: { xs: "initial", md: "center" },
                px: { xs: 2.5, md: 1 },
                mx: { xs: 0, md: 1 },
                mb: 1,
                borderRadius: 2,
                flexDirection: { xs: "row", md: "column" },
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                  "& .MuiListItemText-primary": {
                    color: "primary.main",
                    fontWeight: "bold",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: { xs: 2, md: 0 },
                  mb: { xs: 0, md: 0.5 },
                  justifyContent: "center",
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Logo at bottom */}
      <Box display="flex" justifyContent="center" alignItems="center" p={2} mt="auto">
        <img
          src={proaLogo}
          alt="Proa Logo"
          style={{
            height: "32px",
            width: "auto",
            maxWidth: "100%",
          }}
        />
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          zIndex: theme.zIndex.drawer,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 240,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Sidebar */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          width: 112,
          flexShrink: 0,
        }}
      >
        {drawerContent}
      </Box>
    </>
  );
}
