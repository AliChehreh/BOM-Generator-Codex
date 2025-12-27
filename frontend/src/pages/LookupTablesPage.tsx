import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Tooltip
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import { createLookupTable, deleteLookupTable, fetchBuildFamilies, fetchLookupTables, updateLookupTable } from "../api/hooks";
import { BuildFamily, LookupTable } from "../api/types";

const scopeOptions = [
  { value: "global", label: "Global" },
  { value: "build_family", label: "Build Family" }
];

export default function LookupTablesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({ queryKey: ["lookupTables"], queryFn: () => fetchLookupTables() });
  const { data: buildFamilies = [] } = useQuery({ queryKey: ["buildFamilies"], queryFn: fetchBuildFamilies });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<LookupTable | null>(null);
  const [form, setForm] = useState<{
    name: string;
    scope: "global" | "build_family";
    build_family_id: string;
    description: string;
  }>({ name: "", scope: "global", build_family_id: "", description: "" });

  const createMutation = useMutation({
    mutationFn: createLookupTable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lookupTables"] })
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LookupTable> }) => updateLookupTable(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lookupTables"] })
  });
  const deleteMutation = useMutation({
    mutationFn: deleteLookupTable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lookupTables"] })
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "name",
        headerName: "Lookup Table",
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
            onClick={() => navigate(`/lookup-tables/${params.row.id}`)}
          >
            {params.value}
          </Typography>
        )
      },
      { field: "scope", headerName: "Scope", width: 140 },
      {
        field: "build_family_id",
        headerName: "Build Family",
        flex: 1,
        renderCell: (params) =>
          buildFamilies.find((item: BuildFamily) => item.id === params.row.build_family_id)?.name ||
          "Global"
      },
      { field: "description", headerName: "Description", flex: 1.2 },
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
                  setForm({
                    name: params.row.name,
                    scope: params.row.scope,
                    build_family_id: params.row.build_family_id || "",
                    description: params.row.description || ""
                  });
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
    [buildFamilies, deleteMutation, navigate]
  );

  const handleSave = () => {
    if (!form.name.trim()) {
      return;
    }
    const payload = {
      name: form.name,
      scope: form.scope,
      build_family_id: form.scope === "build_family" ? form.build_family_id || null : null,
      description: form.description
    };
    if (active) {
      updateMutation.mutate({ id: active.id, payload });
    } else {
      createMutation.mutate(payload);
    }
    setDrawerOpen(false);
    setActive(null);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActive(null);
    setForm({ name: "", scope: "global", build_family_id: "", description: "" });
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
            Lookup Tables
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 600 }}>
            Maintain XLOOKUP-ready tables and bundles. Define global or family-specific lookup data.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setActive(null);
            setForm({ name: "", scope: "global", build_family_id: "", description: "" });
            setDrawerOpen(true);
          }}
          sx={{ px: 3, py: 1.5, width: { xs: "100%", sm: "auto" } }}
        >
          New Lookup Table
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
              {active ? "Edit Lookup Table" : "New Lookup Table"}
            </Typography>
            <IconButton onClick={handleCloseDrawer} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            placeholder="e.g. PowerCords"
          />
          <TextField
            select
            label="Scope"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value as "global" | "build_family" })}
            fullWidth
          >
            {scopeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {form.scope === "build_family" && (
            <TextField
              select
              label="Build Family"
              value={form.build_family_id}
              onChange={(e) => setForm({ ...form, build_family_id: e.target.value })}
              fullWidth
            >
              {buildFamilies.map((item: BuildFamily) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            multiline
            rows={4}
            fullWidth
            placeholder="Describe the content and usage of this table..."
          />
        </Box>

        <Box sx={{ p: 3, mt: "auto", borderTop: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleCloseDrawer} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={!form.name.trim()}>
              Save Changes
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
