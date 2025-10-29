// src/App.js
import React, { useEffect, useState } from "react";
import "./App.css";

/* ===== Utilities ===== */
const fmtTime = (d = new Date()) =>
  d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

function polarToXY(angleDeg, r) {
  const a = (angleDeg - 90) * (Math.PI / 180); // 0deg = top, CW
  return { x: 0.5 + r * Math.cos(a) * 0.5, y: 0.5 + r * Math.sin(a) * 0.5 };
}

/* ===== Mock Data ===== */
// Helper: 시간 포맷 함수 (월/일 시:분:초)
function fmtShortTime(d) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
    d.getSeconds()
  )}`;
}

// 일정 생성 함수
const makeSchedule = () => {
  const base = new Date();
  const sats = [
    { sat: "Polytech_Universe-3", elev: 62, status: { setup: 12, tracking: 56, processing: 22, delivery: 10 } },
    { sat: "Tianqi-28", elev: 58, status: { setup: 8, tracking: 52, processing: 20, delivery: 12 } },
    { sat: "WREN-1 OWL", elev: 56, status: { setup: 10, tracking: 48, processing: 18, delivery: 16 } },
    { sat: "TERRA", elev: 52, status: { setup: 9, tracking: 42, processing: 14, delivery: 14 } },
    { sat: "CSTP-2.11", elev: 22, status: { setup: 5, tracking: 35, processing: 12, delivery: 8 } },
    { sat: "NOAA 20", elev: 5, status: { setup: 2, tracking: 8, processing: 3, delivery: 2 } },
    { sat: "RS52SE", elev: 15, status: { setup: 4, tracking: 20, processing: 7, delivery: 5 } },
  ];

  // 각 위성의 시작 시간을 5분, 15분, 25분 ... 간격으로 설정
  return sats.map((s, i) => {
    const start = new Date(base.getTime() + (5 + i * 10 * (1 + Math.random()) * 60 * 1000)); // 첫 번째 5분, 이후 10분 간격
    const end = new Date(start.getTime() + 8 * (1 + Math.random()) * 60 * 1000); // 8분 후 종료
    return {
      ...s,
      start: fmtShortTime(start),
      end: fmtShortTime(end),
    };
  });
};

// 동적으로 계산된 scheduleSeed
const scheduleSeed = makeSchedule();

const polarTargets = [
  { name: "TERRA", az: 30, el: 60 },
  { name: "METOP-B", az: 150, el: 38 },
  { name: "METOP-C", az: 300, el: 25 },
];

/* ===== Small UI Bits ===== */
const Card = ({ style, children }) => (
  <div style={{ background: "#111114", border: "1px solid #2b2b30", borderRadius: 14, padding: 12, ...style }}>
    {children}
  </div>
);
const Title = ({ children }) => <div style={{ color: "#fafafa", fontWeight: 700, marginBottom: 6 }}>{children}</div>;
const Muted = ({ children }) => <span style={{ color: "#a1a1aa" }}>{children}</span>;

/* ===== Widgets ===== */
function StatusBar({ parts }) {
  const tot = Object.values(parts).reduce((a, b) => a + b, 0) || 1;
  const seg = (v, c) => <div key={c} style={{ width: `${(v / tot) * 100}%`, height: 10, background: c }} />;
  return (
    <div
      style={{ display: "flex", width: "100%", height: 10, background: "#1f1f22", borderRadius: 6, overflow: "hidden" }}
    >
      {seg(parts.setup, "#fb923c")}
      {seg(parts.tracking, "#3b82f6")}
      {seg(parts.processing, "#22c55e")}
      {seg(parts.delivery, "#86efac")}
    </div>
  );
}

function ScheduleTable() {
  return (
    <Card style={{ padding: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Title>Schedule</Title>
        <Muted>UTC</Muted>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "190px 140px 150px 48px 1fr",
          color: "#cfcfd4",
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        <div>Satellite</div>
        <div>Start</div>
        <div>End</div>
        <div style={{ textAlign: "right" }}>MaxEl</div>
        <div>Status</div>
      </div>
      <div style={{ display: "grid", rowGap: 6 }}>
        {scheduleSeed.map((r) => (
          <div
            key={r.sat + r.start}
            style={{
              display: "grid",
              gridTemplateColumns: "180px 140px 120px 48px 1fr",
              alignItems: "center",
              columnGap: 8,
            }}
          >
            <div style={{ color: "#f4f4f5", fontWeight: 700 }}>{r.sat}</div>
            <div style={{ color: "#e4e4e7" }}>{r.start}</div>
            <div style={{ color: "#e4e4e7" }}>{r.end}</div>
            <div style={{ color: "#fafafa", textAlign: "right" }}>{r.elev}</div>
            <StatusBar parts={r.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ===== Antenna SVG (replaces image) + bigger polar ===== */
function AntennaImage({ src = "/antenna.png" }) {
  return (
    <div
      style={{
        width: 280,
        height: 340,
        background: "rgba(0, 0,0,0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <img src={src} alt="Antenna" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}

function PolarPlot({ height = 420 }) {
  const rings = [0.2, 0.35, 0.5, 0.65, 0.8, 0.95],
    ticks = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Card style={{ padding: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <Title>Pointing (Az/El)</Title>
        <div style={{ fontSize: 12, color: "#a1a1aa" }}>Az: 359.99° &nbsp; El: 90.00°</div>
      </div>

      {/* 좌: SVG 안테나(검정 배경), 우: 커진 폴라 */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", alignItems: "center", gap: 14 }}>
        <AntennaImage height={height} />
        <svg viewBox="0 0 520 520" style={{ width: "100%", height }}>
          <rect width="520" height="520" fill="transparent" />
          {rings.map((r, i) => (
            <circle key={i} cx="260" cy="260" r={260 * r} fill="none" stroke="#3f3f46" strokeDasharray="4 6" />
          ))}
          <line x1="260" y1="0" x2="260" y2="520" stroke="#52525b" strokeDasharray="3 6" />
          <line x1="0" y1="260" x2="520" y2="260" stroke="#52525b" strokeDasharray="3 6" />
          {ticks.map((deg) => {
            const { x, y } = polarToXY(deg, 0.98);
            return (
              <text
                key={deg}
                x={x * 520}
                y={y * 520}
                fill="#a1a1aa"
                fontSize="12"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {deg}
              </text>
            );
          })}
          {polarTargets.map((t) => {
            const r = 1 - t.el / 100;
            const { x, y } = polarToXY(t.az, r);
            return (
              <g key={t.name}>
                <circle cx={x * 520} cy={y * 520} r="7" fill="#fde047" />
                <text x={x * 520 + 12} y={y * 520 - 8} fill="#e4e4e7" fontSize="13">
                  {t.name}
                </text>
              </g>
            );
          })}
          {/* 예시 궤적 */}
          <path d="M 60 480 C 200 220, 320 130, 470 90" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
        </svg>
      </div>
    </Card>
  );
}

/* ===== Multi-series Sensors (big) - UPDATED ===== */
function SpectrumPanel() {
  const series = [
    { key: "temp", name: "Temperature", color: "#60a5fa", base: 35 },
    { key: "rad", name: "Radiation", color: "#f97316", base: 20 },
    { key: "humid", name: "Humidity", color: "#10b981", base: 55 },
    { key: "vibe", name: "Vibration", color: "#eab308", base: 15 },
    { key: "bat", name: "Battery", color: "#ea08aaff", base: 52 },
  ];
  const N = 260;
  const H = 640,
    W = 820,
    P = 28;

  // 전역 모드: 버튼으로 토글
  const [globalMode, setGlobalMode] = React.useState("normal"); // "normal" | "burst"

  // 지표별 상태: points + 현재 적용 중인 모드(effectiveMode) + 보류된 전환(pending)
  const [data, setData] = React.useState(() =>
    series.map((s) => ({
      key: s.key,
      points: Array.from({ length: N }, () => s.base),
      effectiveMode: "normal", // 지표에 실제로 적용 중인 모드
      pending: null, // { toMode: "normal"|"burst", at: timestamp }
    }))
  );

  // 수렴 속도
  const ALPHA_NORMAL = 0.08;
  const ALPHA_BURST = 0.35;

  // 지연 파라미터 (원하면 조절하세요)
  const GAP_STEP = 2080; // 인덱스별 계단 증가
  const GAP_JITTER = 120; // 랜덤 지터

  const gapOn = (idx) => Math.random() * GAP_STEP + Math.floor(Math.random() * GAP_JITTER);
  const gapOff = (idx) => Math.random() * GAP_STEP + Math.floor(Math.random() * GAP_JITTER);

  const triggerBurst = () => {
    const now = Date.now();
    setGlobalMode("burst");
    setData((prev) =>
      prev.map((s, idx) => ({
        ...s,
        // 이미 burst면 다시 예약하지 않음
        pending: s.effectiveMode === "burst" ? s.pending : { toMode: "burst", at: now + gapOn(idx) },
      }))
    );
  };

  const backToNormal = () => {
    const now = Date.now();
    setGlobalMode("normal");
    setData((prev) =>
      prev.map((s, idx) => ({
        ...s,
        pending: s.effectiveMode === "normal" ? s.pending : { toMode: "normal", at: now + gapOff(idx) },
      }))
    );
  };

  React.useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setData((prev) =>
        prev.map((s, idx) => {
          // 시간 도달 시 모드 전환 적용
          let effectiveMode = s.effectiveMode;
          let pending = s.pending;
          if (pending && now >= pending.at) {
            effectiveMode = pending.toMode;
            pending = null;
          }

          const last = s.points[s.points.length - 1];
          const target = effectiveMode === "burst" ? 100 : series[idx].base;
          const alpha = effectiveMode === "burst" ? ALPHA_BURST : ALPHA_NORMAL;

          const noise = (Math.random() - 0.5) * 1.4;
          const humWave = s.key === "humid" ? Math.sin(Date.now() / 1500) * 0.18 : 0;

          let next = last + alpha * (target - last) + noise + humWave;
          next = Math.max(0, Math.min(100, next));

          const nextArr = s.points.slice(1);
          nextArr.push(next);

          return {
            ...s,
            points: nextArr,
            effectiveMode,
            pending,
          };
        })
      );
    }, 60);
    return () => clearInterval(id);
  }, []);

  const x = (i) => P + (i / (N - 1)) * (W - 2 * P);
  const y = (v) => P + (1 - v / 100) * (H - 2 * P);

  const isBursting =
    globalMode === "burst" ||
    data.some((s) => s.effectiveMode === "burst" || (s.pending && s.pending.toMode === "burst"));

  return (
    <Card style={{ padding: 10 }}>
      {/* burst이면 배경 펄스 + 스윕 + 상단 라인 */}
      {isBursting && (
        <>
          <div className="emergency-bg" style={{ position: "absolute", inset: 0, zIndex: 0 }} />
          <div className="emergency-sweep" style={{ zIndex: 0 }} />
          <div className="emergency-topline" style={{ zIndex: 1 }} />
        </>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Title>Sensors</Title>
          <Muted>dBFS-like scale (0–100)</Muted>
          {isBursting && (
            <span className="badge">
              <span className="dot" />
              EMERGENCY
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, zIndex: 9999 }}>
          <button
            onClick={triggerBurst}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              background: "rgba(0, 0, 0, 0)",
              color: "rgba(0, 0, 0, 0)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "default",
            }}
          >
            Burst Mode
          </button>
          <button
            onClick={backToNormal}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              background: "rgba(0, 0, 0, 0)",
              color: "rgba(0, 0, 0, 0)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "default",
            }}
          >
            Normal Mode
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 6 }}>
        {series.map((s, i) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ddd" }}>
            <span style={{ width: 18, height: 4, background: s.color, display: "inline-block", borderRadius: 2 }} />
            {s.name}
            {/* 지표별 상태 뱃지 (선택) */}
            {/* <span style={{ fontSize: 11, color: "#a1a1aa" }}>
              {data[i]?.effectiveMode}{data[i]?.pending ? " (pending)" : ""}
            </span> */}
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
        <rect width={W} height={H} fill="transparent" />
        {[0, 20, 40, 60, 80, 100].map((g) => (
          <line key={g} x1={P} y1={y(g)} x2={W - P} y2={y(g)} stroke="#3f3f46" strokeDasharray="3 3" />
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((gx, i) => (
          <line
            key={i}
            x1={P + gx * (W - 2 * P)}
            y1={P}
            x2={P + gx * (W - 2 * P)}
            y2={H - P}
            stroke="#3f3f46"
            strokeDasharray="3 3"
          />
        ))}
        <line x1={P} y1={P} x2={P} y2={H - P} stroke="#52525b" />
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#52525b" />

        {data.map((s, i) => {
          const pts = s.points.map((v, idx) => `${x(idx)},${y(v)}`).join(" ");
          return <polyline key={s.key} points={pts} fill="none" stroke={series[i].color} strokeWidth="2.2" />;
        })}
      </svg>
    </Card>
  );
}

/* ===== EOSFES Panel (unchanged) ===== */
function EOSFESPanel() {
  const btn = (t) => (
    <div
      key={t}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        background: "#1f1f22",
        border: "1px solid #3b3b40",
        color: "#e4e4e7",
        fontSize: 12,
        textAlign: "center",
      }}
    >
      {t}
    </div>
  );
  const act = (t) => (
    <button
      key={t}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        background: "rgba(16,185,129,0.18)",
        border: "1px solid rgba(16,185,129,0.4)",
        color: "#bbf7d0",
        fontSize: 12,
      }}
    >
      {t}
    </button>
  );
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 800, color: "#fafafa" }}>EOS FES</div>
        <div style={{ display: "flex", gap: 6 }}>
          {["TLEs", "Software", "Hardware"].map((x) => (
            <div
              key={x}
              style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "#15803d", color: "#eafff1" }}
            >
              {x}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 8 }}>
        {["Demods", "Ingestors", "RT-Processors", "Processing", "Delivery"].map(btn)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 10 }}>
        {["DRD26", "DRD20 Ingest.", "RT-Frame", "Image Formatter", "FTP Push"].map(act)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {["Raw", "CCSDS", "Level 0", "PNG", "Level 1"].map((x) => (
          <button
            key={x}
            style={{
              padding: "10px 8px",
              borderRadius: 12,
              background: "#efefef14",
              border: "1px solid #3f3f46",
              color: "#f2f2f6",
              fontSize: 12,
            }}
          >
            {x}
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ===== Main App (layout tuned) ===== */
export default function App() {
  const [now, setNow] = useState(fmtTime());
  useEffect(() => {
    const t = setInterval(() => setNow(fmtTime()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "linear-gradient(to bottom, #0b2447, #0a0a0b)",
        color: "#e4e4e7",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #2b2b30",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "#38bdf8" }} />
          <div>
            <div style={{ fontWeight: 700 }}>Ground Station Controller</div>
            <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: -2 }}>
              Site: EOSFES-Primary · User: Orbital Support
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#d4d4d8" }}>{now} UTC</div>
      </div>

      {/* Body: 좌 58% / 우 42% */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "58% 42%",
          gap: 12,
          height: "calc(100vh - 46px)",
          padding: 12,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "grid", gridTemplateRows: "80% 20%", gap: 12 }}>
          <SpectrumPanel />
          <EOSFESPanel />
        </div>
        <div style={{ display: "grid", gridTemplateRows: "40% 60%", gap: 12, minWidth: 0 }}>
          <ScheduleTable />
          <PolarPlot height={420} />
        </div>
      </div>
    </div>
  );
}
