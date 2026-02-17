# 🎮 Pokédex - Edición Azul
### Diseño Game Boy Advance con React + PokéAPI

---

## 📋 PASO A PASO - Desde cero

### PASO 1: Instalar Node.js (si no lo tienes)
Descarga desde: https://nodejs.org (versión LTS recomendada)

Verifica la instalación:
```bash
node --version   # debe mostrar v18+ 
npm --version    # debe mostrar v9+
```

---

### PASO 2: Crear la carpeta del proyecto
```bash
# Ve a donde quieras crear el proyecto
cd ~/Documents  # o la carpeta que prefieras

# Crea la carpeta
mkdir pokedex-app
cd pokedex-app
```

---

### PASO 3: Copiar los archivos del proyecto
Copia todos los archivos que te entregué manteniendo esta estructura:

```
pokedex-app/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── hooks/
    │   └── usePokemon.js
    ├── components/
    │   ├── GameBoyShell.jsx
    │   ├── Screen.jsx
    │   ├── Dpad.jsx
    │   ├── PokemonCard.jsx
    │   └── SearchBar.jsx
    └── styles/
        └── App.css
```

---

### PASO 4: Instalar dependencias
```bash
# Dentro de la carpeta pokedex-app
npm install
```
Esto instalará: React, ReactDOM y Vite.
Tomará 1-2 minutos la primera vez.

---

### PASO 5: Iniciar el proyecto
```bash
npm run dev
```

Verás algo como:
```
  VITE v4.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Abre el navegador en: **http://localhost:5173**

---

## ✨ FUNCIONALIDADES

| Funcionalidad | Descripción |
|---|---|
| 🎮 Diseño GBA | Shell completo tipo Game Boy Advance |
| 🔍 Búsqueda | Busca por nombre o número de Pokédex |
| ❤️ Favoritos | Guarda tus Pokémon favoritos (persiste en localStorage) |
| 🌙 Day/Night | Toggle de modo día/noche |
| ✨ Shiny | Click en el sprite para ver la versión shiny |
| ⌨️ Teclado | Usa las flechas del teclado para navegar |
| 🎲 Random | Botón SELECT = Pokémon aleatorio |
| 📊 Stats | Barras animadas de estadísticas |
| 🌐 Multi-idioma | Descripción en español (cuando esté disponible) |

---

## 🛠️ COMANDOS ÚTILES

```bash
npm run dev      # Servidor de desarrollo (con hot-reload)
npm run build    # Build para producción
npm run preview  # Preview del build de producción
```

---

## 🗂️ QUÉ HACE CADA ARCHIVO

### `src/hooks/usePokemon.js`
El corazón del proyecto. Maneja todo el estado y las llamadas a la PokéAPI:
- Lista de los 151 Pokémon de Gen 1
- Detalles de cada Pokémon (stats, tipos, habilidades)
- Texto descriptivo de cada Pokémon en español
- Sistema de favoritos con localStorage
- Navegación (siguiente/anterior)

### `src/components/GameBoyShell.jsx`
El componente principal que ensambla todo el diseño GBA.
- Pokéballs decorativas animadas
- Logo AZUL con glow
- LEDs animados
- Toggle Day/Night
- Botones A y B
- Botones Start y Select

### `src/components/Screen.jsx`
La "pantalla" del GameBoy. Muestra:
- Sprite animado del Pokémon
- Tipos con colores
- Barras de estadísticas
- Texto descriptivo de la Pokédex

### `src/components/Dpad.jsx`
El control direccional para navegar entre Pokémon.
También escucha las flechas del teclado.

### `src/components/PokemonCard.jsx`
Cada tarjeta en la lista de Pokémon.

### `src/styles/App.css`
Todo el CSS del diseño. Incluye:
- Variables CSS para el tema azul
- Animaciones de entrada
- Efectos de glow y neon
- Diseño responsive

---

## 🚀 PRÓXIMOS PASOS (mejoras futuras)

- [ ] Agregar React Router para páginas individuales por Pokémon
- [ ] Sistema de comparación entre dos Pokémon
- [ ] Animación de sonido al seleccionar
- [ ] Filtro por tipo de Pokémon
- [ ] Agregar Gen 2, 3, etc.
- [ ] Modo batalla simulado

---

## 🐛 PROBLEMAS COMUNES

**"command not found: npm"**
→ Instala Node.js desde nodejs.org

**"Cannot find module"**
→ Verifica que la estructura de carpetas sea exacta

**Pokémon no carga / red error**
→ La PokéAPI es gratuita pero tiene límites. Espera unos segundos y recarga.

---

## 📚 API USADA

**PokéAPI** - https://pokeapi.co (GRATIS, sin API key)

Endpoints:
- `GET /api/v2/pokemon?limit=151` → Lista Gen 1
- `GET /api/v2/pokemon/{id}` → Detalles del Pokémon
- `GET /api/v2/pokemon-species/{id}` → Texto descriptivo

---

¡Gotta catch 'em all! 🎮⚡
