import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { RiskItem } from "@/lib/types";

const riskConfig = {
  高: {
    icon: AlertTriangle,
    tintBg: "bg-red-50",
    tintBorder: "border-red-200",
    iconText: "text-red-600",
    badge: "bg-red-600",
  },
  中: {
    icon: AlertCircle,
    tintBg: "bg-amber-50",
    tintBorder: "border-amber-200",
    iconText: "text-amber-700",
    badge: "bg-amber-600",
  },
  低: {
    icon: Info,
    tintBg: "bg-blue-50",
    tintBorder: "border-blue-200",
    iconText: "text-blue-700",
    badge: "bg-blue-600",
  },
};

export default function RiskCard({ item, index }: { item: RiskItem; index: number }) {
  const config = riskConfig[item.risk_level];
  const Icon = config.icon;

  return (
    <div className="mb-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${config.tintBorder} ${config.tintBg}`}
          >
            <Icon className={`h-5 w-5 ${config.iconText}`} />
          </span>
          <span className="text-sm font-medium text-slate-50">风险 #{index + 1}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
            {item.category}
          </span>
        </div>
        <span
          className={`${config.badge} rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-slate-900/40`}
        >
          {item.risk_level}风险
        </span>
      </div>

      {/* 原文摘录 */}
      <blockquote className="my-3 rounded-r-lg border-l-4 border-sky-400/80 bg-sky-50 py-2 pr-3 pl-3 text-sm italic text-slate-700">
        &ldquo;{item.clause}&rdquo;
      </blockquote>

      {/* 风险分析 */}
      <div className="mb-2">
        <span className="text-xs uppercase tracking-wide text-slate-400">风险分析</span>
        <p className="mt-1 text-sm leading-6 text-slate-700">{item.reason}</p>
      </div>

      {/* 修改建议 */}
      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <span className="text-xs uppercase tracking-wide text-emerald-700">修改建议</span>
        <p className="mt-1 text-sm leading-6 text-emerald-800">{item.suggestion}</p>
      </div>
    </div>
  );
}
