const DEFAULT_DECIMAL_SCALE = 8;
const BIG_ZERO = BigInt(0);
const BIG_ONE = BigInt(1);
const BIG_TWO = BigInt(2);
const BIG_TEN = BigInt(10);

function sanitizeDecimalInput(value: string) {
  const trimmed = value.trim().replace(/,/g, ".");

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(".")) {
    return `0${trimmed}`;
  }

  return trimmed;
}

function isValidUnsignedDecimal(value: string) {
  return /^\d+(?:\.\d+)?$/.test(value);
}

function formatScaledBigInt(value: bigint, scale: number) {
  const sign = value < BIG_ZERO ? "-" : "";
  const absolute = value < BIG_ZERO ? -value : value;
  const digits = absolute.toString().padStart(scale + 1, "0");
  const integerPart = digits.slice(0, digits.length - scale) || "0";
  const fractionalPart = digits.slice(digits.length - scale).replace(/0+$/, "");

  return fractionalPart ? `${sign}${integerPart}.${fractionalPart}` : `${sign}${integerPart}`;
}

function pow10(exp: number) {
  return BIG_TEN ** BigInt(exp);
}

function toScaledBigInt(value: string, scale: number) {
  const [wholePart, fractionalPart = ""] = value.split(".");
  const safeWhole = wholePart || "0";
  const paddedFraction = fractionalPart.padEnd(scale + 1, "0");
  const keptFraction = paddedFraction.slice(0, scale);
  const nextDigit = paddedFraction[scale] ?? "0";
  const base = BigInt(`${safeWhole}${keptFraction || ""}` || "0");

  if (nextDigit >= "5") {
    return base + BIG_ONE;
  }

  return base;
}

export function parsePositiveInteger(value: string) {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function normalizeDecimalString(
  value: string,
  options?: {
    allowZero?: boolean;
    scale?: number;
  }
) {
  const sanitized = sanitizeDecimalInput(value);
  const scale = options?.scale ?? DEFAULT_DECIMAL_SCALE;
  const allowZero = options?.allowZero ?? false;

  if (!sanitized || !isValidUnsignedDecimal(sanitized)) {
    return null;
  }

  const scaledValue = toScaledBigInt(sanitized, scale);

  if (scaledValue < BIG_ZERO || (!allowZero && scaledValue === BIG_ZERO)) {
    return null;
  }

  return formatScaledBigInt(scaledValue, scale);
}

export function normalizeOptionalDecimalString(
  value: string,
  options?: {
    scale?: number;
  }
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return normalizeDecimalString(trimmed, {
    allowZero: true,
    scale: options?.scale,
  });
}

export function divideDecimalStringByInteger(
  value: string,
  divisor: number,
  scale = DEFAULT_DECIMAL_SCALE
) {
  const sanitized = sanitizeDecimalInput(value);

  if (!sanitized || !isValidUnsignedDecimal(sanitized) || !Number.isInteger(divisor) || divisor <= 0) {
    return null;
  }

  const [wholePart, fractionalPart = ""] = sanitized.split(".");
  const numerator = BigInt(`${wholePart}${fractionalPart}` || "0");
  const sourceScale = fractionalPart.length;
  const divisorScaled = BigInt(divisor) * pow10(sourceScale);
  const dividend = numerator * pow10(scale);
  let quotient = dividend / divisorScaled;
  const remainder = dividend % divisorScaled;

  if (remainder * BIG_TWO >= divisorScaled) {
    quotient += BIG_ONE;
  }

  if (quotient <= BIG_ZERO) {
    return null;
  }

  return formatScaledBigInt(quotient, scale);
}
