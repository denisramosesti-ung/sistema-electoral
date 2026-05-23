import { supabase } from "../supabaseClient";

/**
 * Crear un nuevo usuario administrador en la tabla usuarios_admin
 * Solo puede ser ejecutado por usuarios con role 'owner'
 * 
 * @param {Object} currentUser - Usuario actual (debe tener role: 'owner')
 * @param {Object} adminData - Datos del nuevo admin
 * @param {string} adminData.username - Nombre de usuario único
 * @param {string} adminData.password - Contraseña
 * @param {string} adminData.rol - 'owner' o 'superadmin'
 * @returns {Promise<{success: boolean, message: string, data?: Object}>}
 */
export async function crearUsuarioAdmin(currentUser, adminData) {
  // Validar permisos
  if (!currentUser || currentUser.role !== "owner") {
    return {
      success: false,
      message: "Solo usuarios con role 'owner' pueden crear administradores.",
    };
  }

  // Validar datos requeridos
  if (!adminData.username || !adminData.password || !adminData.rol) {
    return {
      success: false,
      message: "Username, password y rol son requeridos.",
    };
  }

  // Validar rol
  if (!["owner", "superadmin"].includes(adminData.rol)) {
    return {
      success: false,
      message: "Rol debe ser 'owner' o 'superadmin'.",
    };
  }

  try {
    // Verificar si el username ya existe
    const { data: existing, error: checkErr } = await supabase
      .from("usuarios_admin")
      .select("username")
      .eq("username", adminData.username)
      .maybeSingle();

    if (checkErr) {
      console.error("[v0] Error verificando username existente:", checkErr);
      return {
        success: false,
        message: "Error verificando username existente.",
      };
    }

    if (existing) {
      return {
        success: false,
        message: "El username ya existe.",
      };
    }

    // Crear el nuevo admin
    const { data: newAdmin, error: insertErr } = await supabase
      .from("usuarios_admin")
      .insert({
        username: adminData.username,
        password: adminData.password, // NOTA: En producción, usar hashing seguro
        rol: adminData.rol,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[v0] Error creando admin:", insertErr);
      return {
        success: false,
        message: "Error al crear el administrador.",
      };
    }

    return {
      success: true,
      message: "Administrador creado exitosamente.",
      data: newAdmin,
    };
  } catch (err) {
    console.error("[v0] Error en crearUsuarioAdmin:", err);
    return {
      success: false,
      message: "Error inesperado al crear administrador.",
    };
  }
}

/**
 * Verificar si el usuario actual es 'owner'
 * @param {Object} currentUser - Usuario actual
 * @returns {boolean}
 */
export function isOwner(currentUser) {
  return currentUser && currentUser.role === "owner";
}

/**
 * Verificar si el usuario actual tiene permisos de admin (owner o superadmin)
 * @param {Object} currentUser - Usuario actual
 * @returns {boolean}
 */
export function isAdmin(currentUser) {
  return (
    currentUser &&
    (currentUser.role === "owner" || currentUser.role === "superadmin")
  );
}
