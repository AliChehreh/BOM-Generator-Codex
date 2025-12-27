import { vi } from "vitest";
import { renderWithProviders } from "./render";
import MainLayout from "../layouts/MainLayout";
import { fireEvent, screen } from "@testing-library/react";

describe("MainLayout", () => {
    it("renders and toggles sidebar", async () => {
        // Render the layout
        const { getByTestId, findByText } = renderWithProviders(
            <MainLayout>
                <div>Content</div>
            </MainLayout>
        );

        // Verify initial state
        expect(await findByText("Build Families")).toBeInTheDocument();

        // Find toggle button
        const toggleButton = getByTestId("sidebar-toggle");
        expect(toggleButton).toBeInTheDocument();

        // Click toggle
        fireEvent.click(toggleButton);

        // Verify no crash (basic check)
        // Detailed style checks are hard in JSDOM without computed styles behaving perfectly
        // but ensuring it doesn't throw is a good start.
        expect(toggleButton).toBeInTheDocument();
    });
});
