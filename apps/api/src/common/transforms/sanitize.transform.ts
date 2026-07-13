import { Transform } from 'class-transformer';

const HTML_TAGS_RE = /<[^>]*>/g;
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

function sanitizeString(value: any) {
  if (typeof value !== 'string')
    return value;
  return value
    .replace(HTML_TAGS_RE, '')
    .replace(CONTROL_CHARS_RE, '')
    .trim();
}

export function SanitizeText(): PropertyDecorator {
  return Transform(({ value }) => sanitizeString(value));
}

export function SanitizeEmail(): PropertyDecorator {
  return Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().replace(CONTROL_CHARS_RE, '').trim() : value);
}
