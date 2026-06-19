export type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenAIResponse = {
  content: string;
  model: string;
};

export async function callOpenAI(
  messages: OpenAIMessage[],
  options?: { maxRetries?: number },
): Promise<OpenAIResponse> {
  const maxRetries = options?.maxRetries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${body}`);
      }

      const json = await res.json();
      return {
        content: json.choices[0].message.content,
        model: json.model,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error('OpenAI call failed');
}
