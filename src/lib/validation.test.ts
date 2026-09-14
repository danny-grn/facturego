import { describe, it, expect } from "vitest";
import { clientSchema, invoiceSchema, signatureSubmitSchema } from "./validation";

describe("clientSchema", () => {
  it("accepts a valid client", () => {
    expect(clientSchema.safeParse({ name: "Studio Martin", email: "contact@martin.fr" }).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(clientSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("allows an empty email since it is optional", () => {
    expect(clientSchema.safeParse({ name: "Studio Martin", email: "" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(clientSchema.safeParse({ name: "Studio Martin", email: "not-an-email" }).success).toBe(false);
  });
});

describe("invoiceSchema", () => {
  const base = {
    client_id: "client-1",
    issue_date: "2026-08-14",
    due_date: "",
    currency: "EUR",
    notes: "",
    payment_terms: "",
  };

  it("rejects an empty items array", () => {
    expect(invoiceSchema.safeParse({ ...base, items: [] }).success).toBe(false);
  });

  it("accepts a valid invoice with at least one item", () => {
    expect(
      invoiceSchema.safeParse({
        ...base,
        items: [{ description: "Prestation", quantity: 1, unit_price: 100, tax_rate: 20 }],
      }).success
    ).toBe(true);
  });

  it("rejects a non-positive quantity", () => {
    expect(
      invoiceSchema.safeParse({
        ...base,
        items: [{ description: "Prestation", quantity: 0, unit_price: 100, tax_rate: 20 }],
      }).success
    ).toBe(false);
  });

  it("rejects a tax rate outside 0-100", () => {
    expect(
      invoiceSchema.safeParse({
        ...base,
        items: [{ description: "Prestation", quantity: 1, unit_price: 100, tax_rate: 150 }],
      }).success
    ).toBe(false);
  });
});

describe("signatureSubmitSchema", () => {
  it("requires consent to be strictly true", () => {
    expect(
      signatureSubmitSchema.safeParse({
        signerName: "Jeanne Dupont",
        signerEmail: "",
        signatureDataUrl: "data:image/png;base64,abc",
        consent: false,
      }).success
    ).toBe(false);
  });

  it("accepts a valid submission", () => {
    expect(
      signatureSubmitSchema.safeParse({
        signerName: "Jeanne Dupont",
        signerEmail: "",
        signatureDataUrl: "data:image/png;base64,abc",
        consent: true,
      }).success
    ).toBe(true);
  });
});
