import { NextRequest, NextResponse } from "next/server";

const ACCESS_PASSWORD = "contract20260317";
const AUTH_COOKIE_NAME = "cg_auth";

function isAuthed(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value === "1";
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ authed: isAuthed(request) });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { password?: unknown }
      | null;
    const password = typeof body?.password === "string" ? body.password : "";

    if (password !== ACCESS_PASSWORD) {
      return NextResponse.json(
        { error: "访问密码错误" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

