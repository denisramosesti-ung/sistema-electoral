// ======================= TELÉFONO PARAGUAYO =======================
// Utilidad centralizada de validación y normalización de números
// celulares paraguayos. El prefijo "+595" es fijo y no editable; el
// usuario solo escribe la parte editable (9 dígitos, empieza con "9").
//
// Ejemplo:
//   Prefijo fijo:     +595
//   Parte editable:   981123456   (9 dígitos, /^9\d{8}$/)
//   Guardado final:    +595981123456
//
// El formato final coincide exactamente con el CHECK existente en
// Supabase: ^\+5959[0-9]{8}$ — no requiere cambios en la base de datos.

// Prefijo fijo mostrado junto al input, no editable por el usuario.
export const PREFIJO_PY = "+595";

// Cantidad exacta de dígitos que debe tener la parte editable.
export const MAX_TELEFONO_INPUT_LENGTH = 9;

// La parte editable siempre debe empezar con "9" y tener 9 dígitos.
const PARTE_EDITABLE_REGEX = /^9\d{8}$/;

// Deja solo dígitos en el valor recibido, y si el usuario tecleó o pegó
// el "595" del prefijo internacional o el "0" inicial nacional, los
// quita para dejar únicamente la parte editable. Recorta a 9 dígitos
// como máximo.
export const sanitizarEntradaTelefono = (raw) => {
  let digits = String(raw ?? "").replace(/\D/g, "");

  if (digits.startsWith("595")) {
    digits = digits.slice(3);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, MAX_TELEFONO_INPUT_LENGTH);
};

// Valida la parte editable (sin el prefijo +595) ingresada por el usuario.
// Retorna { valido, error, normalizado }; normalizado es el número
// completo en formato internacional (+5959XXXXXXXX) listo para guardar.
export const validarTelefonoParaguayo = (parteEditableRaw) => {
  const parte = sanitizarEntradaTelefono(parteEditableRaw);

  if (!parte) {
    return { valido: false, error: "El teléfono es obligatorio.", normalizado: null };
  }

  if (!PARTE_EDITABLE_REGEX.test(parte)) {
    return {
      valido: false,
      error: "Ingrese un celular paraguayo válido. Ejemplo: 981123456",
      normalizado: null,
    };
  }

  return { valido: true, error: null, normalizado: `${PREFIJO_PY}${parte}` };
};

// Dado un teléfono ya guardado en Supabase (+5959XXXXXXXX), devuelve solo
// la parte editable (sin el prefijo) para precargar el input al editar.
export const extraerParteEditable = (telefonoGuardado) => {
  const value = String(telefonoGuardado ?? "").trim();
  const sinPrefijo = value.startsWith(PREFIJO_PY) ? value.slice(PREFIJO_PY.length) : value;
  return sanitizarEntradaTelefono(sinPrefijo);
};
