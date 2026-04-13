import React from "react";
import { Filter, RotateCcw } from "lucide-react";

const CHECKBOX_FIELDS = [
  { key: "abogados", label: "Abogados" },
  { key: "funcionario_publico", label: "Funcionario Público" },
  { key: "jubilados", label: "Jubilados" },
  { key: "tercera_edad", label: "Tercera Edad" },
  { key: "nuevo_anr", label: "Nuevo ANR" },
  { key: "exa_san_jose", label: "Exa San José" },
];

export default function FilterPanel({ filters, onChange, onReset, options }) {
  const { partidos, seccionales, locales, universidades, cargosSeccionales } = options;

  const handleCheckbox = (key) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const handleSelect = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const handleEdad = (key, value) => {
    const num = value === "" ? "" : parseInt(value, 10);
    onChange({ ...filters, [key]: num });
  };

  return (
    <aside className="bg-white border border-slate-200 rounded-xl shadow-card p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-600" />
          <span className="text-sm font-semibold text-slate-800">Filtros</span>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 transition-colors border-0 bg-transparent p-0 shadow-none"
          title="Limpiar filtros"
        >
          <RotateCcw className="w-3 h-3" />
          Limpiar
        </button>
      </div>

      {/* Checkboxes */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Categorías
        </p>
        <div className="flex flex-col gap-2">
          {CHECKBOX_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!filters[key]}
                onChange={() => handleCheckbox(key)}
                className="w-4 h-4 accent-brand-600 rounded"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Selects */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 -mb-1">
          Opciones
        </p>

        <SelectField
          label="Partido"
          value={filters.partido}
          options={partidos}
          onChange={(v) => handleSelect("partido", v)}
        />
        <SelectField
          label="Seccional"
          value={filters.seccional}
          options={seccionales}
          onChange={(v) => handleSelect("seccional", v)}
        />
        <SelectField
          label="Local de Votación"
          value={filters.local_votacion}
          options={locales}
          onChange={(v) => handleSelect("local_votacion", v)}
        />
        <SelectField
          label="Universidad"
          value={filters.universidades}
          options={universidades}
          onChange={(v) => handleSelect("universidades", v)}
        />
        <SelectField
          label="Cargo Seccional"
          value={filters.cargo_seccionales}
          options={cargosSeccionales}
          onChange={(v) => handleSelect("cargo_seccionales", v)}
        />
      </div>

      {/* Votación */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 -mb-1">
          Votación
        </p>

        <div>
          <label className="block text-xs text-slate-600 mb-1">Voto Internas ANR 2021</label>
          <select
            value={filters.voto_internas}
            onChange={(e) => handleSelect("voto_internas", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50"
          >
            <option value="">Todos</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-600 mb-1">Voto Generales 2023</label>
          <select
            value={filters.voto_generales}
            onChange={(e) => handleSelect("voto_generales", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50"
          >
            <option value="">Todos</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {/* Rango de Edad */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Rango de Edad
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={120}
            value={filters.edadMin}
            onChange={(e) => handleEdad("edadMin", e.target.value)}
            placeholder="Mín"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50"
          />
          <span className="text-slate-400 text-xs shrink-0">–</span>
          <input
            type="number"
            min={0}
            max={120}
            value={filters.edadMax}
            onChange={(e) => handleEdad("edadMax", e.target.value)}
            placeholder="Máx"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50"
          />
        </div>
      </div>
    </aside>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50"
      >
        <option value="">Todos</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt || "(sin datos)"}
          </option>
        ))}
      </select>
    </div>
  );
}
