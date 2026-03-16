import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parse-file";
import { reviewContract } from "@/lib/ai-review";

export const maxDuration = 60; // Vercel函数最大运行60秒

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    // 检查文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小不能超过10MB" }, { status: 400 });
    }

    // 1. 解析文件 → 提取文字
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parseFile(buffer, file.name);

    if (text.trim().length < 50) {
      return NextResponse.json(
        { error: "文件内容过少，无法进行有效审查。请确认上传了正确的合同文件。" },
        { status: 400 }
      );
    }

    // 2. AI审查
    const result = await reviewContract(text);

    // 3. 返回结果
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        fileName: file.name,
        fileSize: file.size,
        textLength: text.length,
        reviewedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("审查失败:", error);
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
