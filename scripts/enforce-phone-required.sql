-- =====================================================
-- ENFORCE PHONE REQUIRED
-- Propósito: Garantizar que el teléfono sea obligatorio y tenga
-- formato internacional paraguayo válido en coordinadores,
-- subcoordinadores y votantes.
-- Formato exigido: +5959XXXXXXXX (regex: ^\+5959[0-9]{8}$)
-- No modifica ni elimina datos existentes; solo agrega restricciones.
-- =====================================================

-- Nota: NOT NULL es un atributo de columna, no una constraint con nombre
-- propio en Postgres, por lo que "SET NOT NULL" es idempotente por sí
-- mismo (no requiere DROP CONSTRAINT previo). El formato sí se aplica
-- mediante una CHECK CONSTRAINT con nombre propio.

-- ======================= COORDINADORES =======================
ALTER TABLE coordinadores
  ALTER COLUMN telefono SET NOT NULL;

ALTER TABLE coordinadores
  DROP CONSTRAINT IF EXISTS coordinadores_telefono_formato_py;
ALTER TABLE coordinadores
  ADD CONSTRAINT coordinadores_telefono_formato_py
  CHECK (telefono ~ '^\+5959[0-9]{8}$');

-- ======================= SUBCOORDINADORES =======================
ALTER TABLE subcoordinadores
  ALTER COLUMN telefono SET NOT NULL;

ALTER TABLE subcoordinadores
  DROP CONSTRAINT IF EXISTS subcoordinadores_telefono_formato_py;
ALTER TABLE subcoordinadores
  ADD CONSTRAINT subcoordinadores_telefono_formato_py
  CHECK (telefono ~ '^\+5959[0-9]{8}$');

-- ======================= VOTANTES =======================
ALTER TABLE votantes
  ALTER COLUMN telefono SET NOT NULL;

ALTER TABLE votantes
  DROP CONSTRAINT IF EXISTS votantes_telefono_formato_py;
ALTER TABLE votantes
  ADD CONSTRAINT votantes_telefono_formato_py
  CHECK (telefono ~ '^\+5959[0-9]{8}$');

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Restricciones de teléfono aplicadas a coordinadores, subcoordinadores y votantes.';
  RAISE NOTICE 'IMPORTANTE: si alguna fila existente no tiene teléfono o no cumple el formato +5959XXXXXXXX, este script fallará. Normalice esos datos antes de ejecutarlo.';
END $$;
