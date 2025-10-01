import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import SupportIcon from "@mui/icons-material/Support";
import { Avatar, Box, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, useTheme } from "@mui/material";

import useMediaQuery from "@mui/material/useMediaQuery";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const AccountMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { t } = useTranslation();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSupport = () => {
    navigate("/support");
    handleClose();
  };

  return (
    <React.Fragment>
      <Box display="flex" alignItems="center" textAlign="center">
        <Tooltip title="Account settings">
          <IconButton onClick={handleClick} size="small" aria-controls={open ? "account-menu" : undefined} aria-haspopup="true" aria-expanded={open ? "true" : "false"} sx={{ p: 0 }}>
            {isMdUp ? (
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "#418be0ff",
                  color: "primary.contrastText",
                  fontSize: "16px",
                }}
              >
                {t("proa")}
              </Avatar>
            ) : (
              <MoreVertOutlinedIcon />
            )}
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        elevation={4}
        slotProps={{
          paper: {
            sx: () => ({
              backgroundColor: "background.default",
              width: 256,
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                backgroundColor: "background.default",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            }),
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* <ThemeSwitch isMobile onToggle={handleClose} /> */}
        <MenuItem onClick={handleSupport} sx={{ height: "48px" }}>
          <ListItemIcon>
            <SupportIcon />
          </ListItemIcon>
          {t("support")}
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
};

export default AccountMenu;
