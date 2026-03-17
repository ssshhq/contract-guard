// src/lib/ai-review.ts （DeepSeek版本）

import OpenAI from "openai";
import type { ReviewResult } from "./types";

function createClient(apiKey?: string) {
  const resolvedKey = apiKey?.trim() || process.env.DEEPSEEK_API_KEY;
  if (!resolvedKey) {
    throw new Error("缺少DEEPSEEK_API_KEY，请在服务端配置环境变量或传入用户API Key");
  }
  return new OpenAI({
    apiKey: resolvedKey,
    baseURL: "https://api.deepseek.com", // 指向DeepSeek
  });
}

const SYSTEM_PROMPT = `你是一位拥有20年经验的资深法务顾问AI，专精合同审查与风险评估。

你的任务是对用户提交的合同文本进行全面、专业的审查。

请严格按照以下JSON格式返回结果（不要返回任何其他内容，只返回纯JSON）：

{
  "summary": "合同概要，50字以内",
  "contract_type": "合同类型，如：劳动合同、租赁合同、采购合同、技术服务合同等",
  "parties": ["甲方名称", "乙方名称"],
  "overall_risk": "高|中|低",
  "overall_score": 75,
  "overall_comment": "总体评价，100字以内",
  "risk_items": [
    {
      "clause": "摘录合同中的原文（50字以内）",
      "risk_level": "高|中|低",
      "category": "违约责任|知识产权|竞业限制|付款条件|终止条款|保密义务|争议解决|模糊条款|权利义务失衡|其他",
      "reason": "为什么这是一个风险点，要专业且易懂",
      "suggestion": "具体的修改建议"
    }
  ],
  "missing_clauses": [
    {
      "clause_name": "缺失条款名称",
      "importance": "必要|建议",
      "description": "为什么需要这个条款"
    }
  ],
  "highlights": ["合同中写得好的条款或亮点"]
}

审查要点：
1. 识别对一方明显不利的条款
2. 检查违约金是否过高或过低
3. 检查管辖权和争议解决条款
4. 检查保密条款的范围和期限
5. 检查终止/解除条件是否合理
6. 检查付款条件和验收标准
7. 检查知识产权归属
8. 识别模糊表述（如"合理"、"适当"等未量化的表述）
9. 检查是否缺少常见必要条款

评分标准：
- 90-100: 条款完善，风险极低
- 70-89: 大体合理，有少量需注意的问题
- 50-69: 存在明显风险，建议修改
- 0-49: 风险较高，强烈建议法务介入`;

export async function reviewContract(
  text: string,
  options?: { apiKey?: string; model?: string }
): Promise<ReviewResult> {
  const truncatedText = text.slice(0, 15000);
  const client = createClient(options?.apiKey);
  const model = (options?.model || "").trim() || "deepseek-chat";

  const response = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    response_format: { type: "json_object" },  // 强制返回JSON
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `请审查以下合同文本：\n\n---\n${truncatedText}\n---` },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("AI未返回内容");
  }

  try {
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }
    return JSON.parse(jsonStr) as ReviewResult;
  } catch {
    throw new Error("AI返回格式解析失败，请重试");
  }
}
