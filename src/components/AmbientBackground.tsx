import { useDepartment } from "@/contexts/DepartmentContext";
import bar512Asset from "../../public/videos/bar512.mp4.asset.json";
import konferencjeAsset from "../../public/videos/konferencje.mp4.asset.json";
import polskieSmakiAsset from "../../public/videos/polskie-smaki.mp4.asset.json";

const VIDEO_URL: Record<string, string> = {
  bar512: bar512Asset.url,
  konferencje: konferencjeAsset.url,
  polskie_smaki: polskieSmakiAsset.url,
};

interface Props {
  /** 0 to 1 — overall video opacity */
  intensity?: number;
  /** Pixel blur applied to the video for an atmospheric feel */
  blur?: number;
}

/**
 * Fixed full-viewport ambient background video, themed per department.
 * Designed to sit behind translucent (glassy) UI surfaces.
 */
export default function AmbientBackground({ intensity = 0.55, blur = 2 }: Props) {
  const { department } = useDepartment();
  const src = VIDEO_URL[department];
  if (!src) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: intensity,
          filter: `blur(${blur}px) saturate(0.9)`,
          transform: "scale(1.05)", // hide blur edges
        }}
      />
      {/* Vignette + readability gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(15,14,18,0.35) 0%, rgba(15,14,18,0.75) 70%, rgba(15,14,18,0.95) 100%)",
        }}
      />
    </div>
  );
}
