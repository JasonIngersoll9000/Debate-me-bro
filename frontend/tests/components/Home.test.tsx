import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "@/app/page";
import { useRouter } from "next/navigation";
import { fetchPresetTopics } from "@/lib/api";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock API
jest.mock("@/lib/api", () => ({
  fetchPresetTopics: jest.fn(),
}));

const mockPush = jest.fn();

describe("Landing Page", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (fetchPresetTopics as jest.Mock).mockResolvedValue([
      { id: "test-topic", title: "Test Topic", description: "", pro_position: "", con_position: "" },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the hero text and input", async () => {
    render(<Home />);
    expect(screen.getByText(/See Both Sides./i)).toBeInTheDocument();
    expect(screen.getByText(/For Real./i)).toBeInTheDocument();
  });

  it("fetches presets and navigates to explicit ID on click", async () => {
    render(<Home />);
    
    // Check loading state
    expect(screen.getByText("Loading presets...")).toBeInTheDocument();
    
    // Wait for the mock fetch to resolve
    const presetBtn = await screen.findByRole("button", { name: "Preset topic: Test Topic" });
    expect(presetBtn).toBeInTheDocument();

    // Click it
    fireEvent.click(presetBtn);

    // Ensure state routes specifically to the ID via router.push
    expect(mockPush).toHaveBeenCalledWith("/debates/test-topic");
  });

  it("navigates to /new for custom topic when enter is typed", async () => {
    render(<Home />);
    
    const input = screen.getByPlaceholderText("Enter any debate topic or statement...");
    fireEvent.change(input, { target: { value: "Who would win, Goku or Superman?" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Should push to the custom topic route
    expect(mockPush).toHaveBeenCalledWith("/debates/new?topic=Who%20would%20win%2C%20Goku%20or%20Superman%3F");
  });
});
