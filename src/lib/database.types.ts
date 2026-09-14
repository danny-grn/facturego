// Types générés à la main pour correspondre à supabase/schema.sql.
// Si vous modifiez le schéma SQL, répercutez les changements ici.

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "paid"
  | "overdue"
  | "cancelled";

export type DocumentStatus = "draft" | "sent" | "viewed" | "signed" | "cancelled";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          company_name: string;
          legal_form: string | null;
          siret: string | null;
          vat_number: string | null;
          address: string | null;
          postal_code: string | null;
          city: string | null;
          country: string | null;
          phone: string | null;
          email: string | null;
          iban: string | null;
          bic: string | null;
          logo_data_url: string | null;
          invoice_prefix: string;
          next_invoice_seq: number;
          default_tax_rate: number;
          default_payment_terms: number;
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          postal_code: string | null;
          city: string | null;
          country: string | null;
          siret: string | null;
          vat_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          invoice_number: string;
          status: InvoiceStatus;
          issue_date: string;
          due_date: string | null;
          currency: string;
          notes: string | null;
          payment_terms: string | null;
          subtotal: number;
          tax_total: number;
          total: number;
          share_token: string;
          sent_at: string | null;
          viewed_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]> & {
          user_id: string;
          invoice_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          tax_rate: number;
          position: number;
        };
        Insert: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]> & {
          invoice_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          title: string;
          file_name: string;
          file_mime: string;
          file_data_base64: string;
          status: DocumentStatus;
          share_token: string;
          sent_at: string | null;
          viewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          user_id: string;
          title: string;
          file_name: string;
          file_data_base64: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      signatures: {
        Row: {
          id: string;
          invoice_id: string | null;
          document_id: string | null;
          signer_name: string;
          signer_email: string | null;
          signature_data_url: string;
          signature_hash: string;
          ip_address: string | null;
          user_agent: string | null;
          signed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["signatures"]["Row"]> & {
          signer_name: string;
          signature_data_url: string;
          signature_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["signatures"]["Row"]>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          invoice_id: string | null;
          document_id: string | null;
          event_type: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_log"]["Row"]> & {
          event_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_invoice_number: {
        Args: { p_user_id: string };
        Returns: string;
      };
      log_invoice_activity: {
        Args: { p_invoice_id: string; p_event_type: string; p_metadata?: Json };
        Returns: undefined;
      };
      log_document_activity: {
        Args: { p_document_id: string; p_event_type: string; p_metadata?: Json };
        Returns: undefined;
      };
      client_portal_access: {
        Args: { p_client_id: string };
        Returns: Json;
      };
      get_client_portal: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_signable_by_token: {
        Args: { p_token: string };
        Returns: Json;
      };
      submit_signature_by_token: {
        Args: {
          p_token: string;
          p_signer_name: string;
          p_signer_email: string | null;
          p_signature_data_url: string;
          p_signature_hash: string;
          p_ip_address?: string | null;
          p_user_agent?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type AppDocument = Database["public"]["Tables"]["documents"]["Row"];
export type Signature = Database["public"]["Tables"]["signatures"]["Row"];
export type ActivityLogEntry = Database["public"]["Tables"]["activity_log"]["Row"];
