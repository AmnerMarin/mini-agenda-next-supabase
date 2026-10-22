
# Mini-agenda

Aplicación de gestión de reservas desarrollada como prueba técnica para app2grow.

Permite que los especialistas definan su disponibilidad semanal y que los clientes consulten horarios libres y reserven sesiones de 60 minutos.

## Tecnologías

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth
- PostgreSQL y Row Level Security (RLS)
- Supabase Edge Functions
- Zod
- Vitest

## Funcionalidades

### Autenticación

- Registro con correo y contraseña.
- Inicio y cierre de sesión.
- Roles CLIENT y SPECIALIST.
- Protección de rutas según el rol.
- Inicio de sesión con Google y onboarding.

### Especialista

- Gestión de disponibilidad semanal.
- Visualización de reservas recibidas.
- Confirmación y rechazo de reservas.
- Finalización de sesiones confirmadas.

### Cliente

- Consulta de especialistas.
- Selección de fechas y horarios libres.
- Reservas de 60 minutos.
- Consulta y cancelación de reservas futuras.

### Calendario

La Edge Function `booking-ics` genera un archivo iCalendar (.ics) para reservas confirmadas.

## Requisitos

- Node.js compatible con Next.js y Vitest.
- npm.
- Supabase CLI.
- Un proyecto de Supabase.

## Instalación

1. Clonar el repositorio:

   git clone URL_DEL_REPOSITORIO

2. Entrar en la carpeta:

   cd mini-agenda

3. Instalar las dependencias:

   npm install

4. Copiar `.env.example` a `.env.local`.

5. Configurar en `.env.local` los valores de Supabase.

6. Ejecutar la aplicación:

   npm run dev

7. Abrir http://localhost:3000

## Base de datos

El esquema se encuentra en:

supabase/migrations/

Las migraciones crean las tablas, restricciones, políticas RLS, triggers y funciones SQL necesarias.

Para aplicar las migraciones a un proyecto Supabase vinculado:

    npx supabase login
    npx supabase link --project-ref TU_PROJECT_REF
    npx supabase db push --dry-run
    npx supabase db push

Los datos de ejemplo de desarrollo se encuentran en:

supabase/seed.sql

## Edge Function

La función se encuentra en:

supabase/functions/booking-ics/index.ts

Para desplegarla:

    npx supabase functions deploy booking-ics --use-api

La función recibe el ID de una reserva, verifica la sesión y consulta PostgreSQL utilizando los permisos del usuario.

Solamente genera archivos .ics para reservas confirmadas.

## Pruebas

Ejecutar las pruebas unitarias:

    npm test

Comprobar los tipos TypeScript:

    npm run typecheck

Ejecutar ESLint:

    npm run lint

Comprobar la compilación:

    npm run build

Las pruebas de computeDaySlots cubren:

- Días sin disponibilidad.
- Varias franjas horarias.
- Reservas que bloquean horarios.
- Reservas canceladas.
- Horarios que ya pasaron.
- Solapamiento parcial de intervalos.

## Seguridad

- Autenticación mediante Supabase Auth.
- Políticas RLS en las tablas principales.
- Restricción contra reservas superpuestas.
- Validación de transiciones mediante triggers.
- Validación de entradas mediante Zod.
- Consultas con columnas explícitas.
- Operaciones realizadas con permisos del usuario.

## Decisiones técnicas

- Se utiliza America/Lima como zona horaria de la agenda.
- Las sesiones duran exactamente 60 minutos.
- computeDaySlots es una función pura.
- La base de datos garantiza que no existan reservas activas superpuestas.
- Las reservas canceladas no se eliminan; conservan su historial.
- La descarga del calendario se realiza mediante una Edge Function.

## Cuentas de prueba

Se proporcionarán al equipo evaluador mediante el correo de entrega.

Se incluirá:
- Una cuenta CLIENT.
- Una cuenta SPECIALIST con disponibilidad configurada.

## Despliegue

La aplicación se desplegará en Vercel.

URL: PENDIENTE_DE_DESPLIEGUE

## Limitaciones y verificaciones pendientes

- Verificación completa de permisos con distintas cuentas.
- Comprobación del flujo de reservas de extremo a extremo.
- Validación final de la descarga iCalendar.
- Revisión de migraciones y datos de ejemplo.
- Despliegue y pruebas en Vercel.