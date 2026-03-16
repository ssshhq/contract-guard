"use client";

import React, { useRef, useState } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import type { ReviewResult, UploadState } from "@/lib/types";

interface FileUploadProps {
  onResult: (result: ReviewResult, meta: any) => void;
  onError: (error: string) => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
];

function getStatusText(state: UploadState) {
  switch (state.status) {
    case "uploading":
      return "正在上传文件…";
    case "parsing":
      return "正在解析文件内容…";
    case "reviewing":
      return "AI正在分析合同…";
    case "done":
      return "分析完成";
    case "error":
      return "上传失败";
    default:
      return "";
  }
}

export default function FileUpload({ onResult, onError }: FileUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // reset input value so that user can upload the same file again
    e.target.value = "";
  }

  function validateFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (
      !["pdf", "docx", "doc", "txt"].includes(ext || "") ||
      (file.type && !ACCEPTED_TYPES.includes(file.type) && !ext)
    ) {
      return false;
    }
    return true;
  }

  async function handleFile(file: File) {
    if (!validateFile(file)) {
      setUploadState({
        status: "error",
        progress: 0,
        fileName: file.name,
        error: "只支持上传PDF、DOCX、DOC、TXT文件",
      });
      onError("只支持上传PDF、DOCX、DOC、TXT文件");
      return;
    }

    setUploadState({
      status: "uploading",
      progress: 10,
      fileName: file.name,
    });

    // For progress bar simulation
    function fakeProgress(target: number) {
      setUploadState((prev) => ({
        ...prev,
        progress: target
      }));
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      fakeProgress(20);
      setUploadState((prev) => ({
        ...prev,
        status: "parsing",
        progress: 35,
      }));

      const response = await fetch("/api/review", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setUploadState({
          status: "error",
          progress: 100,
          fileName: file.name,
          error: data?.error || "上传失败",
        });
        onError(data?.error || "上传失败");
        return;
      }

      setUploadState((prev) => ({
        ...prev,
        status: "reviewing",
        progress: 60,
      }));

      const res = await response.json();

      setUploadState({
        status: "done",
        progress: 100,
        fileName: file.name,
        result: res.data,
      });

      onResult(res.data, { ...(res.meta || {}), fileName: file.name });
    } catch (err: any) {
      setUploadState({
        status: "error",
        progress: 100,
        fileName: file.name,
        error: err?.message || "上传或分析失败",
      });
      onError(err?.message || "上传或分析失败");
    }
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div
        className={`
          transition-colors duration-200
          w-full max-w-3xl p-8 sm:p-10
          rounded-3xl border border-dashed
          bg-white
          shadow-[0_18px_45px_rgba(15,23,42,0.06)]
          ${
            isDragging
              ? "border-sky-400/80 ring-4 ring-sky-100"
              : "border-slate-200 hover:border-sky-400/70"
          }
          flex flex-col items-center justify-center cursor-pointer
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        role="button"
        aria-label="上传文件区域"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleChange}
        />
        {uploadState.status === "idle" && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100">
              <Upload size={34} strokeWidth={2.15} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-900 sm:text-xl">
                点击或拖拽合同文件到此处上传
              </p>
              <p className="text-xs text-slate-500 sm:text-sm">
                支持 PDF / DOCX / DOC / TXT，单个文件不超过 10MB
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                自动识别合同类型与各方主体
              </span>
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                梳理关键条款，标注风险等级
              </span>
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                生成结构化修改建议与缺失条款
              </span>
            </div>
          </div>
        )}
        {(uploadState.status === "uploading" ||
          uploadState.status === "parsing" ||
          uploadState.status === "reviewing") && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-sky-500" size={36} />
            <span className="font-semibold text-slate-900">
              {getStatusText(uploadState)}
            </span>
            <span className="text-xs text-slate-500">
              {uploadState.fileName}
            </span>
            <div className="h-2 w-72 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>
        )}
        {uploadState.status === "done" && (
          <div className="flex flex-col items-center gap-3">
            <FileText className="text-emerald-500" size={36} />
            <span className="font-semibold text-slate-900">
              分析完成，查看下方结果
            </span>
            <span className="text-xs text-slate-500">{uploadState.fileName}</span>
            <button
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-white"
              onClick={() => setUploadState({ status: "idle", progress: 0 })}
            >
              上传新文件
            </button>
          </div>
        )}
        {uploadState.status === "error" && (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="text-red-500" size={36} />
            <span className="font-semibold text-red-700">
              上传失败：{uploadState.error}
            </span>
            <button
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-white"
              onClick={() => setUploadState({ status: "idle", progress: 0 })}
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

