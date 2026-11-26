import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, EmptyState, ErrorState, Field, Icon, iconNames, SidebarShell, StatusPill, Table, TabBarShell, ToastProvider, useToast } from "../src/index.js";

const Link = ({ to, children, ...rest }: { to: string; children: React.ReactNode; className?: string; "aria-current"?: "page" }) => <a href={to} {...rest}>{children}</a>;

describe("components", () => {
  it("disables a loading button and marks it busy", async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const b = screen.getByRole("button", { name: /save/i });
    expect(b).toHaveProperty("disabled", true);
    expect(b.getAttribute("aria-busy")).toBe("true");
  });

  it("links field labels, hints and errors for assistive tech", () => {
    render(<Field label="Email" hint="We never share it" error="Enter a valid email" />);
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain("-err");
    expect(screen.getByRole("alert").textContent).toBe("Enter a valid email");
  });

  it("renders states, pills and tables", () => {
    render(
      <>
        <EmptyState title="No visits yet">Your purchases show up here.</EmptyState>
        <ErrorState message="API unavailable" requestId="req-1" />
        <StatusPill tone="success">Active</StatusPill>
        <Table columns={[{ key: "n", header: "Name", render: (r: { n: string }) => r.n }]} rows={[{ n: "Alpha" }]} rowKey={(r) => r.n} />
      </>,
    );
    expect(screen.getByText("No visits yet")).toBeTruthy();
    expect(screen.getByText("Reference: req-1")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeTruthy();
  });

  it("has an icon for every name and hides icons from screen readers", () => {
    const { container } = render(<>{iconNames.map((n) => <Icon key={n} name={n} />)}</>);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(iconNames.length);
    svgs.forEach((s) => expect(s.getAttribute("aria-hidden")).toBe("true"));
  });

  it("shows toasts", async () => {
    function Push() {
      const toast = useToast();
      return <button onClick={() => toast("Saved", "success")}>go</button>;
    }
    render(<ToastProvider><Push /></ToastProvider>);
    await userEvent.click(screen.getByText("go"));
    expect(screen.getByRole("status").textContent).toContain("Saved");
  });
});

describe("shells", () => {
  it("marks the active tab in the consumer shell", () => {
    render(
      <TabBarShell brand="Brand" activePath="/rewards/abc" Link={Link} nav={[{ to: "/", label: "Home" }, { to: "/rewards", label: "Rewards" }]}>
        content
      </TabBarShell>,
    );
    const current = screen.getAllByRole("link", { current: "page" });
    expect(current.every((a) => a.textContent?.includes("Rewards"))).toBe(true);
    expect(screen.getAllByRole("link", { name: /home/i }).every((a) => !a.getAttribute("aria-current"))).toBe(true);
  });

  it("hides empty sidebar sections", () => {
    render(
      <SidebarShell brand="B" activePath="/" Link={Link} sections={[{ label: "Store", items: [{ to: "/", label: "Today" }] }, { label: "Admin", items: [] }]}>
        x
      </SidebarShell>,
    );
    expect(screen.getByText("Store")).toBeTruthy();
    expect(screen.queryByText("Admin")).toBeNull();
  });
});
