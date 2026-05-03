/**
 * AI Code Assistant API
 * POST /api/ai/chat       — streaming or non-streaming chat with GPT
 * POST /api/ai/complete   — single code completion for editor inline suggestions
 */
import { Router } from "express";
import { optionalAuth } from "../middlewares/require-auth";
import { logger } from "../lib/logger";
import OpenAI from "openai";

const router = Router();

function getOpenAIClient(): OpenAI | null {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey  = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseURL || !apiKey) return null;
  return new OpenAI({ baseURL, apiKey });
}

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
// Pass `stream: true` in the request body to receive a text/event-stream SSE
// response with `data: {"delta":"..."}` lines.  Omit for classic JSON reply.

router.post("/ai/chat", optionalAuth, async (req, res) => {
  const { messages, stream: wantStream } = req.body as {
    messages?: { role: string; content: string }[];
    stream?: boolean;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const client = getOpenAIClient();
  if (!client) {
    res.status(503).json({
      error: "AI service not configured. Add the OpenAI integration in Replit to enable AI features.",
    });
    return;
  }

  const mappedMessages = messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));

  // ── Streaming SSE ──────────────────────────────────────────────────────────
  if (wantStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      const stream = await client.chat.completions.create({
        model: "gpt-4.1",
        max_completion_tokens: 4096,
        messages: mappedMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) {
          res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      logger.error({ err }, "AI stream failed");
      const msg = err instanceof Error ? err.message : "AI request failed";
      try { res.write(`data: ${JSON.stringify({ error: msg })}\n\n`); res.end(); } catch { /* ignore */ }
    }
    return;
  }

  // ── Non-streaming JSON ─────────────────────────────────────────────────────
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 4096,
      messages: mappedMessages,
    });

    const reply = completion.choices[0]?.message?.content ?? "No response generated.";
    res.json({ reply });
  } catch (err) {
    logger.error({ err }, "AI chat failed");
    const msg = err instanceof Error ? err.message : "AI request failed";
    res.status(500).json({ error: msg });
  }
});

// ── POST /api/ai/complete ─────────────────────────────────────────────────────
// Fast inline code completion.
// Body: { prefix: string, suffix?: string, filename?: string }
// Returns: { completion: string }

const EXT_TO_LANG: Record<string, string> = {
  js: "JavaScript", jsx: "JavaScript (JSX)", ts: "TypeScript", tsx: "TypeScript (TSX)",
  py: "Python", sh: "Bash", bash: "Bash", pl: "Perl",
  c: "C", h: "C header", cpp: "C++", cxx: "C++", cc: "C++", hpp: "C++ header",
  html: "HTML", htm: "HTML", css: "CSS", scss: "SCSS",
  json: "JSON", md: "Markdown", rs: "Rust", go: "Go",
  java: "Java", kt: "Kotlin", dart: "Dart", swift: "Swift",
};

router.post("/ai/complete", optionalAuth, async (req, res) => {
  const { prefix, suffix, filename } = req.body as {
    prefix?: string;
    suffix?: string;
    filename?: string;
  };

  if (!prefix) {
    res.status(400).json({ error: "prefix is required" });
    return;
  }

  const client = getOpenAIClient();
  if (!client) {
    res.status(503).json({ error: "AI not configured" });
    return;
  }

  const ext  = filename?.split(".").pop()?.toLowerCase() ?? "js";
  const lang = EXT_TO_LANG[ext] ?? "code";

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      max_completion_tokens: 256,
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content:
            `You are an inline code completion engine for ${lang}. ` +
            `Output ONLY the raw code to insert at [CURSOR] — no explanation, no markdown fences. ` +
            `Match the surrounding indent and style. Complete the current expression, statement, ` +
            `or small block naturally. Stop at a logical boundary. If nothing useful, output nothing.`,
        },
        {
          role: "user",
          content:
            `${prefix.slice(-800)}[CURSOR]${suffix ? suffix.slice(0, 200) : ""}`,
        },
      ],
    });

    const text = (completion.choices[0]?.message?.content ?? "").trim();
    res.json({ completion: text });
  } catch (err) {
    logger.error({ err }, "AI complete failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "AI completion failed" });
  }
});

export default router;
