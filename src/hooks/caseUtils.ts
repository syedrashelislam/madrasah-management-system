// Utility to convert between snake_case (app interfaces) and camelCase (Blink SDK)

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[snakeToCamel(key)] = obj[key];
  }
  return result;
}

export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[camelToSnake(key)] = obj[key];
  }
  return result;
}

export function mapToSnake<T>(arr: Record<string, unknown>[]): T[] {
  return arr.map((item) => toSnakeCase(item) as T);
}

export function singleToSnake<T>(obj: Record<string, unknown>): T {
  return toSnakeCase(obj) as T;
}
