# Estructura del Frontend - Sistema de Turnos en Español

## 📁 Estructura de Carpetas Propuesta

```
frontend/src/
├── pages/
│   ├── public/
│   │   ├── Display.tsx          # Pantalla para mostrar turnos llamados
│   │   └── Kiosco.tsx           # Pantalla para que clientes saquen turnos
│   ├── admin/
│   │   ├── Dashboard.tsx        # Dashboard principal del admin
│   │   ├── Workers.tsx          # CRUD de trabajadores
│   │   ├── ServiceAreas.tsx     # CRUD de áreas de servicio
│   │   └── Config.tsx           # Configuración del sistema
│   ├── worker/
│   │   └── WorkerPanel.tsx      # Panel para trabajadores
│   └── Login.tsx                # Pantalla de login
├── components/
│   ├── layout/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── workers/
│   │   ├── WorkerList.tsx
│   │   ├── WorkerForm.tsx
│   │   └── WorkerCard.tsx
│   ├── serviceAreas/
│   │   ├── ServiceAreaList.tsx
│   │   ├── ServiceAreaForm.tsx
│   │   └── ServiceAreaCard.tsx
│   ├── turns/
│   │   ├── TurnCard.tsx
│   │   ├── TurnList.tsx
│   │   └── TurnDisplay.tsx
│   └── config/
│       └── ConfigForm.tsx
├── services/
│   ├── api.ts                   # Cliente API base
│   ├── configService.ts         # Servicios de configuración
│   ├── workerService.ts         # Servicios de workers
│   ├── serviceAreaService.ts    # Servicios de áreas
│   └── turnService.ts           # Servicios de turnos
├── hooks/
│   ├── useConfig.ts             # Hook para obtener config
│   ├── useWorkers.ts            # Hook para gestionar workers
│   └── useTurns.ts              # Hook para gestionar turnos
├── types/
│   ├── config.ts
│   ├── worker.ts
│   ├── serviceArea.ts
│   └── turn.ts
└── i18n/
    └── es.json                  # Traducciones al español
```

## 🚀 Rutas del Frontend

```typescript
// App.tsx
<Routes>
  {/* Rutas Públicas */}
  <Route path="/display" element={<Display />} />
  <Route path="/kiosco" element={<Kiosco />} />
  <Route path="/login" element={<Login />} />
  
  {/* Rutas Protegidas - Admin */}
  <Route path="/admin" element={<ProtectedRoute role="admin"><Layout /></ProtectedRoute>}>
    <Route index element={<Dashboard />} />
    <Route path="trabajadores" element={<Workers />} />
    <Route path="areas" element={<ServiceAreas />} />
    <Route path="configuracion" element={<Config />} />
    <Route path="turnos" element={<TurnManagement />} />
  </Route>
  
  {/* Rutas Protegidas - Worker */}
  <Route path="/worker" element={<ProtectedRoute role="worker"><WorkerPanel /></ProtectedRoute>} />
</Routes>
```

## 📝 Archivos Clave a Crear

### 1. Login.tsx - Con 3 botones

```typescript
import { Link } from 'react-router-dom';

export const Login = () => {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>JobStream - Sistema de Turnos</h1>
        
        {/* Botones públicos */}
        <div className="public-buttons">
          <Link to="/display" className="btn btn-primary btn-lg">
            📺 Ver Pantalla de Turnos
          </Link>
          <Link to="/kiosco" className="btn btn-success btn-lg">
            🎫 Sacar Turno
          </Link>
        </div>
        
        <div className="divider">O inicia sesión</div>
        
        {/* Formulario de login */}
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Contraseña" />
          <button type="submit">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );
};
```

### 2. Display.tsx - Pantalla Pública

```typescript
export const Display = () => {
  const [turns, setTurns] = useState([]);
  const { config } = useConfig();
  
  useEffect(() => {
    // WebSocket para actualizaciones en tiempo real
    const ws = new WebSocket('ws://localhost:5000');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TURN_CALLED') {
        setTurns(prev => [data.turn, ...prev].slice(0, config.displayConfig.showLastCalled));
      }
    };
    
    return () => ws.close();
  }, []);
  
  return (
    <div className="display-screen">
      <header>
        <h1>{config.businessName}</h1>
        <div className="clock">{currentTime}</div>
      </header>
      
      <div className="current-turn">
        {turns[0] && (
          <>
            <h2>Turno Actual</h2>
            <div className="turn-number">{turns[0].turnNumber}</div>
            <div className="service-area">{turns[0].serviceAreaName}</div>
            <div className="counter">Ventanilla {turns[0].counterNumber}</div>
          </>
        )}
      </div>
      
      <div className="last-turns">
        <h3>Últimos Turnos Llamados</h3>
        <div className="turns-grid">
          {turns.slice(1).map(turn => (
            <div key={turn._id} className="turn-item">
              <span className="number">{turn.turnNumber}</span>
              <span className="area">{turn.serviceAreaCode}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 3. Kiosco.tsx - Pantalla para Clientes

```typescript
export const Kiosco = () => {
  const { config } = useConfig();
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [customerData, setCustomerData] = useState({});
  const [generatedTurn, setGeneratedTurn] = useState(null);
  
  const handleGenerateTurn = async () => {
    if (config.operationMode === 'single') {
      // Modo único - generar directamente
      const turn = await createTurn({ serviceAreaCode: serviceAreas[0].code });
      setGeneratedTurn(turn);
    } else {
      // Modo múltiple - mostrar áreas
      if (!selectedArea) {
        alert('Por favor selecciona un área de servicio');
        return;
      }
      
      const turn = await createTurn({
        serviceAreaCode: selectedArea.code,
        customerData: config.requireCustomerValidation ? customerData : undefined
      });
      setGeneratedTurn(turn);
    }
  };
  
  if (generatedTurn) {
    return (
      <div className="turn-ticket">
        <h2>Tu Turno</h2>
        <div className="turn-number">{generatedTurn.turnNumber}</div>
        {config.operationMode === 'multiple' && (
          <div className="area">{generatedTurn.serviceAreaName}</div>
        )}
        <p>Espera a ser llamado</p>
        <button onClick={() => {
          window.print();
          setGeneratedTurn(null);
        }}>
          🖨️ Imprimir
        </button>
      </div>
    );
  }
  
  return (
    <div className="kiosco-screen">
      <h1>Bienvenido a {config.businessName}</h1>
      
      {config.requireCustomerValidation && (
        <div className="customer-form">
          <h3>Por favor ingresa tus datos</h3>
          {config.validationType === 'dni' && (
            <input 
              placeholder="DNI" 
              onChange={e => setCustomerData({...customerData, idNumber: e.target.value})}
            />
          )}
          {config.validationType === 'phone' && (
            <input 
              placeholder="Teléfono" 
              onChange={e => setCustomerData({...customerData, phone: e.target.value})}
            />
          )}
        </div>
      )}
      
      {config.operationMode === 'single' ? (
        <button className="btn-generate" onClick={handleGenerateTurn}>
          🎫 Generar Turno
        </button>
      ) : (
        <div className="service-areas-grid">
          <h3>Selecciona el área de servicio</h3>
          {serviceAreas.map(area => (
            <button
              key={area._id}
              className={`area-btn ${selectedArea?._id === area._id ? 'selected' : ''}`}
              onClick={() => setSelectedArea(area)}
            >
              <div className="area-icon">{area.code}</div>
              <div className="area-name">{area.name}</div>
            </button>
          ))}
          
          {selectedArea && (
            <button className="btn-generate" onClick={handleGenerateTurn}>
              Generar Turno
            </button>
          )}
        </div>
      )}
    </div>
  );
};
```

### 4. Dashboard Admin (Español)

```typescript
export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  
  return (
    <div className="dashboard">
      <h1>📊 Panel de Control</h1>
      <p className="subtitle">Vista general del sistema de turnos</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <h3>{stats?.turnsToday || 0}</h3>
            <p>Turnos Hoy</p>
            <span className="stat-description">
              Total de turnos generados en el día actual
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats?.waitingTurns || 0}</h3>
            <p>En Espera</p>
            <span className="stat-description">
              Turnos pendientes de ser atendidos
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats?.completedTurns || 0}</h3>
            <p>Completados</p>
            <span className="stat-description">
              Turnos atendidos exitosamente hoy
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats?.activeWorkers || 0}</h3>
            <p>Trabajadores Activos</p>
            <span className="stat-description">
              Empleados actualmente atendiendo
            </span>
          </div>
        </div>
      </div>
      
      <div className="charts-section">
        <div className="chart-card">
          <h3>📈 Turnos por Hora</h3>
          <p className="chart-description">
            Distribución de turnos a lo largo del día
          </p>
          {/* Gráfico de barras */}
        </div>
        
        <div className="chart-card">
          <h3>🎯 Turnos por Área</h3>
          <p className="chart-description">
            Cantidad de turnos por cada área de servicio
          </p>
          {/* Gráfico de pastel */}
        </div>
      </div>
      
      <div className="quick-actions">
        <h3>⚡ Acciones Rápidas</h3>
        <div className="actions-grid">
          <Link to="/admin/trabajadores" className="action-btn">
            👥 Gestionar Trabajadores
          </Link>
          <Link to="/admin/areas" className="action-btn">
            🏢 Gestionar Áreas
          </Link>
          <Link to="/admin/configuracion" className="action-btn">
            ⚙️ Configuración
          </Link>
          <Link to="/display" target="_blank" className="action-btn">
            📺 Ver Display
          </Link>
        </div>
      </div>
    </div>
  );
};
```

### 5. Services (configService.ts)

```typescript
import api from './api';

export const configService = {
  getConfig: async () => {
    const response = await api.get('/config');
    return response.data.data.config;
  },
  
  updateConfig: async (config) => {
    const response = await api.put('/config', config);
    return response.data.data.config;
  },
  
  resetConfig: async () => {
    const response = await api.post('/config/reset');
    return response.data.data.config;
  }
};
```

## 🎨 Estilos Sugeridos

- **Display**: Pantalla completa, fuente grande, colores vivos, auto-refresh
- **Kiosco**: Botones grandes táctiles, interfaz simple e intuitiva
- **Dashboard**: Tarjetas informativas, gráficos claros, colores corporativos
- **CRUDs**: Tablas con filtros, modales para crear/editar, acciones rápidas

## 🔧 Configuraciones Importantes

### API Base URL
```typescript
// src/services/api.ts
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### WebSocket Connection
```typescript
// src/services/websocket.ts
const ws = new WebSocket('ws://localhost:5000');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Manejar eventos: TURN_CALLED, TURN_COMPLETED, etc.
};
```

## 📱 Responsive Design

- **Display**: Diseñado para monitores grandes (TV/Pantallas)
- **Kiosco**: Optimizado para tablets/touchscreens
- **Admin**: Responsive para desktop y tablet
- **Worker**: Optimizado para desktop

## ✅ Siguiente Paso

1. Crea la estructura de carpetas
2. Implementa Login con los 3 botones
3. Implementa Display (tiempo real con WebSocket)
4. Implementa Kiosco (modo único y múltiple)
5. Implementa Dashboard Admin
6. Implementa CRUDs (Workers, Áreas, Config)

Todo debe estar en **ESPAÑOL** con mensajes claros y descriptivos.
