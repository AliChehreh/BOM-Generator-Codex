import { vi } from "vitest";
import BuildFamiliesPage from "../pages/BuildFamiliesPage";
import { renderWithProviders } from "./render";

vi.mock("../api/hooks", () => ({
  fetchBuildFamilies: vi.fn().mockResolvedValue([]),
  createBuildFamily: vi.fn().mockResolvedValue({}),
  updateBuildFamily: vi.fn().mockResolvedValue({}),
  deleteBuildFamily: vi.fn().mockResolvedValue({})
}));

describe("BuildFamiliesPage", () => {
  it("renders heading", async () => {
    const { findByText } = renderWithProviders(<BuildFamiliesPage />);
    expect(await findByText("Build Families")).toBeInTheDocument();
  });
});
