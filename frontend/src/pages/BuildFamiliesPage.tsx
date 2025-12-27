import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
  Tooltip
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import { createBuildFamily, deleteBuildFamily, fetchBuildFamilies, updateBuildFamily } from "../api/hooks";
import { BuildFamily } from "../api/types";

export default function BuildFamiliesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data = [], isLoading } = useQuery({ queryKey: ["buildFamilies"], queryFn: fetchBuildFamilies });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<BuildFamily | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: createBuildFamily,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["buildFamilies"] })
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; description?: string | null } }) =>
      updateBuildFamily(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["buildFamilies"] })
  });
  const deleteMutation = useMutation({
    mutationFn: deleteBuildFamily,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["buildFamilies"] })
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "name",
        headerName: "Build Family",
        flex: 1,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "primary.main",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" }
            }}
            onClick={() => navigate(`/build-families/${params.row.id}`)}
          >
            {params.value}
          </Typography>
        )
      },
      { field: "description", headerName: "Description", flex: 1.5 },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  setActive(params.row);
                  setName(params.row.name);
                  setDescription(params.row.description || "");
                  setDrawerOpen(true);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => deleteMutation.mutate(params.row.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ],
    [deleteMutation, navigate]
  );

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    if (active) {
      updateMutation.mutate({ id: active.id, payload: { name, description } });
    } else {
      createMutation.mutate({ name, description });
    }
    setDrawerOpen(false);
    setActive(null);
    setName("");
    setDescription("");
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActive(null);
    setName("");
    setDescription("");
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Build Families
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 600 }}>
            Define families that drive configuration schemas and BOM templates. Manage your product lines and their associated rules.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setActive(null);
            setName("");
            setDescription("");
            setDrawerOpen(true);
          }}
          sx={{ px: 3, py: 1.5, width: { xs: "100%", sm: "auto" } }}
        >
          New Build Family
        </Button>
      </Stack>

      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={data}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 }
            }
          }}
          sx={{
            "& .MuiDataGrid-toolbarContainer": {
              p: 2,
              borderBottom: "1px solid",
              borderColor: "divider"
            }
          }}
        />
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: 400, p: 0 } }}
      >
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {active ? "Edit Build Family" : "New Build Family"}
            </Typography>
            <IconButton onClick={handleCloseDrawer} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder="e.g. Server Rack v2"
            helperText="A unique name for this build family"
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
            placeholder="Describe the purpose and scope of this family..."
          />
        </Box>

        <Box sx={{ p: 3, mt: "auto", borderTop: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleCloseDrawer} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
              Save Changes
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
