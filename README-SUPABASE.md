# Configuración de Supabase — ConveyorQuote

Esta etapa incorpora inicio de sesión real y un directorio de clientes persistente.

## 1. Crear el proyecto

1. Entra a https://supabase.com/dashboard.
2. Crea un proyecto nuevo para ConveyorQuote.
3. Guarda la contraseña de la base de datos en un gestor seguro.
4. Espera a que el proyecto termine de aprovisionarse.

## 2. Crear las tablas y políticas

1. Abre **SQL Editor** en el proyecto.
2. Selecciona **New query**.
3. Copia y ejecuta el contenido completo de:
   `supabase/migrations/202611260001_initial_auth_and_clients.sql`.
4. Verifica que la consulta termine sin errores.

Esto crea perfiles, roles y clientes, además de políticas RLS. Los usuarios nuevos reciben el rol vendedor por defecto. Los usuarios no pueden cambiar su propio rol desde la aplicación.

## 3. Crear el primer administrador

1. En Supabase abre **Authentication → Users**.
2. Selecciona **Add user** y crea tu usuario con tu correo y una contraseña segura.
3. Copia el UUID del usuario creado.
4. Abre **SQL Editor** y ejecuta, sustituyendo el UUID:

```sql
update public.profiles
set role = 'administrador'
where id = 'PEGA-AQUI-EL-UUID-DEL-USUARIO';
```

5. Confirma que el rol quedó como `administrador`:

```sql
select id, email, role from public.profiles;
```

No publiques ni compartas contraseñas.

## 4. Conectar la aplicación

En Supabase abre **Project Settings → API** (en algunas versiones aparece como **API Keys** o **Data API**). Copia:

- Project URL.
- Publishable key (recomendada) o la legacy anon/public key.

En la raíz del proyecto, crea un archivo llamado `.env.local` (usa `.env.example` como guía):

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_PUBLISHABLE_O_ANON_KEY
```

La publishable/anon key está diseñada para usarse en el navegador y no sustituye las políticas RLS. **Nunca pongas la secret key ni la service_role key en variables VITE_, en el frontend ni en GitHub.**

Reinicia el servidor de desarrollo después de cambiar el archivo.

## 5. Crear usuarios vendedores

Por ahora, crea usuarios desde **Authentication → Users → Add user**. El trigger crea su perfil automáticamente como vendedor. La pantalla administrativa para gestionar usuarios se desarrollará después.

## 6. Probar

1. Inicia la aplicación.
2. Entra con el usuario administrador creado.
3. Abre Clientes y registra un cliente de prueba.
4. Actualiza la página: el cliente debe seguir apareciendo.
5. Cierra sesión y entra con un usuario vendedor: debe poder registrar clientes y solo ver los que él creó.
6. Comprueba en **Table Editor → clients** que el registro existe.

## Variables de entorno

- `VITE_SUPABASE_URL`: URL del proyecto.
- `VITE_SUPABASE_ANON_KEY`: publishable/anon key pública.

El archivo `.env.local` está excluido de Git. No subas credenciales privadas.
