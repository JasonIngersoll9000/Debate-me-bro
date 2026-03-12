import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "@/app/page";
import { useRouter } from "next/navigation";
import { fetchPresetTopics } from "@/lib/api";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock next/link so it renders as a plain <a> in tests
jest.mock("next/link", () => {
  const MockLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

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
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders the hero text and input", async () => {
    render(<Home />);
    expect(screen.getByText(/See Both Sides./i)).toBeInTheDocument();
    expect(screen.getByText(/For Real./i)).toBeInTheDocument();
  });

  it("redirects unauthenticated users to /auth when clicking a preset topic", async () => {
    // No token in localStorage → user is not logged in
    render(<Home />);

    const presetBtn = await screen.findByRole("button", { name: "Preset topic: Test Topic" });
    fireEvent.click(presetBtn);

    expect(mockPush).toHaveBeenCalledWith("/auth");
  });

  it("redirects unauthenticated users to /auth when submitting a custom topic", async () => {
    render(<Home />);

    const input = screen.getByPlaceholderText("Enter any debate topic or statement...");
    fireEvent.change(input, { target: { value: "Should pineapple go on pizza?" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/auth");
  });

  it("navigates authenticated users to the demo URL when clicking a preset topic", async () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user_email", "user@example.com");

    render(<Home />);

    const presetBtn = await screen.findByRole("button", { name: "Preset topic: Test Topic" });
    fireEvent.click(presetBtn);

    expect(mockPush).toHaveBeenCalledWith("/debates/test-topic?demo=true");
  });

  it("navigates to /new for custom topic when authenticated and enter is typed", async () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user_email", "user@example.com");

    render(<Home />);

    const input = screen.getByPlaceholderText("Enter any debate topic or statement...");
    fireEvent.change(input, { target: { value: "Who would win, Goku or Superman?" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/debates/new?topic=Who%20would%20win%2C%20Goku%20or%20Superman%3F");
  });
});
