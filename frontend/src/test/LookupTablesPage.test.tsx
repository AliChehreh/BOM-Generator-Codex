import { vi } from "vitest";
import LookupTablesPage from "../pages/LookupTablesPage";
import { renderWithProviders } from "./render";

vi.mock("../api/hooks", () => ({
  fetchLookupTables: vi.fn().mockResolvedValue([]),
  fetchBuildFamilies: vi.fn().mockResolvedValue([]),
  createLookupTable: vi.fn().mockResolvedValue({}),
  updateLookupTable: vi.fn().mockResolvedValue({}),
  deleteLookupTable: vi.fn().mockResolvedValue({})
}));

describe("LookupTablesPage", () => {
  it("renders heading", async () => {
    const { findByText } = renderWithProviders(<LookupTablesPage />);
    expect(await findByText("Lookup Tables")).toBeInTheDocument();
  });
});
