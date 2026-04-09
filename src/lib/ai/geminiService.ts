export interface GeminiTransition {
  from: string;
  read: string;
  to: string;
  write: string;
  move: 'L' | 'R' | 'S';
}

export interface GeminiTMResponse {
  states: string[];
  inputAlphabet: string[];
  tapeAlphabet: string[];
  startState: string;
  acceptState: string;
  rejectState: string;
  transitions: GeminiTransition[];
}

export type GeminiResult =
  | { ok: true; machine: GeminiTMResponse }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `You are a Turing Machine designer. When given a description, respond ONLY with a JSON object (no markdown, no code fences, no explanation) matching this exact schema:

{
  "states": ["q0", "q1", "qAccept", "qReject"],
  "inputAlphabet": ["a", "b"],
  "tapeAlphabet": ["a", "b", "X", "Y", "_"],
  "startState": "q0",
  "acceptState": "qAccept",
  "rejectState": "qReject",
  "transitions": [
    { "from": "q0", "read": "a", "to": "q1", "write": "X", "move": "R" }
  ]
}

Rules:
- Use _ for blank (not a space, not any Unicode blank character)
- The move field must be exactly "L", "R", or "S"
- Every state referenced in transitions must appear in the states array
- acceptState and rejectState must be in the states array
- startState must be in the states array
- Include a transition for every (state, symbol) pair that can be reached — the machine must be total on the states and tape alphabet it uses
- If you cannot generate a valid Turing Machine from the description, respond with exactly: {"error": "Could not generate a valid Turing Machine from this description."}
- Do NOT include any text, markdown, or code fences — only raw JSON`;

export async function generateTMFromDescription(description: string): Promise<GeminiResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    return {
      ok: false,
      error: 'No Gemini API key found. Add VITE_GEMINI_API_KEY=your_key to your .env file and restart the dev server.',
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { text: `Description: ${description}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 32768,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch {
    return { ok: false, error: 'Network error: could not reach the Gemini API. Check your connection.' };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const snippet = body.slice(0, 300);
    return { ok: false, error: `Gemini API error ${response.status}: ${snippet}` };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: 'Failed to parse the Gemini API response as JSON.' };
  }

  // Extract text from Gemini's response envelope.
  // Gemini 2.5+ (thinking models) return multiple parts: a `thought` part
  // with internal reasoning, then the actual response part. Skip thought parts.
  type GeminiPart = { text?: string; thought?: boolean };
  type GeminiCandidate = {
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  };
  const candidate = (data as { candidates?: GeminiCandidate[] })?.candidates?.[0];

  if (candidate?.finishReason === 'MAX_TOKENS') {
    return {
      ok: false,
      error: 'The model ran out of tokens while thinking. Try a simpler description.',
    };
  }

  const parts: GeminiPart[] = candidate?.content?.parts ?? [];

  const text = parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('');

  // Extract the JSON object from wherever it appears in the response.
  // Gemini 2.5 Flash often adds prose before/after the JSON despite the prompt.
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const cleaned = jsonMatch ? jsonMatch[0] : text.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      ok: false,
      error: `Gemini returned non-JSON output: ${cleaned.slice(0, 300)}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Gemini returned an unexpected response format.' };
  }

  if ('error' in parsed) {
    return { ok: false, error: String((parsed as { error: unknown }).error) };
  }

  const m = parsed as GeminiTMResponse;
  if (
    !Array.isArray(m.states) ||
    !m.startState ||
    !m.acceptState ||
    !m.rejectState ||
    !Array.isArray(m.transitions)
  ) {
    return { ok: false, error: 'Gemini response is missing required Turing Machine fields.' };
  }

  return { ok: true, machine: m };
}
