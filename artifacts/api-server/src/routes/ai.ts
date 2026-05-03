/**
 * AI Code Assistant API
 * POST /api/ai/chat — send a conversation to GPT and receive a reply
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

router.post("/ai/chat", optionalAuth, async (req, res) => {
  const { messages } = req.body as {
    messages?: { role: string; content: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const client = getOpenAIClient();
  if (!client) {
    res.status(503).json({
      error: "AI service not configured. Set AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY.",
    });
    return;
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4096,
      messages: messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
    });

    const reply = completion.choices[0]?.message?.content ?? "No response generated.";
    res.json({ reply });
  } catch (err) {
    logger.error({ err }, "AI chat failed");
    const msg = err instanceof Error ? err.message : "AI request failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
