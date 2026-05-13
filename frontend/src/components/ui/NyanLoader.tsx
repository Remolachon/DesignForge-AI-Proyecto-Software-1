"use client";

import { useEffect, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface NyanLoaderProps {
  /** Mensaje que aparece debajo del loader */
  message?: string;
  /** Mostrar barra de progreso animada */
  showProgress?: boolean;
}

// ─── Sub-componentes internos ─────────────────────────────────────────────────

function StarShape({
  x,
  y,
  size,
  color,
  delay,
}: {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        animationDelay: delay,
        animation: "nyan-twinkle 1.2s ease-in-out infinite",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 12 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="6,0.5 7.7,4.3 12,4.9 9,7.9 9.7,12 6,10.1 2.3,12 3,7.9 0,4.9 4.3,4.3"
          fill={color}
        />
      </svg>
    </div>
  );
}

function NyanCatSVG() {
  return (
    <svg
      width="160"
      height="72"
      viewBox="0 0 160 72"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* ── Rainbow trail ── */}
      <rect x="0" y="20" width="60" height="6" fill="#FF6B8A" />
      <rect x="0" y="26" width="60" height="6" fill="#FF9F1C" />
      <rect x="0" y="32" width="60" height="6" fill="#FFE045" />
      <rect x="0" y="38" width="60" height="6" fill="#4BDE80" />
      <rect x="0" y="44" width="60" height="6" fill="#45AAFF" />
      <rect x="0" y="50" width="60" height="6" fill="#C06EF3" />

      {/* ── Pop-tart cuerpo ── */}
      <rect x="54" y="16" width="58" height="42" rx="7" fill="#F5C5A3" />
      {/* Frosting */}
      <rect x="59" y="20" width="48" height="33" rx="5" fill="#FF9EC2" />
      {/* Sprinkles */}
      <rect
        x="65"
        y="25"
        width="6"
        height="3"
        rx="1.5"
        fill="#FF5599"
        transform="rotate(-18 68 26)"
      />
      <rect
        x="80"
        y="27"
        width="6"
        height="3"
        rx="1.5"
        fill="#45AAFF"
        transform="rotate(12 83 28)"
      />
      <rect
        x="72"
        y="37"
        width="6"
        height="3"
        rx="1.5"
        fill="#FFE045"
        transform="rotate(-8 75 38)"
      />
      <rect
        x="90"
        y="34"
        width="6"
        height="3"
        rx="1.5"
        fill="#4BDE80"
        transform="rotate(22 93 35)"
      />
      <rect
        x="63"
        y="43"
        width="6"
        height="3"
        rx="1.5"
        fill="#C06EF3"
        transform="rotate(6 66 44)"
      />
      <rect
        x="87"
        y="43"
        width="6"
        height="3"
        rx="1.5"
        fill="#FF9F1C"
        transform="rotate(-14 90 44)"
      />

      {/* ── Patas (4) ── */}
      <rect x="62" y="54" width="10" height="13" rx="3" fill="#999" />
      <rect x="75" y="54" width="10" height="13" rx="3" fill="#999" />
      <rect x="88" y="54" width="10" height="13" rx="3" fill="#999" />
      <rect x="101" y="54" width="10" height="13" rx="3" fill="#999" />

      {/* ── Cabeza ── */}
      <ellipse cx="128" cy="30" rx="22" ry="19" fill="#aaa" />

      {/* Orejas */}
      <polygon points="110,17 116,7 122,17" fill="#aaa" />
      <polygon points="134,17 140,7 146,17" fill="#aaa" />
      {/* Interior orejas */}
      <polygon points="112,16 116,9 120,16" fill="#FF9EC2" />
      <polygon points="136,16 140,9 144,16" fill="#FF9EC2" />

      {/* Ojos (cerrados felices) */}
      <path
        d="M118 28 Q122 24 126 28"
        fill="none"
        stroke="#333"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M130 28 Q134 24 138 28"
        fill="none"
        stroke="#333"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Nariz */}
      <ellipse cx="128" cy="34" rx="3.5" ry="2.5" fill="#FF9EC2" />

      {/* Boca */}
      <path
        d="M124 37 Q128 40 132 37"
        fill="none"
        stroke="#666"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Bigotes izquierdos */}
      <line
        x1="108"
        y1="31"
        x2="123"
        y2="33"
        stroke="#666"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="108"
        y1="36"
        x2="123"
        y2="36"
        stroke="#666"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Bigotes derechos */}
      <line
        x1="133"
        y1="33"
        x2="148"
        y2="31"
        stroke="#666"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="133"
        y1="36"
        x2="148"
        y2="36"
        stroke="#666"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Cola */}
      <path
        d="M156 14 Q166 6 156 28"
        fill="none"
        stroke="#aaa"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function NyanLoader({
  message = "Cargando",
  showProgress = true,
}: NyanLoaderProps) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 450);
    return () => clearInterval(id);
  }, []);

  const stars: {
    x: string;
    y: string;
    size: number;
    color: string;
    delay: string;
  }[] = [
    { x: "4%", y: "12%", size: 13, color: "#C06EF3", delay: "0s" },
    { x: "12%", y: "68%", size: 9, color: "#45AAFF", delay: "0.3s" },
    { x: "22%", y: "30%", size: 7, color: "#4BDE80", delay: "0.6s" },
    { x: "78%", y: "10%", size: 11, color: "#FFE045", delay: "0.15s" },
    { x: "85%", y: "70%", size: 9, color: "#FF6B8A", delay: "0.75s" },
    { x: "92%", y: "35%", size: 7, color: "#FF9F1C", delay: "0.45s" },
    { x: "50%", y: "5%", size: 8, color: "#C06EF3", delay: "0.9s" },
    { x: "38%", y: "80%", size: 6, color: "#45AAFF", delay: "0.2s" },
    { x: "65%", y: "75%", size: 10, color: "#4BDE80", delay: "0.55s" },
  ];

  return (
    <>
      <style>{`
        @keyframes nyan-fly {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-8px); }
        }
        @keyframes nyan-twinkle {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.25; transform: scale(0.5) rotate(20deg); }
        }
        @keyframes nyan-rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes nyan-progress {
          0%   { width: 0%; }
          30%  { width: 45%; }
          60%  { width: 68%; }
          85%  { width: 82%; }
          100% { width: 88%; }
        }
        @keyframes nyan-bg-scroll {
          0%   { background-position: 0 0; }
          100% { background-position: -60px 0; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
          /* Fondo oscuro estrellado tipo pixel-art */
          background: "#0d0d1a",
          fontFamily: "'Courier New', Courier, monospace",
          padding: "2rem",
        }}
      >
        {/* ── Escena animada ── */}
        <div
          style={{
            position: "relative",
            width: "min(480px, 90vw)",
            height: "110px",
            /* Textura de fondo sutil */
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            animation: "nyan-bg-scroll 2s linear infinite",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Estrellas */}
          {stars.map((s, i) => (
            <StarShape key={i} {...s} />
          ))}

          {/* Nyan Cat centrado y flotando */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              animation: "nyan-fly 0.38s ease-in-out infinite",
              zIndex: 10,
            }}
          >
            <NyanCatSVG />
          </div>
        </div>

        {/* ── Barra de progreso arcoíris ── */}
        {showProgress && (
          <div
            style={{
              width: "min(360px, 80vw)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                height: "8px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "4px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "4px",
                  backgroundImage:
                    "linear-gradient(90deg, #FF6B8A, #FF9F1C, #FFE045, #4BDE80, #45AAFF, #C06EF3, #FF6B8A)",
                  backgroundSize: "200% 100%",
                  animation:
                    "nyan-progress 4s ease-out forwards, nyan-rainbow 1.5s linear infinite",
                }}
              />
            </div>
          </div>
        )}

        {/* ── Mensaje ── */}
        <p
          style={{
            color: "#e0d6ff",
            fontSize: "15px",
            letterSpacing: "0.08em",
            margin: 0,
            textShadow: "0 0 12px rgba(192, 110, 243, 0.6)",
          }}
        >
          {message}
          {dots}
        </p>
      </div>
    </>
  );
}