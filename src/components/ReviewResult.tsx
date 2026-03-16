import { FileText, ShieldAlert, Sparkles, Download } from "lucide-react";
import type { ReviewResult as ReviewResultType } from "@/lib/types";
import RiskCard from "@/components/RiskCard";

function riskBadge(risk: ReviewResultType["overall_risk"]) {
  switch (risk) {
    case "高":
      return { text: "高风险", cls: "bg-red-600" };
    case "中":
      return { text: "中风险", cls: "bg-amber-600" };
    case "低":
      return { text: "低风险", cls: "bg-blue-600" };
    default:
      return { text: "风险未知", cls: "bg-gray-600" };
  }
}

export default function ReviewResult({ result }: { result: ReviewResultType; meta?: any }) {
  const badge = riskBadge(result.overall_risk);

  function handleExport() {
    if (typeof window === "undefined") return;
    const mdLines: string[] = [];
    mdLines.push(`# 合同审查报告`);
    mdLines.push("");
    mdLines.push(`- 合同类型：${result.contract_type || "未知"}`);
    mdLines.push(
      `- 合同各方：${
        (result.parties || []).filter(Boolean).join(" / ") || "未知"
      }`
    );
    mdLines.push(`- 总体风险：${result.overall_risk}`);
    mdLines.push(`- 综合评分：${result.overall_score}/100`);
    mdLines.push("");
    mdLines.push(`## 一、合同概要`);
    mdLines.push("");
    mdLines.push(result.summary || "（暂无概要）");
    mdLines.push("");
    mdLines.push(`## 二、总体评价`);
    mdLines.push("");
    mdLines.push(result.overall_comment || "（暂无总体评价）");
    mdLines.push("");
    mdLines.push(`## 三、重点风险条款`);
    mdLines.push("");
    if (!result.risk_items || result.risk_items.length === 0) {
      mdLines.push("- 暂未识别到明显风险点（仍建议人工复核关键条款）。");
    } else {
      result.risk_items.forEach((item, idx) => {
        mdLines.push(
          `### ${idx + 1}. ${item.category || "未分类"}（${item.risk_level}风险）`
        );
        mdLines.push("");
        mdLines.push(`> ${item.clause}`);
        mdLines.push("");
        mdLines.push(`**风险分析：** ${item.reason}`);
        mdLines.push("");
        mdLines.push(`**修改建议：** ${item.suggestion}`);
        mdLines.push("");
      });
    }
    mdLines.push(`## 四、缺失或建议补充的条款`);
    mdLines.push("");
    if (!result.missing_clauses || result.missing_clauses.length === 0) {
      mdLines.push("- 暂未识别到明显缺失条款。");
    } else {
      result.missing_clauses.forEach((c, idx) => {
        mdLines.push(`### ${idx + 1}. ${c.clause_name}（${c.importance}）`);
        mdLines.push("");
        mdLines.push(c.description);
        mdLines.push("");
      });
    }
    mdLines.push(`## 五、合同亮点`);
    mdLines.push("");
    if (!result.highlights || result.highlights.length === 0) {
      mdLines.push("- 暂无特别亮点条款输出。");
    } else {
      result.highlights.forEach((h) => {
        mdLines.push(`- ${h}`);
      });
    }

    const content = mdLines.join("\n");
    const blob = new Blob([content], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.contract_type || "合同"}-审查报告.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-500" />
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                审查结果
              </h2>
              <span
                className={`${badge.cls} rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-sky-900/20`}
              >
                {badge.text}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs sm:text-sm ring-1 ring-slate-200">
                类型：{result.contract_type || "未知"}
              </span>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs sm:text-sm ring-1 ring-slate-200">
                参与方：{(result.parties || []).filter(Boolean).join(" / ") || "未知"}
              </span>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs sm:text-sm ring-1 ring-slate-200">
                评分：
                <span className="font-semibold text-sky-600">{result.overall_score}</span>
                /100
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 sm:w-[360px]">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <Download className="h-3.5 w-3.5" />
              导出报告（Markdown）
            </button>
            <div className="w-full rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-sky-500" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">总体评价</div>
                  <div className="mt-1 text-sm leading-6 text-slate-700">
                    {result.overall_comment || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-900">合同概要</div>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {result.summary || "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-sky-500" />
            <h3 className="text-base font-semibold text-slate-900">风险点</h3>
            <span className="text-xs text-slate-400">({result.risk_items?.length || 0})</span>
          </div>
          <div className="mt-4 space-y-4">
            {(result.risk_items || []).length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                未识别到明显风险点（仍建议人工复核关键条款）。
              </div>
            ) : (
              (result.risk_items || []).map((item, idx) => (
                <RiskCard key={`${item.category}-${idx}`} item={item} index={idx} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-500" />
              <h3 className="text-base font-semibold text-slate-900">亮点条款</h3>
              <span className="text-xs text-slate-400">({result.highlights?.length || 0})</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {(result.highlights || []).length === 0 ? (
                <li className="rounded-xl bg-slate-50 px-4 py-3 text-slate-600 ring-1 ring-slate-200">
                  暂无亮点条款输出。
                </li>
              ) : (
                (result.highlights || []).map((h, i) => (
                  <li key={i} className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    {h}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-sky-500" />
              <h3 className="text-base font-semibold text-slate-900">缺失条款</h3>
              <span className="text-xs text-slate-400">({result.missing_clauses?.length || 0})</span>
            </div>
            <div className="mt-4 space-y-2">
              {(result.missing_clauses || []).length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                  暂未识别到缺失条款（请结合合同类型再核对）。
                </div>
              ) : (
                (result.missing_clauses || []).map((c, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{c.clause_name}</div>
                      <span
                        className={
                          c.importance === "必要"
                            ? "rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm shadow-red-900/20"
                            : "rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm shadow-sky-900/20"
                        }
                      >
                        {c.importance}
                      </span>
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-700">{c.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
