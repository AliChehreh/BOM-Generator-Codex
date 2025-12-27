import { useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createConfigField, deleteConfigField, fetchConfigFields, updateConfigField } from "../../api/hooks";
import { ConfigField } from "../../api/types";

const fieldTypeOptions = [
  { value: "boolean", label: "Boolean" },
  { value: "int", label: "Integer" },
  { value: "decimal", label: "Decimal" },
  { value: "text", label: "Text" },
  { value: "enum", label: "Enum" }
];

type ConfigFieldRow = ConfigField & { enum_values_text: string };

export default function ConfigFieldsTab({ buildFamilyId }: { buildFamilyId: string }) {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["configFields", buildFamilyId],
    queryFn: () => fetchConfigFields(buildFamilyId)
  });

  const [rows, setRows] = useState<ConfigFieldRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "text",
    enum_values_text: "",
    is_required: true,
    display_order: 0
  });

  useEffect(() => {
    setRows(
      data.map((item) => ({
        ...item,
        enum_values_text: item.enum_values ? item.enum_values.join(", ") : ""
      }))
    );
    setDirtyIds(new Set());
  }, [data]);

  const createMutation = useMutation({
    mutationFn: (payload: Partial<ConfigField>) => createConfigField(buildFamilyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["configFields", buildFamilyId] })
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ConfigField> }) => updateConfigField(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["configFields", buildFamilyId] })
  });
  const deleteMutation = useMutation({
    mutationFn: deleteConfigField,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["configFields", buildFamilyId] })
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "field_name", headerName: "Field Name", flex: 1, editable: true },
      {
        field: "field_type",
        headerName: "Type",
        flex: 1,
        editable: true,
        type: "singleSelect",
        valueOptions: fieldTypeOptions
      },
      {
        field: "enum_values_text",
        headerName: "Enum Values",
        flex: 1.5,
        editable: true,
        description: "Comma-separated"
      },
      {
        field: "is_required",
        headerName: "Required",
        width: 120,
        type: "boolean",
        editable: true
      },
      {
        field: "display_order",
        headerName: "Order",
        width: 120,
        type: "number",
        editable: true
      },
      {
        field: "actions",
        headerName: "",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Button color="error" onClick={() => deleteMutation.mutate(params.row.id)}>
            Delete
          </Button>
        )
      }
    ],
    [deleteMutation]
  );

  const processRowUpdate = (newRow: ConfigFieldRow) => {
    setRows((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    setDirtyIds((prev) => new Set(prev).add(newRow.id));
    return newRow;
  };

  const handleSaveChanges = () => {
    rows.forEach((row) => {
      if (dirtyIds.has(row.id)) {
        const enumValues = row.enum_values_text
          ? row.enum_values_text.split(",").map((item) => item.trim()).filter(Boolean)
          : null;
        updateMutation.mutate({
          id: row.id,
          payload: {
            field_name: row.field_name,
            field_type: row.field_type,
            enum_values: enumValues,
            is_required: row.is_required,
            display_order: row.display_order
          }
        });
      }
    });
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6">Config Fields</Typography>
          <Typography color="text.secondary">Define required fields for each build family.</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button variant="outlined" onClick={handleSaveChanges} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Save Changes
          </Button>
          <Button variant="contained" onClick={() => setDialogOpen(true)} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Add Field
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          processRowUpdate={processRowUpdate}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Config Field</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField
            label="Field Name"
            value={newField.field_name}
            onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
          />
          <TextField
            select
            label="Field Type"
            value={newField.field_type}
            onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
          >
            {fieldTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Enum Values (comma-separated)"
            value={newField.enum_values_text}
            onChange={(e) => setNewField({ ...newField, enum_values_text: e.target.value })}
          />
          <TextField
            label="Display Order"
            type="number"
            value={newField.display_order}
            onChange={(e) => setNewField({ ...newField, display_order: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!newField.field_name.trim()) {
                return;
              }
              createMutation.mutate({
                field_name: newField.field_name,
                field_type: newField.field_type as ConfigField["field_type"],
                enum_values: newField.enum_values_text
                  ? newField.enum_values_text.split(",").map((item) => item.trim()).filter(Boolean)
                  : null,
                is_required: newField.is_required,
                display_order: newField.display_order
              });
              setDialogOpen(false);
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
