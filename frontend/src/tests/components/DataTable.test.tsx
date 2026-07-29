import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DataTable, Column } from "../../components/ui/DataTable";

interface TestRow {
  id: number;
  name: string;
  status: string;
  value: number;
}

const columns: Column<TestRow>[] = [
  { id: "id", header: "ID", accessor: "id", sortable: true },
  { id: "name", header: "Name", accessor: "name", sortable: true },
  { id: "status", header: "Status", accessor: "status" },
  { id: "value", header: "Value", accessor: "value", sortable: true },
];

const data: TestRow[] = [
  { id: 1, name: "Alpha", status: "Active", value: 100 },
  { id: 2, name: "Beta", status: "Inactive", value: 200 },
  { id: 3, name: "Gamma", status: "Active", value: 150 },
];

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("shows empty state when data is empty", () => {
    render(<DataTable data={[]} columns={columns} />);
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("shows custom empty message", () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="Custom empty" />);
    expect(screen.getByText("Custom empty")).toBeInTheDocument();
  });

  it("shows loading spinner when isLoading", () => {
    const { container } = render(<DataTable data={data} columns={columns} isLoading />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("filters rows by search query", async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} />);
    const searchInput = screen.getByPlaceholderText("Search...");
    await user.type(searchInput, "Alpha");
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma")).not.toBeInTheDocument();
  });

  it("shows result count when searching", async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} />);
    const searchInput = screen.getByPlaceholderText("Search...");
    // "Alpha" matches only 1 row
    await user.type(searchInput, "Alpha");
    expect(screen.getByText("1 result")).toBeInTheDocument();
  });

  it("clears search when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} />);
    const searchInput = screen.getByPlaceholderText("Search...");
    await user.type(searchInput, "Alpha");
    expect(screen.getByText("Alpha")).toBeInTheDocument();

    const clearButton = screen.getByRole("button", { name: "" });
    await user.click(clearButton);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("sorts data when sortable column header is clicked", async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} />);
    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Alpha");
    expect(rows[2]).toHaveTextContent("Beta");
    expect(rows[3]).toHaveTextContent("Gamma");
  });

  it("toggles sort direction on second click", async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} />);
    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);
    await user.click(nameHeader);
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Gamma");
    expect(rows[3]).toHaveTextContent("Alpha");
  });

  it("calls onRowClick when a row is clicked", async () => {
    const handleRowClick = vi.fn();
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} onRowClick={handleRowClick} />);
    await user.click(screen.getByText("Alpha"));
    expect(handleRowClick).toHaveBeenCalledTimes(1);
    expect(handleRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: "Alpha" })
    );
  });

  it("shows pagination section when data is present", () => {
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText(/1.*–.*3/)).toBeInTheDocument();
  });

  it("shows pagination controls when data exceeds page size", () => {
    render(<DataTable data={data} columns={columns} pageSize={2} />);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("paginates data correctly", async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} pageSize={2} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByText("Gamma")).not.toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: /next page/i });
    await user.click(nextButton);
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("renders with search disabled", () => {
    render(<DataTable data={data} columns={columns} searchable={false} />);
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("renders non-sortable columns without sort indicator interaction", () => {
    render(<DataTable data={data} columns={columns} />);
    const statusHeader = screen.getByText("Status");
    // Status column is not sortable — clicking should not change sort
    expect(statusHeader.closest("th")).not.toHaveClass("cursor-pointer");
  });
});
