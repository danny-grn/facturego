import { describe, it, expect } from "vitest";
import {
  computeInvoiceTotals,
  computeLineTotal,
  groupTaxByRate,
  getEffectiveInvoiceStatus,
  round2,
} from "./invoice-utils";

describe("round2", () => {
  it("rounds floating point artifacts to 2 decimals", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(10.005)).toBeCloseTo(10.01, 2);
  });
});

describe("computeLineTotal", () => {
  it("multiplies quantity by unit price", () => {
    expect(computeLineTotal({ quantity: 3, unit_price: 10, tax_rate: 20 })).toBe(30);
  });
});

describe("computeInvoiceTotals", () => {
  it("sums subtotal, tax and total across mixed tax rates", () => {
    const totals = computeInvoiceTotals([
      { quantity: 2, unit_price: 100, tax_rate: 20 },
      { quantity: 1, unit_price: 50, tax_rate: 10 },
    ]);
    expect(totals.subtotal).toBe(250);
    expect(totals.taxTotal).toBeCloseTo(45, 2);
    expect(totals.total).toBeCloseTo(295, 2);
  });

  it("handles floating point quantities without drifting", () => {
    const totals = computeInvoiceTotals([
      { quantity: 0.1, unit_price: 10, tax_rate: 0 },
      { quantity: 0.1, unit_price: 10, tax_rate: 0 },
      { quantity: 0.1, unit_price: 10, tax_rate: 0 },
    ]);
    expect(totals.subtotal).toBeCloseTo(3, 2);
  });

  it("returns zeros for an empty list", () => {
    const totals = computeInvoiceTotals([]);
    expect(totals).toEqual({ subtotal: 0, taxTotal: 0, total: 0 });
  });
});

describe("groupTaxByRate", () => {
  it("groups bases and tax amounts by rate", () => {
    const groups = groupTaxByRate([
      { quantity: 1, unit_price: 100, tax_rate: 20 },
      { quantity: 1, unit_price: 50, tax_rate: 20 },
      { quantity: 1, unit_price: 200, tax_rate: 10 },
    ]);
    expect(groups).toEqual([
      { rate: 10, base: 200, tax: 20 },
      { rate: 20, base: 150, tax: 30 },
    ]);
  });
});

describe("getEffectiveInvoiceStatus", () => {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  it("marks a sent invoice past its due date as overdue", () => {
    expect(getEffectiveInvoiceStatus({ status: "sent", due_date: yesterday })).toBe("overdue");
  });

  it("marks a viewed invoice past its due date as overdue", () => {
    expect(getEffectiveInvoiceStatus({ status: "viewed", due_date: yesterday })).toBe("overdue");
  });

  it("leaves a sent invoice with a future due date untouched", () => {
    expect(getEffectiveInvoiceStatus({ status: "sent", due_date: tomorrow })).toBe("sent");
  });

  it("never marks draft, paid, signed or cancelled invoices as overdue", () => {
    for (const status of ["draft", "paid", "signed", "cancelled"] as const) {
      expect(getEffectiveInvoiceStatus({ status, due_date: yesterday })).toBe(status);
    }
  });

  it("handles a missing due date", () => {
    expect(getEffectiveInvoiceStatus({ status: "sent", due_date: null })).toBe("sent");
  });
});
