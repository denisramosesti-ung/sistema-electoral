import React, { useMemo } from "react";

// ======================= BAR CHART =======================
function BarChart({ title, data, maxBars = 12, color = "bg-brand-500" }) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.value - a.value).slice(0, maxBars),
    [data, maxBars]
  );
  const max = sorted[0]?.value || 1;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card p-5">
      <p className="text-sm font-semibold text-slate-800 mb-4">{title}</p>
      {sorted.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">Sin datos</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map(({ label, value }) => {
            const pct = Math.round((value / max) * 100);
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="text-xs text-slate-600 shrink-0 text-right"
                  style={{ width: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={label || "(sin datos)"}
                >
                  {label || "(sin datos)"}
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-4 relative overflow-hidden">
                  <div
                    className={`h-4 rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 shrink-0 w-10 text-right">
                  {value.toLocaleString("es-PY")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ======================= PIE CHART =======================
function PieChart({ title, slices }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  let cumAngle = 0;

  const segments = slices.map((d) => {
    const angle = total === 0 ? 0 : (d.value / total) * 360;
    const start = cumAngle;
    cumAngle += angle;
    return { ...d, angle, start };
  });

  const describeArc = (cx, cy, r, startDeg, endDeg) => {
    if (endDeg - startDeg >= 360) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
    }
    const toRad = (d) => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  const COLORS = ["#dc2626", "#b91c1c", "#ef4444", "#f87171", "#fca5a5"];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card p-5">
      <p className="text-sm font-semibold text-slate-800 mb-4">{title}</p>
      {total === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">Sin datos</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0">
            {segments.map((seg, i) => (
              <path
                key={seg.label}
                d={describeArc(60, 60, 54, seg.start, seg.start + seg.angle)}
                fill={COLORS[i % COLORS.length]}
                stroke="white"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          <div className="flex flex-col gap-1.5 w-full">
            {segments.map((seg, i) => {
              const pct = total ? Math.round((seg.value / total) * 100) : 0;
              return (
                <div key={seg.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-xs text-slate-700 truncate">{seg.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 shrink-0">
                    {pct}% ({seg.value.toLocaleString("es-PY")})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ======================= EDAD HISTOGRAM =======================
function EdadHistogram({ data }) {
  const RANGES = [
    { label: "18-25", min: 18, max: 25 },
    { label: "26-35", min: 26, max: 35 },
    { label: "36-45", min: 36, max: 45 },
    { label: "46-55", min: 46, max: 55 },
    { label: "56-65", min: 56, max: 65 },
    { label: "66+",   min: 66, max: 999 },
  ];

  const buckets = useMemo(() => {
    return RANGES.map((r) => ({
      label: r.label,
      value: data.filter((d) => d >= r.min && d <= r.max).length,
    }));
  }, [data]);

  return <BarChart title="Distribución por Edad" data={buckets} color="bg-indigo-500" maxBars={6} />;
}

// ======================= EXPORT =======================
export default function ChartsBI({ filtered }) {
  const byPartido = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const k = r.partido || "Sin datos";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const bySeccional = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const k = r.seccional || "Sin datos";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const edades = useMemo(
    () => filtered.map((r) => r.edad).filter((e) => typeof e === "number" && !isNaN(e)),
    [filtered]
  );

  const votoInternasSlices = useMemo(() => {
    const si = filtered.filter((r) => r.voto_internas_anr_2021 === "S").length;
    const no = filtered.length - si;
    return [
      { label: "Votó internas", value: si },
      { label: "No votó", value: no },
    ];
  }, [filtered]);

  const votoGeneralesSlices = useMemo(() => {
    const si = filtered.filter((r) => r.voto_gral_presidenciales_2023 === "S").length;
    const no = filtered.length - si;
    return [
      { label: "Votó generales", value: si },
      { label: "No votó", value: no },
    ];
  }, [filtered]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BarChart title="Distribución por Partido" data={byPartido} maxBars={10} color="bg-brand-500" />
      <BarChart title="Votantes por Seccional" data={bySeccional} maxBars={12} color="bg-amber-500" />
      <PieChart title="Voto Internas ANR 2021" slices={votoInternasSlices} />
      <PieChart title="Voto Generales 2023" slices={votoGeneralesSlices} />
      <EdadHistogram data={edades} />
    </div>
  );
}
