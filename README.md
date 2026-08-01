# Frontend Shippear Juridico

Frontend Next.js + TypeScript + Tailwind + shadcn/ui para la gestion integral de causas penales.

## Modulos

- Acceso OTP de desarrollo.
- Dashboard y alertas.
- Listado, busqueda y filtros de causas.
- Expediente con imputados, delitos, proceso y detencion.
- Agenda global y por causa.
- Notas y enlaces documentales.

## Desarrollo

1. Copiar `.env.example` a `.env.local`.
2. Configurar `NEXT_PUBLIC_API_URL` con la URL local o publica del backend.
3. Ejecutar `npm run dev`.

En Railway/Vercel, definir `NEXT_PUBLIC_API_URL` con la URL HTTPS publica del backend. En el backend, `FRONTEND_URL` debe contener la URL publica de este frontend.

Produccion actual: https://frontend-shippear-juridico-production.up.railway.app
