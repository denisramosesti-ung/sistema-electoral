-- =====================================================
-- TABLA: usuarios_admin
-- Propósito: Almacenar usuarios administrativos del sistema
-- Roles: 'owner' (máximo permiso) y 'superadmin'
-- =====================================================

CREATE TABLE IF NOT EXISTS usuarios_admin (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'superadmin')),
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_username ON usuarios_admin(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_role ON usuarios_admin(role);

-- Comentarios de tabla
COMMENT ON TABLE usuarios_admin IS 'Usuarios administrativos del sistema electoral';
COMMENT ON COLUMN usuarios_admin.username IS 'Nombre de usuario único para login';
COMMENT ON COLUMN usuarios_admin.password IS 'Contraseña (en producción usar hashing)';
COMMENT ON COLUMN usuarios_admin.role IS 'Rol: owner (máximo) o superadmin';
COMMENT ON COLUMN usuarios_admin.nombre IS 'Nombre del administrador';
COMMENT ON COLUMN usuarios_admin.apellido IS 'Apellido del administrador';

-- =====================================================
-- DATOS INICIALES: Usuario owner por defecto
-- Username: admin
-- Password: admin123 (CAMBIAR EN PRODUCCIÓN)
-- =====================================================

INSERT INTO usuarios_admin (username, password, role, nombre, apellido)
VALUES ('admin', 'admin123', 'owner', 'Administrador', 'Sistema')
ON CONFLICT (username) DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Tabla usuarios_admin creada exitosamente';
  RAISE NOTICE 'Usuario inicial: admin / admin123 (role: owner)';
  RAISE NOTICE 'IMPORTANTE: Cambiar la contraseña en producción';
END $$;
