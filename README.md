# Mini agenda

Desarrollé esta aplicación como prueba técnica para App2Grow. Mi objetivo fue permitir que un especialista publique sus horarios semanales y que sus clientes reserven sesiones de 60 minutos, consulten sus reservas y cancelen las que todavía sean futuras.

## Tecnologías que elegí

Construí la interfaz con Next.js 16, React 19, TypeScript y Tailwind CSS. Para autenticar usuarios y almacenar la información utilicé Supabase Auth y PostgreSQL con Row Level Security (RLS). También usé Zod para validar los datos, Vitest para las pruebas unitarias y React Icons para los iconos de la interfaz.

## Funcionalidades que implementé

Organicé la aplicación en dos roles:

- Como **especialista**, puedo configurar mi disponibilidad semanal, revisar las reservas recibidas, confirmarlas o rechazarlas y marcar como completadas las sesiones confirmadas.
- Como **cliente**, puedo consultar especialistas, elegir una fecha con disponibilidad, reservar una sesión de 60 minutos, revisar mis reservas y cancelar las futuras.
- Implementé registro e inicio de sesión con correo y contraseña, cierre de sesión, acceso con Google y protección de páginas según el rol.
- Añadí la Edge Function `booking-ics`, que genera un archivo iCalendar (`.ics`) para una reserva confirmada después de validar la sesión del usuario.

## Cómo organizo el proyecto

- `app/`: páginas, rutas y acciones de servidor de la aplicación.
- `components/`: componentes reutilizables de la interfaz.
- `lib/`: clientes de Supabase, validaciones y lógica compartida.
- `supabase/migrations/`: esquema, restricciones, políticas RLS, triggers y funciones de PostgreSQL.
- `supabase/functions/booking-ics/`: código de la función que genera archivos iCalendar.
- `supabase/seed.sql`: horarios de ejemplo para el especialista demo.

## Requisitos

Para ejecutar el proyecto, instalé o necesito tener disponible:

- Node.js y npm.
- Un proyecto de Supabase.
- Supabase CLI para aplicar migraciones y desplegar la Edge Function.

## Cómo configuro y ejecuto la aplicación

1. Clono el repositorio:

   ```bash
   git clone URL_DEL_REPOSITORIO
   cd mini-agenda
   ```

2. Instalo las dependencias:

   ```bash
   npm install
   ```

3. Copio `.env.example` como `.env.local` y configuro las variables públicas de Supabase:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

4. Inicio el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abro [http://localhost:3000](http://localhost:3000).

## Base de datos y horarios de ejemplo

Guardé las migraciones en `supabase/migrations/`. Para aplicarlas a mi proyecto Supabase vinculado, utilizo:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Configuré `supabase/seed.sql` para añadir estos horarios al usuario `especialista.demo@example.com`, siempre que su perfil tenga el rol `SPECIALIST`:

- Lunes, de 09:00 a 12:00.
- Miércoles, de 14:00 a 17:00.
- Viernes, de 09:00 a 13:00.

El seed no crea usuarios. Primero registro al especialista demo desde la aplicación con ese correo y el rol **Especialista**; el trigger de Auth crea su fila en `profiles`. Después ejecuto el seed. Si uso `supabase db reset`, el seed se ejecuta automáticamente después de las migraciones, pero no insertará horarios si el usuario todavía no existe en ese momento. En ese caso, vuelvo a ejecutarlo desde el SQL Editor de Supabase después de crear la cuenta. `supabase db push` aplica migraciones, pero no ejecuta el seed.

## Edge Function de calendario

Implementé `booking-ics` en `supabase/functions/booking-ics/index.ts`. Para desplegarla, utilizo:

```bash
npx supabase functions deploy booking-ics --use-api
```

La función valida la sesión y consulta la reserva con los permisos del usuario. Solo genera el archivo `.ics` cuando la reserva está confirmada.

## Pruebas y comprobaciones

Preparé pruebas unitarias para `computeDaySlots`, la función pura que calcula los horarios disponibles. Cubrí días sin disponibilidad, varias franjas, reservas que ocupan un horario, reservas canceladas, horarios pasados y solapamientos parciales.

Para ejecutar las comprobaciones disponibles, uso:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Decisiones técnicas

Uso `America/Lima` como zona horaria de la agenda y fijo cada sesión en 60 minutos. Mantengo `computeDaySlots` como función pura para poder comprobar el cálculo de horarios de forma aislada. La base de datos impide reservas activas superpuestas y conserva las reservas canceladas para mantener su historial. Para proteger los datos, combino validaciones de entrada, controles de rol, políticas RLS, triggers y restricciones de PostgreSQL.

## Cuentas de prueba

Para que el equipo evaluador pruebe ambos roles, proporcionaré por separado las credenciales de una cuenta `CLIENT` y una cuenta `SPECIALIST` con disponibilidad configurada. No publico contraseñas en este repositorio.

## Despliegue

Para publicar la aplicación, conectaré este repositorio con Vercel y configuraré allí las variables de entorno de Supabase. La URL pública es:

`PENDIENTE_DE_DESPLIEGUE`

Cuando complete el despliegue en Vercel, reemplazaré ese marcador por la URL real.
