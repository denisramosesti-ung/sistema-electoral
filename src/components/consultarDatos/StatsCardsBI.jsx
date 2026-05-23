import React from "react";
import { Users, Briefcase, Building, Clock, Star, UserCheck } from "lucide-react";

const CARDS = [
  { key: "total",             label: "Total Registros",       icon: Users,      color: "text-slate-600",  bg: "bg-slate-50"  },
  { key: "abogados",          label: "Abogados",              icon: Briefcase,  color: "text-brand-600",  bg: "bg-brand-50"  },
  { key: "funcionarios",      label: "Funcionarios Públicos", icon: Building,   color: "text-amber-600",  bg: "bg-amber-50"  },
  { key: "jubilados",         label: "Jubilados",             icon: Clock,      color: "text-emerald-600",bg: "bg-emerald-50"},
  { key: "terceraEdad",       label: "Tercera Edad",          icon: UserCheck,  color: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "nuevoAnr",          label: "Nuevo ANR",             icon: Star,       color: "text-rose-600",   bg: "bg-rose-50"   },
];

export default function StatsCardsBI({ metrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARDS.map(({ key, label, icon: Icon, color, bg }) => (
        <div
          key={key}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-card"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 leading-tight">
              {label}
            </p>
            <div className={`p-1.5 rounded-lg ${bg}`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {(metrics[key] ?? 0).toLocaleString("es-PY")}
          </p>
        </div>
      ))}
    </div>
  );
}
