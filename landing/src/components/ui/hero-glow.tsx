import { cn } from "@/lib/utils";

interface HeroGlowProps {
  className?: string;
}

export function HeroGlow({ className }: HeroGlowProps) {
  return (
    <div className={cn("absolute inset-0 z-0 pointer-events-none", className)}>
      {/* Warm orange glow — top center */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 20%, #D16B42 0%, transparent 70%)",
          opacity: 0.08,
        }}
      />
      {/* Subtle green glow — bottom left */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 60% at 25% 80%, #2F4538 0%, transparent 70%)",
          opacity: 0.06,
        }}
      />
      {/* Subtle green glow — bottom right */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 60% at 75% 80%, #2F4538 0%, transparent 70%)",
          opacity: 0.06,
        }}
      />
    </div>
  );
}
