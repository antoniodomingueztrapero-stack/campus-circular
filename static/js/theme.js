/* Arranque del modo noche.
 *
 * Se carga como fichero externo (no inline) porque la cabecera
 * Content-Security-Policy de la app declara `script-src 'self'`: un <script>
 * inline sería bloqueado por el navegador y volveríamos a ver el destello del
 * tema claro antes de que arrancase app.js.
 *
 * Reglas: la preferencia explícita del usuario (localStorage) manda; si no la
 * hay, se usa la del sistema. Solo toca el atributo `data-theme` y el
 * `theme-color` del navegador — el resto de la lógica vive en app.js.
 */
(function () {
  "use strict";
  var KEY = "***";
  var DARK_BG = "#0d1410";
  var LIGHT_BG = "#12573A";
  var theme = "";

  try { theme = localStorage.getItem(KEY) || ""; } catch (e) { /* modo privado sin storage */ }
  if (theme !== "dark" && theme !== "light") {
    var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    theme = mq && mq.matches ? "dark" : "light";
  }

  var root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "dark" ? DARK_BG : LIGHT_BG;
})();
