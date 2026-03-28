"use client";

import { Eye } from "lucide-react";
import { DesignSettings } from "@/types/types";

interface Props {
  designSettings: DesignSettings;
  setDesignSettings: (s: DesignSettings) => void;
}

export default function Step4Editor3D({
  designSettings,
  setDesignSettings,
}: Props) {
  const update = (key: keyof DesignSettings, value: any) => {
    setDesignSettings({ ...designSettings, [key]: value });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Editor 3D</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Viewer */}
        <div className="aspect-square flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <Eye className="mx-auto mb-2" size={40} />
            <p>Vista previa 3D</p>
          </div>
        </div>

        {/* Config */}
        <div className="space-y-6">
          {/* Color */}
          <div>
            <label className="block mb-2">Color</label>
            <div className="flex gap-2">
              {["#00E5C2", "#FF2D95", "#0B213F"].map((c) => (
                <button
                  key={c}
                  onClick={() => update("color", c)}
                  className={`w-10 h-10 rounded ${
                    designSettings.color === c
                      ? "ring-2 ring-accent"
                      : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Tamaño */}
          <select
            value={designSettings.size}
            onChange={(e) => update("size", e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
            <option value="xlarge">XL</option>
          </select>

          {/* Material */}
          <select
            value={designSettings.material}
            onChange={(e) => update("material", e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="standard">Estándar</option>
            <option value="premium">Premium</option>
            <option value="deluxe">Deluxe</option>
          </select>
        </div>
      </div>
    </div>
  );
}