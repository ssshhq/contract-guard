import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parse-file";
import { reviewContract } from "@/lib/ai-review";

export const maxDuration = 60; // Vercel函数最大运行60秒

export async function POST(request: NextRequest) {
  try {
    // 访问密码门控（仅允许已验证用户调用审查接口）
    const authed = request.cookies.get("cg_auth")?.value === "1";
    if (!authed) {
      return NextResponse.json({ error: "未授权访问，请先输入访问密码" }, { status: 401 });
    }

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

    const userApiKeyRaw = request.headers.get("x-api-key") || "";
    const userApiKey = userApiKeyRaw.trim();
    const userModelRaw = request.headers.get("x-model") || "";
    const userModel = userModelRaw.trim();

    // 免费额度：未提供用户Key时，仅允许1次（用cookie计数）
    if (!userApiKey) {
      const used = request.cookies.get("cg_free_used")?.value === "1";
      if (used) {
        return NextResponse.json(
          { error: "免费额度已用完（1次）。请在“设置”中填写自己的API Key继续使用。" },
          { status: 429 }
        );
      }
    }

    // 2. AI审查
    const result = await reviewContract(text, {
      apiKey: userApiKey || undefined,
      model: userModel || undefined,
    });

    // 3. 返回结果
    const res = NextResponse.json({
      success: true,
      data: result,
      meta: {
        fileName: file.name,
        fileSize: file.size,
        textLength: text.length,
        reviewedAt: new Date().toISOString(),
        model: userModel || "deepseek-chat",
        usedUserKey: Boolean(userApiKey),
      },
    });
    if (!userApiKey) {
      res.cookies.set({
        name: "cg_free_used",
        value: "1",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  } catch (error: unknown) {
    console.error("审查失败:", error);
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
