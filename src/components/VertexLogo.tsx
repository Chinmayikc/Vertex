export function VertexLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/vertex-logo-transparent.png"
      alt="Vertex — The Tech Club"
      className={className}
      width={120}
      height={60}
      decoding="async"
    />
  );
}
