# DIAGNÓSTICO - Login de Administradores

## Cambios Realizados

Se agregaron logs detallados en el flujo de login de admin para diagnosticar exactamente qué está fallando.

## Qué Buscar en la Consola

### 1. Cuando intentas login con admin + password, deberías ver:

```
[v0] Admin login attempt { username: "admin", hasPassword: true }
```

### 2. Después de la consulta a Supabase, verás:

```
[v0] Supabase response: {
  data: { ... },
  error: null | { ... },
  errorMessage: "...",
  errorDetails: "...",
  errorHint: "...",
  errorCode: "..."
}
```

## Posibles Escenarios

### ESCENARIO A: Error de Supabase (error no es null)

**Logs esperados:**
```
[v0] Admin login failed - Database error: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

**Posibles causas:**

1. **Tabla no existe**
   - Error: "relation 'usuarios_admin' does not exist"
   - Solución: Ejecutar el script `scripts/create-usuarios-admin-table.sql` en Supabase

2. **Permisos RLS (Row Level Security)**
   - Error: "permission denied" o "new row violates row-level security"
   - Solución: Deshabilitar RLS en la tabla o agregar políticas:
     ```sql
     ALTER TABLE usuarios_admin DISABLE ROW LEVEL SECURITY;
     ```
     O crear política:
     ```sql
     CREATE POLICY "Enable read access for all users" 
     ON usuarios_admin FOR SELECT 
     USING (true);
     ```

3. **Columna no existe**
   - Error: "column 'username' does not exist"
   - Solución: Verificar schema de la tabla

### ESCENARIO B: Sin error pero data es null

**Logs esperados:**
```
[v0] Supabase response: {
  data: null,
  error: null,
  ...
}
[v0] Admin login failed - Invalid credentials (no data returned)
```

**Causa:** Usuario o contraseña incorrectos (la tabla existe y funciona, pero no hay match)

**Verificar:**
1. Usuario existe en la tabla: `SELECT * FROM usuarios_admin WHERE username = 'admin';`
2. Password es exacto: `SELECT * FROM usuarios_admin WHERE username = 'admin' AND password = 'admin123';`

### ESCENARIO C: Login exitoso

**Logs esperados:**
```
[v0] Supabase response: {
  data: { id: 1, username: "admin", role: "owner", ... },
  error: null
}
[v0] Admin login success { username: "admin", role: "owner", nombre: "Administrador" }
```

## Verificaciones en Supabase

### 1. Verificar que la tabla existe:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'usuarios_admin';
```

### 2. Verificar datos en la tabla:

```sql
SELECT * FROM usuarios_admin;
```

### 3. Verificar RLS:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'usuarios_admin';
```

Si `rowsecurity = true`, necesitas políticas o deshabilitarlo.

### 4. Ver políticas existentes:

```sql
SELECT * FROM pg_policies WHERE tablename = 'usuarios_admin';
```

## Solución Rápida si RLS está bloqueando

Ejecutar en Supabase SQL Editor:

```sql
-- Deshabilitar RLS temporalmente para testing
ALTER TABLE usuarios_admin DISABLE ROW LEVEL SECURITY;

-- O crear política permisiva
CREATE POLICY "allow_all_usuarios_admin" 
ON usuarios_admin 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

## Nombre de Tabla Confirmado

El nombre exacto de la tabla es: `usuarios_admin` (todo minúscula, con underscore)

**Query en el código:**
```javascript
.from("usuarios_admin")  // ✅ CORRECTO
```

## Próximos Pasos

1. Intenta hacer login con `admin` / `admin123`
2. Abre la consola del navegador (F12)
3. Busca los logs `[v0]`
4. Comparte el output completo de `[v0] Supabase response`
5. Con esa información sabremos exactamente qué está fallando
