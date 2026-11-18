/**
 * Client-side field validators aligned with backend Express validation schemas.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KEY_PREFIX_REGEX = /^[A-Za-z][A-Za-z0-9]{1,9}$/;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const FULL_NAME_ALLOWED_REGEX = /^[\p{L}\s'.-]+$/u;
const FULL_NAME_DISALLOWED_CHARS_REGEX = /[^\p{L}\s'.-]/gu;

/**
 * Strip disallowed characters (digits like 0-9 and symbols like %, #, $, etc.) from a name string.
 * @param {string} value
 * @returns {{ sanitized: string, hadDisallowed: boolean }}
 */
export function sanitizeFullNameInput(value) {
  const raw = value || '';
  const sanitized = raw.replace(FULL_NAME_DISALLOWED_CHARS_REGEX, '');
  return {
    sanitized,
    hadDisallowed: sanitized !== raw,
  };
}

/**
 * Validate a user's full name (letters, spaces, hyphens, apostrophes, periods only).
 * @param {string} value
 * @returns {string | null}
 */
export function validateFullName(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 2 || trimmed.length > 120) {
    return 'Full name must be between 2 and 120 characters.';
  }
  if (!FULL_NAME_ALLOWED_REGEX.test(trimmed)) {
    return 'Full name cannot contain numbers or special characters (such as 0, %, #, $).';
  }
  return null;
}

/**
 * Validate an email address.
 * @param {string} value
 * @returns {string | null} Error message or null when valid.
 */
export function validateEmail(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Email is required.';
  if (trimmed.length > 255) return 'Email must be 255 characters or fewer.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address.';
  return null;
}

/**
 * Validate password strength for registration or password change.
 * @param {string} value
 * @returns {string | null}
 */
export function validatePassword(value) {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 128) return 'Password must be 128 characters or fewer.';
  if (/\s/.test(value)) return 'Password cannot contain spaces.';
  return null;
}

/**
 * Evaluate password strength and produce actionable warnings for signup UX.
 * @param {string} password
 */
export function evaluatePasswordStrength(password) {
  const value = password || '';
  const checks = {
    minLength: value.length >= 8,
    hasUpper: /[A-Z]/.test(value),
    hasLower: /[a-z]/.test(value),
    hasNumber: /\d/.test(value),
    hasSpecial: /[^A-Za-z0-9\s]/.test(value),
    hasNoSpaces: !/\s/.test(value),
  };

  const warnings = [];
  if (!checks.hasNoSpaces) warnings.push('Remove spaces from your password.');
  if (!checks.minLength) warnings.push('Use at least 8 characters.');
  if (!checks.hasUpper) warnings.push('Add an uppercase letter (A-Z).');
  if (!checks.hasLower) warnings.push('Add a lowercase letter (a-z).');
  if (!checks.hasNumber) warnings.push('Include at least one number (0-9).');
  if (!checks.hasSpecial) warnings.push('Include a special symbol (e.g. !@#$%).');
  if (/(.)\1{3,}/.test(value)) {
    warnings.push('Avoid repeating the same character 4 or more times.');
  }

  let score = 0;
  if (checks.minLength) score += 1;
  if (checks.hasUpper && checks.hasLower) score += 1;
  if (checks.hasNumber) score += 1;
  if (checks.hasSpecial) score += 1;

  if (!checks.minLength || !checks.hasNoSpaces) {
    score = Math.min(score, 1);
  }
  if (value.length >= 12 && score >= 3 && checks.hasNoSpaces) {
    score = 4;
  }

  const levels = [
    { level: 'empty', label: '' },
    { level: 'weak', label: 'Weak' },
    { level: 'fair', label: 'Fair' },
    { level: 'good', label: 'Good' },
    { level: 'strong', label: 'Strong' },
  ];

  const activeScore = value.length === 0 ? 0 : Math.max(1, Math.min(4, score));
  const { level, label } = levels[activeScore];

  return {
    score: activeScore,
    level,
    label,
    checks,
    warnings,
  };
}

/**
 * Validate a project's key prefix (2-10 alphanumeric chars starting with a letter).
 * @param {string} value
 * @returns {string | null}
 */
export function validateProjectKeyPrefix(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Key prefix is required.';
  if (!KEY_PREFIX_REGEX.test(trimmed)) {
    return 'Key prefix must be 2-10 alphanumeric characters starting with a letter.';
  }
  return null;
}

/**
 * Validate a 6-digit hex color code (e.g. #2563EB).
 * @param {string} value
 * @returns {string | null}
 */
export function validateHexColor(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Color is required.';
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return 'Color must be a valid 6-digit hex value (e.g. #2563EB).';
  }
  return null;
}

/**
 * Validate an optional HTTP/HTTPS URL (allows empty string to clear avatar_url).
 * @param {string} value
 * @returns {string | null}
 */
export function validateHttpUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  if (trimmed.length > 500) return 'URL must be 500 characters or fewer.';
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL must start with http:// or https://.';
    }
    return null;
  } catch {
    return 'Enter a valid URL.';
  }
}
