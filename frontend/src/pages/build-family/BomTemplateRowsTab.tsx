import { useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, IconButton } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { createBomTemplateRow, deleteBomTemplateRow, fetchBomTemplateRows, updateBomTemplateRow, fetchVariables } from "../../api/hooks";
import { BomTemplateRow } from "../../api/types";
import { FormulaEditorDialog } from "../../components/formula-editor/FormulaEditorDialog";
import { Suggestion } from "../../components/formula-editor/useFormulaEditor";

// Helper to determine parent/child relationships and visibility
interface ProcessedRow extends BomTemplateRow {
  isParent: boolean;
  isVisible: boolean;
  treeLevel: number; // calculated level for safety, though we use nest_level
}

export default function BomTemplateRowsTab({ buildFamilyId }: { buildFamilyId: string }) {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["bomTemplateRows", buildFamilyId],
    queryFn: () => fetchBomTemplateRows(buildFamilyId)
  });

  const { data: variables = [] } = useQuery({
    queryKey: ["variables", buildFamilyId],
    queryFn: () => fetchVariables(buildFamilyId)
  });

  const [rows, setRows] = useState<BomTemplateRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRow, setNewRow] = useState({ row_id: "", component_no: "", uom_code: "", nest_level: 0, display_order: 0 });

  // Tree View State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Formula Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string, field: string, value: string } | null>(null);

  useEffect(() => {
    // Sort by display_order initially
    const sorted = [...data].sort((a, b) => a.display_order - b.display_order);
    setRows(sorted);
    setDirtyIds(new Set());

    // Default expand all parents
    const allIds = new Set(data.map(r => r.id));
    setExpandedIds(allIds);
  }, [data]);

  const createMutation = useMutation({
    mutationFn: (payload: Partial<BomTemplateRow>) => createBomTemplateRow(buildFamilyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bomTemplateRows", buildFamilyId] })
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BomTemplateRow> }) => updateBomTemplateRow(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bomTemplateRows", buildFamilyId] })
  });
  const deleteMutation = useMutation({
    mutationFn: deleteBomTemplateRow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bomTemplateRows", buildFamilyId] })
  });

  const variableSuggestions: Suggestion[] = useMemo(() => variables.map(v => ({
    id: v.id,
    label: v.name,
    type: 'variable',
    value: v.name,
    description: v.type
  })), [variables]);

  // Compute Tree Properties and WBS Row IDs
  const processedRows = useMemo(() => {
    // Ensure rows are sorted by display_order for the logic to work
    const sorted = [...rows].sort((a, b) => a.display_order - b.display_order);

    const result: ProcessedRow[] = [];
    const parentStack: { level: number; id: string; expanded: boolean }[] = [];
    const counters: number[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i];
      const nextRow = sorted[i + 1];

      // WBS Calculation
      const level = row.nest_level;

      // Ensure counters array is deep enough
      while (counters.length <= level) counters.push(0);

      // Increment current level
      counters[level]++;

      // Reset deeper levels
      for (let j = level + 1; j < counters.length; j++) counters[j] = 0;

      // Generate WBS string (e.g., "1.2.1")
      // We only include counters up to the current level
      const wbsId = counters.slice(0, level + 1).join('.');

      // Determine if isParent (has children)
      const isParent = nextRow ? nextRow.nest_level > row.nest_level : false;

      // Manage stack to find current active parents
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= row.nest_level) {
        parentStack.pop();
      }

      // Determine visibility
      const isVisible = parentStack.every(p => p.expanded);

      result.push({
        ...row,
        row_id: wbsId, // Override with autogenerated WBS
        isParent,
        isVisible,
        treeLevel: row.nest_level
      });

      // Push self to stack for next iterations
      parentStack.push({ level: row.nest_level, id: row.id, expanded: expandedIds.has(row.id) });
    }
    return result;
  }, [rows, expandedIds]);

  const visibleRows = useMemo(() => processedRows.filter(r => r.isVisible), [processedRows]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenEditor = (id: string, field: string, value: string) => {
    setEditingCell({ id, field, value });
    setIsEditorOpen(true);
  };

  const handleSaveFormula = (newValue: string) => {
    if (editingCell) {
      setRows(prev => prev.map(row => {
        if (row.id === editingCell.id) {
          return { ...row, [editingCell.field]: newValue };
        }
        return row;
      }));
      setDirtyIds(prev => new Set(prev).add(editingCell.id));
    }
  };

  const renderFormulaCell = (params: GridRenderCellParams) => (
    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{params.value}</span>
      <IconButton size="small" onClick={(e) => {
        e.stopPropagation();
        handleOpenEditor(params.row.id, params.field, params.value as string || '');
      }}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Stack>
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "row_id",
        headerName: "Row ID (WBS)",
        width: 180,
        editable: false,
        sortable: false, // Disable sorting to maintain hierarchy
        renderCell: (params) => {
          const row = params.row as ProcessedRow;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: row.nest_level * 3, fontWeight: row.isParent ? 'bold' : 'normal' }}>
              {row.isParent ? (
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(row.id);
                }}>
                  {expandedIds.has(row.id) ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                </IconButton>
              ) : <Box sx={{ width: 28 }} />} {/* Spacer for non-parents */}
              {params.value}
            </Box>
          );
        }
      },
      { field: "level_type", headerName: "Level Type", width: 130, editable: true, sortable: false },
      { field: "component_no", headerName: "Component #", width: 140, editable: true, sortable: false },
      {
        field: "description",
        headerName: "Description",
        width: 200,
        editable: true,
        sortable: false,
        renderCell: (params) => {
          const row = params.row as ProcessedRow;
          return (
            <span style={{ fontWeight: row?.isParent ? 'bold' : 'normal' }}>
              {params.value}
            </span>
          );
        }
      },
      { field: "uom_code", headerName: "UOM", width: 90, editable: true, sortable: false },
      // Hidden: nest_level, display_order

      { field: "f_qty_per_product", headerName: "f_qty_per_product", width: 180, editable: true, sortable: false, renderCell: renderFormulaCell },
      { field: "f_qty", headerName: "f_qty", width: 140, editable: true, sortable: false, renderCell: renderFormulaCell },
      { field: "f_size_per_unit", headerName: "f_size_per_unit", width: 170, editable: true, sortable: false, renderCell: renderFormulaCell },
      { field: "f_qty_per_assembly", headerName: "f_qty_per_assembly", width: 190, editable: true, sortable: false, renderCell: renderFormulaCell },
      { field: "f_unit_cost", headerName: "f_unit_cost", width: 150, editable: true, sortable: false, renderCell: renderFormulaCell },
      { field: "f_price_per_product", headerName: "f_price_per_product", width: 190, editable: true, sortable: false, renderCell: renderFormulaCell },
      { field: "f_extended_price", headerName: "f_extended_price", width: 180, editable: true, sortable: false, renderCell: renderFormulaCell },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation, variables, expandedIds]
  );

  const processRowUpdate = (newRow: BomTemplateRow) => {
    setRows((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    setDirtyIds((prev) => new Set(prev).add(newRow.id));
    return newRow;
  };

  const handleSave = () => {
    // We use processedRows because it contains the up-to-date autogenerated row_ids
    // We check against the original 'rows' logic implicitly via dirtyIds or by value comparison
    // Actually, simply checking if the calculated ID differs from the stored ID is enough to warrant a save
    // for rows that haven't been otherwise modified. But sticking to dirtyIds + ID check is safest.

    processedRows.forEach((procRow) => {
      // Find original row to compare
      const originalRow = rows.find(r => r.id === procRow.id);

      const isDirty = dirtyIds.has(procRow.id);
      const idChanged = originalRow && originalRow.row_id !== procRow.row_id;

      if (isDirty || idChanged) {
        updateMutation.mutate({
          id: procRow.id,
          payload: {
            ...procRow,
            // Ensure we send the WBS ID
            row_id: procRow.row_id
          }
        });
      }
    });
  };

  const adjustNest = (delta: number) => {
    setRows((prev) =>
      prev.map((row) =>
        selectionModel.includes(row.id)
          ? { ...row, nest_level: Math.max(0, row.nest_level + delta) }
          : row
      )
    );
    setDirtyIds((prev) => {
      const next = new Set(prev);
      selectionModel.forEach((id) => next.add(String(id)));
      return next;
    });
  };

  const moveRows = (direction: number) => {
    if (selectionModel.length === 0) return;

    // Sort rows by current order
    const sorted = [...rows].sort((a, b) => a.display_order - b.display_order);

    // Create map for fast lookup
    const idToIndex = new Map(sorted.map((r, i) => [r.id, i]));

    // Get selected indices sorted
    const selectedIndices = selectionModel
      .map(id => idToIndex.get(String(id)))
      .filter(i => i !== undefined)
      .sort((a, b) => direction === -1 ? a! - b! : b! - a!) as number[];

    let newRows = [...sorted];
    let changed = false;
    const dirty = new Set(dirtyIds);

    for (const index of selectedIndices) {
      const targetIndex = index + direction;
      if (targetIndex >= 0 && targetIndex < newRows.length) {
        // Check if target is also selected (to avoid swapping within selection group effectively if moving block)
        // Simple swap logic:
        if (selectionModel.includes(newRows[targetIndex].id)) continue;

        // Swap
        const current = newRows[index];
        const target = newRows[targetIndex];

        // Swap display orders
        const tempOrder = current.display_order;
        current.display_order = target.display_order;
        target.display_order = tempOrder;

        // Swap positions in array
        newRows[index] = target;
        newRows[targetIndex] = current;

        dirty.add(current.id);
        dirty.add(target.id);
        changed = true;
      }
    }

    if (changed) {
      setRows(newRows);
      setDirtyIds(dirty);
    }
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
          <Typography variant="h6">BOM Template Rows</Typography>
          <Typography color="text.secondary">Author template rows for Phase 2 generation.</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" }, flexWrap: "wrap", gap: 1 }}>
          <Button variant="outlined" onClick={() => moveRows(-1)} disabled={selectionModel.length === 0}>
            <ArrowUpwardIcon />
          </Button>
          <Button variant="outlined" onClick={() => moveRows(1)} disabled={selectionModel.length === 0}>
            <ArrowDownwardIcon />
          </Button>
          <Button variant="outlined" onClick={() => adjustNest(1)} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Indent
          </Button>
          <Button variant="outlined" onClick={() => adjustNest(-1)} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Outdent
          </Button>
          <Button variant="outlined" onClick={handleSave} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Save Changes
          </Button>
          <Button variant="contained" onClick={() => setDialogOpen(true)} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Add Row
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={visibleRows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          processRowUpdate={processRowUpdate}
          checkboxSelection
          disableRowSelectionOnClick={false}
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={(model) => setSelectionModel(model)}
          hideFooter
          initialState={{
            pagination: { paginationModel: { pageSize: 100 } },
          }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New BOM Template Row</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>

          <TextField
            label="Component #"
            value={newRow.component_no}
            onChange={(e) => setNewRow({ ...newRow, component_no: e.target.value })}
          />
          <TextField
            label="UOM"
            value={newRow.uom_code}
            onChange={(e) => setNewRow({ ...newRow, uom_code: e.target.value })}
          />
          <TextField
            label="Nest Level"
            type="number"
            value={newRow.nest_level}
            onChange={(e) => setNewRow({ ...newRow, nest_level: Number(e.target.value) })}
          />
          <TextField
            label="Display Order"
            type="number"
            value={newRow.display_order}
            onChange={(e) => setNewRow({ ...newRow, display_order: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              // Generate a temporary unique ID to satisfy the backend uniqueness constraint.
              // The proper WBS ID will be calculated by the UI and saved later.
              const tempId = `ROW-${Date.now()}`;
              const maxOrder = Math.max(0, ...rows.map(r => r.display_order));

              const payload = {
                ...newRow,
                row_id: tempId,
                display_order: maxOrder + 10 // Ensure it goes to the end
              };

              createMutation.mutate(payload);
              setDialogOpen(false);
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Formula Editor Dialog */}
      <FormulaEditorDialog
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveFormula}
        initialValue={editingCell?.value || ''}
        variables={variableSuggestions}
      />
    </Box>
  );
}
