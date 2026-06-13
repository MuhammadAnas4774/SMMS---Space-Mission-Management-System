import React from "react";

export default function HologramHeader({ icon: Icon, title, description }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
      <div className="hologram-wrap">
        <div className="hologram-base"></div>
        <div className="hologram-beam"></div>
        <div className="hologram-figure">
          {Icon && <Icon size={60} strokeWidth={1.5} />}
        </div>
      </div>
      <div>
        <h2 style={{ margin: "0 0 8px 0" }}>{title}</h2>
        {description && (
          <p className="muted" style={{ margin: 0, maxWidth: "800px" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
