"use client";

import { useRef } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  uploadedImage: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Step2Upload({
  uploadedImage,
  handleFileUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Sube tu diseño</h2>
      <p className="text-muted-foreground mb-6">
        Arrastra o selecciona tu archivo (.png, .jpg, .svg max 10 MB)
      </p>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        {uploadedImage ? (
          <div>
            <img
              src={uploadedImage}
              alt="Preview"
              className="max-w-full max-h-64 mx-auto rounded-lg mb-4"
            />

            <button
              type="button"
              onClick={openFilePicker}
              className="text-accent hover:underline"
            >
              Cambiar imagen
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div onClick={openFilePicker} className="cursor-pointer">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />

            <p className="text-lg mb-2">Arrastra tu archivo aquí</p>
            <p className="text-sm text-muted-foreground mb-4">o</p>

            <Button type="button">
              <Upload className="w-5 h-5" />
              Seleccionar archivo
            </Button>

            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}