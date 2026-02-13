/**
 * Component unit tests — verify rendering, labels, and styling logic.
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/campaign/status-badge";
import { MetricCard } from "@/components/campaign/metric-card";

// ── StatusBadge ────────────────────────────────────────────

describe("StatusBadge", () => {
  it("renders formatted label from snake_case", () => {
    render(<StatusBadge status="awaiting_approval" />);
    expect(screen.getByText("Awaiting Approval")).toBeInTheDocument();
  });

  it("renders draft status", () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders completed status", () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders failed status", () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("falls back to draft styling for unknown status", () => {
    const { container } = render(<StatusBadge status="unknown_thing" />);
    const badge = container.querySelector("span");
    // Should use draft styles (amber) as fallback
    expect(badge?.className).toContain("bg-amber-100");
  });

  it("adds pulse animation for running status", () => {
    const { container } = render(<StatusBadge status="running" />);
    const dot = container.querySelector("span span");
    expect(dot?.className).toContain("animate-pulse");
  });

  it("no pulse for draft status", () => {
    const { container } = render(<StatusBadge status="draft" />);
    const dot = container.querySelector("span span");
    expect(dot?.className).not.toContain("animate-pulse");
  });
});

// ── MetricCard ─────────────────────────────────────────────

describe("MetricCard", () => {
  it("renders label and value", () => {
    render(<MetricCard label="Total Sent" value={42} />);
    expect(screen.getByText("Total Sent")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("formats large numbers with locale string", () => {
    render(<MetricCard label="Followers" value={1500000} />);
    // toLocaleString() will format as "1,500,000"
    expect(screen.getByText("1,500,000")).toBeInTheDocument();
  });

  it("renders string values as-is", () => {
    render(<MetricCard label="Status" value="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows sub text when provided", () => {
    render(<MetricCard label="Rate" value="85%" sub="+5% vs last week" />);
    expect(screen.getByText("+5% vs last week")).toBeInTheDocument();
  });

  it("does not show sub text when not provided", () => {
    const { container } = render(<MetricCard label="Count" value={10} />);
    // Only two p elements (label + value), no sub
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
  });

  it("applies accent color bar", () => {
    const { container } = render(<MetricCard label="X" value={0} accent="emerald" />);
    const bar = container.querySelector(".bg-emerald-500");
    expect(bar).toBeInTheDocument();
  });

  it("uses default bar color without accent", () => {
    const { container } = render(<MetricCard label="X" value={0} />);
    const bar = container.querySelector(".bg-stone-200");
    expect(bar).toBeInTheDocument();
  });
});
