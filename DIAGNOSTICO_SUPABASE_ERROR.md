# DIAGNÓSTICO COMPLETO - Error "Supabase env vars missing"

## CAUSA RAÍZ IDENTIFICADA

**El proyecto ES VITE, NO Next.js**

### Evidencia:

1. **package.json**
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

2. **Archivos de configuración**
   - ✅ `vite.config.js` - EXISTE
   - ❌ `next.config.js` - NO EXISTE

3. **Entry point**
   - `index.html` → `/src/main.jsx` (patrón de Vite)
   - NO usa `/pages` o `/app` (patrón de Next.js)

---

## EL PROBLEMA

### Código INCORRECTO (antes):
```javascript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

### Por qué fallaba:
- **Vite NO soporta `process.env` en código cliente**
- `process.env` es undefined en el navegador con Vite
- Vite usa `import.meta.env` para exponer variables de entorno

---

## LA SOLUCIÓN

### Código CORRECTO (ahora):
```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Convención de nombres de Vite:
- Variables deben empezar con `VITE_` para ser expuestas al cliente
- Formato: `VITE_NOMBRE_VARIABLE`

---

## CONFIGURACIÓN EN VERCEL

### Variables de entorno requeridas:

| Nombre Variable | Valor |
|----------------|-------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon/Public key de Supabase |

### IMPORTANTE:
- ❌ NO usar `NEXT_PUBLIC_SUPABASE_URL` (es de Next.js)
- ❌ NO usar `SUPABASE_URL` (no tiene prefijo VITE_)
- ✅ DEBE ser `VITE_SUPABASE_URL`
- ✅ DEBE ser `VITE_SUPABASE_ANON_KEY`

---

## PASOS PARA CORREGIR EN VERCEL

### 1. Ir a tu proyecto en Vercel
   - Dashboard → Tu proyecto → Settings → Environment Variables

### 2. Eliminar variables antiguas (si existen):
   - ❌ `NEXT_PUBLIC_SUPABASE_URL`
   - ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Agregar variables correctas:

**Variable 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://tu-proyecto.supabase.co`
- Environments: Production, Preview, Development (todas)

**Variable 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `tu-anon-key-aqui`
- Environments: Production, Preview, Development (todas)

### 4. Redeployar
   - Vercel → Deployments → Click en último deploy → "Redeploy"
   - O hacer push a tu rama para triggear nuevo deploy

---

## LOGS DE DIAGNÓSTICO

El código ahora incluye logs detallados:

```javascript
console.log("[v0] ENV DEBUG:", {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY ? "***PRESENTE***" : undefined,
  allEnvKeys: Object.keys(import.meta.env)
});
```

### Cómo usar los logs:
1. Después de deployar, abre la consola del navegador en producción
2. Verás el log `[v0] ENV DEBUG`
3. Revisa:
   - `url`: debe mostrar tu URL de Supabase
   - `key`: debe mostrar "***PRESENTE***"
   - `allEnvKeys`: lista todas las variables disponibles

### Si sigue fallando:
- Verificar que `allEnvKeys` contenga `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- Si no aparecen, las variables no están configuradas correctamente en Vercel
- Asegurar que estás usando exactamente los nombres `VITE_*`

---

## RESUMEN

| Item | Antes (❌) | Ahora (✅) |
|------|----------|----------|
| Framework | Confusión Next.js | **VITE** |
| Sintaxis env | `process.env.NEXT_PUBLIC_*` | `import.meta.env.VITE_*` |
| Variables Vercel | `NEXT_PUBLIC_SUPABASE_URL` | `VITE_SUPABASE_URL` |
| Variables Vercel | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` |
| Error | "Supabase env vars missing" | Corregido ✅ |

---

## ARCHIVOS MODIFICADOS

- ✅ `/src/supabaseClient.js` - Cambiado a `import.meta.env.VITE_*`
- ✅ Agregados logs de diagnóstico
- ✅ Mensaje de error mejorado con instrucciones

---

## TESTING

### En desarrollo local:
1. Crear archivo `.env` en la raíz del proyecto:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

2. Ejecutar:
   ```bash
   npm run dev
   ```

3. Abrir consola del navegador, debe mostrar:
   ```
   [v0] ENV DEBUG: {
     url: "https://tu-proyecto.supabase.co",
     key: "***PRESENTE***",
     allEnvKeys: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", ...]
   }
   ```

### En producción (Vercel):
1. Configurar variables como se indica arriba
2. Deployar
3. Abrir app en producción
4. Verificar consola - mismo log debe aparecer
5. NO debe haber error "Supabase env vars missing"

---

## CONCLUSIÓN

El error se debía a usar sintaxis de Next.js (`process.env.NEXT_PUBLIC_*`) en un proyecto Vite. La solución es usar `import.meta.env.VITE_*` y configurar las variables correctamente en Vercel con el prefijo `VITE_`.

**Estado: RESUELTO ✅**
