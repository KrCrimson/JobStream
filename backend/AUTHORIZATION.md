# Sistema de Autenticación y Autorización - JobStream

## 🔐 Roles del Sistema

El sistema de turnos JobStream implementa un control de acceso basado en roles (RBAC) con tres niveles:

### 1. **Admin** (Administrador)
- **Permisos**: Acceso completo a todas las funcionalidades
- **Funciones**:
  - Crear, modificar y eliminar áreas de servicio
  - Ver todas las estadísticas del sistema
  - Gestionar trabajadores
  - Ver y gestionar todos los turnos
  - Acceder a reportes y análisis completos

### 2. **Worker** (Trabajador)
- **Permisos**: Acceso limitado a funciones operativas
- **Funciones**:
  - Llamar y atender turnos
  - Ver turnos asignados a sus áreas de servicio
  - Completar y cancelar turnos en atención
  - Ver estadísticas propias
  - **Restricción**: Solo puede ver sus propios datos

### 3. **Viewer** (Visualizador)
- **Permisos**: Solo lectura
- **Funciones**:
  - Ver pantalla de turnos
  - Consultar estado de áreas de servicio
  - Ver turnos en espera (público)

---

## 👤 Usuario Admin por Defecto

El sistema viene con un usuario administrador pre-creado:

```
Email:    admin@jobstream.com
Password: Admin123!
Role:     admin
```

⚠️ **IMPORTANTE**: Cambia esta contraseña después del primer login.

### Crear Admin Manualmente

Si necesitas crear un nuevo admin, ejecuta:

```bash
cd backend
npm run seed:admin
```

---

## 🔑 Autenticación JWT

El sistema utiliza JWT (JSON Web Tokens) para autenticación:

### Payload del Token
```typescript
{
  userId: string;      // ID del usuario
  email: string;       // Email del usuario
  role: string;        // 'admin' | 'worker' | 'viewer'
  workerId?: string;   // ID del Worker si es trabajador
  id: string;          // Alias de userId
}
```

### Headers de Autenticación
```
Authorization: Bearer <token>
```

---

## 🛡️ Rutas Protegidas

### Rutas Públicas (Sin autenticación)
- `POST /api/turns` - Crear turno
- `GET /api/turns/number/:turnNumber` - Consultar turno
- `GET /api/turns/display` - Pantalla de turnos
- `GET /api/service-areas` - Listar áreas
- `GET /api/service-areas/:id` - Ver área
- `GET /api/service-areas/code/:code` - Buscar por código
- `GET /api/service-areas/:id/status` - Estado del área

### Rutas para Workers y Admins
- `POST /api/turns/call/:serviceAreaCode` - Llamar siguiente turno
- `PUT /api/turns/:turnId/attend` - Atender turno
- `PUT /api/turns/:turnId/complete` - Completar turno
- `PUT /api/turns/:turnId/cancel` - Cancelar turno
- `GET /api/turns` - Listar turnos (filtrados por permisos)
- `GET /api/turns/:turnId` - Ver detalle de turno

### Rutas Solo Admin
- `POST /api/service-areas` - Crear área de servicio
- `PUT /api/service-areas/:id` - Actualizar área
- `DELETE /api/service-areas/:id` - Eliminar área
- `PUT /api/service-areas/:id/activate` - Activar/desactivar área
- `GET /api/turns/stats/summary` - Estadísticas completas

---

## 📋 Ejemplos de Uso

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@jobstream.com",
  "password": "Admin123!"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "email": "admin@jobstream.com",
      "name": "Administrador Principal",
      "role": "admin",
      "isActive": true
    }
  }
}
```

### Llamar Turno (Worker o Admin)
```bash
POST /api/turns/call/CAJA
Authorization: Bearer <token>
```

### Crear Área de Servicio (Solo Admin)
```bash
POST /api/service-areas
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Caja 1",
  "code": "CAJA",
  "description": "Área de caja"
}
```

---

## 🔄 Vincular Usuario con Worker

Para que un trabajador pueda operar en el sistema:

1. Crear el Worker en la colección `workers`
2. Crear el User con `role: 'worker'` y `workerId` apuntando al Worker
3. El trabajador solo podrá ver/gestionar sus propios turnos

```typescript
// Ejemplo
const worker = await Worker.create({
  name: "Juan",
  lastName: "Pérez",
  employeeId: "EMP001",
  username: "jperez",
  passwordHash: "...",
  serviceAreas: ["CAJA"]
});

const user = await User.create({
  email: "jperez@jobstream.com",
  password: "password123",
  name: "Juan Pérez",
  role: "worker",
  workerId: worker._id
});
```

---

## 🔐 Cambiar Contraseña

```bash
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "Admin123!",
  "newPassword": "NuevaPassword456!"
}
```

---

## ⚙️ Variables de Entorno

```env
JWT_SECRET=tu-secreto-super-seguro
JWT_EXPIRE=7d
```

---

## 🚀 Iniciar el Sistema

```bash
# Backend
cd backend
npm run seed:admin    # Crear admin (primera vez)
npm run dev          # Iniciar servidor

# Frontend
cd frontend
npm run dev
```

---

## 📊 Flujo de Autorización

```
1. Usuario hace login → Recibe JWT token
2. Token incluye: userId, email, role, workerId (si aplica)
3. Cada request incluye: Authorization: Bearer <token>
4. Middleware authenticate verifica el token
5. Middleware authorize verifica permisos por rol
6. Si pasa → ejecuta la acción
7. Si falla → 401 (no autenticado) o 403 (sin permisos)
```

---

## 🐛 Troubleshooting

### Error: "No autenticado"
- Verifica que estés enviando el header `Authorization`
- Verifica que el token sea válido y no haya expirado

### Error: "No tienes permisos"
- Tu rol no tiene acceso a este recurso
- Contacta al administrador para actualizar permisos

### No puedo crear el admin
- Asegúrate de que MongoDB esté corriendo
- Verifica la conexión en `.env`
- Si ya existe, elimínalo desde MongoDB y vuelve a ejecutar el seed

---

## 📝 Notas de Seguridad

- ✅ Las contraseñas se hashean con bcrypt (salt rounds: 10)
- ✅ Los tokens JWT expiran en 7 días por defecto
- ✅ Los passwords no se retornan en respuestas JSON
- ⚠️ Cambia el `JWT_SECRET` en producción
- ⚠️ Usa HTTPS en producción
- ⚠️ Implementa rate limiting en endpoints públicos
