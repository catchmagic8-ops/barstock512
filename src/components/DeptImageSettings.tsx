import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import bar512Tile from "@/assets/dept-bar512.jpg";
import bar512Ambient from "@/assets/ambient-bar512.jpg";
import {
  DEPT_AMBIENT_IMAGE_KEY,
  DEPT_TILE_IMAGE_KEY,
  getSettings,
  setSetting,
  uploadAppImage,
} from "@/lib/appSettings";

const KEYS = [DEPT_TILE_IMAGE_KEY, DEPT_AMBIENT_IMAGE_KEY];

export default function DeptImageSettings() {
  const qc = useQueryClient();
  const { data: settings = {} } = useQuery({
    queryKey: ["app-settings", "dept-images"],
    queryFn: () => getSettings(KEYS),
  });

  const slots = [
    {
      key: DEPT_TILE_IMAGE_KEY,
      label: "Kafelek Bar 512",
      hint: "Zdjecie na kafelku departamentu",
      fallback: bar512Tile,
    },
    {
      key: DEPT_AMBIENT_IMAGE_KEY,
      label: "Tlo strony departamentow",
      hint: "Zdjecie w tle (rozmyte)",
      fallback: bar512Ambient,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {slots.map((s) => (
        <Slot
          key={s.key}
          {...s}
          current={settings[s.key]}
          onDone={() => qc.invalidateQueries({ queryKey: ["app-settings", "dept-images"] })}
        />
      ))}
    </div>
  );
}

function Slot({
  settingKey,
  label,
  hint,
  fallback,
  current,
  onDone,
  key: _k,
  ...rest
}: any) {
  const k = rest.key ?? settingKey;
  return null;
}
