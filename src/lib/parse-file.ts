export async function parseFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === "docx" || ext === "doc") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8");
  }

  throw new Error(`不支持的文件格式: .${ext}，请上传 PDF、DOCX 或 TXT 文件`);
}