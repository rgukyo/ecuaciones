# Ecuaciones

App para estudiar ecuaciones en **3° de secundaria** (México). Tiene tres módulos:

1. **Enseñanza:** leyes de los signos, jerarquía de operaciones, términos semejantes, ecuaciones de primer grado, problemas, sistemas 2×2 y ecuaciones cuadráticas. Cada ejemplo se abre paso a paso.
2. **Practicar:** ejercicios nuevos cada vez, con pista, solución completa y revisión al momento. Acepta respuestas equivalentes (`3/2`, `1.5`, `1,5`, `-2`).
3. **Exámenes:** eliges temas o un mixto, con tiempo, sin pistas. Al final ves el puntaje, cada solución y qué temas repasar.

No hay cuentas ni servidor. El avance (práctica, lecciones abiertas e historial de exámenes) se guarda solo en el navegador del dispositivo. Puedes borrarlo en **Avance**.

Cuando se publique, la dirección será [https://rgukyo.github.io/ecuaciones/](https://rgukyo.github.io/ecuaciones/). La primera visita descarga la app; después funciona sin conexión y se puede instalar en la pantalla de inicio.

## Instalar en Android

1. Abre la app en **Chrome**.
2. Toca el menú **⋮** (arriba a la derecha).
3. Elige **Agregar a pantalla principal** (o **Instalar app**).
4. Confirma. Queda un ícono como el de cualquier aplicación.

## Instalar en iPhone o iPad

1. Abre la app en **Safari**.
2. Toca **Compartir** (el cuadrado con la flecha).
3. Elige **Agregar a inicio**.
4. Confirma con **Agregar**.

## Probar en esta carpeta

Hace falta un servidor estático (el service worker no corre al abrir el archivo directo):

```bash
python3 -m http.server 8080
```

Entra a `http://localhost:8080`. Las pruebas automáticas son dos:

```bash
node --test tests/generators.test.js tests/smoke.test.js
```
