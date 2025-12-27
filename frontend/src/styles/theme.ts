import { createTheme } from "@mui/material/styles";
import type { } from "@mui/x-data-grid/themeAugmentation";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0F5132", // Deep forest green
      light: "#198754",
      dark: "#083D24",
      contrastText: "#FFFFFF"
    },
    secondary: {
      main: "#D65A31", // Burnt orange
      light: "#E67E59",
      dark: "#A84220",
      contrastText: "#FFFFFF"
    },
    background: {
      default: "#F8F9FA", // Very light gray/white
      paper: "#FFFFFF"
    },
    text: {
      primary: "#212529",
      secondary: "#6C757D"
    }
  },
  typography: {
    fontFamily: '"Inter", "Space Grotesk", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, letterSpacing: "-0.02em" },
    h5: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }
        },
        contained: {
          "&:hover": {
            boxShadow: "0 4px 12px rgba(11, 110, 79, 0.2)"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        },
        elevation1: {
          boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)"
        }
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "none",
          backgroundColor: "#FFFFFF",
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #F0F0F0"
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#F8F9FA",
            borderBottom: "1px solid #E9ECEF",
            color: "#495057",
            fontWeight: 600
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#F8F9FA"
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "none",
          boxShadow: "4px 0 24px rgba(0,0,0,0.02)"
        }
      }
    }
  }
});
