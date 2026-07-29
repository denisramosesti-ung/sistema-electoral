// ======================= TELÉFONO PARAGUAYO =======================
// Utilidad centralizada de validación y normalización de números
// celulares paraguayos. Formato de guardado en Supabase:
//   +595981123456  (siempre internacional, 13 caracteres)
//
// Formatos de entrada aceptados:
//   0981123456
//   0981 123 456
//   +595981123456
//   +595 981 123 456

const NATIONAL_REGEX = /^09\d{8}$/; // 09 + 8 dígitos = 10 dígitos
const INTERNATIONAL_REGEX = /^\+5959\d{8}$/; // +5959 + 8 dígitos = 13 caracteres

// Máximo de caracteres que se permite escribir en el input
// (cubre el formato más largo con espacios: "+595 981 123 456")
export const MAX_TELEFONO_INPUT_LENGTH = 17;

// Quita espacios, guiones y paréntesis antes de validar/normalizar.
export const limpiarTelefono = (raw) =>
  String(raw ?? "").replace(/[\s\-()]/g, "");

// true si, una vez limpio, calza con el formato nacional o internacional.
export const esTelefonoParaguayoValido = (raw) => {
  const limpio = limpiarTelefono(raw);
  return NATIONAL_REGEX.test(limpio) || INTERNATIONAL_REGEX.test(limpio);
};

// Devuelve el número en formato internacional normalizado (+595981123456)
// o null si el valor no es un teléfono paraguayo válido.
export const normalizarTelefonoParaguayo = (raw) => {
  const limpio = limpiarTelefono(raw);
  if (INTERNATIONAL_REGEX.test(limpio)) return limpio;
  if (NATIONAL_REGEX.test(limpio)) return `+595${limpio.slice(1)}`;
  return null;
};

// Valida un valor de teléfono ingresado por el usuario.
// Retorna { valido, error, normalizado }.
export const validarTelefonoParaguayo = (raw) => {
  const value = String(raw ?? "").trim();

  if (!value) {
    return { valido: false, error: "El teléfono es obligatorio.", normalizado: null };
  }

  // Solo se permiten dígitos, "+", espacios, guiones y paréntesis como entrada.
  if (!/^[+0-9\s\-()]+$/.test(value)) {
    return {
      valido: false,
      error: "El teléfono solo puede contener números.",
      normalizado: null,
    };
  }

  const normalizado = normalizarTelefonoParaguayo(value);
  if (!normalizado) {
    return {
      valido: false,
      error: "Número inválido. Use formato 0981123456 o +595981123456.",
      normalizado: null,
    };
  }

  return { valido: true, error: null, normalizado };
};

// Filtra caracteres no permitidos mientras el usuario escribe y limita
// la longitud del input. Pensado para usarse en el onChange del campo.
export const sanitizarEntradaTelefono = (raw) => {
  let value = String(raw ?? "").replace(/[^\d+\s\-()]/g, "");

  // El "+" solo es válido como primer carácter.
  const hasLeadingPlus = value.startsWith("+");
  value = (hasLeadingPlus ? "+" : "") + value.replace(/\+/g, "");

  return value.slice(0, MAX_TELEFONO_INPUT_LENGTH);
};
