import { useQuery } from "@tanstack/react-query";
import { useDepartment } from "@/contexts/DepartmentContext";
import bar512Img from "@/assets/ambient-bar512.jpg";
import konferencjeImg from "@/assets/ambient-konferencje.jpg";
import polskieSmakiImg from "@/assets/ambient-polskie-smaki.jpg";
import { ambientImageKey, getSettings } from "@/lib/appSettings";
import { useAppearance } from "@/lib/appearance";

export const DEPT_AMBIENT: Record<string, string> = {
  bar512: bar512Img,
  konferencje: konferencjeImg,
  polskie_smaki: polskieSmakiImg,
};

interface Props {
  /** 0 to 1 — overall image opacity */
  intensity?: number;
  /** Pixel blur applied for an atmospheric feel */
  blur?: number;
  /** Direct image src (used when not inside a DepartmentProvider). */
  src?: string;
  /** Extra dimming scrim (0-1) for text-heavy screens. */
  scrim?: number;
}

function AmbientShell({
  src,
  intensity = 0.55,
  blur = 2,
  /** Extra dimming layer strength (0-1) for screens with lots of text. */
  scrim,
}: {
  src: string;
  intensity?: number;
  blur?: number;
  scrim?: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <img
        src={src}
        alt=""
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: intensity,
          filter: `blur(${blur}px) saturate(0.9)`,
          transform: "scale(1.05)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--background) / 0.35) 0%, hsl(var(--background) / 0.78) 70%, hsl(var(--background) / 0.95) 100%)",
        }}
      />
      {scrim ? (
        <div
          className="absolute inset-0 supports-[backdrop-filter]:backdrop-blur-[2px]"
          style={{
            background: `linear-gradient(180deg, hsl(var(--background) / ${scrim}) 0%, hsl(var(--background) / ${Math.min(
              1,
              scrim + 0.06,
            )}) 55%, hsl(var(--background) / ${Math.min(1, scrim + 0.1)}) 100%)`,
          }}
        />
      ) : null}
    </div>
  );
}

/** Pulls the ambient image from the active DepartmentProvider (custom image wins). */
export function AmbientBackgroundForDepartment({ intensity, blur, scrim }: Omit<Props, "src">) {
  const { department } = useDepartment();
  const key = ambientImageKey(department);
  const { data: settings = {} } = useQuery({
    queryKey: ["app-settings", "ambient", department],
    queryFn: () => getSettings([key]),
  });
  const appearance = useAppearance();
  const src = settings[key] || DEPT_AMBIENT[department];
  if (!src) return null;
  return (
    <AmbientShell
      src={src}
      intensity={appearance.bgOpacity}
      blur={appearance.bgBlur}
      scrim={scrim}
    />
  );
}

/** Standalone variant — pass an explicit src. */
export default function AmbientBackground({ src, intensity, blur, scrim }: Props) {
  const appearance = useAppearance();
  if (!src) return null;
  return (
    <AmbientShell
      src={src}
      intensity={intensity ?? appearance.bgOpacity}
      blur={blur ?? appearance.bgBlur}
      scrim={scrim}
    />
  );
}
