"use client";

import * as React from "react";
import { toast } from "sonner";
import { UploadCloud, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadDocumentAction } from "@/app/dashboard/documents/actions";
import type { Client } from "@/lib/database.types";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentUploadForm({ clients }: { clients: Client[] }) {
  const [title, setTitle] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleFile(f: File | null) {
    setError(null);
    if (f && f.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (f && f.size > 8_000_000) {
      setError("Le fichier est trop volumineux (8 Mo max).");
      return;
    }
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.pdf$/i, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Le titre est requis.");
    if (!file) return setError("Sélectionnez un fichier PDF.");

    setSubmitting(true);
    try {
      const base64 = await readFileAsBase64(file);
      const result = await uploadDocumentAction({
        title: title.trim(),
        client_id: clientId,
        fileName: file.name,
        fileMime: file.type,
        fileBase64: base64,
      });
      if (result?.error) {
        toast.error(result.error);
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Importer un document</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="doc_title">Titre du document</Label>
            <Input id="doc_title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Devis n°2026-014" />
          </div>

          <div>
            <Label htmlFor="doc_client">Client (optionnel)</Label>
            <Select id="doc_client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Aucun</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Fichier PDF</Label>
            <label
              htmlFor="doc_file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong bg-paper-dim/40 px-6 py-10 text-center transition-colors hover:bg-paper-dim/70"
            >
              {file ? <FileText className="h-6 w-6 text-accent-600" /> : <UploadCloud className="h-6 w-6 text-ink-400" />}
              <span className="text-sm font-medium text-ink-800">{file ? file.name : "Cliquez pour choisir un fichier"}</span>
              <span className="text-xs text-ink-500">PDF uniquement, 8 Mo maximum</span>
              <input
                id="doc_file"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <FieldError>{error}</FieldError>

          <Button type="submit" className="w-full" loading={submitting}>
            Importer et créer le document
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
