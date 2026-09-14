"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateLogoAction } from "@/app/dashboard/settings/actions";

export function LogoUploader({ initialLogo }: { initialLogo: string | null }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [logo, setLogo] = React.useState(initialLogo);
  const [loading, setLoading] = React.useState(false);

  async function handleFile(file: File) {
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("Utilisez une image PNG ou JPEG.");
      return;
    }
    if (file.size > 2_000_000) {
      toast.error("L'image est trop volumineuse (2 Mo max).");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setLoading(true);
    const result = await updateLogoAction(dataUrl);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setLogo(dataUrl);
    toast.success("Logo mis à jour");
    router.refresh();
  }

  async function handleRemove() {
    setLoading(true);
    const result = await updateLogoAction(null);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setLogo(null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-line bg-paper-dim/40">
        {logo ? (
          <Image src={logo} alt="Logo" width={64} height={64} unoptimized className="h-full w-full object-contain" />
        ) : (
          <ImageUp className="h-5 w-5 text-ink-300" />
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button type="button" variant="outline" size="sm" loading={loading} onClick={() => inputRef.current?.click()}>
          {logo ? "Changer le logo" : "Ajouter un logo"}
        </Button>
        {logo && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
