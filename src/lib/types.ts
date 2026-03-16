// 审查结果的完整类型定义

export interface RiskItem {
    clause: string;           // 原文摘录
    risk_level: "高" | "中" | "低";
    category: string;         // 风险类别
    reason: string;           // 风险原因
    suggestion: string;       // 修改建议
  }
  
  export interface MissingClause {
    clause_name: string;
    importance: "必要" | "建议";
    description: string;
  }
  
  export interface ReviewResult {
    summary: string;           // 合同概要
    contract_type: string;     // 合同类型
    parties: string[];         // 合同各方
    overall_risk: "高" | "中" | "低";
    overall_score: number;     // 0-100分
    overall_comment: string;   // 总体评价
    risk_items: RiskItem[];
    missing_clauses: MissingClause[];
    highlights: string[];      // 合同亮点/优势条款
  }
  
  export interface UploadState {
    status: "idle" | "uploading" | "parsing" | "reviewing" | "done" | "error";
    progress: number;
    fileName?: string;
    result?: ReviewResult;
    error?: string;
  }
