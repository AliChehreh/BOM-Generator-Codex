import { useMemo, useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchBuildFamilies } from "../api/hooks";
import BomTemplateRowsTab from "./build-family/BomTemplateRowsTab";
import ConfigFieldsTab from "./build-family/ConfigFieldsTab";
import ConfigValuesTab from "./build-family/ConfigValuesTab";
import ModelCodesTab from "./build-family/ModelCodesTab";
import VariablesTab from "./build-family/VariablesTab";

export default function BuildFamilyDetailPage() {
  const { id } = useParams();
  const [tab, setTab] = useState(0);

  const { data = [] } = useQuery({ queryKey: ["buildFamilies"], queryFn: fetchBuildFamilies });
  const buildFamily = useMemo(() => data.find((item) => item.id === id), [data, id]);

  if (!id) {
    return <Typography>Missing build family id.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {buildFamily?.name || "Build Family"}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage model codes, configuration schema, variables, and template rows.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="ModelCodes" />
        <Tab label="Config Fields" />
        <Tab label="Config Values" />
        <Tab label="Variables" />
        <Tab label="BOM Template Rows" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {tab === 0 && <ModelCodesTab buildFamilyId={id} />}
        {tab === 1 && <ConfigFieldsTab buildFamilyId={id} />}
        {tab === 2 && <ConfigValuesTab buildFamilyId={id} />}
        {tab === 3 && <VariablesTab buildFamilyId={id} />}
        {tab === 4 && <BomTemplateRowsTab buildFamilyId={id} />}
      </Box>
    </Box>
  );
}
