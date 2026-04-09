# Implementación de Login Híbrido para Administradores

## Resumen

Se implementó un sistema de autenticación híbrida que permite login de administradores desde la tabla `usuarios_admin` en Supabase, manteniendo 100% la funcionalidad existente para coordinadores, subcoordinadores y superadmins locales.

---

## Cambios Realizados

### 1. **App.jsx** - Login Híbrido

#### Nuevos estados:
```javascript
const [loginUsername, setLoginUsername] = useState("");
```

#### Lógica de login extendida:
- **PRIMERO**: Si hay `username` + `password`, intenta login contra `usuarios_admin`
- **SEGUNDO**: Si no hay username o no coincide, ejecuta el flujo original (superadmin local, coordinador, subcoordinador)

#### Flujo de autenticación admin:
```javascript
if (username && password) {
  // Query a usuarios_admin
  const { data: admin } = await supabase
    .from("usuarios_admin")
    .select("id,username,role,nombre,apellido")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (admin) {
    // Guardar en localStorage con role 'owner' o 'superadmin'
    setCurrentUser({ username, nombre, apellido, role: admin.role });
  }
}
```

#### UI actualizada:
- Sección superior con campos opcionales para login administrativo
- Username (campo de texto)
- Password (campo de contraseña con toggle show/hide)
- Divider visual cuando no se usa login admin
- Campo de CI/código solo visible si no hay username ingresado
- Instrucciones actualizadas

---

### 2. **Tabla `usuarios_admin`** (Supabase)

#### Script SQL: `/scripts/create-usuarios-admin-table.sql`

```sql
CREATE TABLE usuarios_admin (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'superadmin')),
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Usuario inicial por defecto:
- **Username**: `admin`
- **Password**: `admin123` (⚠️ CAMBIAR EN PRODUCCIÓN)
- **Role**: `owner`

---

### 3. **Utilidades Admin** - `/src/utils/adminHelpers.js`

#### Funciones exportadas:

**`crearUsuarioAdmin(currentUser, adminData)`**
- Valida que currentUser tenga role 'owner'
- Crea nuevo usuario en tabla usuarios_admin
- Valida unicidad de username
- Retorna { success, message, data }

**`isOwner(currentUser)`**
- Verifica si el usuario actual es 'owner'

**`isAdmin(currentUser)`**
- Verifica si el usuario es 'owner' o 'superadmin'

---

### 4. **Modal Crear Admin** - `/src/components/CreateAdminModal.jsx`

Componente modal para crear nuevos administradores:
- **Solo visible para**: role === 'owner'
- **Campos**:
  - Username (requerido, único)
  - Password (requerido, mínimo 6 caracteres)
  - Role (owner o superadmin)
  - Nombre (opcional)
  - Apellido (opcional)
- **Validaciones**: Username único, password seguro

---

### 5. **Dashboard.jsx** - Extensión de permisos

#### Nuevo rol agregado:
```javascript
const roleLabel = {
  owner: "Owner",
  superadmin: "Superadmin",
  coordinador: "Coordinador",
  subcoordinador: "Sub-coordinador",
}[currentUser.role];
```

#### Permisos extendidos para 'owner':

| Acción | owner | superadmin | coordinador | subcoord |
|--------|-------|------------|-------------|----------|
| Ver todas las stats | ✅ | ✅ | ❌ | ❌ |
| Ver todos los coordinadores | ✅ | ✅ | ❌ | ❌ |
| Agregar coordinador | ✅ | ✅ | ❌ | ❌ |
| Editar teléfono (todos) | ✅ | ✅ | Limitado | Limitado |
| Eliminar coordinador | ✅ | ✅ | ❌ | ❌ |
| Confirmar votos | ❌ | ❌ | ✅ | ✅ |
| **Crear administradores** | ✅ | ❌ | ❌ | ❌ |

#### Funciones RBAC actualizadas:
- `canEditarTelefono` → owner = true
- `canEliminar` → owner = true
- `canConfirmarVoto` → owner = false (igual que superadmin)
- `guardarTelefono` → owner bypass
- `guardarDireccion` → owner bypass
- `quitarPersona` → owner permitido

#### UI actualizada:
- Botón "Crear Admin" en header (solo para owner)
- Stats cards visibles para owner
- Sección de coordinadores visible para owner
- Botón "Agregar Coordinador" visible para owner

---

## Nuevos Roles

### **owner**
- Máximo nivel de permisos
- Puede crear nuevos administradores (owner o superadmin)
- Tiene acceso completo a todas las funciones
- Se autentica vía tabla `usuarios_admin`

### **superadmin** (desde usuarios_admin)
- Acceso completo al sistema
- NO puede crear nuevos administradores
- Se autentica vía tabla `usuarios_admin`

### **superadmin** (local - existente)
- Mantiene funcionalidad original
- Hardcodeado en array SUPERADMINS
- CI + contraseña
- NO está en base de datos

---

## Flujo de Login Completo

```
Usuario ingresa datos
    ↓
¿Hay username + password?
    ↓ SÍ
    Query a usuarios_admin
        ↓ ENCONTRADO
        Login con role 'owner' o 'superadmin'
    ↓ NO ENCONTRADO
    Mostrar error "Usuario o contraseña incorrectos"
    
    ↓ NO (sin username)
¿Hay CI/código?
    ↓ SÍ
    ¿Coincide con SUPERADMINS array?
        ↓ SÍ
        Validar password → Login como superadmin local
    ↓ NO
    Query a coordinadores por login_code
        ↓ ENCONTRADO
        Login como coordinador
    ↓ NO ENCONTRADO
    Query a subcoordinadores por login_code
        ↓ ENCONTRADO
        Login como subcoordinador
    ↓ NO ENCONTRADO
    Mostrar error "Usuario no encontrado"
```

---

## Seguridad

⚠️ **IMPORTANTE PARA PRODUCCIÓN**:

1. **Hashing de contraseñas**: Actualmente las contraseñas se guardan en texto plano. En producción, implementar bcrypt o similar:
   ```javascript
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **Cambiar credenciales por defecto**: El usuario `admin/admin123` debe ser eliminado o cambiar su contraseña inmediatamente.

3. **Validación de contraseñas**: Implementar políticas más estrictas (mayúsculas, números, símbolos, mínimo 12 caracteres).

4. **Rate limiting**: Implementar límite de intentos de login fallidos.

5. **Tokens JWT**: Considerar usar tokens en lugar de localStorage para sesiones más seguras.

---

## Comandos para Ejecutar

### 1. Crear la tabla en Supabase:
Ejecutar el script SQL en el panel de Supabase:
```bash
# Ubicación: /scripts/create-usuarios-admin-table.sql
```

### 2. Login como owner:
```
Username: admin
Password: admin123
```

### 3. Crear nuevo administrador:
- Login como 'owner'
- Click en botón "Crear Admin" en el header
- Completar formulario
- Submit

---

## Testing

### Test 1: Login Owner
1. Ingresar username: `admin`
2. Ingresar password: `admin123`
3. Click "Iniciar Sesión"
4. ✅ Debe mostrar Dashboard con badge "Owner"
5. ✅ Debe ver botón "Crear Admin" en header

### Test 2: Crear Admin
1. Login como owner
2. Click "Crear Admin"
3. Completar formulario (username: test, password: test123, role: superadmin)
4. Submit
5. ✅ Debe mostrar mensaje de éxito
6. Logout
7. Login con test/test123
8. ✅ Debe entrar con role "Superadmin"
9. ✅ NO debe ver botón "Crear Admin"

### Test 3: Login Coordinador (sin cambios)
1. Ingresar código de coordinador (ej: A1B2C3D4)
2. Click "Iniciar Sesión"
3. ✅ Debe funcionar igual que antes

### Test 4: Login Superadmin Local (sin cambios)
1. Ingresar CI: 4630621
2. Ingresar password: 16052018
3. Click "Iniciar Sesión"
4. ✅ Debe funcionar igual que antes

---

## Archivos Modificados

### Nuevos archivos:
- ✨ `/src/utils/adminHelpers.js`
- ✨ `/src/components/CreateAdminModal.jsx`
- ✨ `/scripts/create-usuarios-admin-table.sql`
- ✨ `/ADMIN_LOGIN_IMPLEMENTATION.md`

### Archivos modificados:
- 📝 `/src/App.jsx` (login híbrido + UI)
- 📝 `/src/components/Dashboard.jsx` (permisos owner + modal)

### Sin cambios:
- ✅ `/src/supabaseClient.js`
- ✅ `/src/utils/estructuraHelpers.js`
- ✅ `/src/utils/accessCode.js`
- ✅ Todos los demás componentes

---

## Próximos Pasos Recomendados

1. **Ejecutar el script SQL** en Supabase
2. **Probar login como owner** (admin/admin123)
3. **Cambiar password del usuario admin** por seguridad
4. **Crear usuarios owner/superadmin** según necesidad
5. **Implementar hashing de contraseñas** para producción
6. **Eliminar usuario admin por defecto** una vez creados los usuarios reales

---

## Notas Técnicas

- **NO se refactorizó** ninguna lógica existente
- **NO se modificó** el sistema de coordinadores/subcoords/votantes
- **NO se tocaron** las queries de Supabase existentes
- **NO se alteró** el flujo de navegación por renderizado condicional
- **SÍ se extendió** el login agregando validación previa a usuarios_admin
- **SÍ se agregó** el nuevo rol 'owner' con permisos completos
- **SÍ se mantuvo** 100% de compatibilidad hacia atrás

---

**Implementación completada exitosamente** ✅
