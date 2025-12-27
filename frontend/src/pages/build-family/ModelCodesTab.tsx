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

import {
  createModelCode,
  deleteModelCode,
  fetchManufacturingDepartments,
  fetchMarketingCategories,
  fetchModelCodes,
  updateModelCode
} from "../../api/hooks";
import { ManufacturingDepartment, MarketingCategory, ModelCode } from "../../api/types";

export default function ModelCodesTab({ buildFamilyId }: { buildFamilyId: string }) {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["modelCodes", buildFamilyId],
    queryFn: () => fetchModelCodes(buildFamilyId)
  });
  const { data: marketingCategories = [] } = useQuery<MarketingCategory[]>({
    queryKey: ["marketingCategories"],
    queryFn: fetchMarketingCategories
  });
  const { data: manufacturingDepartments = [] } = useQuery<ManufacturingDepartment[]>({
    queryKey: ["manufacturingDepartments"],
    queryFn: fetchManufacturingDepartments
  });

  const [rows, setRows] = useState<ModelCode[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newMarketing, setNewMarketing] = useState<string | "">("");
  const [newManufacturing, setNewManufacturing] = useState<string | "">("");

  useEffect(() => {
    setRows(data);
    setDirtyIds(new Set());
  }, [data]);

  const createMutation = useMutation({
    mutationFn: (payload: Partial<ModelCode>) => createModelCode(buildFamilyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modelCodes", buildFamilyId] })
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ModelCode> }) => updateModelCode(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modelCodes", buildFamilyId] })
  });
  const deleteMutation = useMutation({
    mutationFn: deleteModelCode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modelCodes", buildFamilyId] })
  });

  const categoryOptions = useMemo(
    () => marketingCategories.map((item) => ({ value: item.id, label: item.name })),
    [marketingCategories]
  );
  const departmentOptions = useMemo(
    () => manufacturingDepartments.map((item) => ({ value: item.id, label: item.name })),
    [manufacturingDepartments]
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "model_code", headerName: "ModelCode", flex: 1, editable: true },
      {
        field: "marketing_category_id",
        headerName: "Marketing Category",
        flex: 1,
        editable: true,
        type: "singleSelect",
        valueOptions: categoryOptions,
        valueFormatter: (value: any) =>
          categoryOptions.find((opt) => opt.value === value)?.label || ""
      },
      {
        field: "manufacturing_department_id",
        headerName: "Manufacturing Department",
        flex: 1,
        editable: true,
        type: "singleSelect",
        valueOptions: departmentOptions,
        valueFormatter: (value: any) =>
          departmentOptions.find((opt) => opt.value === value)?.label || ""
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
    [categoryOptions, departmentOptions, deleteMutation]
  );

  const processRowUpdate = (newRow: ModelCode) => {
    setRows((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    setDirtyIds((prev) => new Set(prev).add(newRow.id));
    return newRow;
  };

  const handleSaveChanges = () => {
    rows.forEach((row) => {
      if (dirtyIds.has(row.id)) {
        updateMutation.mutate({
          id: row.id,
          payload: {
            model_code: row.model_code,
            marketing_category_id: row.marketing_category_id,
            manufacturing_department_id: row.manufacturing_department_id
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
          <Typography variant="h6">ModelCodes</Typography>
          <Typography color="text.secondary">Assign independent category and department mappings.</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button variant="outlined" onClick={handleSaveChanges} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Save Changes
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setDialogOpen(true);
              setNewCode("");
              setNewMarketing("");
              setNewManufacturing("");
            }}
            sx={{ flex: { xs: 1, sm: "initial" } }}
          >
            Add ModelCode
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ height: 480 }}>
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
        <DialogTitle>New ModelCode</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField label="ModelCode" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
          <TextField
            select
            label="Marketing Category"
            value={newMarketing}
            onChange={(e) => setNewMarketing(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {marketingCategories.map((item: MarketingCategory) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Manufacturing Department"
            value={newManufacturing}
            onChange={(e) => setNewManufacturing(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {manufacturingDepartments.map((item: ManufacturingDepartment) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!newCode.trim()) {
                return;
              }
              createMutation.mutate({
                model_code: newCode,
                marketing_category_id: newMarketing || null,
                manufacturing_department_id: newManufacturing || null
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
