export type ValidationResult = {
  valid: boolean;
  message?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { valid: false, message: 'Informe um e-mail.' };
  }
  if (!emailPattern.test(email.trim())) {
    return { valid: false, message: 'E-mail inválido.' };
  }
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return { valid: false, message: 'Senha precisa ter ao menos 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Inclua pelo menos uma letra maiúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Inclua pelo menos um número.' };
  }
  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, message: 'Informe um nome válido.' };
  }
  return { valid: true };
}

export function validateLatitude(value: string): ValidationResult {
  const parsed = Number(value.replace(',', '.'));
  if (Number.isNaN(parsed)) {
    return { valid: false, message: 'Latitude inválida.' };
  }
  if (parsed < -90 || parsed > 90) {
    return { valid: false, message: 'Latitude deve estar entre -90 e 90.' };
  }
  return { valid: true };
}

export function validateLongitude(value: string): ValidationResult {
  const parsed = Number(value.replace(',', '.'));
  if (Number.isNaN(parsed)) {
    return { valid: false, message: 'Longitude inválida.' };
  }
  if (parsed < -180 || parsed > 180) {
    return { valid: false, message: 'Longitude deve estar entre -180 e 180.' };
  }
  return { valid: true };
}

export function parseCoordinate(lat: string, lng: string): { lat: number; lng: number } | null {
  const latNum = Number(lat.replace(',', '.'));
  const lngNum = Number(lng.replace(',', '.'));
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return null;
  }
  return { lat: latNum, lng: lngNum };
}
