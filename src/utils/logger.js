const sensitive =
  /password|token|secret|otp|authorization|cookie|api_key|api_secret/i;
const redact = (value) => {
  if (value instanceof Error) return { name: value.name, code: value.code };
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitive.test(key) ? "[REDACTED]" : redact(entry),
      ]),
    );
  return value;
};
const write = (level, message) => {
  const record = {
    time: new Date().toISOString(),
    level,
    ...(typeof message === "object" ? redact(message) : { message }),
  };
  (level === "error" ? console.error : console.log)(JSON.stringify(record));
};
export default {
  info: (message) => write("info", message),
  error: (message) => write("error", message),
};
