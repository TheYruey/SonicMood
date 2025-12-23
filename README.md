# 🎵 SonicMood

SonicMood es una **aplicación de descubrimiento musical basada en el clima**, construida con React, TypeScript y Vite. Conecta la "vibra" atmosférica de tu ubicación actual (o de cualquier ciudad del mundo) con la biblioteca de Spotify para generar la playlist perfecta para el momento.

![SonicMood Banner](public/banner.png)

## ✨ Características

- **Sol & Lluvia, Ritmo y Beat**: Obtiene automáticamente el clima local usando OpenWeatherMap y lo mapea a géneros musicales específicos (ej: *Lluvia + Noche = Jazz/Piano*, *Despejado + Día = Pop/Upbeat*).
- **Modo Teletransporte (Búsqueda)**: ¿No te gusta el clima de donde estás? Escribe el nombre de cualquier ciudad (ej: "Tokyo", "Paris") para experimentar la vibra de otro lugar.
- **Integración Fluida con Spotify**:
  - Flujo de autenticación **PKCE** seguro (sin exponer secretos del cliente).
  - Busca canciones relevantes usando la API de Spotify.
  - **Guardar en Biblioteca**: Crea una nueva playlist directamente en tu cuenta de Spotify con un solo clic.
- **Estado Persistente**: Tu sesión, datos del clima y canciones generadas sobreviven a recargas de página gracias a la persistencia en local storage.
- **Perfil de Usuario Interactivo**: Menú desplegable con efecto glassmorphism para gestionar tu sesión y acceder rápidamente a tu perfil de Spotify.
- **Footer Sticky**: Pie de página profesional que se adapta dinámicamente al contenido, siempre visible o al final de la página según corresponda.
- **Interfaz Hermosa**: Sistema de diseño "Glassmorphism" (vidrio esmerilado) usando Tailwind CSS, con fondos animados tipo Aurora.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, TypeScript, Vite
- **Estilos**: Tailwind CSS (compatible v4), Headless UI
- **Gestión de Estado**: Zustand (con Middleware de Persistencia)
- **Iconos**: Phosphor React
- **APIs**: 
  - [Spotify Web API](https://developer.spotify.com/) (Auth & Search)
  - [OpenWeatherMap API](https://openweathermap.org/) (Datos del clima)

## 🚀 Comenzando

### Prerrequisitos

Necesitas claves de API (API Keys) para:
1.  **[Spotify Developer Dashboard](https://developer.spotify.com/)**: Crea una app y configura la "Redirect URI" a `http://localhost:5173/`.
2.  **[OpenWeatherMap](https://openweathermap.org/)**: Regístrate para obtener una clave gratuita.

### Instalación

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/TheYruey/SonicMood.git
    cd SonicMood
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

3.  Configura las Variables de Entorno:
    Crea un archivo `.env` en el directorio raíz (basado en `.env.example` si existe) y añade:

    ```env
    VITE_SPOTIFY_CLIENT_ID=tu_cliente_id_de_spotify_aqui
    VITE_WEATHER_API_KEY=tu_api_key_de_openweathermap_aqui
    VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/
    ```

    > **Nota de Seguridad:** Nunca subas tu archivo `.env` al control de versiones. Ya está añadido en `.gitignore` por defecto.

4.  Ejecuta el servidor de desarrollo:
    ```bash
    npm run dev
    ```

## 📂 Estructura del Proyecto

- `src/services/api.ts`: Maneja todas las llamadas a API (Spotify y Clima). Incluye la lógica de "Fallback de API de Búsqueda" para evitar endpoints obsoletos.
- `src/store/useStore.ts`: Gestión de estado global con Zustand.
- `src/utils/auth.ts`: Ayudantes de Autenticación PKCE (Generación de Verifier/Challenge).
- `src/utils/moodMap.ts`: Lógica de mapeo de condiciones climáticas a géneros.
- `src/components/ui/GlassCard.tsx`: Componente de UI reutilizable con efecto de vidrio.
- `src/components/ui/Footer.tsx`: Pie de página responsive con efectos visuales y enlaces sociales.
- `src/components/ui/AuroraBackground.tsx`: Fondo animado con efecto Aurora Borealis.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de enviar un Pull Request.

## 📄 Licencia

Este proyecto es open source y está disponible bajo la [Licencia MIT](LICENSE).
