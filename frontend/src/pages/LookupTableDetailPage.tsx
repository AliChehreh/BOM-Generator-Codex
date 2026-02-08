import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridActionsCellItem } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import TableRowsIcon from "@mui/icons-material/TableRows";

import { api } from "../api/client";
import { fetchLookupColumns, fetchLookupRows, updateLookupColumns, upsertLookupRows } from "../api/hooks";
import { LookupTableColumn, LookupTableRow } from "../api/types";

interface RowData {
  id: string;
  list_size: number;
  [key: string]: unknown;
}

export default function LookupTableDetailPage() {
  const { id } = useParams();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: table } = useQuery({
    queryKey: ["lookupTable", id],
    queryFn: async () => {
      const response = await api.get(`/lookup-tables/${id}`);
      return response.data;
    },
    enabled: Boolean(id)
  });

  const { data: columns = [] } = useQuery({
    queryKey: ["lookupColumns", id],
    queryFn: () => fetchLookupColumns(id as string),
    enabled: Boolean(id)
  });
  const { data: rows = [] } = useQuery({
    queryKey: ["lookupRows", id],
    queryFn: () => fetchLookupRows(id as string),
    enabled: Boolean(id)
  });

  const [columnRows, setColumnRows] = useState<LookupTableColumn[]>([]);
  const [dataRows, setDataRows] = useState<RowData[]>([]);
  const [columnError, setColumnError] = useState<string | null>(null);

  const createTempId = () => `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const makeUniqueName = (baseName: string, rows: LookupTableColumn[]) => {
    const normalized = baseName.trim() || "NewColumn";
    const existing = new Set(rows.map((row) => row.column_name.toLowerCase()));
    if (!existing.has(normalized.toLowerCase())) {
      return normalized;
    }
    let counter = 2;
    let candidate = `${normalized}_${counter}`;
    while (existing.has(candidate.toLowerCase())) {
      counter += 1;
      candidate = `${normalized}_${counter}`;
    }
    return candidate;
  };

  useEffect(() => {
    setColumnRows(columns);
  }, [columns]);

  useEffect(() => {
    const mappedRows = rows.map((row: LookupTableRow) => ({
      id: row.id,
      list_size: Number(row.list_size),
      ...row.row_values_json
    }));
    setDataRows(mappedRows);
  }, [rows]);

  const updateColumnsMutation = useMutation({
    mutationFn: (payload: LookupTableColumn[]) => updateLookupColumns(id as string, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lookupColumns", id] })
  });

  const updateRowsMutation = useMutation({
    mutationFn: (payload: RowData[]) =>
      upsertLookupRows(
        id as string,
        payload.map((row) => ({
          list_size: Number(row.list_size),
          row_values_json: Object.fromEntries(
            Object.entries(row).filter(([key]) => key !== "id" && key !== "list_size")
          )
        }))
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lookupRows", id] })
  });

  const columnGrid = useMemo<GridColDef[]>(
    () => [
      { field: "column_name", headerName: "Column Name", flex: 1, editable: true },
      {
        field: "column_type",
        headerName: "Type",
        width: 180,
        editable: true,
        type: "singleSelect",
        valueOptions: [
          { value: "number", label: "Number" },
          { value: "boolean", label: "Boolean" },
          { value: "text", label: "Text" },
          { value: "component_bundle_marker", label: "Bundle Marker" }
        ]
      },
      { field: "display_order", headerName: "Order", width: 120, editable: true, type: "number" },
      {
        field: "actions",
        type: "actions",
        width: 80,
        getActions: (params) => [
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => {
              setColumnRows((prev) => prev.filter((row) => row.id !== params.id));
            }}
          />
        ]
      }
    ],
    []
  );

  const rowGrid = useMemo<GridColDef[]>(() => {
    const dynamicColumns = columnRows.map((col, index) => ({
      field: col.id ? `col-${col.id}` : `col-temp-${index}`,
      headerName: col.column_name || "Unnamed",
      flex: 1,
      editable: true,
      valueGetter: (_value: unknown, row: RowData) => {
        if (!col.column_name) {
          return undefined;
        }
        return row[col.column_name];
      },
      valueSetter: (value: unknown, row: RowData) => {
        if (!col.column_name) {
          return row;
        }
        return {
          ...row,
          [col.column_name]: value
        };
      }
    }));
    return [
      { field: "list_size", headerName: "List Size", width: 140, editable: true, type: "number" },
      ...dynamicColumns,
      {
        field: "actions",
        type: "actions",
        width: 80,
        getActions: (params) => [
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => {
              setDataRows((prev) => prev.filter((row) => row.id !== params.id));
            }}
          />
        ]
      }
    ];
  }, [columnRows]);

  const processColumnUpdate = (newRow: LookupTableColumn) => {
    const trimmedName = newRow.column_name.trim();
    const existing = columnRows.find((row) => row.id === newRow.id);
    if (!trimmedName) {
      setColumnError("Column name is required.");
      return existing ?? newRow;
    }
    const duplicate = columnRows.some(
      (row) =>
        row.id !== newRow.id && row.column_name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setColumnError(`Column name \"${trimmedName}\" already exists.`);
      return existing ?? newRow;
    }
    setColumnError(null);
    setColumnRows((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    return newRow;
  };

  const processRowUpdate = (newRow: RowData) => {
    setDataRows((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    return newRow;
  };

  const handleSaveColumns = () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    updateColumnsMutation.mutate(
      columnRows.map((col) => ({
        ...col,
        id: col.id && uuidRegex.test(col.id) ? col.id : undefined,
        column_name: col.column_name.trim()
      }))
    );
  };

  const handleSaveRows = () => {
    updateRowsMutation.mutate(dataRows);
  };

  const handleAddColumn = () => {
    setColumnRows((prev) => [
      ...prev,
      {
        id: createTempId(),
        column_name: makeUniqueName("NewColumn", prev),
        column_type: "text",
        display_order: prev.length + 1
      }
    ]);
    setColumnError(null);
  };

  const handleAddRow = () => {
    setDataRows((prev) => [
      ...prev,
      { id: `new-${prev.length + 1}`, list_size: 0 }
    ]);
  };

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    await api.post(`/lookup-tables/${id}/import`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    queryClient.invalidateQueries({ queryKey: ["lookupRows", id] });
  };

  if (!id) {
    return <Typography>Missing lookup table id.</Typography>;
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {table?.name || "Lookup Table"}
          </Typography>
          <Typography color="text.secondary">
            Manage columns and list size rows for XLOOKUP operations.
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ flex: { xs: 1, sm: "initial" } }}
          >
            Import Data
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".csv,.xlsx"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleImport(file);
              }
            }}
          />
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <ViewColumnIcon color="primary" />
            <Typography variant="h6">Columns</Typography>
            <Chip label={columnRows.length} size="small" />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button startIcon={<AddIcon />} onClick={handleAddColumn} sx={{ flex: { xs: 1, sm: "initial" } }}>
              Add Column
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveColumns}
              disabled={updateColumnsMutation.isPending}
              sx={{ flex: { xs: 1, sm: "initial" } }}
            >
              Save Columns
            </Button>
          </Stack>
        </Stack>

        {columnError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {columnError}
          </Typography>
        )}

        <Box sx={{ height: 300 }}>
          <DataGrid
            rows={columnRows}
            columns={columnGrid}
            getRowId={(row) => row.id || row.column_name}
            disableRowSelectionOnClick
            processRowUpdate={processColumnUpdate}
            hideFooter
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1
            }}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <TableRowsIcon color="primary" />
            <Typography variant="h6">Data Rows</Typography>
            <Chip label={dataRows.length} size="small" />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button startIcon={<AddIcon />} onClick={handleAddRow} sx={{ flex: { xs: 1, sm: "initial" } }}>
              Add Row
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveRows}
              disabled={updateRowsMutation.isPending}
              sx={{ flex: { xs: 1, sm: "initial" } }}
            >
              Save Data
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ height: 500 }}>
          <DataGrid
            rows={dataRows}
            columns={rowGrid}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            processRowUpdate={processRowUpdate}
            hideFooter
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 }
              }
            }}
            initialState={{
              sorting: { sortModel: [{ field: "list_size", sort: "asc" }] }
            }}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
