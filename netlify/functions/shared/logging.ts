// Structured logging that never records secrets or private form content.

type Fields = Record<string, string | number | boolean | null | undefined>;

const REDACT = /(key|secret|token|password|authorization|reason|message|note|dob|email|phone)/i;

function safeFields(fields: Fields): Fields {
  const out: Fields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (REDACT.test(k)) {
      out[k] = "[redacted]";
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function logInfo(fn: string, message: string, fields: Fields = {}): void {
  console.log(JSON.stringify({ level: "info", fn, message, ...safeFields(fields) }));
}

export function logError(fn: string, message: string, fields: Fields = {}): void {
  console.error(JSON.stringify({ level: "error", fn, message, ...safeFields(fields) }));
}
