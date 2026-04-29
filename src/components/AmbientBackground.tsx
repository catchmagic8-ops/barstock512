import { useDepartment } from "@/contexts/DepartmentContext";
import bar512Img from "@/assets/ambient-bar512.jpg";
import konferencjeImg from "@/assets/ambient-konferencje.jpg";
import polskieSmakiImg from "@/assets/ambient-polskie-smaki.jpg";

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
}

function AmbientShell({
  src,
  intensity = 0.55,
  blur = 2,
}: {
  src: string;
  intensity?: number;
  blur?: number;
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
    </div>
  );
}

/** Pulls the ambient image from the active DepartmentProvider. */
export function AmbientBackgroundForDepartment({ intensity, blur }: Omit<Props, "src">) {
  const { department } = useDepartment();
  const src = DEPT_AMBIENT[department];
  if (!src) return null;
  return <AmbientShell src={src} intensity={intensity} blur={blur} />;
}

/** Standalone variant — pass an explicit src. */
export default function AmbientBackground({ src, intensity, blur }: Props) {
  if (!src) return null;
  return <AmbientShell src={src} intensity={intensity} blur={blur} />;
}
