import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "L'email est requis").email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  companyName: z.string().trim().min(1, "Le nom de votre entreprise est requis"),
  email: z.string().trim().min(1, "L'email est requis").email("Adresse email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Le nom du client est requis"),
  email: z.string().trim().email("Adresse email invalide").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  postal_code: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  siret: z.string().trim().optional().or(z.literal("")),
  vat_number: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Description requise"),
  quantity: z.number().positive("Doit être > 0"),
  unit_price: z.number().min(0, "Doit être ≥ 0"),
  tax_rate: z.number().min(0).max(100),
});

export const invoiceSchema = z.object({
  client_id: z.string().trim().min(1, "Sélectionnez un client"),
  issue_date: z.string().trim().min(1, "Date requise"),
  due_date: z.string().trim().optional().or(z.literal("")),
  currency: z.string().trim().min(1),
  notes: z.string().trim().optional().or(z.literal("")),
  payment_terms: z.string().trim().optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Ajoutez au moins une ligne"),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const profileSchema = z.object({
  company_name: z.string().trim().min(1, "Le nom de l'entreprise est requis"),
  legal_form: z.string().trim().optional().or(z.literal("")),
  siret: z.string().trim().optional().or(z.literal("")),
  vat_number: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  postal_code: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Adresse email invalide").optional().or(z.literal("")),
  iban: z.string().trim().optional().or(z.literal("")),
  bic: z.string().trim().optional().or(z.literal("")),
  invoice_prefix: z.string().trim().min(1).max(10),
  default_tax_rate: z.number().min(0).max(100),
  default_payment_terms: z.number().int().min(0).max(365),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const documentUploadSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  client_id: z.string().trim().optional().or(z.literal("")),
});
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

export const signatureSubmitSchema = z.object({
  signerName: z.string().trim().min(1, "Votre nom est requis"),
  signerEmail: z.string().trim().email("Adresse email invalide").optional().or(z.literal("")),
  signatureDataUrl: z.string().trim().min(1, "Votre signature est requise"),
  consent: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter les conditions de signature",
  }),
});
export type SignatureSubmitInput = z.infer<typeof signatureSubmitSchema>;
