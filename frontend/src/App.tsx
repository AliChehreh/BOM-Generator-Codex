import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import BuildFamiliesPage from "./pages/BuildFamiliesPage";
import BuildFamilyDetailPage from "./pages/BuildFamilyDetailPage";
import LookupTablesPage from "./pages/LookupTablesPage";
import LookupTableDetailPage from "./pages/LookupTableDetailPage";
import FormulaTestPage from "./pages/FormulaTestPage";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/build-families" replace />} />
        <Route path="/build-families" element={<BuildFamiliesPage />} />
        <Route path="/build-families/:id" element={<BuildFamilyDetailPage />} />
        <Route path="/lookup-tables" element={<LookupTablesPage />} />
        <Route path="/lookup-tables/:id" element={<LookupTableDetailPage />} />
        <Route path="/formula-test" element={<FormulaTestPage />} />
      </Routes>
    </MainLayout>
  );
}
