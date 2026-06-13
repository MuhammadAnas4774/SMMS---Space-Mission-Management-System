/**
 * 3D Orbit animation — decorative spinning orbit rings
 * Used as a visual accent on dashboard cards or section headers.
 */
export default function OrbitRing({ size = 120, color = "var(--accent)", speed = 12 }) {
  const r = size / 2;
  return (
    <div
      className="orbit-container"
      style={{
        width: size,
        height: size,
        position: "relative",
        perspective: "600px",
      }}
    >
      {/* Planet dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size * 0.15,
          height: size * 0.15,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${color}, rgba(0,0,0,0.6))`,
          transform: "translate(-50%, -50%)",
          boxShadow: `0 0 ${size * 0.15}px ${color}`,
          zIndex: 2,
        }}
      />
      {/* Ring 1 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `1.5px solid`,
          borderColor: `${color}44`,
          borderRadius: "50%",
          animation: `orbitSpin ${speed}s linear infinite`,
          transformStyle: "preserve-3d",
          transform: "rotateX(65deg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -3,
            left: "50%",
            width: 6,
            height: 6,
            background: color,
            borderRadius: "50%",
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
      {/* Ring 2 */}
      <div
        style={{
          position: "absolute",
          inset: size * 0.12,
          border: `1px solid`,
          borderColor: `${color}33`,
          borderRadius: "50%",
          animation: `orbitSpin ${speed * 1.5}s linear infinite reverse`,
          transformStyle: "preserve-3d",
          transform: "rotateX(65deg) rotateZ(45deg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -2,
            left: "50%",
            width: 4,
            height: 4,
            background: "var(--accent-cyan)",
            borderRadius: "50%",
            boxShadow: "0 0 6px var(--accent-cyan)",
          }}
        />
      </div>
    </div>
  );
}
