import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createVariable, deleteVariable, fetchVariables, updateVariable } from "../../api/hooks";
import { Variable } from "../../api/types";

import { FormulaEditorDialog } from "../../components/formula-editor/FormulaEditorDialog";
import { Suggestion } from "../../components/formula-editor/useFormulaEditor";

const typeOptions = [
  { value: "boolean", label: "Boolean" },
  { value: "number", label: "Number" },
  { value: "text", label: "Text" }
];

type VariableRow = Variable;

export default function VariablesTab({ buildFamilyId }: { buildFamilyId: string }) {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["variables", buildFamilyId],
    queryFn: () => fetchVariables(buildFamilyId)
  });

  const [rows, setRows] = useState<VariableRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newVariable, setNewVariable] = useState<{
    name: string;
    type: Variable["type"];
    formula: string;
    display_order: number;
  }>({ name: "", type: "number", formula: "", display_order: 0 });
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Convert variables to suggestions
  const variableSuggestions: Suggestion[] = useMemo(() => rows.map(v => ({
    id: v.id,
    label: v.name,
    type: 'variable',
    value: v.name, // or proper interpolation syntax like @{v.name}
    description: v.type
  })), [rows]);



  useEffect(() => {
    setRows(data);
    setDirtyIds(new Set());
  }, [data]);

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Variable>) => createVariable(buildFamilyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["variables", buildFamilyId] })
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Variable> }) => updateVariable(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["variables", buildFamilyId] })
  });
  const deleteMutation = useMutation({
    mutationFn: deleteVariable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["variables", buildFamilyId] })
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "name", headerName: "Name", flex: 1, editable: true },
      {
        field: "type",
        headerName: "Type",
        width: 140,
        editable: true,
        type: "singleSelect",
        valueOptions: typeOptions
      },
      { field: "formula", headerName: "Formula", flex: 2, editable: true },
      { field: "display_order", headerName: "Order", width: 120, editable: true, type: "number" },
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

  const processRowUpdate = (newRow: VariableRow) => {
    setRows((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    setDirtyIds((prev) => new Set(prev).add(newRow.id));
    return newRow;
  };

  const handleSave = () => {
    rows.forEach((row) => {
      if (dirtyIds.has(row.id)) {
        updateMutation.mutate({
          id: row.id,
          payload: {
            name: row.name,
            type: row.type,
            formula: row.formula,
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
          <Typography variant="h6">Variables</Typography>
          <Typography color="text.secondary">Store typed formulas reusable across templates.</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button variant="outlined" onClick={handleSave} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Save Changes
          </Button>
          <Button variant="contained" onClick={() => setDialogOpen(true)} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Add Variable
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ height: 420 }}>
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
        <DialogTitle>New Variable</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            value={newVariable.name}
            onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
          />
          <TextField
            select
            label="Type"
            value={newVariable.type}
            onChange={(e) => setNewVariable({ ...newVariable, type: e.target.value as Variable["type"] })}
          >
            {typeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>Formula</Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                value={newVariable.formula}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ bgcolor: "#f5f5f5" }}
              />
              <Button variant="outlined" onClick={() => setIsEditorOpen(true)}>Edit</Button>
            </Stack>
          </Box>

          <TextField
            label="Display Order"
            type="number"
            value={newVariable.display_order}
            onChange={(e) => setNewVariable({ ...newVariable, display_order: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!newVariable.name.trim()) {
                return;
              }
              createMutation.mutate(newVariable);
              setDialogOpen(false);
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Editor Dialog */}
      <FormulaEditorDialog
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={(val) => {
          setNewVariable(prev => ({ ...prev, formula: val }));
        }}
        initialValue={newVariable.formula}
        variables={variableSuggestions}
      />
    </Box>
  );
}

