"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Clock3, FileClock, PlayCircle, ChevronDown, Eye, EyeOff } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ReviewResult from "@/components/ReviewResult";
import PasswordGate from "@/components/PasswordGate";
import type { ReviewResult as ReviewResultType } from "@/lib/types";

interface ReviewHistoryItem {
  id: string;
  createdAt: string;
  fileName?: string;
  isDemo?: boolean;
  result: ReviewResultType;
}

const HISTORY_STORAGE_KEY = "contract-guard-history-v1";

const DEMO_RESULT: ReviewResultType = {
  summary:
    "本合同为一份典型的技术服务/软件订阅合同，约定服务内容、费用支付、知识产权与保密条款等核心事项。",
  contract_type: "技术服务合同",
  parties: ["甲方（客户公司）", "乙方（技术服务商）"],
  overall_risk: "中",
  overall_score: 78,
  overall_comment:
    "合同整体结构较为完整，已包含服务范围、费用结算、违约责任及保密等关键条款。但在服务水平、赔偿上限及数据安全责任分配方面存在一定模糊和对甲方不利之处，建议在正式签署前进一步细化和调整。",
  risk_items: [
    {
      clause:
        "乙方仅在年度服务费总额范围内承担最高赔偿责任，且不对任何间接损失负责。",
      risk_level: "高",
      category: "违约责任",
      reason:
        "赔偿责任被严格封顶且排除了间接损失，可能导致即使因乙方严重违约造成重大损失，甲方也难以获得充分赔偿。",
      suggestion:
        "建议提高或分情形约定赔偿上限（如重大过失或故意不适用封顶），并就数据泄露、知识产权侵权等重大情形单列更高的责任标准。",
    },
    {
      clause: "服务水平以乙方内部服务标准为准，未另行约定。",
      risk_level: "中",
      category: "服务水平/验收",
      reason:
        "服务标准完全由乙方单方控制，缺乏可量化指标，后续出现争议时不利于甲方主张未达标。",
      suggestion:
        "建议在合同附件中约定具体SLA指标（如响应时间、可用性、修复时限等），并明确不达标时的违约责任或服务费减免机制。",
    },
    {
      clause: "合同期满自动顺延一年，除非任一方提前30日书面通知终止。",
      risk_level: "低",
      category: "终止条款",
      reason:
        "自动续期条款本身并非高风险，但若内部流程管理不当，可能导致在未预算的情况下继续承担费用。",
      suggestion:
        "建议要求续期前乙方需提前提醒，并在内部设定到期提醒机制；如预算敏感，可改为双方协商续签而非自动续期。",
    },
  ],
  missing_clauses: [
    {
      clause_name: "数据安全与隐私保护条款",
      importance: "必要",
      description:
        "合同未明确约定数据加密、访问控制、备份恢复和数据泄露通知机制，尤其是在涉及客户或个人数据时，应细化乙方在数据安全方面的具体义务与责任。",
    },
    {
      clause_name: "知识产权侵权担保与处理机制",
      importance: "必要",
      description:
        "虽有知识产权归属约定，但未明确如因乙方提供的系统/代码侵犯第三方权利时，乙方的赔偿责任和替换义务，建议单独补充侵权处理条款。",
    },
    {
      clause_name: "服务变更与需求变更流程",
      importance: "建议",
      description:
        "未约定变更需求的提出、评估、工时/费用调整和确认流程，实际实施中容易因沟通不清产生责任划分争议。",
    },
  ],
  highlights: [
    "合同对费用支付节点与发票开具时间有较为清晰的约定，便于双方对账与结算。",
    "设置了合理的保密义务，涵盖技术信息、商业信息等多种类型的保密信息。",
    "约定了提前通知期限的合同解除机制，有利于双方进行资源和人员安排。",
  ],
};

export default function Home() {
  // --- 密码门控逻辑（文件最前面） ---
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let localAuthed = false;
    try {
      localAuthed = window.localStorage.getItem("contract-guard-authed-v1") === "1";
    } catch {
      // ignore
    }

    if (localAuthed) {
      setAuthed(true);
      setAuthChecking(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth", { method: "GET" });
        const data = await res.json().catch(() => ({}));
        const ok = Boolean(data?.authed);
        if (ok) {
          setAuthed(true);
          try {
            window.localStorage.setItem("contract-guard-authed-v1", "1");
          } catch {
            // ignore
          }
        }
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [result, setResult] = useState<ReviewResultType | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);

  const hasResult = useMemo(() => Boolean(result), [result]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ReviewHistoryItem[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  function pushHistory(newResult: ReviewResultType, newMeta: any) {
    if (typeof window === "undefined") return;
    const item: ReviewHistoryItem = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      fileName: newMeta?.fileName,
      isDemo: Boolean(newMeta?.isDemo),
      result: newResult,
    };
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 20);
      try {
        window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  function handleUseDemo() {
    setResult(DEMO_RESULT);
    const demoMeta = { isDemo: true, fileName: "示例技术服务合同" };
    setMeta(demoMeta);
    setError(null);
    pushHistory(DEMO_RESULT, demoMeta);
  }

  if (!authed) {
    if (authChecking) {
      return (
        <div className="min-h-screen bg-slate-50">
          <main className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
            <section className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-10 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:px-10">
              <div className="text-sm text-slate-600">正在验证访问权限…</div>
            </section>
          </main>
        </div>
      );
    }
    return <PasswordGate onAuthed={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        {/* 顶部浅色 Hero 区域 */}
        <section className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100">
                <ShieldCheck className="h-4 w-4 text-sky-500" aria-hidden />
                <span>智能合同审查 · 一键发现风险</span>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  智能合同审查平台
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  上传合同文件（PDF / DOCX / DOC / TXT），由 AI 自动识别隐藏风险、缺失条款与修改建议，
                  帮你快速完成初步审查。
                </p>
              </div>
              {/* 功能摘要 */}
              <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-3 sm:text-sm">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">上传合同</p>
                  <p className="mt-1 leading-5">
                    支持 PDF、Word、TXT 等常见格式，拖拽或点击上传即可。
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">AI 智能审查</p>
                  <p className="mt-1 leading-5">
                    从条款措辞、权责分配、违约责任等多个维度识别风险点。
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">导出审查要点</p>
                  <p className="mt-1 leading-5">
                    生成结构化风险清单与修改建议，便于沟通与二次复核。
                  </p>
                </div>
              </div>
            </div>

            {/* 操作按钮区 */}
            <div className="mt-2 flex w-full flex-col items-stretch gap-3 sm:mt-0 sm:w-60">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("contract-upload-area");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(56,189,248,0.45)] transition hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                一键智能审查
              </button>
              <button
                type="button"
                onClick={handleUseDemo}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <PlayCircle className="h-4 w-4 text-sky-500" />
                查看示例
              </button>
              <p className="text-xs leading-5 text-slate-500">
                没有现成合同？点击
                <span className="font-medium text-sky-600">「查看示例」</span>
                ，体验一份预设的审查结果。
              </p>
            </div>
          </div>
        </section>

        {/* 上传区域 */}
        <section id="contract-upload-area" className="mt-10">
          {/* 设置区域（上传区域上方） */}
          <div className="mx-auto mb-4 w-full max-w-3xl">
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              aria-expanded={settingsOpen}
            >
              <span>使用自己的模型（点击展开）</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  settingsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {settingsOpen && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="输入Model（如 deepseek-chat）"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={apiKeyVisible ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="输入API Key（不填则使用免费额度）"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => setApiKeyVisible((v) => !v)}
                      className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                      aria-label={apiKeyVisible ? "隐藏API Key" : "显示API Key"}
                    >
                      {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  Key仅用于本次请求，不会被存储。免费额度：1次
                </p>
              </div>
            )}
          </div>

          <FileUpload
            apiKey={apiKey}
            model={model}
            onResult={(r, m) => {
              setResult(r);
              setMeta(m);
              setError(null);
              pushHistory(r, m);
            }}
            onError={(e) => {
              setError(e);
            }}
          />

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}
        </section>

        {/* 审查结果 */}
        {hasResult && result && (
          <section className="mt-10">
            <ReviewResult result={result} meta={meta} />
          </section>
        )}

        {/* 审查历史 */}
        <section className="mt-12">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-sky-500" />
                <h2 className="text-sm font-semibold text-slate-900">
                  审查历史
                </h2>
                <span className="text-xs text-slate-400">
                  {history.length} 条记录（本地保存）
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                仅存储在浏览器 localStorage，可随时清空缓存。
              </p>
            </div>
            {history.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                还没有任何历史记录。完成一次审查或使用
                <span className="mx-1 font-medium text-sky-600">示例合同</span>
                后，这里会显示最近的审查结果，方便你随时回看。
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="flex cursor-pointer items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
                    onClick={() => {
                      setResult(item.result);
                      setMeta({
                        ...(meta || {}),
                        fileName: item.fileName,
                        isDemo: item.isDemo,
                        fromHistory: true,
                      });
                      setError(null);
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                        <FileClock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.fileName || "未命名合同"}
                          {item.isDemo && (
                            <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-100">
                              示例
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-slate-500">
                      评分
                      <span className="ml-1 font-semibold text-sky-600">
                        {item.result.overall_score}
                      </span>
                      /100 · {item.result.overall_risk}风险
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 页脚 */}
        <footer className="mt-10 border-t border-slate-200 pt-5 text-[11px] leading-5 text-slate-500">
          <div className="flex flex-col gap-2 text-center text-[11px] sm:flex-row sm:items-center sm:justify-between">
            <div>合同文件仅用于审查，不会长期保存，传输过程可控。</div>
            <div>拖拽上传 · 多维度风险扫描 · 结构化审查报告</div>
          </div>
          <div className="mt-3 text-center text-[10px] text-slate-400">
            免责声明：本工具仅用于合同审查辅助，不构成正式法律意见；请结合专业律师意见作出最终决策。
          </div>
        </footer>
      </main>
    </div>
  );
}
