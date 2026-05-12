import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SuccessNotification } from "@/components/ui/SuccessNotification";
import { ErrorNotification } from "@/components/ui/ErrorNotification";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

describe("SuccessNotification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the success message", () => {
    render(<SuccessNotification message="Saved successfully" />);
    expect(screen.getByText("Saved successfully")).toBeInTheDocument();
  });

  it("auto-dismisses after 3 seconds by default", () => {
    const onDismiss = vi.fn();
    render(
      <SuccessNotification message="Saved" onDismiss={onDismiss} />
    );

    expect(screen.getByText("Saved")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("supports custom duration", () => {
    render(<SuccessNotification message="Quick" duration={1000} />);

    expect(screen.getByText("Quick")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("Quick")).not.toBeInTheDocument();
  });

  it("can be manually dismissed", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <SuccessNotification message="Dismiss me" onDismiss={onDismiss} />
    );

    const dismissButton = screen.getByLabelText("Dismiss notification");
    await user.click(dismissButton);

    expect(screen.queryByText("Dismiss me")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorNotification", () => {
  it("renders the error message", () => {
    render(<ErrorNotification message="Save failed" />);
    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });

  it("does not auto-dismiss", async () => {
    vi.useFakeTimers();
    render(<ErrorNotification message="Persistent error" />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText("Persistent error")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("can be manually dismissed", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <ErrorNotification message="Close me" onDismiss={onDismiss} />
    );

    const dismissButton = screen.getByLabelText("Dismiss error");
    await user.click(dismissButton);

    expect(screen.queryByText("Close me")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("shows retry button when onRetry is provided", () => {
    render(
      <ErrorNotification message="Failed" onRetry={() => {}} />
    );
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("does not show retry button when onRetry is not provided", () => {
    render(<ErrorNotification message="Failed" />);
    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorNotification message="Failed" onRetry={onRetry} />);

    await user.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("LoadingSpinner", () => {
  it("renders without a label", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with a label", () => {
    render(<LoadingSpinner label="Saving..." />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    // The visible label text is rendered
    expect(screen.getAllByText("Saving...").length).toBeGreaterThanOrEqual(1);
  });

  it("has accessible label", () => {
    render(<LoadingSpinner label="Loading data" />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading data"
    );
  });
});

describe("ConfirmDialog", () => {
  it("renders title and description when open", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Project"
        description="Are you sure? This cannot be undone."
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText("Delete Project")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure? This cannot be undone.")
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Delete Project"
        description="Are you sure?"
        onConfirm={() => {}}
      />
    );

    expect(screen.queryByText("Delete Project")).not.toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Confirm Deletion"
        description="Sure?"
        onConfirm={onConfirm}
        confirmLabel="Delete"
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Delete"
        description="Sure?"
        onConfirm={() => {}}
        cancelLabel="Nevermind"
      />
    );

    await user.click(screen.getByText("Nevermind"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uses custom confirm and cancel labels", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Remove"
        description="Remove this?"
        onConfirm={() => {}}
        confirmLabel="Yes, remove"
        cancelLabel="Keep it"
      />
    );

    expect(screen.getByText("Yes, remove")).toBeInTheDocument();
    expect(screen.getByText("Keep it")).toBeInTheDocument();
  });
});
