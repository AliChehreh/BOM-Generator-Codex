import { ReactNode, useState } from "react";
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  useMediaQuery
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TableViewIcon from "@mui/icons-material/TableView";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";

const DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 72;

const navItems = [
  { label: "Build Families", path: "/build-families", icon: <DashboardIcon /> },
  { label: "Lookup Tables", path: "/lookup-tables", icon: <TableViewIcon /> }
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentDrawerWidth = isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const drawerContent = (
    <Box sx={{ overflow: "auto", p: 1 }}>
      <List>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Tooltip
              key={item.path}
              title={isCollapsed && !isMobile ? item.label : ""}
              placement="right"
            >
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: isCollapsed && !isMobile ? "center" : "initial",
                  px: 2.5,
                  color: isActive ? "primary.main" : "text.secondary",
                  bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                  "&:hover": {
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, 0.12)
                      : alpha(theme.palette.text.primary, 0.04)
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isCollapsed && !isMobile ? 0 : 2,
                    justifyContent: "center",
                    color: isActive ? "primary.main" : "text.secondary"
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "0.95rem"
                  }}
                  sx={{ opacity: isCollapsed && !isMobile ? 0 : 1 }}
                />
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
          })
        }}
        elevation={0}
      >
        <Toolbar sx={{ height: 70 }}>
          <IconButton
            data-testid="sidebar-toggle"
            onClick={isMobile ? handleDrawerToggle : handleCollapseToggle}
            edge="start"
            sx={{ mr: 2, color: "primary.main" }}
          >
            {isMobile ? <MenuIcon /> : (isCollapsed ? <MenuIcon /> : <MenuOpenIcon />)}
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.02em",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            BOM Generator
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: currentDrawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH }
          }}
        >
          <Toolbar sx={{ height: 70 }} /> {/* Spacer for visual consistency if needed, or remove title */}
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: currentDrawerWidth,
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen
              }),
              overflowX: "hidden",
              background: "#FFFFFF",
              borderRight: "1px solid",
              borderColor: "divider",
              pt: "70px" // Match AppBar height
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${currentDrawerWidth}px)` } }}>
        <Toolbar sx={{ height: 70 }} />
        {children}
      </Box>
    </Box>
  );
}
