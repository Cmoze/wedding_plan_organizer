import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

/**
 * Server-only Claude wrapper. ANTHROPIC_API_KEY never leaves the server: call these functions
 * from Route Handlers or Server Actions, never from a Client Component.
 */

export const AI_MODEL = "claude-opus-5-5";

export type AiErrorCode =
  /** No API key, network trouble or Claude is down. The app should carry on without AI. */
  | "unavailable"
  /** Our own per-user limit or Anthropic's rate limit. */
  | "rate_limited"
  /** Claude declined, or the answer didn't match the expected shape. */
  | "bad_output";

export class AiError extends Error {
  constructor(
    message: string,
    readonly code: AiErrorCode,
  ) {
    super(message);
    this.name = "AiError";
  }
}

/** False when ANTHROPIC_API_KEY isn't set; AI features should hide or fall back. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!isAiConfigured())
    throw new AiError("The AI helper isn't set up yet", "unavailable");
  // Short timeout and one retry: a slow AI answer should never hang a screen.
  client ??= new Anthropic({ maxRetries: 1, timeout: 45_000 });
  return client;
}

function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (error instanceof Anthropic.RateLimitError)
    return new AiError("The AI helper is busy, try again soon", "rate_limited");
  if (error instanceof Anthropic.BadRequestError)
    return new AiError(
      `AI request was rejected: ${error.message}`,
      "bad_output",
    );
  // Auth, overload, 5xx, timeouts and network errors: treat AI as down.
  return new AiError("The AI helper is unavailable right now", "unavailable");
}

/**
 * One Claude call that returns JSON validated against `schema`.
 * Throws AiError; callers turn that into a friendly message or a non-AI fallback.
 */
export async function generateStructured<T extends z.ZodType>(options: {
  schema: T;
  system: string;
  prompt: string;
  /** `low` for quick extraction, `medium` (the model default) for more judgment. */
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<z.infer<T>> {
  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: AI_MODEL,
      max_tokens: options.maxTokens ?? 8000,
      // If a safety classifier declines, the API retries on a suitable model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: options.effort ?? "medium",
        format: betaZodOutputFormat(options.schema),
      },
      system: options.system,
      messages: [{ role: "user", content: options.prompt }],
    });
  } catch (error) {
    console.error("[ai] request failed", error);
    throw toAiError(error);
  }
  if (response.stop_reason === "refusal")
    throw new AiError(
      "The AI helper couldn't help with this one",
      "bad_output",
    );
  if (response.stop_reason === "max_tokens" || !response.parsed_output)
    throw new AiError("The AI helper gave an incomplete answer", "bad_output");
  return response.parsed_output as z.infer<T>;
}
