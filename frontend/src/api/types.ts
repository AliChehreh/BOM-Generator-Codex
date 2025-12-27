export type BuildFamily = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingCategory = {
  id: string;
  name: string;
};

export type ManufacturingDepartment = {
  id: string;
  name: string;
};

export type ModelCode = {
  id: string;
  build_family_id: string;
  model_code: string;
  marketing_category_id?: string | null;
  manufacturing_department_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ConfigField = {
  id: string;
  build_family_id: string;
  field_name: string;
  field_type: "boolean" | "int" | "decimal" | "text" | "enum";
  enum_values?: string[] | null;
  is_required: boolean;
  display_order: number;
};

export type ConfigValue = {
  id: string;
  model_code_id: string;
  field_id: string;
  value_json?: unknown;
  updated_at: string;
};

export type LookupTable = {
  id: string;
  name: string;
  scope: "global" | "build_family";
  build_family_id?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

export type LookupTableColumn = {
  id?: string;
  lookup_table_id?: string;
  column_name: string;
  column_type: "number" | "boolean" | "text" | "component_bundle_marker";
  display_order: number;
};

export type LookupTableRow = {
  id: string;
  lookup_table_id: string;
  list_size: number;
  row_values_json: Record<string, unknown>;
  updated_at: string;
};

export type Variable = {
  id: string;
  build_family_id: string;
  name: string;
  type: "boolean" | "number" | "text";
  formula: string;
  display_order: number;
  updated_at: string;
};

export type BomTemplateRow = {
  id: string;
  build_family_id: string;
  row_id: string;
  level_type?: string | null;
  component_no?: string | null;
  description?: string | null;
  uom_code?: string | null;
  nest_level: number;
  display_order: number;
  f_qty_per_product?: string | null;
  f_qty?: string | null;
  f_size_per_unit?: string | null;
  f_qty_per_assembly?: string | null;
  f_unit_cost?: string | null;
  f_price_per_product?: string | null;
  f_extended_price?: string | null;
};
