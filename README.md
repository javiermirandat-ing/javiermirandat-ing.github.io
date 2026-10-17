# Portafolio · Javier Miranda Tapia

Portafolio personal con estilo de juego retro: perfil, habilidades, experiencia
laboral, demos de mis proyectos y contacto, en español e inglés.

Sitio estático (HTML, CSS y JavaScript, sin dependencias ni compilación),
publicado con GitHub Pages.

## Cómo cambiar el contenido

Todos los textos están en [`js/data.js`](js/data.js), en español (`es`) y en
inglés (`en`). Para cambiar un trabajo, una habilidad o un proyecto basta con
editar ese archivo: la página se arma sola.

| Qué | Dónde |
|---|---|
| Textos, experiencia, habilidades, proyectos | `js/data.js` |
| Capturas de los proyectos | `img/<proyecto>/` |
| CV descargable (sin la dirección) | `cv/` |
| Certificados (imágenes con el RUT tapado) | `img/certs/` y la lista `certs` en `js/data.js` |
| Demos jugables (builds web de Flutter) | `demos/stray-pets/`, `demos/comite/` |
| Estilos | `css/style.css` |
| Fondo animado (Valparaíso en pixel art) | `js/scene.js` |

## Actualizar una demo de Flutter

1. `flutter build web` en el proyecto (para el Comité, con `-t lib/main_demo.dart`).
2. Copiar `build/web` a `demos/<nombre>/`.
3. En `demos/<nombre>/index.html`, dejar `<base href="/demos/<nombre>/">`.
4. Al final de `flutter_bootstrap.js`, cargar CanvasKit desde la propia carpeta:
   `_flutter.loader.load({ config: { canvasKitBaseUrl: "canvaskit/" } });`

## Detalles

- Atajos: teclas `1` a `5` para cambiar de pestaña, flechas en la galería y
  `Esc` para cerrar. Hay un código secreto.
- Enlaces directos: `#perfil`, `#habilidades`, `#experiencia`, `#proyectos`,
  `#contacto`, `#proyectos/<id>` (por ejemplo `#proyectos/migofit`) y
  `#certificado/<id>` (por ejemplo `#certificado/diplomado`).
- Respeta la preferencia de "reducir movimiento" del sistema.

© 2026 Javier Miranda Tapia
