# Fix: Corrección de Nombre de Columna rol

## Problema
El código estaba usando `role` (con 'e') pero la columna real en la base de datos es `rol` (sin 'e'), causando el error:
```
column usuarios_admin.role does not exist
```

## Solución Aplicada

### Archivos Modificados

#### 1. `/src/App.jsx`
**Cambios:**
- Línea 51: `select("id,username,rol,nombre,apellido")` (era `role`)
- Línea 86-87: `admin.rol` en validación (era `admin.role`)
- Línea 95: `rol: admin.rol` en log (era `role: admin.role`)
- Línea 103: `role: admin.rol` en objeto de sesión (era `role: admin.role`)

**Nota:** El objeto `currentUser` mantiene la propiedad `role` para compatibilidad interna, pero obtiene su valor de `admin.rol` de la BD.

#### 2. `/src/utils/adminHelpers.js`
**Cambios:**
- Línea 11: JSDoc actualizado `@param {string} adminData.rol`
- Línea 26: Validación `!adminData.rol` (era `!adminData.role`)
- Línea 29: Mensaje "rol son requeridos" (era "role")
- Línea 33-34: Validación `adminData.rol` (era `adminData.role`)
- Línea 70: Insert `rol: adminData.rol` (era `role: adminData.role`)

#### 3. `/src/components/CreateAdminModal.jsx`
**Cambios:**
- Línea 13: Estado inicial `rol: "superadmin"` (era `role`)
- Línea 41: Reset de formulario `rol: "superadmin"` (era `role`)
- Línea 128-129: Select value y onChange usan `formData.rol` (era `formData.role`)

#### 4. `/scripts/create-usuarios-admin-table.sql`
**Cambios:**
- Línea 11: `rol VARCHAR(20) NOT NULL CHECK (rol IN ...)` (era `role`)
- Línea 20: Índice `idx_usuarios_admin_rol ON usuarios_admin(rol)` (era `role`)
- Línea 26: Comentario `COMMENT ON COLUMN usuarios_admin.rol` (era `role`)
- Línea 36: Insert `INSERT INTO usuarios_admin (username, password, rol, ...)` (era `role`)
- Línea 44: Mensaje de confirmación actualizado

## Verificación

### Query de prueba para verificar la columna:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios_admin';
```

### Login de prueba:
```javascript
// Debería funcionar sin errores
username: "admin"
password: "admin123"
```

## Notas Importantes

1. **Compatibilidad interna:** El objeto `currentUser` en sesión sigue usando `role` como propiedad para no romper el resto del sistema (Dashboard, permisos, etc.). Solo cambiamos la lectura/escritura a la BD.

2. **Sincronización BD-Código:** Todos los lugares que interactúan con `usuarios_admin` ahora usan `rol`:
   - SELECT queries
   - INSERT queries
   - Validaciones
   - Formularios

3. **SQL Script:** El script de creación de tabla ahora usa `rol` consistentemente, por lo que si se ejecuta en una BD nueva, creará la columna correcta.

## Próximos Pasos

1. Ejecutar el script SQL actualizado en Supabase (o hacer ALTER TABLE si la tabla ya existe)
2. Probar login de admin
3. Verificar que los logs muestren correctamente el rol del usuario
4. Probar creación de nuevo admin desde el modal

## Estado Final

✅ Todos los archivos alineados con nombre de columna `rol`
✅ SQL script actualizado
✅ Lógica de login corregida
✅ Modal de creación corregido
✅ Helpers de admin actualizados
