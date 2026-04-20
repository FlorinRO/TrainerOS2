const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';

type AnthropicRole = 'user' | 'assistant';

export interface AnthropicMessage {
  role: AnthropicRole;
  content: string;
}

interface AnthropicTextOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

function getApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return apiKey;
}

function buildHeaders(stream = false): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-api-key': getApiKey(),
    'anthropic-version': '2023-06-01',
    accept: stream ? 'text/event-stream' : 'application/json',
  };
}

function sanitizeMessages(messages: AnthropicMessage[]): AnthropicMessage[] {
  return messages
    .filter((message) => (message.role === 'user' || message.role === 'assistant') && message.content.trim().length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function extractText(payload: any): string {
  if (!Array.isArray(payload?.content)) {
    return '';
  }

  return payload.content
    .filter((block: any) => block?.type === 'text' && typeof block?.text === 'string')
    .map((block: any) => block.text)
    .join('');
}

export async function createAnthropicText(
  messages: AnthropicMessage[],
  options: AnthropicTextOptions = {}
): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      system: options.system,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      messages: sanitizeMessages(messages),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  return extractText(payload).trim();
}

export async function streamAnthropicText(
  messages: AnthropicMessage[],
  options: AnthropicTextOptions & {
    signal?: AbortSignal;
    onText: (chunk: string) => void;
  }
): Promise<void> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: buildHeaders(true),
    signal: options.signal,
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      system: options.system,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
      messages: sanitizeMessages(messages),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic stream failed (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error('Anthropic stream response body is empty');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  const processEvent = (rawEvent: string) => {
    const trimmed = rawEvent.trim();
    if (!trimmed) {
      return;
    }

    const lines = trimmed.split('\n');
    let eventName = '';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    const dataText = dataLines.join('\n');
    if (!dataText || dataText === '[DONE]') {
      return;
    }

    const payload = JSON.parse(dataText);
    if (eventName === 'content_block_delta' && payload?.delta?.type === 'text_delta') {
      options.onText(payload.delta.text || '');
    }
  };

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });

    let boundaryIndex = buffer.indexOf('\n\n');
    while (boundaryIndex !== -1) {
      processEvent(buffer.slice(0, boundaryIndex));
      buffer = buffer.slice(boundaryIndex + 2);
      boundaryIndex = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) {
    processEvent(buffer);
  }
}
