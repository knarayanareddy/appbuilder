import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
  throw new Error("kaboom");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // React prints the caught error; that is expected here.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a plain explanation instead of a blank screen", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText(/This screen could not be shown/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing has been deleted/i)).toBeInTheDocument();
    expect(screen.getByText("kaboom")).toBeInTheDocument();
  });

  it("can recover once the screen stops failing", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    let broken = true;

    function Flaky() {
      if (broken) throw new Error("kaboom");
      return <p>Recovered</p>;
    }

    render(
      <ErrorBoundary
        onReset={() => {
          broken = false;
          onReset();
        }}
      >
        <Flaky />
      </ErrorBoundary>
    );

    expect(screen.getByText(/This screen could not be shown/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Back to the lot/i }));

    expect(onReset).toHaveBeenCalled();
    expect(screen.getByText("Recovered")).toBeInTheDocument();
    expect(screen.queryByText(/This screen could not be shown/i)).not.toBeInTheDocument();
  });

  it("renders children normally when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });
});
