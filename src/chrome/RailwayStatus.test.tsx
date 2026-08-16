import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RailwayStatus } from "./RailwayStatus";

describe("RailwayStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T23:59:41"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a live 24 hour clock with seconds", () => {
    render(<RailwayStatus mode="night" />);
    expect(screen.getByText("23:59:41")).toBeInTheDocument();
    expect(screen.getByText("NIGHT SERVICE")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.getByText("23:59:42")).toBeInTheDocument();
  });
});
