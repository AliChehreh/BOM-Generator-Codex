import { api } from "./client";
import {
  BomTemplateRow,
  BuildFamily,
  ConfigField,
  ConfigValue,
  LookupTable,
  LookupTableColumn,
  LookupTableRow,
  MarketingCategory,
  ManufacturingDepartment,
  ModelCode,
  Variable
} from "./types";

export const fetchBuildFamilies = async (): Promise<BuildFamily[]> => {
  const response = await api.get("/build-families");
  return response.data;
};

export const createBuildFamily = async (payload: { name: string; description?: string | null }) => {
  const response = await api.post("/build-families", payload);
  return response.data as BuildFamily;
};

export const updateBuildFamily = async (id: string, payload: { name: string; description?: string | null }) => {
  const response = await api.put(`/build-families/${id}`, payload);
  return response.data as BuildFamily;
};

export const deleteBuildFamily = async (id: string) => {
  await api.delete(`/build-families/${id}`);
};

export const fetchMarketingCategories = async (): Promise<MarketingCategory[]> => {
  const response = await api.get("/marketing-categories");
  return response.data;
};

export const fetchManufacturingDepartments = async (): Promise<ManufacturingDepartment[]> => {
  const response = await api.get("/manufacturing-departments");
  return response.data;
};

export const fetchModelCodes = async (buildFamilyId: string): Promise<ModelCode[]> => {
  const response = await api.get(`/build-families/${buildFamilyId}/model-codes`);
  return response.data;
};

export const createModelCode = async (buildFamilyId: string, payload: Partial<ModelCode>) => {
  const response = await api.post(`/build-families/${buildFamilyId}/model-codes`, payload);
  return response.data as ModelCode;
};

export const updateModelCode = async (id: string, payload: Partial<ModelCode>) => {
  const response = await api.put(`/model-codes/${id}`, payload);
  return response.data as ModelCode;
};

export const deleteModelCode = async (id: string) => {
  await api.delete(`/model-codes/${id}`);
};

export const fetchConfigFields = async (buildFamilyId: string): Promise<ConfigField[]> => {
  const response = await api.get(`/build-families/${buildFamilyId}/config-fields`);
  return response.data;
};

export const createConfigField = async (buildFamilyId: string, payload: Partial<ConfigField>) => {
  const response = await api.post(`/build-families/${buildFamilyId}/config-fields`, payload);
  return response.data as ConfigField;
};

export const updateConfigField = async (id: string, payload: Partial<ConfigField>) => {
  const response = await api.put(`/config-fields/${id}`, payload);
  return response.data as ConfigField;
};

export const deleteConfigField = async (id: string) => {
  await api.delete(`/config-fields/${id}`);
};

export const fetchConfigValues = async (modelCodeId: string): Promise<ConfigValue[]> => {
  const response = await api.get(`/model-codes/${modelCodeId}/config-values`);
  return response.data;
};

export const upsertConfigValues = async (modelCodeId: string, values: { field_id: string; value_json: unknown }[]) => {
  const response = await api.put(`/model-codes/${modelCodeId}/config-values`, { values });
  return response.data as ConfigValue[];
};

export const validateConfigValues = async (modelCodeId: string) => {
  const response = await api.get(`/model-codes/${modelCodeId}/config-values/validate`);
  return response.data as { missing_required_fields: { field_id: string; field_name: string }[] };
};

export const fetchLookupTables = async (scope?: string, buildFamilyId?: string): Promise<LookupTable[]> => {
  const response = await api.get("/lookup-tables", { params: { scope, build_family_id: buildFamilyId } });
  return response.data;
};

export const createLookupTable = async (payload: Partial<LookupTable>) => {
  const response = await api.post("/lookup-tables", payload);
  return response.data as LookupTable;
};

export const updateLookupTable = async (id: string, payload: Partial<LookupTable>) => {
  const response = await api.put(`/lookup-tables/${id}`, payload);
  return response.data as LookupTable;
};

export const deleteLookupTable = async (id: string) => {
  await api.delete(`/lookup-tables/${id}`);
};

export const fetchLookupRows = async (tableId: string): Promise<LookupTableRow[]> => {
  const response = await api.get(`/lookup-tables/${tableId}/rows`);
  return response.data;
};

export const upsertLookupRows = async (tableId: string, rows: { list_size: number; row_values_json: Record<string, unknown> }[]) => {
  const response = await api.put(`/lookup-tables/${tableId}/rows`, { rows });
  return response.data as LookupTableRow[];
};

export const updateLookupColumns = async (tableId: string, columns: Partial<LookupTableColumn>[]) => {
  const response = await api.put(`/lookup-tables/${tableId}/columns`, { columns });
  return response.data;
};

export const fetchLookupColumns = async (tableId: string): Promise<LookupTableColumn[]> => {
  const response = await api.get(`/lookup-tables/${tableId}/columns`);
  return response.data;
};

export const fetchVariables = async (buildFamilyId: string): Promise<Variable[]> => {
  const response = await api.get(`/build-families/${buildFamilyId}/variables`);
  return response.data;
};

export const createVariable = async (buildFamilyId: string, payload: Partial<Variable>) => {
  const response = await api.post(`/build-families/${buildFamilyId}/variables`, payload);
  return response.data as Variable;
};

export const updateVariable = async (id: string, payload: Partial<Variable>) => {
  const response = await api.put(`/variables/${id}`, payload);
  return response.data as Variable;
};

export const deleteVariable = async (id: string) => {
  await api.delete(`/variables/${id}`);
};

export const fetchBomTemplateRows = async (buildFamilyId: string): Promise<BomTemplateRow[]> => {
  const response = await api.get(`/build-families/${buildFamilyId}/bom-template-rows`);
  return response.data;
};

export const createBomTemplateRow = async (buildFamilyId: string, payload: Partial<BomTemplateRow>) => {
  const response = await api.post(`/build-families/${buildFamilyId}/bom-template-rows`, payload);
  return response.data as BomTemplateRow;
};

export const updateBomTemplateRow = async (id: string, payload: Partial<BomTemplateRow>) => {
  const response = await api.put(`/bom-template-rows/${id}`, payload);
  return response.data as BomTemplateRow;
};

export const deleteBomTemplateRow = async (id: string) => {
  await api.delete(`/bom-template-rows/${id}`);
};
