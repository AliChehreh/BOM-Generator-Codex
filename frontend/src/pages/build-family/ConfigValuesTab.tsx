import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderEditCellParams } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchConfigFields, fetchConfigValues, fetchModelCodes, upsertConfigValues, validateConfigValues } from "../../api/hooks";
import { ConfigField, ConfigValue, ModelCode } from "../../api/types";

interface ValueRow {
  id: string;
  field_id: string;
  field_name: string;
  field_type: ConfigField["field_type"];
  is_required: boolean;
  enum_values?: string[] | null;
  value: string;
}

export default function ConfigValuesTab({ buildFamilyId }: { buildFamilyId: string }) {
  const queryClient = useQueryClient();
  const { data: modelCodes = [] } = useQuery({
    queryKey: ["modelCodes", buildFamilyId],
    queryFn: () => fetchModelCodes(buildFamilyId)
  });
  const { data: fields = [] } = useQuery({
    queryKey: ["configFields", buildFamilyId],
    queryFn: () => fetchConfigFields(buildFamilyId)
  });

  const [selectedModelCodeId, setSelectedModelCodeId] = useState<string>("");
  const { data: values = [], isLoading } = useQuery({
    queryKey: ["configValues", selectedModelCodeId],
    queryFn: () => fetchConfigValues(selectedModelCodeId),
    enabled: Boolean(selectedModelCodeId)
  });

  const [rows, setRows] = useState<ValueRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (modelCodes.length && !selectedModelCodeId) {
      setSelectedModelCodeId(modelCodes[0].id);
    }
  }, [modelCodes, selectedModelCodeId]);

  useEffect(() => {
    const valueMap = values.reduce((acc: Record<string, ConfigValue>, item) => {
      acc[item.field_id] = item;
      return acc;
    }, {});

    const nextRows = fields.map((field) => {
      const match = valueMap[field.id];
      return {
        id: field.id,
        field_id: field.id,
        field_name: field.field_name,
        field_type: field.field_type,
        enum_values: field.enum_values,
        is_required: field.is_required,
        value: match?.value_json !== undefined && match?.value_json !== null ? String(match.value_json) : ""
      };
    });
    setRows(nextRows);
    setDirtyIds(new Set());
  }, [fields, values]);

  const saveMutation = useMutation({
    mutationFn: (payload: { field_id: string; value_json: unknown }[]) =>
      upsertConfigValues(selectedModelCodeId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["configValues", selectedModelCodeId] })
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "field_name", headerName: "Field", flex: 1 },
      { field: "field_type", headerName: "Type", width: 120 },
      {
        field: "value",
        headerName: "Value",
        flex: 1.2,
        editable: true,
        renderEditCell: (params: GridRenderEditCellParams) => {
          const fieldType = params.row.field_type as ValueRow["field_type"];
          const enumValues = params.row.enum_values as string[] | null | undefined;
          if (fieldType === "enum" && enumValues) {
            return (
              <TextField
                select
                fullWidth
                value={params.value ?? ""}
                onChange={(event) =>
                  params.api.setEditCellValue({
                    id: params.id,
                    field: params.field,
                    value: event.target.value
                  })
                }
              >
                {enumValues.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            );
          }
          if (fieldType === "boolean") {
            return (
              <TextField
                select
                fullWidth
                value={params.value ?? ""}
                onChange={(event) =>
                  params.api.setEditCellValue({
                    id: params.id,
                    field: params.field,
                    value: event.target.value
                  })
                }
              >
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </TextField>
            );
          }
          return (
            <TextField
              fullWidth
              value={params.value ?? ""}
              onChange={(event) =>
                params.api.setEditCellValue({
                  id: params.id,
                  field: params.field,
                  value: event.target.value
                })
              }
            />
          );
        }
      },
      {
        field: "required",
        headerName: "Required",
        width: 120,
        renderCell: (params) => (params.row.is_required ? <Chip size="small" label="Required" /> : null)
      }
    ],
    []
  );

  const processRowUpdate = (newRow: ValueRow) => {
    setRows((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    setDirtyIds((prev) => new Set(prev).add(newRow.id));
    return newRow;
  };

  const parseValue = (row: ValueRow) => {
    if (row.value === "") {
      return null;
    }
    if (row.field_type === "boolean") {
      return String(row.value).toLowerCase() === "true";
    }
    if (row.field_type === "int") {
      return parseInt(row.value, 10);
    }
    if (row.field_type === "decimal") {
      return parseFloat(row.value);
    }
    return row.value;
  };

  const handleSave = () => {
    const payload = rows
      .filter((row) => dirtyIds.has(row.id))
      .map((row) => ({ field_id: row.field_id, value_json: parseValue(row) }));
    if (payload.length) {
      saveMutation.mutate(payload);
    }
  };

  const handleValidate = async () => {
    if (!selectedModelCodeId) {
      return;
    }
    const response = await validateConfigValues(selectedModelCodeId);
    setMissingFields(response.missing_required_fields.map((item) => item.field_name));
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
          <Typography variant="h6">Config Values</Typography>
          <Typography color="text.secondary">Fill required values per ModelCode.</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button variant="outlined" onClick={handleValidate} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Validate Required
          </Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Save Values
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="ModelCode"
          value={selectedModelCodeId}
          onChange={(e) => setSelectedModelCodeId(e.target.value)}
          sx={{ minWidth: 240, width: { xs: "100%", md: "auto" } }}
        >
          {modelCodes.map((code: ModelCode) => (
            <MenuItem key={code.id} value={code.id}>
              {code.model_code}
            </MenuItem>
          ))}
        </TextField>
        {missingFields.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 1 }}>
            <Typography color="error">Missing:</Typography>
            {missingFields.map((field) => (
              <Chip key={field} size="small" color="error" label={field} />
            ))}
          </Stack>
        )}
      </Stack>

      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
        />
      </Box>
    </Box>
  );
}
