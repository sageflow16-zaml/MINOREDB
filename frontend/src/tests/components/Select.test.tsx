import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Select } from "../../components/ui/select";

const options = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
];

describe("Select", () => {
  it("renders trigger with placeholder", () => {
    render(<Select options={options} placeholder="Choose..." />);
    expect(screen.getByText("Choose...")).toBeInTheDocument();
  });

  it("renders trigger with selected value", () => {
    render(<Select options={options} value="option2" />);
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("opens dropdown and shows options on trigger click", async () => {
    const user = userEvent.setup();
    render(<Select options={options} />);
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    // Options are rendered in a portal — use waitFor/findBy
    await waitFor(() => {
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("calls onChange when an option is selected", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Select options={options} onChange={handleChange} />);
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    const option2 = await screen.findByText("Option 2");
    await user.click(option2);
    expect(handleChange).toHaveBeenCalledWith("option2");
  });

  it("renders in disabled state", () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("applies error styling when error prop is true", () => {
    const { container } = render(<Select options={options} error />);
    const trigger = container.querySelector("button[role='combobox']");
    expect(trigger).toHaveClass("border-destructive");
  });

  it("renders with custom className", () => {
    const { container } = render(<Select options={options} className="custom-select" />);
    const trigger = container.querySelector("button[role='combobox']");
    expect(trigger).toHaveClass("custom-select");
  });
});
