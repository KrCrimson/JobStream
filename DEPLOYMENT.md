# JobStream - Sistema de Gestión de Turnos

Sistema completo de gestión de turnos con backend en Node.js/TypeScript y frontend en React/TypeScript.

## 🚀 Deployment

### Backend - Render

1. **Crear cuenta en Render**: https://render.com
2. **Nuevo Web Service**:
   - Connect Repository: Conecta tu repositorio de GitHub
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Variables de Entorno** (en Render Dashboard):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=tu_mongodb_atlas_uri
   JWT_SECRET=tu_secreto_seguro (se genera automáticamente)
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://tu-app.vercel.app
   ```

4. **MongoDB Atlas**:
   - Crea cluster en https://cloud.mongodb.com
   - Whitelist IP: `0.0.0.0/0` (todas las IPs)
   - Copia connection string

### Frontend - Vercel

1. **Crear cuenta en Vercel**: https://vercel.com
2. **Import Project**:
   - Import Git Repository
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Variables de Entorno** (en Vercel Dashboard):
   ```
   VITE_API_URL=https://tu-backend.onrender.com
   ```

4. **Deploy**: Click "Deploy"

## 📋 Orden de Deployment

1. **Primero Backend** (Render)
   - Espera a que termine el build
   - Copia la URL del backend (ej: `https://jobstream-backend.onrender.com`)

2. **Luego Frontend** (Vercel)
   - Configura `VITE_API_URL` con la URL del backend
   - Deploy

## 🔧 Configuración Post-Deployment

### 1. Crear Usuario Admin
```bash
# En Render Shell o localmente conectado a producción
npm run seed:admin
```

Credenciales por defecto:
- Email: `admin@jobstream.com`
- Password: `Admin123!`

### 2. Crear Trabajador de Prueba
```bash
npm run seed:worker
```

Credenciales:
- Email: `trabajador@jobstream.com`
- Password: `Worker123!`

## 🌐 URLs del Sistema

- **Frontend**: https://tu-app.vercel.app
- **Backend API**: https://tu-backend.onrender.com
- **Login Admin**: https://tu-app.vercel.app/login
- **Kiosco Público**: https://tu-app.vercel.app/kiosco
- **Display/TV**: https://tu-app.vercel.app/display

## ⚙️ Funcionalidades

### Para Administradores
- CRUD de trabajadores
- CRUD de áreas de servicio
- Configuración del sistema
- Dashboard con estadísticas

### Para Trabajadores
- Login con credenciales
- Panel de atención
- Llamar siguiente turno
- Iniciar atención
- Completar/cancelar turnos

### Para Clientes
- Kiosco: Generar turno seleccionando área
- Display/TV: Ver turnos actuales y en espera

## 🔒 Seguridad

- Autenticación JWT
- Passwords hasheados con bcrypt
- CORS configurado
- Rate limiting en desarrollo
- Validación de datos con express-validator

## 📱 Tecnologías

### Backend
- Node.js + TypeScript
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO (real-time)

### Frontend
- React + TypeScript
- Vite
- React Router v6
- Axios
- Tailwind CSS
- Lucide Icons
- React Hot Toast

## 🐛 Troubleshooting

### Error de CORS
Asegúrate que `CORS_ORIGIN` en el backend tenga la URL correcta del frontend (sin `/` al final)

### Backend no responde
- Verifica que MongoDB Atlas permite conexiones desde todas las IPs
- Revisa logs en Render Dashboard

### Frontend no conecta
- Verifica que `VITE_API_URL` apunte a la URL correcta del backend
- Debe incluir el protocolo `https://`

## 📞 Soporte

Para reportar bugs o solicitar features, crea un issue en el repositorio.
