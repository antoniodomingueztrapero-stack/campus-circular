/* Campus Circular — SPA independiente (ES / EN / GL) */
"use strict";

const API = "";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const BOOT = (() => {
  try {
    return JSON.parse(($("#cc-boot") && $("#cc-boot").textContent) || "{}");
  } catch (e) {
    return {};
  }
})();

const CONFIG = {
  service: BOOT.service || "Campus Circular",
  contactEmail: BOOT.contactEmail || "campuscircular@hotmail.com",
  controller: BOOT.controller || "Equipo Campus Circular (proyecto académico independiente)",
  legalVersion: BOOT.legalVersion || "2026-11-17",
  legalUpdated: BOOT.legalUpdated || "2026-11-17",
  sessionDays: Number(BOOT.sessionDays) || 30,
};

const ROUTE_PATHS = {
  home: "/", publish: "/publicar", points: "/puntos", rules: "/normas",
  about: "/proyecto", my: "/mi-area", legal: "/aviso-legal",
  privacy: "/privacidad", terms: "/condiciones",
};
const PATH_VIEWS = Object.fromEntries(
  Object.entries(ROUTE_PATHS).map(([view, path]) => [path, view])
);
const TEAM_NAMES = [
  "Pavlo Kovalenko", "Karen Itzel Sandoval Ramos", "Okechukwu Patrick Okeh",
  "Fernando Heriberto Cardenas Rubi", "Alba Grille Louro", "Filip Juran",
  "Greypher Alisander Garcia Alvarado", "Jacob Schaal", "Antonio Domínguez Trapero"
];

/* ---------------- i18n ---------------- */
const I18N = {
  es: {
    skip_content: "Saltar al contenido", close: "Cerrar", brand_tag: "Proyecto independiente · CTC Congress",
    nav_home: "Explorar", nav_publish: "Publicar", nav_points: "Puntos de entrega", nav_rules: "Normas y confianza", nav_about: "El proyecto",
    nav_primary: "Principal", brand_home: "Campus Circular — inicio", account_menu: "Menú de cuenta", photo_preview: "Vista previa de la foto del objeto",
    footer_tag: "Reutilización e intercambio de materiales de segunda vida.",
    footer_independent: "Proyecto independiente. No es un servicio oficial de ninguna universidad.",
    footer_explore: "Explorar", footer_legal: "Información legal", footer_legal_notice: "Aviso legal",
    footer_privacy: "Privacidad y datos", footer_terms: "Condiciones de uso", footer_presented: "Presentado en",
    footer_payment_mini: "Sin pagos dentro de la plataforma",
    footer_note: "Prototipo sin ánimo de lucro · sin analítica · sin recursos de terceros · las imágenes de ejemplo son locales.",
    credit_label: "Equipo del proyecto", payment_eyebrow: "Pagos", noscript: "Campus Circular necesita JavaScript para mostrar el catálogo y gestionar la cuenta.",
    title_home: "Explorar", catalog_title: "Catálogo de segunda vida", title_publish: "Publicar", title_points: "Puntos de entrega", title_rules: "Normas y confianza",
    title_about: "El proyecto", title_my: "Mi área", title_legal: "Aviso legal", title_privacy: "Privacidad y datos", title_terms: "Condiciones de uso",
    hero_eyebrow: "Reutilización e intercambio", hero_title: "Lo que ya no usas puede seguir teniendo una buena historia.",
    hero_lead: "Encuentra o publica libros, ropa, muebles y material de estudio de segunda mano entre estudiantes de la Universidade de Vigo. Acuerda la entrega en un lugar público.",
    hero_search_label: "Buscar en el catálogo", hero_image_alt: "Auriculares, un teclado, un libro abierto y una mochila.",
    hero_search_ph: "Libros, ropa, muebles…", hero_search_btn: "Buscar", publish_cta: "Publicar un objeto",
    stat_items: "objetos publicados", stat_users: "cuentas creadas",
    stats_title: "Campus Circular en cifras", stats_unavailable: "Las cifras no están disponibles en este momento.",
    payment_banner_title: "Sin pasarela de pago",
    payment_banner_body: "Campus Circular no procesa pagos, no cobra comisiones, no custodia dinero ni garantiza objetos. «Vender» muestra solo un precio orientativo: cualquier pago se acuerda directamente entre particulares, fuera de la plataforma.",
    all: "Todo", search: "Buscar", filters: "Filtros", campus: "Campus", condition: "Estado", type: "Tipo", sort: "Ordenar",
    sort_recent: "Más recientes", sort_price_asc: "Precio: menor a mayor", sort_price_desc: "Precio: mayor a menor",
    results: "objetos", no_results: "No hay objetos con esos filtros. Prueba con otra búsqueda o publica el tuyo.",
    free: "Gratis", price_orientative: "Precio orientativo", view_item: "Ver", items_word: "objetos",
    how_title: "Cómo funciona", how_1_t: "1. Publica", how_1_b: "Foto real, estado honesto y punto de entrega. Sin datos personales en la descripción.",
    theme_to_dark: "Activar modo noche",
    theme_to_light: "Activar modo claro",
    how_2_t: "2. Busca y solicita", how_2_b: "Filtra por categoría, campus y estado. Envía una solicitud con un mensaje breve.",
    how_3_t: "3. Queda en público", how_3_b: "Acordad un lugar seguro y marcado como entregado cuando terminéis.",
    trust_title: "Diseñado con criterios claros", trust_1: "Consentimiento explícito, aviso legal, privacidad y condiciones en tres idiomas.",
    trust_2: "Exportación y supresión de cuenta desde Mi área; sin analítica, cookies de terceros ni rastreadores.",
    trust_3: "Imágenes locales, sin pasarela de pago, sin comisiones ni fondos retenidos.",
    login: "Iniciar sesión", register: "Crear cuenta", logout: "Cerrar sesión", my_area: "Mi área",
    my_items: "Mis objetos", my_requests: "Mis solicitudes", received: "Solicitudes recibidas", favorites: "Favoritos",
    publish_title: "Publicar un objeto", publish_intro: "Publica como particular. El precio, si lo hay, es orientativo; Campus Circular no gestiona cobros.",
    publish_progress: "de 3 pasos listos",
    publish_check_photo: "Foto", publish_check_title: "Título", publish_check_consent: "Declaración",
    publish_step_media: "La foto", publish_step_media_hint: "Una foto real vende más que mil palabras. Ten el objeto delante.",
    publish_step_basics: "Qué publicas", publish_step_basics_hint: "Título, categoría y modalidad. Lo demás se entiende en la foto.",
    publish_step_final: "Confirmar y publicar", publish_step_final_hint: "Solo la declaración de particular y ya está.",
    photo_take: "Hacer una foto", photo_pick: "Elegir de la galería",
    photo_added: "Foto añadida · toca para cambiarla",
    publish_title_hint: "Nombre, marca y modelo si los tiene.",
    publish_type_hint: "Puedes cambiarlo después desde tus publicaciones.",
    publish_bar_title: "Todo listo para publicar",
    publish_bar_hint: "Añade foto, título y confirmación",
    publish_bar_pending: "Complétalo para publicar",
    publish_bar_ready: "Ya puedes publicarlo",
    publish_preview_t: "Vista previa",
    publish_preview_empty: "Añade una foto para ver tu anuncio",
    publish_preview_untitled: "Título de tu anuncio",
    publish_tip: "Fondo liso, luz natural y una foto del objeto completo: es lo que más solicitudes genera.",
    f_title: "Título", f_desc: "Descripción", f_category: "Categoría", f_condition: "Estado", f_type: "Tipo de intercambio",
    f_campus: "Campus", f_handover: "Punto de entrega", f_price: "Precio orientativo (€)", f_price_hint: "No se cobra aquí. El importe se acuerda directamente y fuera de la plataforma.",
    f_image: "Foto del objeto", f_image_hint: "Sube una imagen real. Se reescala a 1200 px, se convierte a WebP y se eliminan los metadatos EXIF (incluida la ubicación).",
    upload: "Subir imagen", f_private: "Confirmo que publico como particular", f_private_hint: "No se admiten vendedores profesionales ni actividad comercial habitual.",
    desc_hint: "Describe marcas, defectos y qué incluye. No escribas teléfonos, direcciones ni datos de contacto.",
    publish_btn: "Publicar objeto", cancel: "Cancelar", payment_notice_title: "Pago fuera de Campus Circular",
    payment_notice_body: "La plataforma no intermedia ni procesa el pago. Acordadlo directamente en la entrega, en efectivo o por un medio directo entre particulares. No hay comisión, reembolso ni garantía de Campus Circular.",
    detail_request: "Solicitar", detail_fav: "Guardar", detail_faved: "Guardado", request_title: "Solicitar este objeto",
    request_msg: "Mensaje para la otra persona (opcional)", request_msg_ph: "Hola, me interesa… ¿podemos quedar en un lugar público?",
    chat: "Abrir chat", chat_title: "Conversación sobre {item}", chat_send: "Enviar", chat_empty: "Aún no hay mensajes. Escribe para coordinar el intercambio.", chat_placeholder: "Escribe un mensaje…", notify_new_request: "Tienes una nueva solicitud de un objeto.", notify_new_message: "Tienes un mensaje nuevo en una solicitud.",
    request_btn: "Enviar solicitud", request_sent: "Solicitud enviada. La otra persona la verá en su área.",
    request_privacy: "Usa este mensaje solo para coordinar el intercambio. No compartas datos sensibles.",
    owner: "Publicado por", academic_email: "Dominio académico", personal_email: "Correo personal",
    identity_note: "La insignia describe solo el dominio del correo: no acredita matrícula, identidad ni pertenencia institucional.",
    handover_label: "Entrega en", loan_rules: "Si es un préstamo, acordad por escrito la fecha de devolución en la solicitud.",
    detail_payment_notice: "Precio orientativo. Cualquier pago se acuerda directamente entre particulares, fuera de Campus Circular; la plataforma no cobra, retiene fondos ni media en disputas.",
    detail_privacy_note: "No publiques datos de contacto en la descripción; utiliza la solicitud y queda en un lugar público.",
    status_disponible: "Disponible", status_reservado: "Reservado", status_entregado: "Entregado",
    req_pendiente: "Pendiente", req_aceptada: "Aceptada", req_rechazada: "Rechazada", req_cancelada: "Cancelada", req_completada: "Completada",
    accept: "Aceptar", reject: "Rechazar", complete: "Marcar entregado", cancel_req: "Cancelar solicitud",
    mark_available: "Marcar disponible", mark_reserved: "Marcar reservado", mark_delivered: "Marcar entregado", delete_item: "Eliminar",
    points_title: "Puntos de entrega", points_lead: "Estas son sugerencias de lugares públicos y fáciles de encontrar. Elegid siempre un sitio concurrido y, si alguien habilita un espacio físico, debe contar con la autorización de quien lo gestiona.",
    points_notice: "Campus Circular no habilita puntos oficiales: son etiquetas orientativas para acordar la entrega, no espacios reservados ni servicios institucionales.",
    rules_title: "Normas y confianza", rules_lead: "Un intercambio sencillo funciona mejor con información honesta, prudencia y reglas pequeñas y claras.",
    about_title: "El proyecto", about_lead: "Campus Circular es un prototipo independiente presentado en CTC Congress para explorar la reutilización de materiales de segunda vida.",
    auth_login_title: "Iniciar sesión", auth_register_title: "Crear cuenta", auth_name: "Nombre visible", auth_email: "Email",
    auth_password: "Contraseña", auth_password_hint: "Mínimo 8 caracteres. No la compartas.", auth_campus: "Campus",
    auth_email_hint: "Vale cualquier correo válido. No verificamos matrícula ni identidad.",
    auth_btn_login: "Entrar", auth_btn_register: "Registrarme", auth_no_account: "¿No tienes cuenta?", auth_have_account: "¿Ya tienes cuenta?",
    auth_minimum: "Resumen: guardamos nombre, email, contraseña con hash, campus y los contenidos que publiques. Puedes exportarlos o borrarlos desde Mi área.",
    auth_consent: "Acepto la {privacy} y las {terms}. He leído el resumen y consiento expresamente el tratamiento de mis datos para usar el servicio.",
    demo_hint: "Crea tu cuenta con cualquier correo válido. No hay cuentas de demostración compartidas.",
    need_login: "Inicia sesión para continuar.", need_login_publish: "Inicia sesión para publicar un objeto.",
    consent_update_title: "Actualiza tu consentimiento", consent_update_body: "La política de privacidad y las condiciones se han actualizado. léelas y acepta la versión vigente para seguir usando tu cuenta: {privacyLink} · {termsLink}.",
    consent_update_check: "Acepto la versión {version} de la política y las condiciones.", consent_update_btn: "Guardar consentimiento",
    toast_published: "Objeto publicado correctamente.", toast_deleted: "Objeto eliminado.", toast_status: "Estado actualizado.",
    toast_fav_on: "Guardado en favoritos.", toast_fav_off: "Eliminado de favoritos.", toast_request: "Solicitud enviada.", toast_req_status: "Solicitud actualizada.",
    toast_login: "Sesión iniciada. ¡Bienvenido/a!", toast_register: "Cuenta creada. ¡Bienvenido/a a Campus Circular!", toast_logout: "Sesión cerrada.",
    toast_error: "Algo salió mal. Inténtalo de nuevo.", toast_upload: "Imagen subida.", toast_own_item: "Este es tu objeto. Puedes gestionarlo en Mi área.",
    toast_account_exported: "Datos exportados.", toast_account_deleted: "Cuenta y datos eliminados.", toast_consent_updated: "Consentimiento actualizado.",
    toast_consent_required: "Debes aceptar la política y las condiciones.", toast_private_required: "Confirma que publicas como particular.",
    toast_invalid_image: "Usa una imagen subida a Campus Circular.", toast_unauthorized: "Inicia sesión para continuar.",
    toast_email_taken: "Ya existe una cuenta con ese email.", toast_invalid_credentials: "Email o contraseña incorrectos.", toast_invalid_password: "Revisa la contraseña.",
    cat_libros: "Libros y apuntes", cat_ropa: "Ropa y complementos", cat_muebles: "Muebles", cat_estudio: "Material de estudio",
    cat_electronica: "Electrónica / accesorios", cat_cocina: "Cocina / hogar", cat_electrodomesticos: "Pequeños electrodomésticos",
    cat_deporte: "Deporte y ocio", cat_otros: "Otros",
    cond_nuevo: "Nuevo", cond_como_nuevo: "Como nuevo", cond_bueno: "Bueno", cond_usable: "Usable con marcas",
    type_regalar: "Regalar", type_prestar: "Prestar", type_intercambiar: "Intercambiar", type_vender: "Vender (precio orientativo)",
    campus_vigo: "Vigo", campus_pontevedra: "Pontevedra", campus_ourense: "Ourense",
    hand_biblioteca: "Biblioteca", hand_entrada: "Entrada principal", hand_cafeteria: "Cafetería",
    hand_punto: "Punto público señalizado", hand_acordado: "Lugar público acordado",
    my_empty_items: "Aún no has publicado ningún objeto.", my_empty_requests: "No tienes solicitudes enviadas.",
    my_empty_received: "No has recibido solicitudes todavía.", my_empty_favs: "No tienes favoritos. Toca el corazón en un objeto para guardarlo.",
    rules_1_t: "Fotos y estado real", rules_1_b: "Describe marcas y defectos. Si algo no coincide al verlo, no lo aceptes.",
    rules_2_t: "Sin verificación oficial", rules_2_b: "No comprobamos matrícula ni identidad. Actúa con prudencia y no compartas datos sensibles.",
    rules_3_t: "Préstamos con fecha", rules_3_b: "Acordad la devolución por escrito en la solicitud.",
    rules_4_t: "Entregas seguras", rules_4_b: "Lugares públicos y concurridos, nunca domicilios de desconocidos.",
    rules_5_t: "Comunicación amable", rules_5_b: "Responde con tiempo. Si no puedes, cancela la solicitud.",
    rules_6_t: "Sin envíos por correo", rules_6_b: "Todo se entrega en mano para evitar problemas y costes innecesarios.",
    rules_payment_title: "Pagos fuera de la plataforma", rules_payment_body: "No hay pasarela de pago, monedero, depósito, comisión ni reembolso gestionado por Campus Circular. El precio es orientativo y cualquier pago directo se acuerda entre particulares, fuera del servicio.",
    rules_data_title: "Datos mínimos", rules_data_body: "Solo pedimos lo necesario para la cuenta y la publicación. Puedes exportar tus datos o eliminar la cuenta; no usamos analítica ni publicidad de terceros.",
    points_biblioteca_t: "Biblioteca", points_biblioteca_b: "Zona de paso sencilla; queda en la entrada o recepción.",
    points_entrada_t: "Entrada principal", points_entrada_b: "Visible y fácil de encontrar entre clases.",
    points_cafeteria_t: "Cafetería", points_cafeteria_b: "Lugar concurrido antes o después de clase.",
    points_punto_t: "Punto público señalizado", points_punto_b: "Solo si el espacio está autorizado para dejar y recoger objetos.",
    points_acordado_t: "Lugar público acordado", points_acordado_b: "Acordad un sitio concreto, seguro y visible en el mensaje.",
    about_p1: "La idea es sencilla: facilitar que objetos en buen estado encuentren a otra persona antes de convertirse en residuo, sin crear una tienda, un monedero ni un servicio oficial.",
    about_p2: "La web permite publicar, buscar, guardar favoritos y solicitar materiales. La información sobre el estado y un punto de entrega claro sustituyen a las promesas comerciales: cada acuerdo es entre particulares.",
    about_p3: "Esta versión es un prototipo sin ánimo de lucro. Los objetos de ejemplo son ficticios, las imágenes son locales y el despliegue gratuito puede usar una base de datos efímera. No sustituye a una evaluación jurídica, fiscal o de protección de datos antes de un uso real con datos personales.",
    about_pillars_title: "Tres ideas clave", about_pillar_1: "Independencia: sin marca institucional ni afirmación de servicio oficial.",
    about_pillar_2: "Privacidad: consentimiento, minimización, exportación, supresión y cero rastreadores.",
    about_pillar_3: "Pagos: sin comisiones ni custodia de fondos; acuerdos directos fuera de la plataforma.",
    photo_caption: "Fotografía del equipo del proyecto.", photo_privacy: "Si apareces en la imagen y prefieres que se retire, escríbenos.",
    account_data_title: "Tus datos, bajo tu control", account_data_body: "Consulta qué guarda tu cuenta, descarga una copia o elimínala. La supresión borra tu perfil, sesiones, publicaciones, favoritos y solicitudes propias; lo escrito por otras personas se conserva anonimizado.",
    account_email: "Email", account_campus: "Campus", account_consent: "Consentimiento", account_consent_ok: "Vigente", account_consent_old: "Pendiente de renovar",
    account_rights: "Derechos", account_rights_body: "Acceso, rectificación, supresión, oposición, limitación y portabilidad. También puedes reclamar ante la AEPD.",
    account_note: "Para ejercer tus derechos o resolver dudas: {contact}. En un despliegue institucional con datos reales, coordina antes con la delegación de protección de datos correspondiente.",
    privacy_export: "Descargar mis datos", privacy_delete: "Eliminar mi cuenta", privacy_login_manage: "Inicia sesión para gestionar tus datos.",
    delete_account_title: "Eliminar cuenta", delete_warning: "Esta acción es irreversible. Se borrarán tu perfil, sesiones, objetos, favoritos y solicitudes propias; el historial de otras personas se conserva sin tus datos. Confirma tu contraseña.",
    delete_password: "Contraseña actual", delete_confirm_btn: "Eliminar definitivamente",
    legal_kicker: "Documento informativo", legal_updated: "Última actualización", legal_version: "Versión", legal_print: "Imprimir / guardar PDF",
    back_home: "Volver al inicio", legal_contact_label: "Contacto",
    legal_title: "Aviso legal", legal_lead: "Información general sobre Campus Circular, su naturaleza independiente y el uso de este sitio.",
    privacy_title: "Política de privacidad y datos", privacy_lead: "Aviso en capas: aquí tienes el resumen y el detalle del tratamiento de datos personales.",
    terms_title: "Condiciones de uso", terms_lead: "Reglas para participar como particular en un prototipo de reutilización sin pagos gestionados por la plataforma.",
    hero_chip_1: "Sin pagos ni comisiones", hero_chip_2: "Datos mínimos", hero_chip_3: "Proyecto independiente",
    type_badge_regalar: "Regalar", type_badge_prestar: "Prestar", type_badge_intercambiar: "Intercambiar", type_badge_vender: "Vender",
    nav_my: "Mi área", nav_my_short: "Mi área", nav_publish_short: "Publicar", nav_points_short: "Puntos", nav_rules_short: "Normas",
    filters_btn: "Filtros", filters_title: "Filtros y orden", filters_subtitle: "Ajusta campus, estado, tipo y orden de los resultados.",
    filters_apply: "Ver resultados", filters_clear: "Limpiar todo", sort_by: "Ordenar por", filter_remove: "Quitar filtro: {value}",
    photo_unavailable: "Foto no disponible",
    loading_items: "Cargando objetos…", retry: "Reintentar", catalog_eyebrow: "Catálogo",
    results_found: "objetos encontrados", results_one: "objeto encontrado",
    empty_catalog_t: "Aún no hay objetos publicados", empty_catalog_b: "Sé la primera persona en dar una segunda vida a algo que ya no usas.",
    empty_filter_t: "Ningún objeto coincide", empty_filter_b: "Prueba a quitar algún filtro o a buscar con otras palabras.",
    empty_fav_t: "Todavía no guardas nada", empty_fav_b: "Toca el corazón de un objeto para guardarlo y verlo aquí.",
    empty_my_items_t: "Aún no has publicado nada", empty_my_items_b: "Publica tu primer objeto: con una foto real y un estado honesto basta.",
    empty_req_t: "Sin solicitudes enviadas", empty_req_b: "Cuando solicites un objeto, verás aquí su estado.",
    empty_recv_t: "Sin solicitudes recibidas", empty_recv_b: "Cuando alguien se interese por tus objetos, aparecerá en esta lista.",
    publish_first: "Publicar el primero", browse_catalog: "Explorar el catálogo", close_toast: "Cerrar notificación",
    detail_description: "Descripción", detail_handover_h: "Entrega y seguridad", detail_payment_h: "Pago fuera de la plataforma",
    detail_unavailable: "Este objeto ya no está disponible.", detail_manage: "Gestionar en Mi área", status_change: "Cambiar estado",
    edit_item: "Editar",
    edit_title: "Editar publicación",
    edit_hint: "Cambia los datos del objeto. La foto se mantiene.",
    edit_save: "Guardar cambios",
    edit_saved: "Publicación actualizada.",
    status_quick: "Estado de la publicación",
    demo_cta: "Probar al instante",
    demo_note: "Abre una cuenta temporal, sin registro. Lo que publiques lo verá todo el mundo en el catálogo y se queda ahí; la cuenta caduca en {h} h. No pongas datos personales.",
    demo_started: "Modo demo: publica algo y lo verá todo el mundo en el catálogo.",
    demo_badge: "demo",
    demo_failed: "No se pudo abrir la demo. Inténtalo otra vez.",
    or: "o",
    filters_view: "Ver {n} objetos",
    filters_view_all: "Ver todos",
    confirm_delete_t: "¿Eliminar este objeto?", confirm_delete_b: "Se borrará la publicación y sus datos asociados. Esta acción no se puede deshacer.",
    confirm_delete_btn: "Sí, eliminar",
    photo_drop_t: "Toca para elegir una foto", photo_drop_b: "JPG, PNG o WebP · máximo 5 MB · se optimiza al subir",
    photo_remove: "Quitar foto", photo_upload: "Subir foto", photo_uploading: "Subiendo foto…",
    photo_ready: "Foto subida y lista", photo_change: "Cambiar foto",
    form_sec_1: "Lo esencial", form_sec_2: "Detalles del intercambio", form_sec_3: "Foto y publicación",
    publishing: "Publicando…", sending: "Enviando…", saving: "Guardando…",
    title_ph: "Ej.: Lámpara de escritorio LED",
    my_area_subtitle: "Tus publicaciones, solicitudes y datos.",
    hand_conserjeria: "Conserjería",
    points_conserjeria_t: "Conserjería",
    points_conserjeria_b: "Punto de información a la entrada, con personal y zona de paso.",
    estimate_word: "estimación",
    trust_panel_title: "Confianza y trayectoria",
    verified_badge: "Dominio académico",
    rating_aria: "Valoración: {n} de 5 ({c} valoraciones)",
    rating_none: "Sin valoraciones todavía",
    rating_none_short: "sin valoraciones",
    ratings_received: "Valoraciones recibidas",
    ratings_none: "Todavía no hay valoraciones de este perfil.",
    comments_title: "Valoraciones y comentarios",
    comments_empty: "Todavía no hay comentarios. Sé la primera persona en opinar.",
    comments_add: "Deja tu valoración",
    comments_body: "Comentario",
    comments_body_ph: "¿Qué te pareció esta publicación? Describe el estado, la entrega o cualquier detalle útil.",
    comments_score: "Puntuación (opcional)",
    comments_score_none: "Sin puntuación",
    comments_submit: "Publicar comentario",
    comments_login: "Inicia sesión para dejar un comentario.",
    comments_already: "Ya has dejado tu valoración en esta publicación.",
    comments_posted: "Comentario publicado.",
    comments_count: "{n} comentarios",
    comments_count_one: "1 comentario",
    comments_avg: "{a} de 5",
    comments_score_aria: "Puntuar con {n} estrellas",
    comments_more: "Ver más comentarios",
    comments_own: "Tus propias publicaciones no pueden valorarse por ti mismo: quien opina es quien recibe el objeto.",
    comments_need_something: "Escribe un comentario o deja una valoración.",
    exchanges_completed: "Intercambios completados",
    given_label: "Entregados",
    received_label: "Recibidos",
    level_label: "Nivel",
    level_semilla: "Semilla",
    level_brote: "Brote",
    level_arbol: "Árbol",
    level_bosque: "Bosque",
    level_next: "Siguiente:",
    level_max: "Nivel máximo alcanzado",
    exchanges_short: "intercambios",
    badges_title: "Insignias",
    badge_verified: "Email de dominio académico",
    badge_first_delivery: "Primera entrega",
    badge_five_exchanges: "Cinco intercambios",
    badge_rated: "Perfil valorado",
    badge_earned: "conseguida",
    badge_locked: "pendiente",
    rate_title: "Valora el intercambio",
    rate_lead: "Tu valoración ayuda a otras personas a decidir con quién intercambiar.",
    rate_score_legend: "Tu valoración",
    rate_comment: "Comentario (opcional)",
    rate_comment_ph: "¿Cómo fue la entrega? Sin datos personales.",
    rate_submit: "Enviar valoración",
    rate_later: "Ahora no",
    rate_cta: "Valorar",
    rate_yours: "Tu valoración",
    rate_note: "La valoración es pública y no se puede editar una vez enviada.",
    rate_item_label: "Objeto",
    toast_rated: "Gracias por valorar",
    form_quick: "Lo esencial",
    form_quick_hint: "Foto, título, categoría y tipo. Publicar lleva menos de un minuto.",
    form_optional: "Detalles opcionales",
    form_optional_hint: "Descripción, estado, campus y punto de entrega. Puedes publicar sin rellenarlos.",
    f_desc_optional: "Descripción (opcional)",
    detail_no_desc: "Sin descripción adicional.",
    image_required_hint: "Obligatoria: es la foto que verá quien reciba el objeto.",
    toast_image_required: "Añade una foto para publicar.",
    required_word: "obligatorio",
    status_help: "Reservado indica que ya hay un acuerdo; entregado cierra el intercambio.",
    req_handover: "Punto propuesto",
    request_point: "Punto de encuentro",
    request_point_hint: "Elige un sitio público y concurrido; podéis ajustarlo al aceptar.",
    req_rated: "Valorado con {n}/5",
    trust_error: "No se pudo cargar tu perfil de confianza.",
    searching: "Buscando…",
    cold_title: "El servidor se está despertando",
    cold_body: "El plan gratuito se suspende por inactividad: la primera petición puede tardar unos segundos.",
    cold_offline: "No hay conexión con el servidor. Vuelve a intentarlo en unos segundos.",
    load_more: "Cargar más objetos",
    results_partial: "{shown} de {total} objetos encontrados",
    report_open: "Reportar publicación",
    report_title: "Reportar esta publicación",
    report_privacy: "El reporte queda guardado con tu cuenta para revisión. No se avisa a la otra persona.",
    report_reason: "Motivo",
    report_reason_spam: "Spam o publicidad",
    report_reason_inapropiado: "Contenido inapropiado",
    report_reason_estafa: "Posible estafa",
    report_reason_duplicado: "Publicación duplicada",
    report_reason_otro: "Otro motivo",
    report_comment: "Comentario (opcional)",
    report_comment_ph: "Cuéntanos qué ocurre; ayuda a revisarlo antes.",
    report_note: "Tres reportes de cuentas distintas retiran la publicación del catálogo hasta su revisión.",
    report_send: "Enviar reporte",
    report_sent: "Reporte enviado. Gracias por cuidar el tablón.",
    report_sent_hidden: "Reporte enviado. La publicación se ha retirado hasta revisión.",
    report_already: "Ya has reportado esta publicación.",
    status_review: "En revisión",
    review_note: "Retirada del catálogo tras {n} reportes. Revísala o elimínala.",
    toast_rate_limited: "Demasiados intentos seguidos. Espera un momento y vuelve a probar.",
    toast_not_found: "Esta publicación ya no está disponible.",
    profile_edit: "Editar perfil",
    profile_title: "Editar perfil",
    profile_email_note: "Puedes cambiar tu nombre y tu campus. El email no se edita: cambiarlo exige verificarlo antes.",
    profile_name: "Nombre visible",
    profile_campus: "Campus",
    profile_campus_hint: "Se usa para filtrar y para proponer puntos de entrega.",
    profile_save: "Guardar cambios",
    profile_saved: "Perfil actualizado.",
    menu_password: "Cambiar contraseña",
    password_title: "Cambiar contraseña",
    password_lead: "Al cambiarla se cerrarán las demás sesiones abiertas con la contraseña anterior; esta seguirá activa.",
    password_current: "Contraseña actual",
    password_new: "Contraseña nueva",
    password_repeat: "Repite la contraseña nueva",
    password_save: "Guardar contraseña",
    password_changed: "Contraseña actualizada. Las demás sesiones se han cerrado.",
    password_mismatch: "Las dos contraseñas nuevas no coinciden.",
    password_hint: "Mínimo 8 caracteres y que no sea una contraseña común.",
    password_weak: "Esa contraseña es demasiado común. Prueba con una frase larga.",
    password_bad_current: "La contraseña actual no es correcta.",
    password_same: "La contraseña nueva debe ser distinta de la actual.",
    lang_name: "Español",
  },
  en: {
    skip_content: "Skip to content", close: "Close", brand_tag: "Independent project · CTC Congress",
    nav_home: "Browse", nav_publish: "List an item", nav_points: "Handover points", nav_rules: "Rules & trust", nav_about: "The project",
    nav_primary: "Main", brand_home: "Campus Circular — home", account_menu: "Account menu", photo_preview: "Preview of the item photo",
    footer_tag: "Reuse and exchange of second-life materials.",
    footer_independent: "Independent project. Not an official service of any university.",
    footer_explore: "Explore", footer_legal: "Legal information", footer_legal_notice: "Legal notice",
    footer_privacy: "Privacy & data", footer_terms: "Terms of use", footer_presented: "Presented at",
    footer_payment_mini: "No payments inside the platform",
    footer_note: "Non-profit prototype · no analytics · no third-party resources · sample images are local.",
    credit_label: "Project team", payment_eyebrow: "Payments", noscript: "Campus Circular needs JavaScript to show the catalogue and manage your account.",
    title_home: "Browse", catalog_title: "Second-life catalogue", title_publish: "List an item", title_points: "Handover points", title_rules: "Rules & trust",
    title_about: "The project", title_my: "My area", title_legal: "Legal notice", title_privacy: "Privacy & data", title_terms: "Terms of use",
    hero_eyebrow: "Reuse and exchange", hero_title: "What you no longer use can still have a good story.",
    hero_lead: "Find or list second-hand books, clothing, furniture and study materials among University of Vigo students. Arrange handover in a public place.",
    hero_search_label: "Search the catalogue", hero_image_alt: "Headphones, a keyboard, an open book and a backpack.",
    hero_search_ph: "Books, clothes, furniture…", hero_search_btn: "Search", publish_cta: "List an item",
    stat_items: "items listed", stat_users: "accounts created",
    stats_title: "Campus Circular in numbers", stats_unavailable: "Figures are currently unavailable.",
    payment_banner_title: "No payment gateway",
    payment_banner_body: "Campus Circular does not process payments, charge fees, hold funds or guarantee items. “Sell” shows an indicative price only: any payment is agreed directly between private individuals, outside the platform.",
    all: "All", search: "Search", filters: "Filters", campus: "Campus", condition: "Condition", type: "Type", sort: "Sort",
    sort_recent: "Most recent", sort_price_asc: "Price: low to high", sort_price_desc: "Price: high to low",
    results: "items", no_results: "No items match those filters. Try another search or list yours.",
    free: "Free", price_orientative: "Indicative price", view_item: "View", items_word: "items",
    how_title: "How it works", how_1_t: "1. List", how_1_b: "A real photo, an honest condition and a handover point. No personal data in the description.",
    theme_to_dark: "Switch to dark mode",
    theme_to_light: "Switch to light mode",
    how_2_t: "2. Search & request", how_2_b: "Filter by category, campus and condition. Send a short request message.",
    how_3_t: "3. Meet in public", how_3_b: "Choose a safe public place and mark the item as handed over when you are done.",
    trust_title: "Built with clear choices", trust_1: "Explicit consent, legal notice, privacy policy and terms in three languages.",
    trust_2: "Account export and deletion in My area; no analytics, third-party cookies or trackers.",
    trust_3: "Local images, no payment gateway, no fees or held funds.",
    login: "Log in", register: "Create account", logout: "Log out", my_area: "My area",
    my_items: "My items", my_requests: "My requests", received: "Received requests", favorites: "Favorites",
    publish_title: "List an item", publish_intro: "List as a private individual. Any price is indicative; Campus Circular does not handle payments.",
    publish_progress: "of 3 steps ready",
    publish_check_photo: "Photo", publish_check_title: "Title", publish_check_consent: "Declaration",
    publish_step_media: "The photo", publish_step_media_hint: "One real photo works better than a thousand words. Have the item with you.",
    publish_step_basics: "What you are listing", publish_step_basics_hint: "Title, category and type. The rest shows in the photo.",
    publish_step_final: "Confirm and publish", publish_step_final_hint: "Just the private-individual declaration and you are done.",
    photo_take: "Take a photo", photo_pick: "Choose from gallery",
    photo_added: "Photo added · tap to change it",
    publish_title_hint: "Name, brand and model if it has them.",
    publish_type_hint: "You can change this later from your listings.",
    publish_bar_title: "Ready to publish",
    publish_bar_hint: "Add a photo, a title and the confirmation",
    publish_bar_pending: "Finish it to publish",
    publish_bar_ready: "You are good to publish",
    publish_preview_t: "Preview",
    publish_preview_empty: "Add a photo to see your listing",
    publish_preview_untitled: "Your listing title",
    publish_tip: "Plain background, daylight and the whole item in frame: that is what brings the most requests.",
    f_title: "Title", f_desc: "Description", f_category: "Category", f_condition: "Condition", f_type: "Exchange type",
    f_campus: "Campus", f_handover: "Handover point", f_price: "Indicative price (€)", f_price_hint: "No payment happens here. Settle any amount directly, outside the platform.",
    f_image: "Item photo", f_image_hint: "Upload a real image. It is resized to 1200 px, converted to WebP and stripped of EXIF metadata (including location).",
    upload: "Upload image", f_private: "I confirm I am listing as a private individual", f_private_hint: "Professional sellers and regular commercial activity are not allowed.",
    desc_hint: "Describe marks, defects and what is included. Do not add phone numbers, addresses or contact details.",
    publish_btn: "List item", cancel: "Cancel", payment_notice_title: "Payment outside Campus Circular",
    payment_notice_body: "The platform does not intermediate or process payment. Arrange it directly at handover, in cash or by a direct person-to-person method. Campus Circular charges no fee, offers no refund and gives no guarantee.",
    detail_request: "Request", detail_fav: "Save", detail_faved: "Saved", request_title: "Request this item",
    request_msg: "Message for the other person (optional)", request_msg_ph: "Hi, I'm interested… can we meet somewhere public?",
    chat: "Open chat", chat_title: "Conversation about {item}", chat_send: "Send", chat_empty: "No messages yet. Start coordinating the exchange.", chat_placeholder: "Write a message…", notify_new_request: "You have a new item request.", notify_new_message: "You have a new message in a request.",
    request_btn: "Send request", request_sent: "Request sent. The other person will see it in their area.",
    request_privacy: "Use this message only to coordinate the exchange. Do not share sensitive data.",
    owner: "Listed by", academic_email: "Academic domain", personal_email: "Personal email",
    identity_note: "The badge only describes the email domain: it does not prove enrolment, identity or institutional membership.",
    handover_label: "Handover at", loan_rules: "For a loan, agree the return date in writing in the request.",
    detail_payment_notice: "Indicative price. Any payment is agreed directly between private individuals outside Campus Circular; the platform does not charge, hold funds or mediate disputes.",
    detail_privacy_note: "Do not post contact details in the description; use the request and meet in a public place.",
    status_disponible: "Available", status_reservado: "Reserved", status_entregado: "Delivered",
    req_pendiente: "Pending", req_aceptada: "Accepted", req_rechazada: "Rejected", req_cancelada: "Cancelled", req_completada: "Completed",
    accept: "Accept", reject: "Reject", complete: "Mark delivered", cancel_req: "Cancel request",
    mark_available: "Mark available", mark_reserved: "Mark reserved", mark_delivered: "Mark delivered", delete_item: "Delete",
    points_title: "Handover points", points_lead: "These are suggestions for public, easy-to-find places. Always choose a busy location; if a physical space is set up, it must have authorisation from whoever manages it.",
    points_notice: "Campus Circular does not operate official points: these are orientation labels for arranging handover, not reserved spaces or institutional services.",
    rules_title: "Rules & trust", rules_lead: "A simple exchange works best with honest information, caution and a few clear rules.",
    about_title: "The project", about_lead: "Campus Circular is an independent prototype presented at CTC Congress to explore reuse of second-life materials.",
    auth_login_title: "Log in", auth_register_title: "Create account", auth_name: "Display name", auth_email: "Email",
    auth_password: "Password", auth_password_hint: "At least 8 characters. Do not share it.", auth_campus: "Campus",
    auth_email_hint: "Any valid email works. We do not verify enrolment or identity.",
    auth_btn_login: "Log in", auth_btn_register: "Sign up", auth_no_account: "No account yet?", auth_have_account: "Already have an account?",
    auth_minimum: "Summary: we store display name, email, hashed password, campus and the content you publish. You can export or erase it from My area.",
    auth_consent: "I accept the {privacy} and the {terms}. I have read the summary and explicitly consent to the processing of my data to use the service.",
    demo_hint: "Create an account with any valid email. There are no shared demo accounts.",
    need_login: "Log in to continue.", need_login_publish: "Log in to list an item.",
    consent_update_title: "Update your consent", consent_update_body: "The privacy policy and terms have been updated. Please read them and accept the current version to continue using your account: {privacyLink} · {termsLink}.",
    consent_update_check: "I accept version {version} of the policy and terms.", consent_update_btn: "Save consent",
    toast_published: "Item listed successfully.", toast_deleted: "Item deleted.", toast_status: "Status updated.",
    toast_fav_on: "Saved to favorites.", toast_fav_off: "Removed from favorites.", toast_request: "Request sent.", toast_req_status: "Request updated.",
    toast_login: "Logged in. Welcome!", toast_register: "Account created. Welcome to Campus Circular!", toast_logout: "Logged out.",
    toast_error: "Something went wrong. Please try again.", toast_upload: "Image uploaded.", toast_own_item: "This is your item. Manage it in My area.",
    toast_account_exported: "Data exported.", toast_account_deleted: "Account and data deleted.", toast_consent_updated: "Consent updated.",
    toast_consent_required: "You must accept the policy and terms.", toast_private_required: "Confirm that you list as a private individual.",
    toast_invalid_image: "Use an image uploaded to Campus Circular.", toast_unauthorized: "Log in to continue.",
    toast_email_taken: "An account already exists with that email.", toast_invalid_credentials: "Incorrect email or password.", toast_invalid_password: "Check your password.",
    cat_libros: "Books & notes", cat_ropa: "Clothing & accessories", cat_muebles: "Furniture", cat_estudio: "Study equipment",
    cat_electronica: "Electronics / Accessories", cat_cocina: "Kitchen / Household", cat_electrodomesticos: "Small appliances",
    cat_deporte: "Sports & Leisure", cat_otros: "Other",
    cond_nuevo: "New", cond_como_nuevo: "Like new", cond_bueno: "Good", cond_usable: "Usable with marks",
    type_regalar: "Give away", type_prestar: "Lend", type_intercambiar: "Exchange", type_vender: "Sell (indicative price)",
    campus_vigo: "Vigo", campus_pontevedra: "Pontevedra", campus_ourense: "Ourense",
    hand_biblioteca: "Library", hand_entrada: "Main entrance", hand_cafeteria: "Cafeteria",
    hand_punto: "Marked public point", hand_acordado: "Agreed public place",
    my_empty_items: "You haven't listed any items yet.", my_empty_requests: "You have no sent requests.",
    my_empty_received: "You haven't received any requests yet.", my_empty_favs: "No favorites yet. Tap the heart on an item to save it.",
    rules_1_t: "Real photos & condition", rules_1_b: "Describe marks and defects. If something does not match in person, do not accept it.",
    rules_2_t: "No official verification", rules_2_b: "We do not check enrolment or identity. Be cautious and do not share sensitive data.",
    rules_3_t: "Loans with a date", rules_3_b: "Agree the return date in writing in the request.",
    rules_4_t: "Safe handovers", rules_4_b: "Busy public places, never a stranger's home.",
    rules_5_t: "Kind communication", rules_5_b: "Reply in good time. If you cannot, cancel the request.",
    rules_6_t: "No postal shipping", rules_6_b: "Everything is handed over in person to avoid problems and unnecessary costs.",
    rules_payment_title: "Payments outside the platform", rules_payment_body: "There is no payment gateway, wallet, deposit, commission or refund managed by Campus Circular. The price is indicative and any direct payment is agreed between private individuals outside the service.",
    rules_data_title: "Minimal data", rules_data_body: "We ask only for what the account and listing need. You can export your data or delete your account; we use no analytics or third-party advertising.",
    points_biblioteca_t: "Library", points_biblioteca_b: "Easy meeting spot; use the entrance or reception.",
    points_entrada_t: "Main entrance", points_entrada_b: "Visible and easy to find between classes.",
    points_cafeteria_t: "Cafeteria", points_cafeteria_b: "Busy place before or after class.",
    points_punto_t: "Marked public point", points_punto_b: "Only if the space is authorised for drop-off and pick-up.",
    points_acordado_t: "Agreed public place", points_acordado_b: "Agree a specific, safe and visible spot in the message.",
    about_p1: "The idea is simple: help usable items find another person before they become waste, without creating a shop, a wallet or an official service.",
    about_p2: "The site lets people list, search, save favorites and request materials. Honest condition details and a clear handover point replace commercial promises: each agreement is between private individuals.",
    about_p3: "This version is a non-profit prototype. Sample items are fictional, images are local and the free deployment may use an ephemeral database. It does not replace legal, tax or data-protection review before real use with personal data.",
    about_pillars_title: "Three key ideas", about_pillar_1: "Independence: no institutional branding or claim of an official service.",
    about_pillar_2: "Privacy: consent, minimisation, export, erasure and zero trackers.",
    about_pillar_3: "Payments: no fees or held funds; direct agreements outside the platform.",
    photo_caption: "Project team photograph.", photo_privacy: "If you appear in the image and would like it removed, contact us.",
    account_data_title: "Your data, under your control", account_data_body: "See what your account stores, download a copy or erase it. Deletion removes your profile, sessions, listings, favorites and own requests; what other people wrote is kept anonymised.",
    account_email: "Email", account_campus: "Campus", account_consent: "Consent", account_consent_ok: "Current", account_consent_old: "Renewal pending",
    account_rights: "Rights", account_rights_body: "Access, rectification, erasure, objection, restriction and portability. You may also complain to the AEPD.",
    account_note: "To exercise your rights or ask a question: {contact}. In an institutional deployment with real data, coordinate first with the relevant data protection officer.",
    privacy_export: "Download my data", privacy_delete: "Delete my account", privacy_login_manage: "Log in to manage your data.",
    delete_account_title: "Delete account", delete_warning: "This action cannot be undone. Your profile, sessions, items, favorites and own requests will be deleted; other people's history is kept without your data. Confirm your password.",
    delete_password: "Current password", delete_confirm_btn: "Delete permanently",
    legal_kicker: "Information document", legal_updated: "Last updated", legal_version: "Version", legal_print: "Print / save PDF",
    back_home: "Back to home", legal_contact_label: "Contact",
    legal_title: "Legal notice", legal_lead: "General information about Campus Circular, its independent nature and the use of this site.",
    privacy_title: "Privacy & data policy", privacy_lead: "Layered notice: here you have both the summary and the detail of personal-data processing.",
    terms_title: "Terms of use", terms_lead: "Rules for taking part as a private individual in a reuse prototype with no platform-managed payments.",
    hero_chip_1: "No payments or fees", hero_chip_2: "Minimal data", hero_chip_3: "Independent project",
    type_badge_regalar: "Give away", type_badge_prestar: "Lend", type_badge_intercambiar: "Exchange", type_badge_vender: "Sell",
    nav_my: "My area", nav_my_short: "My area", nav_publish_short: "List item", nav_points_short: "Points", nav_rules_short: "Rules",
    filters_btn: "Filters", filters_title: "Filters & sorting", filters_subtitle: "Adjust campus, condition, type and result order.",
    filters_apply: "Show results", filters_clear: "Clear all", sort_by: "Sort by", filter_remove: "Remove filter: {value}",
    photo_unavailable: "Photo unavailable",
    loading_items: "Loading items…", retry: "Try again", catalog_eyebrow: "Catalogue",
    results_found: "items found", results_one: "item found",
    empty_catalog_t: "No items listed yet", empty_catalog_b: "Be the first to give a second life to something you no longer use.",
    empty_filter_t: "Nothing matches", empty_filter_b: "Try removing a filter or searching with different words.",
    empty_fav_t: "Nothing saved yet", empty_fav_b: "Tap the heart on an item to save it and find it here.",
    empty_my_items_t: "You haven't listed anything yet", empty_my_items_b: "List your first item: a real photo and an honest condition are enough.",
    empty_req_t: "No sent requests", empty_req_b: "When you request an item, its status will appear here.",
    empty_recv_t: "No received requests", empty_recv_b: "When someone is interested in your items, it will show up in this list.",
    publish_first: "List the first one", browse_catalog: "Browse the catalogue", close_toast: "Dismiss notification",
    detail_description: "Description", detail_handover_h: "Handover & safety", detail_payment_h: "Payment outside the platform",
    detail_unavailable: "This item is no longer available.", detail_manage: "Manage in My area", status_change: "Change status",
    edit_item: "Edit",
    edit_title: "Edit listing",
    edit_hint: "Change the item details. The photo stays the same.",
    edit_save: "Save changes",
    edit_saved: "Listing updated.",
    status_quick: "Listing status",
    demo_cta: "Try it right now",
    demo_note: "Opens a temporary account, no sign-up. Everything you publish is visible to everyone in the catalogue and stays there; the account expires in {h} h. Do not enter personal data.",
    demo_started: "Demo mode: publish something and everyone will see it in the catalogue.",
    demo_badge: "demo",
    demo_failed: "Could not open the demo. Please try again.",
    or: "or",
    filters_view: "Show {n} items",
    filters_view_all: "Show all",
    confirm_delete_t: "Delete this item?", confirm_delete_b: "The listing and its related data will be deleted. This cannot be undone.",
    confirm_delete_btn: "Yes, delete",
    photo_drop_t: "Tap to choose a photo", photo_drop_b: "JPG, PNG or WebP · 5 MB max · optimised on upload",
    photo_remove: "Remove photo", photo_upload: "Upload photo", photo_uploading: "Uploading photo…",
    photo_ready: "Photo uploaded and ready", photo_change: "Change photo",
    form_sec_1: "The essentials", form_sec_2: "Exchange details", form_sec_3: "Photo & publishing",
    publishing: "Publishing…", sending: "Sending…", saving: "Saving…",
    title_ph: "E.g. LED desk lamp",
    my_area_subtitle: "Your listings, requests and data.",
    hand_conserjeria: "Reception desk",
    points_conserjeria_t: "Reception desk",
    points_conserjeria_b: "Information desk at the entrance, staffed and with foot traffic.",
    estimate_word: "estimate",
    trust_panel_title: "Trust and track record",
    verified_badge: "Academic domain",
    rating_aria: "Rating: {n} out of 5 ({c} reviews)",
    rating_none: "No ratings yet",
    rating_none_short: "no ratings",
    ratings_received: "Reviews received",
    ratings_none: "This profile has no reviews yet.",
    comments_title: "Ratings and comments",
    comments_empty: "No comments yet. Be the first to share your thoughts.",
    comments_add: "Leave your review",
    comments_body: "Comment",
    comments_body_ph: "What did you think of this listing? Describe condition, handover, or any useful detail.",
    comments_score: "Rating (optional)",
    comments_score_none: "No rating",
    comments_submit: "Post comment",
    comments_login: "Log in to leave a comment.",
    comments_already: "You have already reviewed this listing.",
    comments_posted: "Comment posted.",
    comments_count: "{n} comments",
    comments_count_one: "1 comment",
    comments_avg: "{a} out of 5",
    comments_score_aria: "Rate {n} stars",
    comments_more: "Show more comments",
    comments_own: "You cannot rate your own listing: opinions come from the people who receive the item.",
    comments_need_something: "Write a comment or leave a rating.",
    exchanges_completed: "Completed exchanges",
    given_label: "Given",
    received_label: "Received",
    level_label: "Level",
    level_semilla: "Seed",
    level_brote: "Sprout",
    level_arbol: "Tree",
    level_bosque: "Forest",
    level_next: "Next:",
    level_max: "Top level reached",
    exchanges_short: "exchanges",
    badges_title: "Badges",
    badge_verified: "Academic-domain email",
    badge_first_delivery: "First handover",
    badge_five_exchanges: "Five exchanges",
    badge_rated: "Reviewed profile",
    badge_earned: "earned",
    badge_locked: "locked",
    rate_title: "Rate the exchange",
    rate_lead: "Your rating helps other people decide who to exchange with.",
    rate_score_legend: "Your rating",
    rate_comment: "Comment (optional)",
    rate_comment_ph: "How was the handover? No personal data.",
    rate_submit: "Send rating",
    rate_later: "Not now",
    rate_cta: "Rate",
    rate_yours: "Your rating",
    rate_note: "Reviews are public and cannot be edited once sent.",
    rate_item_label: "Item",
    toast_rated: "Thanks for rating",
    form_quick: "The essentials",
    form_quick_hint: "Photo, title, category and type. Publishing takes under a minute.",
    form_optional: "Optional details",
    form_optional_hint: "Description, condition, campus and handover point. You can publish without filling them in.",
    f_desc_optional: "Description (optional)",
    detail_no_desc: "No further description.",
    image_required_hint: "Required: this is the photo the receiver will see.",
    toast_image_required: "Add a photo to publish.",
    required_word: "required",
    status_help: "Reserved means a deal is in place; delivered closes the exchange.",
    req_handover: "Proposed point",
    request_point: "Handover point",
    request_point_hint: "Choose a public, busy place; you can adjust it when accepting.",
    req_rated: "Rated {n}/5",
    trust_error: "Could not load your trust profile.",
    searching: "Searching…",
    cold_title: "The server is waking up",
    cold_body: "The free plan sleeps when idle: the first request may take a few seconds.",
    cold_offline: "No connection to the server. Try again in a few seconds.",
    load_more: "Load more items",
    results_partial: "{shown} of {total} items found",
    report_open: "Report this listing",
    report_title: "Report this listing",
    report_privacy: "The report is stored with your account for review. The other person is not notified.",
    report_reason: "Reason",
    report_reason_spam: "Spam or advertising",
    report_reason_inapropiado: "Inappropriate content",
    report_reason_estafa: "Possible scam",
    report_reason_duplicado: "Duplicate listing",
    report_reason_otro: "Other reason",
    report_comment: "Comment (optional)",
    report_comment_ph: "Tell us what is wrong; it helps us review it faster.",
    report_note: "Three reports from different accounts remove the listing from the catalogue until review.",
    report_send: "Send report",
    report_sent: "Report sent. Thanks for looking after the board.",
    report_sent_hidden: "Report sent. The listing has been removed until review.",
    report_already: "You already reported this listing.",
    status_review: "Under review",
    review_note: "Removed from the catalogue after {n} reports. Review it or delete it.",
    toast_rate_limited: "Too many attempts in a row. Wait a moment and try again.",
    toast_not_found: "This listing is no longer available.",
    profile_edit: "Edit profile",
    profile_title: "Edit profile",
    profile_email_note: "You can change your name and campus. The email is not editable: changing it requires verification first.",
    profile_name: "Display name",
    profile_campus: "Campus",
    profile_campus_hint: "Used for filters and to suggest handover points.",
    profile_save: "Save changes",
    profile_saved: "Profile updated.",
    menu_password: "Change password",
    password_title: "Change password",
    password_lead: "Changing it closes the other sessions opened with the old password; this one stays active.",
    password_current: "Current password",
    password_new: "New password",
    password_repeat: "Repeat the new password",
    password_save: "Save password",
    password_changed: "Password updated. The other sessions have been closed.",
    password_mismatch: "The two new passwords do not match.",
    password_hint: "At least 8 characters and not a common password.",
    password_weak: "That password is too common. Try a longer phrase.",
    password_bad_current: "The current password is not correct.",
    password_same: "The new password must be different from the current one.",
    lang_name: "English",
  },
  gl: {
    skip_content: "Saltar ao contido", close: "Pechar", brand_tag: "Proxecto independente · CTC Congress",
    nav_home: "Explorar", nav_publish: "Publicar", nav_points: "Puntos de entrega", nav_rules: "Normas e confianza", nav_about: "O proxecto",
    nav_primary: "Principal", brand_home: "Campus Circular — inicio", account_menu: "Menú de conta", photo_preview: "Vista previa da foto do obxecto",
    footer_tag: "Reutilización e intercambio de materiais de segunda vida.",
    footer_independent: "Proxecto independente. Non é un servizo oficial de ningunha universidade.",
    footer_explore: "Explorar", footer_legal: "Información legal", footer_legal_notice: "Aviso legal",
    footer_privacy: "Privacidade e datos", footer_terms: "Condicións de uso", footer_presented: "Presentado en",
    footer_payment_mini: "Sen pagos dentro da plataforma",
    footer_note: "Prototipo sen ánimo de lucro · sen analítica · sen recursos de terceiros · as imaxes de exemplo son locais.",
    credit_label: "Equipo do proxecto", payment_eyebrow: "Pagos", noscript: "Campus Circular necesita JavaScript para amosar o catálogo e xestionar a conta.",
    title_home: "Explorar", catalog_title: "Catálogo de segunda vida", title_publish: "Publicar", title_points: "Puntos de entrega", title_rules: "Normas e confianza",
    title_about: "O proxecto", title_my: "A miña área", title_legal: "Aviso legal", title_privacy: "Privacidade e datos", title_terms: "Condicións de uso",
    hero_eyebrow: "Reutilización e intercambio", hero_title: "O que xa non usas pode seguir tendo unha boa historia.",
    hero_lead: "Atopa ou publica libros, roupa, mobles e material de estudo de segunda man entre estudantes da Universidade de Vigo. Acorda a entrega nun lugar público.",
    hero_search_label: "Buscar no catálogo", hero_image_alt: "Auriculares, un teclado, un libro aberto e unha mochila.",
    hero_search_ph: "Libros, roupa, mobles…", hero_search_btn: "Buscar", publish_cta: "Publicar un obxecto",
    stat_items: "obxectos publicados", stat_users: "contas creadas",
    stats_title: "Campus Circular en cifras", stats_unavailable: "As cifras non están dispoñibles neste momento.",
    payment_banner_title: "Sen pasarela de pago",
    payment_banner_body: "Campus Circular non procesa pagos, non cobra comisións, non custodia cartos nin garante obxectos. «Vender» amosa só un prezo orientativo: calquera pago acórdase directamente entre particulares, fóra da plataforma.",
    all: "Todo", search: "Buscar", filters: "Filtros", campus: "Campus", condition: "Estado", type: "Tipo", sort: "Ordenar",
    sort_recent: "Máis recentes", sort_price_asc: "Prezo: de menor a maior", sort_price_desc: "Prezo: de maior a menor",
    results: "obxectos", no_results: "Non hai obxectos con eses filtros. Proba con outra busca ou publica o teu.",
    free: "De balde", price_orientative: "Prezo orientativo", view_item: "Ver", items_word: "obxectos",
    how_title: "Como funciona", how_1_t: "1. Publica", how_1_b: "Foto real, estado honesto e punto de entrega. Sen datos persoais na descrición.",
    theme_to_dark: "Activar modo noite",
    theme_to_light: "Activar modo claro",
    how_2_t: "2. Busca e solicita", how_2_b: "Filtra por categoría, campus e estado. Envía unha solicitude cunha mensaxe breve.",
    how_3_t: "3. Queda en público", how_3_b: "Escollede un lugar seguro e marcade como entregado ao rematar.",
    trust_title: "Deseñado con criterios claros", trust_1: "Consentimento explícito, aviso legal, privacidade e condicións en tres idiomas.",
    trust_2: "Exportación e supresión de conta na Miña área; sen analítica, cookies de terceiros nin rastrexadores.",
    trust_3: "Imaxes locais, sen pasarela de pago, sen comisións nin fondos retidos.",
    login: "Iniciar sesión", register: "Crear conta", logout: "Pechar sesión", my_area: "A miña área",
    my_items: "Os meus obxectos", my_requests: "As miñas solicitudes", received: "Solicitudes recibidas", favorites: "Favoritos",
    publish_title: "Publicar un obxecto", publish_intro: "Publica como particular. O prezo, se o hai, é orientativo; Campus Circular non xestiona cobros.",
    publish_progress: "de 3 pasos listos",
    publish_check_photo: "Foto", publish_check_title: "Título", publish_check_consent: "Declaración",
    publish_step_media: "A foto", publish_step_media_hint: "Unha foto real vale máis que mil palabras. Ten o obxecto diante.",
    publish_step_basics: "Que publicas", publish_step_basics_hint: "Título, categoría e modalidade. O demais véxose na foto.",
    publish_step_final: "Confirmar e publicar", publish_step_final_hint: "Só a declaración de particular e xa está.",
    photo_take: "Facer unha foto", photo_pick: "Escoller da galería",
    photo_added: "Foto engadida · toca para cambiala",
    publish_title_hint: "Nome, marca e modelo se os ten.",
    publish_type_hint: "Podes modificalo despois desde as túas publicacións.",
    publish_bar_title: "Todo listo para publicar",
    publish_bar_hint: "Engade foto, título e confirmación",
    publish_bar_pending: "Coméntao para publicar",
    publish_bar_ready: "Xa podes publicalo",
    publish_preview_t: "Vista previa",
    publish_preview_empty: "Engade unha foto para ver o teu anuncio",
    publish_preview_untitled: "Título do teu anuncio",
    publish_tip: "Fondo liso, luz natural e unha foto do obxecto completo: é o que xera máis solicitudes.",
    f_title: "Título", f_desc: "Descrición", f_category: "Categoría", f_condition: "Estado", f_type: "Tipo de intercambio",
    f_campus: "Campus", f_handover: "Punto de entrega", f_price: "Prezo orientativo (€)", f_price_hint: "Aquí non se cobra. O importe acórdase directamente e fóra da plataforma.",
    f_image: "Foto do obxecto", f_image_hint: "Sube unha imaxe real. Redimensiónase a 1200 px, convértese a WebP e elimínanse os metadatos EXIF (incluída a localización).",
    upload: "Subir imaxe", f_private: "Confirmo que publico como particular", f_private_hint: "Non se admiten vendedores profesionais nin actividade comercial habitual.",
    desc_hint: "Describe marcas, defectos e que inclúe. Non escribas teléfonos, enderezos nin datos de contacto.",
    publish_btn: "Publicar obxecto", cancel: "Cancelar", payment_notice_title: "Pago fóra de Campus Circular",
    payment_notice_body: "A plataforma non intermedia nin procesa o pago. Acordádeo directamente na entrega, en efectivo ou cun medio directo entre particulares. Non hai comisión, reembolso nin garantía de Campus Circular.",
    detail_request: "Solicitar", detail_fav: "Gardar", detail_faved: "Gardado", request_title: "Solicitar este obxecto",
    request_msg: "Mensaxe para a outra persoa (opcional)", request_msg_ph: "Ola, interésame… podemos quedar nun lugar público?",
    chat: "Abrir conversa", chat_title: "Conversa sobre {item}", chat_send: "Enviar", chat_empty: "Aínda non hai mensaxes. Empeza a coordinar o intercambio.", chat_placeholder: "Escribe unha mensaxe…", notify_new_request: "Tes unha nova solicitude dun obxecto.", notify_new_message: "Tes unha mensaxe nova nunha solicitude",
    request_btn: "Enviar solicitude", request_sent: "Solicitude enviada. A outra persoa veraa na súa área.",
    request_privacy: "Usa esta mensaxe só para coordinar o intercambio. Non compartas datos sensibles.",
    owner: "Publicado por", academic_email: "Dominio académico", personal_email: "Correo persoal",
    identity_note: "A insignia describe só o dominio do correo: non acredita matrícula, identidade nin pertenza institucional.",
    handover_label: "Entrega en", loan_rules: "Se é un préstamo, acordade por escrito a data de devolución na solicitude.",
    detail_payment_notice: "Prezo orientativo. Calquera pago acórdase directamente entre particulares, fóra de Campus Circular; a plataforma non cobra, retén fondos nin media en disputas.",
    detail_privacy_note: "Non publiques datos de contacto na descrición; usa a solicitude e queda nun lugar público.",
    status_disponible: "Dispoñible", status_reservado: "Reservado", status_entregado: "Entregado",
    req_pendiente: "Pendente", req_aceptada: "Aceptada", req_rechazada: "Rexeitada", req_cancelada: "Cancelada", req_completada: "Completada",
    accept: "Aceptar", reject: "Rexeitar", complete: "Marcar entregado", cancel_req: "Cancelar solicitude",
    mark_available: "Marcar dispoñible", mark_reserved: "Marcar reservado", mark_delivered: "Marcar entregado", delete_item: "Eliminar",
    points_title: "Puntos de entrega", points_lead: "Estas son suxestións de lugares públicos e doados de atopar. Escollede sempre un sitio concorrido e, se alguén habilita un espazo físico, debe contar coa autorización de quen o xestiona.",
    points_notice: "Campus Circular non habilita puntos oficiais: son etiquetas orientativas para acordar a entrega, non espazos reservados nin servizos institucionais.",
    rules_title: "Normas e confianza", rules_lead: "Un intercambio sinxelo funciona mellor con información honesta, prudencia e regras pequenas e claras.",
    about_title: "O proxecto", about_lead: "Campus Circular é un prototipo independente presentado en CTC Congress para explorar a reutilización de materiais de segunda vida.",
    auth_login_title: "Iniciar sesión", auth_register_title: "Crear conta", auth_name: "Nome visible", auth_email: "Email",
    auth_password: "Contrasinal", auth_password_hint: "Mínimo 8 caracteres. Non o compartas.", auth_campus: "Campus",
    auth_email_hint: "Vale calquera correo válido. Non verificamos matrícula nin identidade.",
    auth_btn_login: "Entrar", auth_btn_register: "Rexistrarme", auth_no_account: "Non tes conta?", auth_have_account: "Xa tes conta?",
    auth_minimum: "Resumo: gardamos nome, email, contrasinal con hash, campus e os contidos que publiques. Podes exportalos ou borralos na Miña área.",
    auth_consent: "Acepto a {privacy} e as {terms}. Lin o resumo e consinto expresamente o tratamento dos meus datos para usar o servizo.",
    demo_hint: "Crea a túa conta con calquera correo válido. Non hai contas de demostración compartidas.",
    need_login: "Inicia sesión para continuar.", need_login_publish: "Inicia sesión para publicar un obxecto.",
    consent_update_title: "Actualiza o consentimento", consent_update_body: "A política de privacidade e as condicións actualizáronse. Leas e acepta a versión vixente para seguir usando a conta: {privacyLink} · {termsLink}.",
    consent_update_check: "Acepto a versión {version} da política e as condicións.", consent_update_btn: "Gardar consentimento",
    toast_published: "Obxecto publicado correctamente.", toast_deleted: "Obxecto eliminado.", toast_status: "Estado actualizado.",
    toast_fav_on: "Gardado en favoritos.", toast_fav_off: "Eliminado de favoritos.", toast_request: "Solicitude enviada.", toast_req_status: "Solicitude actualizada.",
    toast_login: "Sesión iniciada. Benvido/a!", toast_register: "Conta creada. Benvido/a a Campus Circular!", toast_logout: "Sesión pechada.",
    toast_error: "Algo saíu mal. Inténtao de novo.", toast_upload: "Imaxe subida.", toast_own_item: "Este é o teu obxecto. Xestióao na Miña área.",
    toast_account_exported: "Datos exportados.", toast_account_deleted: "Conta e datos eliminados.", toast_consent_updated: "Consentimento actualizado.",
    toast_consent_required: "Debes aceptar a política e as condicións.", toast_private_required: "Confirma que publicas como particular.",
    toast_invalid_image: "Usa unha imaxe subida a Campus Circular.", toast_unauthorized: "Inicia sesión para continuar.",
    toast_email_taken: "Xa existe unha conta con ese email.", toast_invalid_credentials: "Email ou contrasinal incorrectos.", toast_invalid_password: "Revisa o contrasinal.",
    cat_libros: "Libros e apuntes", cat_ropa: "Roupa e complementos", cat_muebles: "Mobles", cat_estudio: "Material de estudo",
    cat_electronica: "Electrónica / accesorios", cat_cocina: "Cociña / fogar", cat_electrodomesticos: "Pequenos electrodomésticos",
    cat_deporte: "Deporte e lecer", cat_otros: "Outros",
    cond_nuevo: "Novo", cond_como_nuevo: "Como novo", cond_bueno: "Bo", cond_usable: "Usable con marcas",
    type_regalar: "Regalar", type_prestar: "Prestar", type_intercambiar: "Intercambiar", type_vender: "Vender (prezo orientativo)",
    campus_vigo: "Vigo", campus_pontevedra: "Pontevedra", campus_ourense: "Ourense",
    hand_biblioteca: "Biblioteca", hand_entrada: "Entrada principal", hand_cafeteria: "Cafetería",
    hand_punto: "Punto público sinalizado", hand_acordado: "Lugar público acordado",
    my_empty_items: "Aínda non publicaches ningún obxecto.", my_empty_requests: "Non tes solicitudes enviadas.",
    my_empty_received: "Aínda non recibiches solicitudes.", my_empty_favs: "Non tes favoritos. Toca o corazón nun obxecto para gardalo.",
    rules_1_t: "Fotos e estado real", rules_1_b: "Describe marcas e defectos. Se algo non coincide ao velo, non o aceptes.",
    rules_2_t: "Sen verificación oficial", rules_2_b: "Non comprobamos matrícula nin identidade. Actúa con prudencia e non compartas datos sensibles.",
    rules_3_t: "Préstamos con data", rules_3_b: "Acordade a devolución por escrito na solicitude.",
    rules_4_t: "Entregas seguras", rules_4_b: "Lugares públicos e concorridos, nunca domicilios de descoñecidos.",
    rules_5_t: "Comunicación amable", rules_5_b: "Responde con tempo. Se non podes, cancela a solicitude.",
    rules_6_t: "Sen envíos por correo", rules_6_b: "Todo entrégase en man para evitar problemas e custos innecesarios.",
    rules_payment_title: "Pagos fóra da plataforma", rules_payment_body: "Non hai pasarela de pago, moedeiro, depósito, comisión nin reembolso xestionado por Campus Circular. O prezo é orientativo e calquera pago directo acórdase entre particulares, fóra do servizo.",
    rules_data_title: "Datos mínimos", rules_data_body: "Só pedimos o necesario para a conta e a publicación. Podes exportar os datos ou eliminar a conta; non usamos analítica nin publicidade de terceiros.",
    points_biblioteca_t: "Biblioteca", points_biblioteca_b: "Zona de paso sinxela; queda na entrada ou recepción.",
    points_entrada_t: "Entrada principal", points_entrada_b: "Visible e doado de atopar entre clases.",
    points_cafeteria_t: "Cafetería", points_cafeteria_b: "Lugar concorrido antes ou despois de clase.",
    points_punto_t: "Punto público sinalizado", points_punto_b: "Só se o espazo está autorizado para deixar e recoller obxectos.",
    points_acordado_t: "Lugar público acordado", points_acordado_b: "Acordade un sitio concreto, seguro e visible na mensaxe.",
    about_p1: "A idea é sinxela: facilitar que obxectos en bo estado atopen outra persoa antes de converterse en residuo, sen crear unha tenda, unha moedeira nin un servizo oficial.",
    about_p2: "A web permite publicar, buscar, gardar favoritos e solicitar materiais. A información sobre o estado e un punto de entrega claro substitúen as promesas comerciais: cada acordo é entre particulares.",
    about_p3: "Esta versión é un prototipo sen ánimo de lucro. Os obxectos de exemplo son ficticios, as imaxes son locais e o despregue gratuíto pode usar unha base de datos efémera. Non substitúe unha avaliación xurídica, fiscal ou de protección de datos antes dun uso real con datos persoais.",
    about_pillars_title: "Tres ideas clave", about_pillar_1: "Independencia: sen marca institucional nin afirmación de servizo oficial.",
    about_pillar_2: "Privacidade: consentimento, minimización, exportación, supresión e cero rastrexadores.",
    about_pillar_3: "Pagos: sen comisións nin custodia de fondos; acordos directos fóra da plataforma.",
    photo_caption: "Fotografía do equipo do proxecto.", photo_privacy: "Se apareces na imaxe e prefires que se retire, escríbenos.",
    account_data_title: "Os teus datos, baixo o teu control", account_data_body: "Consulta que garda a túa conta, descarga unha copia ou elimínaa. A supresión borra o teu perfil, sesións, publicacións, favoritos e solicitudes propias; o escrito por outras persoas consérvase anonimizado.",
    account_email: "Email", account_campus: "Campus", account_consent: "Consentimento", account_consent_ok: "Vixente", account_consent_old: "Pendente de renovar",
    account_rights: "Dereitos", account_rights_body: "Acceso, rectificación, supresión, oposición, limitación e portabilidade. Tamén podes reclamar ante a AEPD.",
    account_note: "Para exercer os teus dereitos ou resolver dúbidas: {contact}. Nun despregue institucional con datos reais, coordina antes coa delegación de protección de datos correspondente.",
    privacy_export: "Descargar os meus datos", privacy_delete: "Eliminar a miña conta", privacy_login_manage: "Inicia sesión para xestionar os teus datos.",
    delete_account_title: "Eliminar conta", delete_warning: "Esta acción é irreversible. Borraranse o perfil, sesións, obxectos, favoritos e solicitudes propias; o historial doutras persoas consérvase sen os teus datos. Confirma o contrasinal.",
    delete_password: "Contrasinal actual", delete_confirm_btn: "Eliminar definitivamente",
    legal_kicker: "Documento informativo", legal_updated: "Última actualización", legal_version: "Versión", legal_print: "Imprimir / gardar PDF",
    back_home: "Volver ao inicio", legal_contact_label: "Contacto",
    legal_title: "Aviso legal", legal_lead: "Información xeral sobre Campus Circular, a súa natureza independente e o uso deste sitio.",
    privacy_title: "Política de privacidade e datos", privacy_lead: "Aviso por capas: aquí tes o resumo e o detalle do tratamento de datos persoais.",
    terms_title: "Condicións de uso", terms_lead: "Regras para participar como particular nun prototipo de reutilización sen pagos xestionados pola plataforma.",
    hero_chip_1: "Sen pagos nin comisións", hero_chip_2: "Datos mínimos", hero_chip_3: "Proxecto independente",
    type_badge_regalar: "Regalar", type_badge_prestar: "Prestar", type_badge_intercambiar: "Intercambiar", type_badge_vender: "Vender",
    nav_my: "A miña área", nav_my_short: "Miña área", nav_publish_short: "Publicar", nav_points_short: "Puntos", nav_rules_short: "Normas",
    filters_btn: "Filtros", filters_title: "Filtros e orde", filters_subtitle: "Axusta campus, estado, tipo e orde dos resultados.",
    filters_apply: "Ver resultados", filters_clear: "Limpar todo", sort_by: "Ordenar por", filter_remove: "Quitar filtro: {value}",
    photo_unavailable: "Foto non dispoñible",
    loading_items: "Cargando obxectos…", retry: "Reintentar", catalog_eyebrow: "Catálogo",
    results_found: "obxectos atopados", results_one: "obxecto atopado",
    empty_catalog_t: "Aínda non hai obxectos publicados", empty_catalog_b: "Sé a primeira persoa en darlle unha segunda vida a algo que xa non usas.",
    empty_filter_t: "Ningún obxecto coincide", empty_filter_b: "Proba a quitar algún filtro ou a buscar con outras palabras.",
    empty_fav_t: "Aínda non gardas nada", empty_fav_b: "Toca o corazón dun obxecto para gardalo e velo aquí.",
    empty_my_items_t: "Aínda non publicaches nada", empty_my_items_b: "Publica o teu primeiro obxecto: cunha foto real e un estado honesto abonda.",
    empty_req_t: "Sen solicitudes enviadas", empty_req_b: "Cando solicites un obxecto, verás aquí o seu estado.",
    empty_recv_t: "Sen solicitudes recibidas", empty_recv_b: "Cando alguén se interese polos teus obxectos, aparecerá nesta lista.",
    publish_first: "Publicar o primeiro", browse_catalog: "Explorar o catálogo", close_toast: "Pechar notificación",
    detail_description: "Descrición", detail_handover_h: "Entrega e seguridade", detail_payment_h: "Pago fóra da plataforma",
    detail_unavailable: "Este obxecto xa non está dispoñible.", detail_manage: "Xestionar na Miña área", status_change: "Cambiar estado",
    edit_item: "Editar",
    edit_title: "Editar publicación",
    edit_hint: "Cambia os datos do obxecto. A foto mantense.",
    edit_save: "Gardar cambios",
    edit_saved: "Publicación actualizada.",
    status_quick: "Estado da publicación",
    demo_cta: "Probar agora mesmo",
    demo_note: "Abre unha conta temporal, sen rexistro. O que publiques vaino ver todo o mundo no catálogo e queda aí; a conta caduca en {h} h. Non poñas datos persoais.",
    demo_started: "Modo demo: publica algo e vaino ver todo o mundo no catálogo.",
    demo_badge: "demo",
    demo_failed: "Non se puido abrir a demo. Téntao outra vez.",
    or: "ou",
    filters_view: "Ver {n} obxectos",
    filters_view_all: "Ver todos",
    confirm_delete_t: "Eliminar este obxecto?", confirm_delete_b: "Borrarase a publicación e os seus datos asociados. Esta acción non se pode desfacer.",
    confirm_delete_btn: "Si, eliminar",
    photo_drop_t: "Toca para escoller unha foto", photo_drop_b: "JPG, PNG ou WebP · máximo 5 MB · optimízase ao subir",
    photo_remove: "Quitar foto", photo_upload: "Subir foto", photo_uploading: "Subindo foto…",
    photo_ready: "Foto subida e lista", photo_change: "Cambiar foto",
    form_sec_1: "O esencial", form_sec_2: "Detalles do intercambio", form_sec_3: "Foto e publicación",
    publishing: "Publicando…", sending: "Enviando…", saving: "Gardando…",
    title_ph: "Ex.: Lámpara de escritorio LED",
    my_area_subtitle: "As túas publicacións, solicitudes e datos.",
    hand_conserjeria: "Conserxería",
    points_conserjeria_t: "Conserxería",
    points_conserjeria_b: "Punto de información á entrada, con persoal e zona de paso.",
    estimate_word: "estimación",
    trust_panel_title: "Confianza e traxectoria",
    verified_badge: "Dominio académico",
    rating_aria: "Valoración: {n} de 5 ({c} valoracións)",
    rating_none: "Sen valoracións aínda",
    rating_none_short: "sen valoracións",
    ratings_received: "Valoracións recibidas",
    ratings_none: "Aínda non hai valoracións deste perfil.",
    comments_title: "Valoracións e comentarios",
    comments_empty: "Aínda non hai comentarios. Sé a primeira persoa en opinar.",
    comments_add: "Deixa a túa valoración",
    comments_body: "Comentario",
    comments_body_ph: "Que che pareceu esta publicación? Describe o estado, a entrega ou calquera detalle útil.",
    comments_score: "Puntuación (opcional)",
    comments_score_none: "Sen puntuación",
    comments_submit: "Publicar comentario",
    comments_login: "Inicia sesión para deixar un comentario.",
    comments_already: "Xa deixaches a túa valoración nesta publicación.",
    comments_posted: "Comentario publicado.",
    comments_count: "{n} comentarios",
    comments_count_one: "1 comentario",
    comments_avg: "{a} de 5",
    comments_score_aria: "Puntuar con {n} estrelas",
    comments_more: "Ver máis comentarios",
    comments_own: "Non podes valorar as túas propias publicacións: opinan quen recibe o obxecto.",
    comments_need_something: "Escribe un comentario ou deixa unha valoración.",
    exchanges_completed: "Intercambios completados",
    given_label: "Entregados",
    received_label: "Recibidos",
    level_label: "Nivel",
    level_semilla: "Semente",
    level_brote: "Brote",
    level_arbol: "Árbore",
    level_bosque: "Bosque",
    level_next: "Seguinte:",
    level_max: "Nivel máximo acadado",
    exchanges_short: "intercambios",
    badges_title: "Insignias",
    badge_verified: "Email de dominio académico",
    badge_first_delivery: "Primeira entrega",
    badge_five_exchanges: "Cinco intercambios",
    badge_rated: "Perfil valorado",
    badge_earned: "acadada",
    badge_locked: "pendente",
    rate_title: "Valora o intercambio",
    rate_lead: "A túa valoración axuda a outras persoas a decidir con quen intercambiar.",
    rate_score_legend: "A túa valoración",
    rate_comment: "Comentario (opcional)",
    rate_comment_ph: "Como foi a entrega? Sen datos persoais.",
    rate_submit: "Enviar valoración",
    rate_later: "Agora non",
    rate_cta: "Valorar",
    rate_yours: "A túa valoración",
    rate_note: "A valoración é pública e non se pode editar unha vez enviada.",
    rate_item_label: "Obxecto",
    toast_rated: "Grazas por valorar",
    form_quick: "O esencial",
    form_quick_hint: "Foto, título, categoría e tipo. Publicar leva menos dun minuto.",
    form_optional: "Detalles opcionais",
    form_optional_hint: "Descrición, estado, campus e punto de entrega. Podes publicar sen enchelos.",
    f_desc_optional: "Descrición (opcional)",
    detail_no_desc: "Sen descrición adicional.",
    image_required_hint: "Obrigatoria: é a foto que verá quen reciba o obxecto.",
    toast_image_required: "Engade unha foto para publicar.",
    required_word: "obrigatorio",
    status_help: "Reservado indica que xa hai un acordo; entregado pecha o intercambio.",
    req_handover: "Punto proposto",
    request_point: "Punto de encontro",
    request_point_hint: "Escolle un sitio público e concorrido; podedes axustalo ao aceptar.",
    req_rated: "Valorado con {n}/5",
    trust_error: "Non se puido cargar o teu perfil de confianza.",
    searching: "Buscando…",
    cold_title: "O servidor está espertando",
    cold_body: "O plan gratuíto suspéndese por inactividade: a primeira petición pode tardar uns segundos.",
    cold_offline: "Non hai conexión co servidor. Téntao de novo nuns segundos.",
    load_more: "Cargar máis obxectos",
    results_partial: "{shown} de {total} obxectos atopados",
    report_open: "Reportar a publicación",
    report_title: "Reportar esta publicación",
    report_privacy: "O reporte gárdase coa túa conta para revisión. Non se avisa á outra persoa.",
    report_reason: "Motivo",
    report_reason_spam: "Spam ou publicidade",
    report_reason_inapropiado: "Contido inapropiado",
    report_reason_estafa: "Posible estafa",
    report_reason_duplicado: "Publicación duplicada",
    report_reason_otro: "Outro motivo",
    report_comment: "Comentario (opcional)",
    report_comment_ph: "Cóntanos que ocorre; axuda a revisalo antes.",
    report_note: "Tres reportes de contas distintas retiran a publicación do catálogo ata a súa revisión.",
    report_send: "Enviar reporte",
    report_sent: "Reporte enviado. Grazas por coidar o taboleiro.",
    report_sent_hidden: "Reporte enviado. A publicación retirouse ata a revisión.",
    report_already: "Xa reportaches esta publicación.",
    status_review: "En revisión",
    review_note: "Retirada do catálogo tras {n} reportes. Revísaa ou elimínaa.",
    toast_rate_limited: "Demasiados intentos seguidos. Espera un intre e téntao de novo.",
    toast_not_found: "Esta publicación xa non está dispoñible.",
    profile_edit: "Editar perfil",
    profile_title: "Editar perfil",
    profile_email_note: "Podes cambiar o teu nome e o teu campus. O email non se edita: cambialo esixe verificalo antes.",
    profile_name: "Nome visible",
    profile_campus: "Campus",
    profile_campus_hint: "Úsase para filtrar e para propoñer puntos de entrega.",
    profile_save: "Gardar cambios",
    profile_saved: "Perfil actualizado.",
    menu_password: "Cambiar contrasinal",
    password_title: "Cambiar contrasinal",
    password_lead: "Ao cambialo pecharanse as demais sesións abertas co contrasinal anterior; esta seguirá activa.",
    password_current: "Contrasinal actual",
    password_new: "Contrasinal novo",
    password_repeat: "Repite o contrasinal novo",
    password_save: "Gardar contrasinal",
    password_changed: "Contrasinal actualizado. As demais sesións pecháronse.",
    password_mismatch: "Os dous contrasinais novos non coinciden.",
    password_hint: "Mínimo 8 caracteres e que non sexa un contrasinal común.",
    password_weak: "Ese contrasinal é demasiado común. Proba cunha frase longa.",
    password_bad_current: "O contrasinal actual non é correcto.",
    password_same: "O contrasinal novo debe ser distinto do actual.",
    lang_name: "Galego",
  }
};

/* ---------------- Documentos legales (ES / EN / GL) ---------------- */
const LEGAL_DOCS = {
  es: {
    legal: [
      { h: "1. Identificación", p: ["El responsable editorial de este prototipo es {controller}. Contacto: {contact}. Campus Circular es el nombre visible del proyecto; no es una sociedad, una tienda ni un servicio administrativo."] },
      { h: "2. Naturaleza independiente", p: ["Campus Circular es un prototipo sin ánimo de lucro presentado en CTC Congress. No utiliza marcas, logotipos ni denominaciones institucionales como propias, y no se presenta como un servicio oficial, avalado o gestionado por ninguna universidad.", "Las denominaciones Vigo, Pontevedra y Ourense se usan únicamente como etiquetas geográficas para organizar entregas."] },
      { h: "3. Información general y LSSI", p: ["Esta versión de demostración no realiza una actividad económica online: no vende, no cobra, no gestiona pagos ni ofrece servicios profesionales. Por eso no se facilitan NIF, domicilio mercantil ni datos registrales.", "Si en el futuro el proyecto presta un servicio de la sociedad de la información con carácter económico, antes deberán completarse los deberes de información permanente, fácil, directa y gratuita del artículo 10 de la Ley 34/2002 (LSSI), y revisarse obligaciones de consumo, fiscales y de comercio."] },
      { h: "4. Contenidos y propiedad intelectual", p: ["El código, los textos, las fotografías locales y el diseño se publican para este prototipo. La marca gráfica de CTC Congress y la fotografía de equipo forman parte de los materiales del proyecto; no se cede su titularidad.", "Los contenidos publicados por las personas usuarias siguen siendo suyos. Al publicar, permiten únicamente su mostrado dentro del servicio mientras la cuenta o el objeto existan."] },
      { h: "5. Enlaces, disponibilidad y contacto", p: ["Los documentos de {privacyLink} y {termsLink} son accesibles de forma permanente desde el pie de página y también por URL directa. No se utilizan enlaces a recursos de terceros para mostrar imágenes, fuentes o analítica.", "Para retirar un contenido, ejercer derechos o comunicar un problema, escribe a {contact}."] },
    ],
    privacy: [
      { h: "1. Responsable y contacto", p: ["Responsable: {controller}. Contacto de privacidad: {contact}. Versión del documento: {version}, actualizada el {updated}."] },
      { h: "2. Datos que tratamos", p: ["Registro: nombre visible, email, contraseña almacenada como hash, campus elegido, fecha de alta, consentimiento y su versión.", "Contenido: título, descripción, categoría, estado, tipo, precio orientativo, imagen subida, favoritos y mensajes de solicitud. Las solicitudes recibidas por una persona pueden contener el nombre visible y el mensaje de quien solicita.", "Sesión: un token aleatorio guardado en el navegador y una fecha de caducidad. No se guarda la dirección IP con la cuenta ni se crean perfiles publicitarios."] },
      { h: "3. Finalidades y base jurídica", p: ["Gestionar la cuenta, mostrar publicaciones, tramitar solicitudes y permitir favoritos: ejecución de la relación de uso del servicio y consentimiento expreso prestado al registrarse.", "Conservar el registro del consentimiento: obligación de poder acreditar que la información se aceptó de forma libre, específica, informada e inequívoca.", "No se tratan datos para publicidad, analítica, perfilado, cesiones comerciales ni decisiones automatizadas."] },
      { h: "4. Consentimiento explícito", p: ["La casilla de registro está sin marcar y enlaza con esta política y con las condiciones. Si cambiamos sustancialmente la finalidad o la versión legal, las cuentas existentes deberán aceptar de nuevo la versión vigente antes de seguir publicando.", "Puedes retirar el consentimiento eliminando la cuenta desde Mi área o escribiendo a {contact}; la retirada no afecta a la licitud del tratamiento previo."] },
      { h: "5. Conservación", p: ["Los datos de la cuenta se conservan mientras exista y, después, solo durante el plazo necesario para atender incidencias o cumplir obligaciones legales. Las sesiones caducan a los {days} días y se eliminan las caducadas al iniciar sesión.", "En el despliegue gratuito de demostración la base SQLite puede estar en almacenamiento efímero: un reinicio puede hacer desaparecer los datos. Esta circunstancia no sustituye una copia de seguridad ni una solicitud formal de supresión."] },
      { h: "6. Destinatarios y transferencias", p: ["No se venden ni ceden datos a terceros. El proveedor de alojamiento puede tratar datos técnicos mínimos para prestar el servicio; no se contratan analíticas, píxeles, fuentes externas ni CDN de imágenes.", "No se prevén transferencias internacionales de datos de cuenta. Si se introduce un proveedor externo, se informará antes y se evaluará su encaje en el RGPD y la LOPDGDD."] },
      { h: "7. Derechos", p: ["Puedes ejercer acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad. La exportación descarga todos los datos de tu cuenta en JSON; la supresión elimina tu perfil, sesiones, publicaciones, favoritos y solicitudes propias, y conserva de forma anonimizada el historial escrito por otras personas.", "Escríbenos a {contact}. Si consideras que no se atiende tu solicitud, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD)."] },
      { h: "8. Seguridad y limitaciones", p: ["Se usan contraseñas con hash, tokens de sesión aleatorios, validación en servidor, una política de contenido local y cabeceras de seguridad. No se almacenan contraseñas en texto plano ni se exponen emails en perfiles públicos.", "Este prototipo no verifica matrícula, identidad ni titularidad de los objetos. La moderación es comunitaria: cualquier cuenta puede reportar una publicación y, al alcanzar el umbral de reportes de cuentas distintas, la publicación se retira del catálogo hasta que una cuenta de moderación la revisa y, en su caso, restaura. Antes de un despliegue institucional con datos reales, coordina con la delegación de protección de datos correspondiente y realiza una evaluación de riesgos."] },
      { h: "9. Menores", p: ["El servicio está pensado para personas adultas. No se recoge fecha de nacimiento y no se admite el registro de menores de 14 años. Si eres menor de edad, no publiques datos personales ni quedes sin acompañamiento."] },
      { h: "10. Cookies, analítica y recursos de terceros", p: ["No se usan cookies de sesión, cookies publicitarias, analítica, píxeles ni rastreadores. El idioma y el token se guardan en el almacenamiento local del navegador; puedes borrarlos desde su configuración.", "Las imágenes de ejemplo y de categoría se sirven desde este mismo dominio. Para privacidad, no se aceptan URL de imágenes externas en las publicaciones."] },
      { h: "11. Fotografías", p: ["Las fotos de objetos que subas pueden contener datos personales si muestras cartas, pantallas, etiquetas o documentos: revísalas antes de publicar.", "La fotografía de grupo de la página del proyecto forma parte de los materiales del proyecto. Las imágenes de personas son datos personales; si apareces en ella y deseas que se retire, escribe a {contact}."] },
      { h: "12. Valoraciones", p: ["Tras una entrega completada, ambas partes pueden puntuar de 1 a 5 y dejar un comentario opcional. Se guardan la puntuación, el comentario, la fecha y el vínculo con el intercambio; la media aparece en el perfil público junto al nombre visible de quien valora."] },
      { h: "13. Cambios", p: ["Los cambios relevantes se reflejarán en el número de versión {version} y en la fecha {updated}. La versión vigente se muestra también en el registro y en Mi área."] },
    ],
    terms: [
      { h: "1. Qué es el servicio", p: ["Campus Circular es un prototipo independiente para que personas particulares publiquen, busquen y soliciten objetos de segunda vida: regalar, prestar, intercambiar o indicar un precio orientativo.", "No es una tienda, un marketplace profesional, un servicio de mensajería, una entidad de pago ni un servicio oficial de ninguna institución."] },
      { h: "2. Independencia y ausencia de verificación", p: ["El proyecto no usa marcas institucionales ni afirma contar con aval, autorización o verificación oficial. La insignia de dominio académico, cuando aparece, es automática y meramente informativa: no comprueba matrícula, identidad ni pertenencia.", "Cualquier punto físico de entrega necesitaría autorización de quien gestione ese espacio. Las etiquetas de puntos de esta web son solo sugerencias."] },
      { h: "3. Cuenta y consentimiento", p: ["Puedes registrarte con cualquier email válido. Debes marcar expresamente la casilla de aceptación de {privacyLink} y {termsLink}, usar una contraseña propia y no compartirla.", "La sesión caduca a los {days} días. Eres responsable de la información que publicas y de mantener tu contraseña en secreto."] },
      { h: "4. Publicaciones permitidas", p: ["Solo se admiten anuncios ocasionales de particulares. Quedan fuera vendedores profesionales, actividad comercial habitual, artículos prohibidos, productos que requieran requisitos especiales y contenido que incluya datos personales de terceros.", "Describe el estado con honestidad, sube una foto real del objeto y no escribas teléfonos, direcciones ni datos bancarios en la descripción."] },
      { h: "5. Pagos fuera de la plataforma", p: ["Campus Circular no procesa pagos, no cobra comisiones, no retiene fondos, no ofrece depósito en garantía, no emite reembolsos, no garantiza objetos ni media en disputas. «Vender» es solo un precio orientativo y un motivo para contactar.", "Si hay contraprestación, se acuerda directamente entre particulares fuera de la plataforma, por ejemplo en efectivo o mediante un pago directo persona a persona en la entrega. Cada persona asume su propio cumplimiento legal y fiscal: la venta habitual o profesional puede activar obligaciones de consumo, IVA, IRPF, LSSI y prevención de blanqueo."] },
      { h: "6. Entregas y solicitudes", p: ["La solicitud sirve para coordinar el intercambio. Elegid un lugar público y concurrido, comprobad el objeto antes de aceptarlo y acordad por escrito la devolución si es un préstamo.", "No hay envíos por correo gestionados por Campus Circular. Marca el objeto como entregado solo cuando la entrega real haya terminado."] },
      { h: "7. Usos prohibidos", p: ["Prohibido publicar datos de contacto en abierto, suplantar identidades, acosar, estafar, vender como profesional, eludir la validación de imágenes, introducir URL externas o intentar usar la plataforma como monedero, escrow o sistema de comisiones.", "Prohibido subir contenido ilegal, peligroso, discriminatorio o que vulnere derechos de terceros."] },
      { h: "8. Responsabilidad", p: ["Campus Circular ofrece una herramienta técnica de publicación y solicitud, pero no verifica objetos, no participa en los acuerdos y no responde por su cumplimiento, estado, precio, pago, devolución o daños.", "El prototipo puede tener errores, reiniciarse o perder datos en un alojamiento gratuito efímero. No lo uses como único repositorio de información importante."] },
      { h: "9. Datos y supresión", p: ["El tratamiento de datos se describe en {privacyLink}. Puedes descargar una copia y eliminar la cuenta desde Mi área, o escribir a {contact}.", "La supresión elimina perfil, sesiones, publicaciones, favoritos y solicitudes propias; no crea una copia de respaldo. Las solicitudes recibidas, las valoraciones y los reportes escritos por otras personas se conservan de forma anonimizada para no destruir su historial."] },
      { h: "11. Valoraciones", p: ["Solo se puede valorar un intercambio cuando la entrega figura como completada. Las valoraciones son públicas, no se editan y deben describir la entrega sin insultos, datos personales ni acusaciones no contrastadas."] },
      { h: "11. Cambios y ley aplicable", p: ["Podemos actualizar estas condiciones para reflejar cambios técnicos o legales; la versión vigente es {version}, de {updated}.", "Estas condiciones se interpretan conforme a la normativa española y europea aplicable, en particular RGPD, LOPDGDD y LSSI cuando corresponda. No constituyen asesoramiento jurídico, fiscal o de consumo."] },
    ],
  },
  en: {
    legal: [
      { h: "1. Identification", p: ["The editorial controller of this prototype is {controller}. Privacy contact: {contact}. Campus Circular is the visible project name; it is not a company, a shop or an administrative service."] },
      { h: "2. Independent nature", p: ["Campus Circular is a non-profit prototype presented at CTC Congress. It does not use institutional names, logos or brands as its own and does not present itself as an official, endorsed or managed service of any university.", "Vigo, Pontevedra and Ourense are used only as geographic labels to organise handovers."] },
      { h: "3. General information and LSSI", p: ["This demo version does not carry out an economic online activity: it does not sell, charge, process payments or provide professional services. For that reason no tax ID, business address or registry details are provided.", "If the project later becomes an economic information-society service, the permanent, easy, direct and free information duties of article 10 of Spanish Law 34/2002 (LSSI) must be completed first, together with a consumer, tax and commerce review."] },
      { h: "4. Content and intellectual property", p: ["The code, texts, local photographs and design are published for this prototype. The CTC Congress mark and the team photograph are part of the project materials; ownership is not transferred.", "User-generated content remains its author's. By listing an item, the author allows only its display within the service while the account or listing exists."] },
      { h: "5. Links, availability and contact", p: ["The {privacyLink} and {termsLink} documents are permanently available from the footer and by direct URL. No third-party resources are used for images, fonts or analytics.", "To remove content, exercise rights or report a problem, write to {contact}."] },
    ],
    privacy: [
      { h: "1. Controller and contact", p: ["Controller: {controller}. Privacy contact: {contact}. Document version: {version}, updated {updated}."] },
      { h: "2. Data we process", p: ["Account: display name, email, hashed password, chosen campus, signup date, consent record and its version.", "Content: title, description, category, condition, exchange type, indicative price, uploaded image, favorites and request messages. Requests received by a person may include the requester's display name and message.", "Session: a random token stored in the browser and an expiry date. No account IP address is stored and no advertising profiles are built."] },
      { h: "3. Purposes and legal basis", p: ["Managing the account, displaying listings, handling requests and favorites: performance of the service relationship and the explicit consent given at registration.", "Keeping a consent record: accountability for consent that must be free, specific, informed and unambiguous.", "No data is used for advertising, analytics, profiling, commercial transfers or automated decisions."] },
      { h: "4. Explicit consent", p: ["The registration checkbox is unchecked and links to this policy and the terms. If purposes or the legal version change materially, existing accounts must accept the current version again before publishing.", "Consent may be withdrawn by deleting the account from My area or writing to {contact}; withdrawal does not affect the lawfulness of prior processing."] },
      { h: "5. Retention", p: ["Account data is kept while the account exists and afterwards only as long as needed to handle incidents or legal duties. Sessions expire after {days} days and expired sessions are removed at login.", "On the free demo deployment the SQLite database may be on ephemeral storage: a restart can remove data. That is not a backup and does not replace a formal erasure request."] },
      { h: "6. Recipients and transfers", p: ["Data is not sold or transferred to third parties. The hosting provider may process minimal technical data to deliver the service; no analytics, pixels, external fonts or image CDNs are contracted.", "No international transfers of account data are planned. If an external provider is added, users will be informed first and its GDPR/LOPDGDD fit assessed."] },
      { h: "7. Rights", p: ["You may exercise access, rectification, erasure, objection, restriction and portability. Export downloads all your account data as JSON; erasure deletes the profile, sessions, listings, favorites and own requests, and keeps what other people wrote anonymised.", "Write to {contact}. If your request is not satisfied, you may complain to the Spanish Data Protection Agency (AEPD)."] },
      { h: "8. Security and limitations", p: ["Passwords are hashed, session tokens are random, inputs are validated server-side, resources are local and security headers are set. Passwords are never stored in plain text and emails are not exposed in public profiles.", "This prototype does not verify enrolment, identity or ownership. Moderation is community-based: any account can report a listing and, once the threshold of reports from distinct accounts is reached, the listing is removed from the catalog until a moderation account reviews and, if appropriate, restores it. Before an institutional deployment with real data, coordinate with the relevant data protection officer and complete a risk assessment."] },
      { h: "9. Minors", p: ["The service is intended for adults. No date of birth is collected and registration by children under 14 is not accepted. Minors should not post personal data or attend handovers unaccompanied."] },
      { h: "10. Cookies, analytics and third-party resources", p: ["No session cookies, advertising cookies, analytics, pixels or trackers are used. Language and token are stored in browser local storage and can be cleared in browser settings.", "Sample and category images are served from this same domain. For privacy, external image URLs are not accepted in listings."] },
      { h: "11. Photographs", p: ["Photos you upload may contain personal data if they show letters, screens, labels or documents: check them before publishing.", "The group photo on the project page is part of the project materials. Images of people are personal data; if you appear in it and want it removed, write to {contact}."] },
      { h: "12. Ratings", p: ["After a completed handover, both parties may rate from 1 to 5 and leave an optional comment. The score, comment, date and link to the exchange are stored; the average appears on the public profile next to the rater's display name."] },
      { h: "13. Changes", p: ["Material changes will be reflected in version {version} and date {updated}. The current version is also shown at registration and in My area."] },
    ],
    terms: [
      { h: "1. What the service is", p: ["Campus Circular is an independent prototype for private individuals to list, find and request second-life items: give away, lend, exchange or show an indicative price.", "It is not a shop, a professional marketplace, a courier service, a payment entity or an official service of any institution."] },
      { h: "2. Independence and no verification", p: ["The project uses no institutional branding and claims no official endorsement, authorisation or verification. An academic-domain badge, when shown, is automatic and informative only: it does not check enrolment, identity or membership.", "Any physical handover point would need authorisation from whoever manages the space. The point labels on this site are suggestions only."] },
      { h: "3. Account and consent", p: ["You may register with any valid email. You must explicitly tick the box accepting {privacyLink} and {termsLink}, use your own password and keep it secret.", "Sessions expire after {days} days. You are responsible for the information you publish and for your password."] },
      { h: "4. Permitted listings", p: ["Only occasional listings by private individuals are allowed. Professional sellers, regular commercial activity, prohibited goods, regulated items requiring special conditions and content containing third-party personal data are excluded.", "Describe condition honestly, upload a real photo and do not put phone numbers, addresses or bank details in the description."] },
      { h: "5. Payments outside the platform", p: ["Campus Circular does not process payments, charge fees, hold funds, provide escrow, issue refunds, guarantee items or mediate disputes. “Sell” is only an indicative price and a reason to make contact.", "Any consideration is agreed directly between private individuals outside the platform, for example in cash or by a direct person-to-person payment at handover. Each person remains responsible for their own legal and tax duties: regular or professional selling can trigger consumer, VAT, income-tax, LSSI and anti-money-laundering obligations."] },
      { h: "6. Handovers and requests", p: ["The request coordinates the exchange. Choose a busy public place, inspect the item before accepting it and agree a return date in writing for a loan.", "Campus Circular does not manage postal shipping. Mark an item as delivered only after the real handover is complete."] },
      { h: "7. Prohibited uses", p: ["Do not post open contact details, impersonate others, harass, defraud, sell professionally, bypass image validation, insert external URLs or try to use the platform as a wallet, escrow or commission system.", "Do not upload illegal, dangerous, discriminatory content or material that infringes third-party rights."] },
      { h: "8. Liability", p: ["Campus Circular provides a technical listing and request tool, but does not verify items, take part in agreements or answer for their performance, condition, price, payment, return or damages.", "The prototype may contain errors, restart or lose data on a free ephemeral host. Do not use it as the only repository for important information."] },
      { h: "9. Data and erasure", p: ["Data processing is described in {privacyLink}. You can download a copy and delete your account from My area, or write to {contact}.", "Erasure removes the profile, sessions, listings, favorites and own requests; it does not create a backup copy. Requests received, ratings and reports written by other people are kept anonymised so their history is not destroyed."] },
      { h: "11. Ratings", p: ["An exchange can only be rated once the handover is marked as completed. Ratings are public, cannot be edited and must describe the handover without insults, personal data or unverified accusations."] },
      { h: "11. Changes and applicable law", p: ["These terms may be updated to reflect technical or legal changes; the current version is {version}, dated {updated}.", "They are interpreted under applicable Spanish and EU law, in particular GDPR, LOPDGDD and LSSI where relevant. They are not legal, tax or consumer advice."] },
    ],
  },
  gl: {
    legal: [
      { h: "1. Identificación", p: ["O responsable editorial deste prototipo é {controller}. Contacto de privacidade: {contact}. Campus Circular é o nome visible do proxecto; non é unha sociedade, unha tenda nin un servizo administrativo."] },
      { h: "2. Natureza independente", p: ["Campus Circular é un prototipo sen ánimo de lucro presentado en CTC Congress. Non usa marcas, logotipos nin denominacións institucionais como propias, e non se presenta como un servizo oficial, avalado ou xestionado por ningunha universidade.", "As denominacións Vigo, Pontevedra e Ourense úsanse só como etiquetas xeográficas para organizar entregas."] },
      { h: "3. Información xeral e LSSI", p: ["Esta versión de demostración non realiza unha actividade económica en liña: non vende, non cobra, non xestiona pagos nin ofrece servizos profesionais. Por iso non se facilitan NIF, domicilio mercantil nin datos rexistrais.", "Se no futuro o proxecto presta un servizo da sociedade da información con carácter económico, antes deberán completarse os deberes de información permanente, doada, directa e gratuíta do artigo 10 da Lei 34/2002 (LSSI), e revisarse obrigas de consumo, fiscais e de comercio."] },
      { h: "4. Contidos e propiedade intelectual", p: ["O código, os textos, as fotografías locais e o deseño publícanse para este prototipo. A marca gráfica de CTC Congress e a fotografía de equipo forman parte dos materiais do proxecto; non se cede a súa titularidade.", "Os contidos publicados polas persoas usuarias seguen sendo seus. Ao publicar, permiten só a súa visualización dentro do servizo mentres existan a conta ou o obxecto."] },
      { h: "5. Ligazóns, dispoñibilidade e contacto", p: ["Os documentos de {privacyLink} e {termsLink} son accesibles de forma permanente desde o pé de páxina e tamén por URL directa. Non se usan ligazóns a recursos de terceiros para amosar imaxes, fontes ou analítica.", "Para retirar un contido, exercer dereitos ou comunicar un problema, escribe a {contact}."] },
    ],
    privacy: [
      { h: "1. Responsable e contacto", p: ["Responsable: {controller}. Contacto de privacidade: {contact}. Versión do documento: {version}, actualizada o {updated}."] },
      { h: "2. Datos que tratamos", p: ["Rexistro: nome visible, email, contrasinal gardado como hash, campus elixido, data de alta, consentimento e a súa versión.", "Contido: título, descrición, categoría, estado, tipo, prezo orientativo, imaxe subida, favoritos e mensaxes de solicitude. As solicitudes recibidas poden conter o nome visible e a mensaxe de quen solicita.", "Sesión: un token aleatorio gardado no navegador e unha data de caducidade. Non se garda o enderezo IP coa conta nin se crean perfís publicitarios."] },
      { h: "3. Finalidades e base xurídica", p: ["Xestionar a conta, amosar publicacións, tramitar solicitudes e permitir favoritos: execución da relación de uso do servizo e consentimento expreso prestado ao rexistrarse.", "Conservar o rexistro do consentimento: obriga de poder acreditar que a información se aceptou de forma libre, específica, informada e inequívoca.", "Non se tratan datos para publicidade, analítica, perfilado, cesións comerciais nin decisións automatizadas."] },
      { h: "4. Consentimento explícito", p: ["A caixa de rexistro está sen marcar e enlaza con esta política e coas condicións. Se cambiamos substancialmente a finalidade ou a versión legal, as contas existentes deberán aceptar de novo a versión vixente antes de seguir publicando.", "Podes retirar o consentimento eliminando a conta na Miña área ou escribindo a {contact}; a retirada non afecta á licitude do tratamento previo."] },
      { h: "5. Conservación", p: ["Os datos da conta consérvanse mentres exista e, despois, só durante o prazo necesario para atender incidencias ou cumprir obrigas legais. As sesións caducan aos {days} días e elimínanse as caducadas ao iniciar sesión.", "No despregue gratuíto de demostración a base SQLite pode estar en almacenamento efémero: un reinicio pode facer desaparecer os datos. Isto non substitúe unha copia de seguridade nin unha solicitude formal de supresión."] },
      { h: "6. Destinatarios e transferencias", p: ["Non se venden nin ceden datos a terceiros. O provedor de aloxamento pode tratar datos técnicos mínimos para prestar o servizo; non se contratan analíticas, píxeles, fontes externas nin CDN de imaxes.", "Non se prevén transferencias internacionais de datos de conta. Se se introduce un provedor externo, informarase antes e avaliarase o seu encaixe no RGPD e na LOPDGDD."] },
      { h: "7. Dereitos", p: ["Podes exercer acceso, rectificación, supresión, oposición, limitación do tratamento e portabilidade. A exportación descarga todos os datos da túa conta en JSON; a supresión elimina o teu perfil, sesións, publicacións, favoritos e solicitudes propias, e conserva de forma anonimizada o historial escrito por outras persoas.", "Escríbenos a {contact}. Se consideras que non se atende a túa solicitude, podes presentar unha reclamación ante a Axencia Española de Protección de Datos (AEPD)."] },
      { h: "8. Seguridade e limitacións", p: ["Úsanse contrasinais con hash, tokens de sesión aleatorios, validación no servidor, unha política de contido local e cabeceiras de seguridade. Non se almacenan contrasinais en texto plano nin se expoñen emails en perfís públicos.", "Este prototipo non verifica matrícula, identidade nin titularidade dos obxectos. A moderación é comunitaria: calquera conta pode reportar unha publicación e, ao chegar ao limiar de reportes de contas distintas, a publicación retírase do catálogo ata que unha conta de moderación a revise e, no seu caso, restaure. Antes dun despregue institucional con datos reais, coordina coa delegación de protección de datos correspondente e realiza unha avaliación de riscos."] },
      { h: "9. Menores", p: ["O servizo está pensado para persoas adultas. Non se recolle data de nacemento e non se admite o rexistro de menores de 14 anos. Se es menor, non publiques datos persoais nin quedes sen acompañamento."] },
      { h: "10. Cookies, analítica e recursos de terceiros", p: ["Non se usan cookies de sesión, cookies publicitarias, analítica, píxeles nin rastrexadores. O idioma e o token gárdanse no almacenamento local do navegador; podes borralos desde a súa configuración.", "As imaxes de exemplo e de categoría sírvense desde este mesmo dominio. Para privacidade, non se aceptan URL de imaxes externas nas publicacións."] },
      { h: "11. Fotografías", p: ["As fotos de obxectos que subas poden conter datos persoais se amosan cartas, pantallas, etiquetas ou documentos: revísaas antes de publicar.", "A fotografía de grupo da páxina do proxecto forma parte dos materiais do proxecto. As imaxes de persoas son datos persoais; se apareces nela e desexas que se retire, escribe a {contact}."] },
      { h: "12. Valoracións", p: ["Tras unha entrega completada, ambas as partes poden puntuar de 1 a 5 e deixar un comentario opcional. Gárdanse a puntuación, o comentario, a data e o vínculo co intercambio; a media aparece no perfil público xunto ao nome visible de quen valora."] },
      { h: "13. Cambios", p: ["Os cambios relevantes reflectiranse no número de versión {version} e na data {updated}. A versión vixente tamén se amosa no rexistro e na Miña área."] },
    ],
    terms: [
      { h: "1. Que é o servizo", p: ["Campus Circular é un prototipo independente para que persoas particulares publiquen, busquen e soliciten obxectos de segunda vida: regalar, prestar, intercambiar ou indicar un prezo orientativo.", "Non é unha tenda, un marketplace profesional, un servizo de mensaxaría, unha entidade de pago nin un servizo oficial de ningunha institución."] },
      { h: "2. Independencia e ausencia de verificación", p: ["O proxecto non usa marcas institucionais nin afirma contar con aval, autorización ou verificación oficial. A insignia de dominio académico, cando aparece, é automática e só informativa: non comproba matrícula, identidade nin pertenza.", "Calquera punto físico de entrega necesitaría autorización de quen xestione ese espazo. As etiquetas de puntos desta web son só suxestións."] },
      { h: "3. Conta e consentimento", p: ["Podes rexistrarte con calquera email válido. Debes marcar expresamente a caixa de aceptación de {privacyLink} e {termsLink}, usar un contrasinal propio e non compartilo.", "A sesión caduca aos {days} días. Es responsable da información que publicas e de manter o contrasinal en segredo."] },
      { h: "4. Publicacións permitidas", p: ["Só se admiten anuncios ocasionais de particulares. Quedan fóra vendedores profesionais, actividade comercial habitual, artigos prohibidos, produtos con requisitos especiais e contido con datos persoais de terceiros.", "Describe o estado con honestidade, sube unha foto real e non escribas teléfonos, enderezos nin datos bancarios na descrición."] },
      { h: "5. Pagos fóra da plataforma", p: ["Campus Circular non procesa pagos, non cobra comisións, non retén fondos, non ofrece depósito en garantía, non emite reembolsos, non garante obxectos nin media en disputas. «Vender» é só un prezo orientativo e un motivo para contactar.", "Se hai contraprestación, acórdase directamente entre particulares fóra da plataforma, por exemplo en efectivo ou cun pago directo persoa a persoa na entrega. Cada persoa asume o seu propio cumprimento legal e fiscal: a venda habitual ou profesional pode activar obrigas de consumo, IVE, IRPF, LSSI e prevención de branqueo."] },
      { h: "6. Entregas e solicitudes", p: ["A solicitude serve para coordinar o intercambio. Escollede un lugar público e concorrido, comprobade o obxecto antes de aceptalo e acordade por escrito a devolución se é un préstamo.", "Non hai envíos por correo xestionados por Campus Circular. Marca o obxecto como entregado só cando a entrega real rematase."] },
      { h: "7. Usos prohibidos", p: ["Prohíbese publicar datos de contacto en aberto, suplantar identidades, acosar, estafar, vender como profesional, eludir a validación de imaxes, introducir URL externas ou intentar usar a plataforma como moedeiro, escrow ou sistema de comisións.", "Prohíbese subir contido ilegal, perigoso, discriminatorio ou que vulnere dereitos de terceiros."] },
      { h: "8. Responsabilidade", p: ["Campus Circular ofrece unha ferramenta técnica de publicación e solicitude, pero non verifica obxectos, non participa nos acordos e non responde polo seu cumprimento, estado, prezo, pago, devolución ou danos.", "O prototipo pode ter erros, reiniciarse ou perder datos nun aloxamento gratuíto efémero. Non o uses como único repositorio de información importante."] },
      { h: "9. Datos e supresión", p: ["O tratamento de datos descríbese en {privacyLink}. Podes descargar unha copia e eliminar a conta na Miña área, ou escribir a {contact}.", "A supresión elimina perfil, sesións, publicacións, favoritos e solicitudes propias; non crea unha copia de respaldo. As solicitudes recibidas, as valoracións e os reportes escritos por outras persoas consérvanse de forma anonimizada para non destruír o seu historial."] },
      { h: "11. Valoracións", p: ["Só se pode valorar un intercambio cando a entrega figura como completada. As valoracións son públicas, non se editan e deben describir a entrega sen insultos, datos persoais nin acusacións non contrastadas."] },
      { h: "11. Cambios e lei aplicable", p: ["Podemos actualizar estas condicións para reflectir cambios técnicos ou legais; a versión vixente é {version}, de {updated}.", "Estas condicións interprétanse conforme á normativa española e europea aplicable, en particular RGPD, LOPDGDD e LSSI cando corresponda. Non constitúen asesoramento xurídico, fiscal ou de consumo."] },
    ],
  }
};

const CATEGORIES = ["libros", "ropa", "muebles", "estudio", "electronica", "cocina", "electrodomesticos", "deporte", "otros"];
const CONDITIONS = ["nuevo", "como_nuevo", "bueno", "usable"];
const TYPES = ["regalar", "prestar", "intercambiar", "vender"];
const CAMPUSES = ["vigo", "pontevedra", "ourense"];
const HANDOVERS = ["biblioteca", "conserjeria", "cafeteria", "entrada", "punto", "acordado"];

const initialLang = ["es", "en", "gl"].includes(localStorage.getItem("cc_lang"))
  ? localStorage.getItem("cc_lang") : "es";
const state = {
  lang: initialLang,
  user: null,
  token: localStorage.getItem("cc_token") || null,
  view: BOOT.view || PATH_VIEWS[location.pathname] || "home",
  myTab: "items",
  filters: { q: "", category: "", campus: "", condition: "", type: "", sort: "recent" },
  items: [],
  totalResults: null,
  stats: null,
  pendingConsent: false,
  demo: localStorage.getItem("cc_demo") === "1",
};

const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || I18N.es[k] || k;
const catLabel = (c) => t("cat_" + c);
const condLabel = (c) => t("cond_" + c);
const typeLabel = (c) => t("type_" + c);
const typeBadge = (c) => t("type_badge_" + c);
const campusLabel = (c) => t("campus_" + c);
const handLabel = (c) => t("hand_" + c);
const levelLabel = (k) => t("level_" + k);
const statusLabel = (s) => t("status_" + s);
const reqLabel = (s) => t("req_" + s);
const categoryImage = (c) => `/static/img/items/${CATEGORIES.includes(c) ? c : "placeholder"}.jpg`;
const itemImage = (it) => it.image_url || categoryImage(it.category);

/* Manifiesto de variantes generado por tools/optimize_images.py. Se inyecta en
   el boot para no añadir peticiones: { "<url>": { webp, src, width, height } }. */
const IMG_MANIFEST = BOOT.imgManifest || {};

/* <picture> con WebP y srcset cuando el asset tiene variantes; si no, <img> de
   siempre. `sizes` debe reflejar el ancho real de pintado. */
function responsiveImage(src, opts = {}) {
  const {
    alt = "", sizes = "(max-width: 720px) 92vw, 300px", cls = "",
    lazy = true, priority = false, fallback = "", category = "",
  } = opts;
  const attrs = [];
  if (cls) attrs.push(`class="${esc(cls)}"`);
  attrs.push(`alt="${esc(alt)}"`);
  if (lazy) attrs.push('loading="lazy"');
  attrs.push('decoding="async"');
  if (priority) attrs.push('fetchpriority="high"');
  let extra = " data-fallback";
  if (fallback) extra += ` data-fallback-src="${esc(fallback)}"`;
  if (category) extra += ` data-category="${esc(category)}"`;
  const variants = IMG_MANIFEST[src];
  if (!variants || !variants.webp) {
    return `<img src="${esc(src)}" ${attrs.join(" ")}${extra}>`;
  }
  const dims = variants.width && variants.height
    ? `width="${variants.width}" height="${variants.height}" ` : "";
  const source = `<source type="image/webp" srcset="${esc(variants.webp)}" sizes="${esc(sizes)}">`;
  return `<picture>${source}<img src="${esc(variants.src || src)}" ${dims}${attrs.join(" ")}${extra}></picture>`;
}
function itemPhoto(it, opts) {
  return `${it.image_url ? responsiveImage(it.image_url, opts) : ""}
    <span class="item-photo-note${it.image_url ? " hidden" : ""}">${icon("camera")}${esc(t("photo_unavailable"))}</span>`;
}

const POINT_ICONS = { biblioteca: "inbox", conserjeria: "info", cafeteria: "clock", entrada: "pin", punto: "tag", acordado: "shield" };
const MY_TABS = [
  { id: "items", label: "my_items" },
  { id: "requests", label: "my_requests" },
  { id: "received", label: "received" },
  { id: "favorites", label: "favorites" }
];
const TOAST_ICONS = { success: "check-circle", error: "alert", info: "info" };
const TOAST_DURATION = 4600;
const PAGE_SIZE = Number(BOOT.pageSize) || 24;
const REPORT_REASONS = ["spam", "inapropiado", "estafa", "duplicado", "otro"];
const COLD_START_MS = 2500;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/* ---------------- Iconos y utilidades ---------------- */
function icon(name, extra = "") {
  return `<svg class="icon${extra ? " " + extra : ""}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
}

function legalText(s = "") {
  let out = esc(s);
  const replacements = {
    "{service}": esc(CONFIG.service),
    "{controller}": esc(CONFIG.controller),
    "{contact}": `<a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a>`,
    "{version}": esc(CONFIG.legalVersion),
    "{updated}": esc(CONFIG.legalUpdated),
    "{days}": esc(String(CONFIG.sessionDays)),
    "{privacy}": `<a href="/privacidad" data-route="privacy">${esc(t("footer_privacy"))}</a>`,
    "{terms}": `<a href="/condiciones" data-route="terms">${esc(t("footer_terms"))}</a>`,
    "{privacyLink}": `<a href="/privacidad" data-route="privacy">${esc(t("footer_privacy"))}</a>`,
    "{termsLink}": `<a href="/condiciones" data-route="terms">${esc(t("footer_terms"))}</a>`,
  };
  for (const [key, value] of Object.entries(replacements)) out = out.split(key).join(value);
  return out;
}

function setBusy(btn, busy, label) {
  if (!btn) return;
  if (busy) {
    if (!btn.dataset.idleLabel) btn.dataset.idleLabel = btn.innerHTML;
    btn.classList.add("btn-loading");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${esc(label || t("saving"))}</span>`;
  } else {
    btn.classList.remove("btn-loading");
    btn.disabled = false;
    if (btn.dataset.idleLabel) {
      btn.innerHTML = btn.dataset.idleLabel;
      delete btn.dataset.idleLabel;
    }
  }
}

/* ---------------- API y errores ---------------- */
let coldSeq = 0;
const slowRequests = new Set();

function showColdStart() {
  if ($("#slow-notice")) return;
  const el = document.createElement("div");
  el.id = "slow-notice";
  el.className = "slow-notice";
  el.setAttribute("role", "status");
  el.innerHTML = `<span class="spinner" aria-hidden="true"></span>
    <div><strong>${esc(t("cold_title"))}</strong><span>${esc(t("cold_body"))}</span></div>`;
  document.body.appendChild(el);
}

function hideColdStart() {
  const el = $("#slow-notice");
  if (el) el.remove();
}

function markSlow(id) {
  slowRequests.add(id);
  showColdStart();
}

function unmarkSlow(id) {
  slowRequests.delete(id);
  if (!slowRequests.size) hideColdStart();
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (state.token) headers.Authorization = "Bearer " + state.token;
  // Si Render está despertando el servicio, se avisa en lugar de dejar la
  // pantalla congelada.
  const id = ++coldSeq;
  const timer = setTimeout(() => markSlow(id), COLD_START_MS);
  try {
    const res = await fetch(API + path, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || data.error || "error");
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError || (err && err.name === "TypeError")) {
      const offline = new Error(t("cold_offline"));
      offline.data = { error: "network_error" };
      throw offline;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    unmarkSlow(id);
  }
}

const ERROR_KEYS = {
  consent_required: "toast_consent_required",
  private_seller_required: "toast_private_required",
  invalid_image_url: "toast_invalid_image",
  unauthorized: "toast_unauthorized",
  email_taken: "toast_email_taken",
  already_reported: "report_already",
  rate_limited: "toast_rate_limited",
  not_found: "toast_not_found",
  invalid_credentials: "toast_invalid_credentials",
  invalid_password: "toast_invalid_password",
  weak_password: "password_weak",
  invalid_current_password: "password_bad_current",
  same_password: "password_same",
};
function errorMessage(err) {
  const code = err && err.data && err.data.error;
  if (code && ERROR_KEYS[code]) return t(ERROR_KEYS[code]);
  return (err && err.message) || t("toast_error");
}

/* ---------------- Capas flotantes y avisos ---------------- */
function retireSurface(el) {
  // CSS controla la salida. Sin transición (movimiento reducido, navegador
  // sin soporte o cierre antes del primer fotograma), se retira al instante.
  if (!("inert" in el)) { el.remove(); return; }
  el.inert = true;
  el.classList.add("is-leaving");
  const exit = el.getAnimations?.().find(a => a.transitionProperty === "opacity");
  if (!exit) { el.remove(); return; }
  exit.finished.then(() => el.remove(), () => el.remove());
}

function toast(message, type = "success") {
  const root = $("#toast-root");
  if (!root || !message) return;
  let kind = type === true ? "error" : type;
  if (!TOAST_ICONS[kind]) kind = "success";
  while (root.children.length >= 3) root.firstElementChild.remove();
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.innerHTML = `<span class="toast-icon">${icon(TOAST_ICONS[kind])}</span>
    <span class="toast-msg"></span>
    <button type="button" class="toast-close" aria-label="${esc(t("close_toast"))}">${icon("close")}</button>`;
  el.querySelector(".toast-msg").textContent = message;
  let timer;
  let hovering = false;
  let focusFrom = null;
  const dismiss = () => {
    clearTimeout(timer);
    if (!el.isConnected || el.inert) return;
    const hadFocus = el.contains(document.activeElement);
    retireSurface(el);
    if (hadFocus) restoreSurfaceFocus(focusFrom);
  };
  const schedule = (focused = el.contains(document.activeElement)) => {
    clearTimeout(timer);
    if (!hovering && !focused && el.isConnected && !el.inert) timer = setTimeout(dismiss, TOAST_DURATION);
  };
  el.querySelector(".toast-close").onclick = dismiss;
  el.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") { hovering = true; schedule(); } });
  el.addEventListener("pointerleave", () => { hovering = false; schedule(); });
  el.addEventListener("focusin", e => {
    if (!el.contains(e.relatedTarget)) focusFrom = e.relatedTarget;
    schedule(true);
  });
  el.addEventListener("focusout", e => schedule(el.contains(e.relatedTarget)));
  root.appendChild(el);
  schedule();
}

/* ---------------- Estados vacíos / esqueletos ---------------- */
function emptyState({ iconName = "leaf", title = "", text = "", actions = [], alert = false, heading = "h3" }) {
  return `<div class="empty">
    <span class="empty-icon" aria-hidden="true">${icon(iconName)}</span>
    <${heading}${alert ? ' role="alert"' : ""}>${esc(title)}</${heading}>
    ${text ? `<p>${esc(text)}</p>` : ""}
    ${actions.length ? `<div class="empty-actions">${actions.map(a =>
      `<button type="button" class="btn ${a.variant || "btn-primary"}" data-empty="${esc(a.id)}">${a.icon ? icon(a.icon) : ""}${esc(a.label)}</button>`
    ).join("")}</div>` : ""}
  </div>`;
}

function bindEmptyActions(scope, handlers) {
  $$("[data-empty]", scope).forEach(btn => {
    const fn = handlers[btn.dataset.empty];
    if (fn) btn.onclick = fn;
  });
}

function skeletonCards(n = 6) {
  return Array.from({ length: n }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton sk-media"></div>
      <div class="sk-body">
        <div class="sk-row"><div class="skeleton sk-line w-45"></div><div class="skeleton sk-line w-25"></div></div>
        <div class="skeleton sk-card-title"></div>
        <div class="skeleton sk-line w-70"></div>
        <div class="skeleton sk-line w-60"></div>
        <div class="sk-row sk-card-foot"><div class="skeleton sk-line w-25"></div><div class="skeleton sk-line w-25"></div></div>
      </div>
    </div>`).join("");
}

function skeletonRows(n = 3) {
  return Array.from({ length: n }, () => `
    <div class="skeleton-card sk-card-row" aria-hidden="true">
      <div class="skeleton sk-thumb"></div>
      <div class="sk-stack">
        <div class="skeleton sk-line w-70"></div>
        <div class="skeleton sk-line w-45"></div>
        <div class="skeleton sk-line w-90"></div>
      </div>
    </div>`).join("");
}

function statSkeleton() {
  return `<div class="home-figures stats-row" aria-hidden="true">${Array.from({ length: 2 }, () => `
    <div><div class="skeleton sk-num"></div><div class="skeleton sk-stat-label"></div></div>`).join("")}
  </div>`;
}

/* ---------------- Enlaces y mejoras de DOM ---------------- */
function bindRouteLinks(root = document) {
  $$("a[data-route]", root).forEach(a => {
    a.onclick = (e) => { e.preventDefault(); navigate(a.dataset.route); };
  });
}
function bindImageFallbacks(root = document) {
  $$("img[data-fallback]", root).forEach(img => {
    img.addEventListener("error", () => {
      const note = img.closest(".card-media, .detail-media")?.querySelector(".item-photo-note");
      if (note) {
        img.classList.add("hidden");
        note.classList.remove("hidden");
        img.closest(".card-media")?.classList.add("is-photo-missing");
        return;
      }
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = "1";
      // Dentro de <picture> el <source> tiene prioridad: hay que quitarlo o el
      // navegador seguiría intentando la variante que acaba de fallar.
      const picture = img.closest("picture");
      if (picture) $$("source", picture).forEach(s => s.remove());
      img.src = img.dataset.fallbackSrc || categoryImage(img.dataset.category || "otros");
    });
  });
}
function bindViewButtons(root = document) {
  $$("[data-view]", root).forEach(b => {
    b.onclick = (e) => { e.stopPropagation(); openItem(Number(b.dataset.view)); };
  });
}
function bindFavButtons(root = document) {
  $$("[data-fav]", root).forEach(b => {
    b.onclick = async (e) => {
      e.stopPropagation();
      if (!state.user) { toast(t("need_login"), "info"); openAuth("login"); return; }
      b.disabled = true;
      try {
        const d = await api(`/api/items/${b.dataset.fav}/favorite`, { method: "POST" });
        toast(d.is_favorite ? t("toast_fav_on") : t("toast_fav_off"));
        b.classList.toggle("active", d.is_favorite);
        b.setAttribute("aria-pressed", String(d.is_favorite));
        b.setAttribute("aria-label", favoriteLabel(d.is_favorite, b.dataset.itemTitle));
        b.disabled = false;
        if (state.view === "my" && state.myTab === "favorites" && !d.is_favorite) {
          const card = b.closest(".card");
          if (card) card.remove();
          if ($("#my-panel") && !$("#my-panel .card")) loadMyTab("favorites");
        }
      } catch (err) {
        toast(errorMessage(err), "error");
        b.disabled = false;
      }
    };
  });
}
function bindAccountTools(root = document) {
  $$('[data-action="export"]', root).forEach(b => { b.onclick = downloadAccountExport; });
  $$('[data-action="delete"]', root).forEach(b => { b.onclick = openDeleteAccount; });
  $$('[data-action="login"]', root).forEach(b => { b.onclick = () => openAuth("login"); });
}
function enhance(root = document) {
  bindRouteLinks(root);
  bindImageFallbacks(root);
  bindViewButtons(root);
  bindFavButtons(root);
  bindAccountTools(root);
  $$("[data-print]", root).forEach(b => { b.onclick = () => window.print(); });
  $$("[data-close]", root).forEach(b => { b.onclick = closeModal; });
}
function setApp(app, html) {
  app.innerHTML = html;
  enhance(app);
}

/* ---------------- Auth UI ---------------- */
function closeUserMenu(restoreFocus = false) {
  const menu = $("#user-menu");
  const chip = $("#user-chip");
  if (menu && !menu.classList.contains("hidden")) {
    const restore = restoreFocus && menu.contains(document.activeElement);
    menu.classList.add("hidden");
    if (chip) {
      chip.setAttribute("aria-expanded", "false");
      if (restore) chip.focus();
    }
  }
}

function renderAuthArea() {
  const area = $("#auth-area");
  if (!area) return;
  if (state.token && !state.user) {
    area.innerHTML = `<span class="skeleton sk-auth" aria-hidden="true"></span>`;
    return;
  }
  if (!state.user) {
    area.innerHTML = `
      <button type="button" class="btn btn-ghost btn-sm auth-login" id="btn-login" aria-label="${esc(t("login"))}">
        ${icon("user", "icon-only")}<span class="label-lg">${esc(t("login"))}</span>
      </button>
      <button type="button" class="btn btn-primary btn-sm auth-register" id="btn-register">${esc(t("register"))}</button>`;
    $("#btn-login").onclick = () => openAuth("login");
    $("#btn-register").onclick = () => openAuth("register");
  } else {
    const initials = esc((state.user.name || "?").trim().charAt(0).toUpperCase() || "?");
    const firstName = (state.user.name || "").trim().split(/\s+/)[0] || t("my_area");
    const menuLabel = [firstName, state.demo ? t("demo_badge") : "", t("account_menu")].filter(Boolean).join(" — ");
    area.innerHTML = `
      <div class="dropdown">
        <button type="button" class="user-chip" id="user-chip" aria-label="${esc(menuLabel)}" aria-haspopup="menu" aria-expanded="false" aria-controls="user-menu">
          <span class="avatar" aria-hidden="true">${initials}</span>
          <span class="user-name">${esc(firstName)}</span>
          ${state.demo ? `<span class="demo-badge">${esc(t("demo_badge"))}</span>` : ""}
          ${icon("chevron")}
        </button>
        <div class="dropdown-menu hidden" id="user-menu" role="menu" aria-labelledby="user-chip">
          <button type="button" role="menuitem" tabindex="-1" id="menu-my">${icon("grid")}${esc(t("my_area"))}</button>
          <button type="button" role="menuitem" tabindex="-1" id="menu-publish">${icon("plus")}${esc(t("nav_publish"))}</button>
          <button type="button" role="menuitem" tabindex="-1" id="menu-password">${icon("shield")}${esc(t("menu_password"))}</button>
          <button type="button" role="menuitem" tabindex="-1" id="menu-privacy">${icon("shield")}${esc(t("footer_privacy"))}</button>
          <div class="menu-sep" role="separator"></div>
          <button type="button" role="menuitem" tabindex="-1" id="menu-logout" class="danger">${icon("logout")}${esc(t("logout"))}</button>
        </div>
      </div>`;
    const chip = $("#user-chip");
    const menu = $("#user-menu");
    const items = $$('[role="menuitem"]', menu);
    const openMenu = (last = false) => {
      menu.classList.remove("hidden");
      chip.setAttribute("aria-expanded", "true");
      items[last ? items.length - 1 : 0].focus();
    };
    chip.onclick = (e) => {
      e.stopPropagation();
      if (menu.classList.contains("hidden")) openMenu();
      else closeUserMenu(true);
    };
    chip.onkeydown = (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      openMenu(e.key === "ArrowUp");
    };
    menu.onkeydown = (e) => {
      const index = items.indexOf(document.activeElement);
      if (e.key === "Tab") { closeUserMenu(true); return; }
      const next = { ArrowDown: (index + 1) % items.length, ArrowUp: (index + items.length - 1) % items.length, Home: 0, End: items.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      items[next].focus();
    };
    $("#menu-my").onclick = () => { closeUserMenu(true); navigate("my"); };
    $("#menu-publish").onclick = () => { closeUserMenu(true); navigate("publish"); };
    $("#menu-password").onclick = () => { closeUserMenu(true); openPasswordChange(); };
    $("#menu-privacy").onclick = () => { closeUserMenu(true); navigate("privacy"); };
    $("#menu-logout").onclick = () => { closeUserMenu(true); logout(); };
  }
}

async function logout() {
  try { await api("/api/auth/logout", { method: "POST" }); } catch (e) {}
  state.token = null; state.user = null; state.pendingConsent = false;
  state.demo = false;
  localStorage.removeItem("cc_token");
  localStorage.removeItem("cc_demo");
  renderAuthArea();
  toast(t("toast_logout"));
  navigate("home");
}

/* ---------------- Modales ---------------- */
let lastFocused = null;

function trapFocus(e) {
  if (e.key !== "Tab") return;
  const modal = e.currentTarget;
  const items = $$(FOCUSABLE, modal).filter(el => el.offsetParent !== null);
  if (!items.length) { e.preventDefault(); modal.focus(); return; }
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function setPageInert(inert) {
  $$(".skip-link, .topbar, .tabbar, #app, .footer").forEach(el => { el.inert = inert; });
}

function openModal(html, opts = {}) {
  const dismissible = opts.dismissible !== false;
  if (!$("#backdrop:not([inert])")) lastFocused = document.activeElement;
  const root = $("#modal-root");
  const labelAttr = opts.labelledBy
    ? `aria-labelledby="${esc(opts.labelledBy)}"`
    : opts.label ? `aria-label="${esc(opts.label)}"` : "";
  root.innerHTML = `<div class="modal-backdrop" id="backdrop">
    <div class="modal${opts.wide ? " modal-wide" : ""}${opts.sheet ? " modal-sheet" : ""}" role="dialog" aria-modal="true" ${labelAttr} tabindex="-1">
      <span class="sheet-handle" aria-hidden="true"></span>
      ${html}
    </div>
  </div>`;
  const backdrop = $("#backdrop");
  const modal = $(".modal", backdrop);
  if (dismissible) {
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
  }
  modal.addEventListener("keydown", trapFocus);
  document.body.classList.add("is-locked");
  enhance(modal);
  const target = $("[data-autofocus]", modal) || modal;
  target.focus({ preventScroll: true });
  setPageInert(true);
  return modal;
}

function restoreSurfaceFocus(previous) {
  const dialog = $("#backdrop:not([inert]) .modal");
  const canRestore = previous?.isConnected && !previous.closest("[inert]") && (!dialog || dialog.contains(previous));
  (canRestore ? previous : dialog || $("#app"))?.focus({ preventScroll: true });
}

function closeModal() {
  if (state.pendingConsent) return;
  const backdrop = $("#backdrop:not([inert])");
  if (!backdrop) return;
  const previous = lastFocused;
  lastFocused = null;
  document.body.classList.remove("is-locked");
  retireSurface(backdrop);
  setPageInert(false);
  restoreSurfaceFocus(previous);
}
function closeBtn() {
  return state.pendingConsent ? "" : `<button type="button" class="close" data-close aria-label="${esc(t("close"))}">${icon("close")}</button>`;
}
window.closeModal = closeModal;

/* Cuenta temporal para la exposición: un toque y dentro, sin formularios. */
async function startDemo() {
  const btn = $("#auth-demo");
  if (btn) setBusy(btn, true, t("demo_cta"));
  try {
    const data = await api("/api/auth/demo", { method: "POST" });
    state.token = data.token;
    state.user = data.user;
    state.demo = true;
    localStorage.setItem("cc_token", data.token);
    localStorage.setItem("cc_demo", "1");
    closeModal();
    renderAuthArea();
    toast(t("demo_started"));
    state.myTab = "items";
    navigate("publish");
  } catch (err) {
    if (btn) setBusy(btn, false);
    toast(err && err.data && err.data.error === "demo_disabled" ? t("demo_failed") : errorMessage(err), "error");
  }
}

function openAuth(mode = "login") {
  const isLogin = mode === "login";
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="auth-title">${esc(isLogin ? t("auth_login_title") : t("auth_register_title"))}</h2>
      <p>${esc(t("demo_hint"))}</p>
    </div>
    <form id="auth-form" aria-labelledby="auth-title">
      ${isLogin ? "" : `<div class="field"><label for="auth-name">${esc(t("auth_name"))}</label><input id="auth-name" name="name" required minlength="2" maxlength="60" autocomplete="name"></div>`}
      <div class="field">
        <label for="auth-email">${esc(t("auth_email"))}</label>
        <input id="auth-email" name="email" type="email" required autocomplete="email" ${isLogin ? "data-autofocus" : ""}>
        <small>${esc(t("auth_email_hint"))}</small>
      </div>
      <div class="field">
        <label for="auth-password">${esc(t("auth_password"))}</label>
        <input id="auth-password" name="password" type="password" required minlength="8" autocomplete="${isLogin ? "current-password" : "new-password"}">
        <small>${esc(t("auth_password_hint"))}</small>
      </div>
      ${isLogin ? "" : `
        <div class="field">
          <label for="auth-campus">${esc(t("auth_campus"))}</label>
          <select id="auth-campus" name="campus">${CAMPUSES.map(c => `<option value="${c}">${esc(campusLabel(c))}</option>`).join("")}</select>
        </div>
        <div class="consent-box">
          <label class="check-row"><input type="checkbox" name="consent" required><span>${legalText(t("auth_consent"))}</span></label>
          <p>${esc(t("auth_minimum"))}</p>
        </div>`}
      <button class="btn btn-primary btn-block btn-lg" type="submit" data-submit>${esc(isLogin ? t("auth_btn_login") : t("auth_btn_register"))}</button>
    </form>
    ${BOOT.demoMode ? `
      <div class="auth-demo">
        <span class="auth-demo-sep">${esc(t("or"))}</span>
        <button type="button" class="btn btn-ghost btn-block" id="auth-demo">${icon("refresh")}${esc(t("demo_cta"))}</button>
        <small>${esc(t("demo_note").replace("{h}", String(BOOT.demoTtlHours || 24)))}</small>
      </div>` : ""}
    <p class="muted small text-center mt-3">
      ${esc(isLogin ? t("auth_no_account") : t("auth_have_account"))}
      <button type="button" class="btn-link" id="switch-auth">${esc(isLogin ? t("register") : t("login"))}</button>
    </p>`, { labelledBy: "auth-title" });

  $("#switch-auth").onclick = () => openAuth(isLogin ? "register" : "login");
  const demoBtn = $("#auth-demo");
  if (demoBtn) demoBtn.onclick = startDemo;
  $("#auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const submit = $("[data-submit]", form);
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (!isLogin) {
      payload.consent = fd.get("consent") === "on";
      payload.legal_version = CONFIG.legalVersion;
    }
    setBusy(submit, true);
    try {
      const data = await api(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST", body: JSON.stringify(payload)
      });
      state.token = data.token;
      state.user = data.user;
      state.demo = false;
      localStorage.setItem("cc_token", data.token);
      localStorage.removeItem("cc_demo");
      closeModal();
      renderAuthArea();
      toast(isLogin ? t("toast_login") : t("toast_register"));
      if (!state.user.consent_ok) openConsentUpdate();
      else render();
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

function openConsentUpdate() {
  state.pendingConsent = true;
  const modal = openModal(`
    <div class="modal-head">
      <h2 id="consent-title">${esc(t("consent_update_title"))}</h2>
      <p>${legalText(t("consent_update_body"))}</p>
    </div>
    ${["privacy", "terms"].map(kind => `<details class="disclosure" id="consent-${kind}">
      <summary><span>${esc(t(kind + "_title"))}</span>${icon("chevron")}</summary>
      <div class="disclosure-body">${legalSections(kind, "h3")}</div>
    </details>`).join("")}
    <form id="consent-update-form" aria-labelledby="consent-title">
      <div class="consent-box">
        <label class="check-row"><input type="checkbox" name="consent" required><span>${legalText(t("consent_update_check"))}</span></label>
      </div>
      <button class="btn btn-primary btn-block btn-lg" type="submit" data-submit>${esc(t("consent_update_btn"))}</button>
    </form>`, { dismissible: false, labelledBy: "consent-title" });
  // Keep the revised documents readable without leaving the mandatory dialog.
  $$("[data-route='privacy'], [data-route='terms']", modal).forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const doc = $("#consent-" + link.dataset.route, modal);
      doc.open = true;
      $("summary", doc).focus();
    };
  });
  $("#consent-update-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const submit = $("[data-submit]", e.target);
    setBusy(submit, true);
    try {
      const data = await api("/api/account/consent", {
        method: "POST", body: JSON.stringify({ consent: fd.get("consent") === "on", legal_version: CONFIG.legalVersion })
      });
      state.user = data.user;
      state.pendingConsent = false;
      closeModal();
      renderAuthArea();
      toast(t("toast_consent_updated"));
      render();
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

/* ---------------- Navegación ---------------- */
function navigate(view, opts = {}) {
  state.view = view;
  const path = ROUTE_PATHS[view] || "/";
  if (!opts.fromPopState && location.pathname !== path) {
    try { history.pushState({ view }, "", path); } catch (e) { location.hash = path; }
  }
  closeUserMenu();
  closeModal();
  try { window.scrollTo({ top: 0, behavior: "auto" }); } catch (e) {}
  render();
  $("#app").focus({ preventScroll: true });
}
window.navigate = navigate;

async function render() {
  const app = $("#app");
  if (!app) return;
  closeUserMenu();
  document.documentElement.lang = state.lang;
  document.title = `${t("title_" + state.view) || CONFIG.service} · ${CONFIG.service}`;
  $$(".lang-switch button").forEach(b => {
    const active = b.dataset.lang === state.lang;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  $$("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
  $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$("[data-nav]").forEach(el => {
    el.onclick = (e) => { e.preventDefault(); navigate(el.dataset.nav); };
    if (el.classList.contains("brand")) return;
    const active = el.dataset.nav === state.view;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  $$("a[data-route]", $(".footer")).forEach(a => {
    const active = a.dataset.route === state.view;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  bindRouteLinks(document);

  if (state.view === "publish") return renderPublish(app);
  if (state.view === "points") return renderPoints(app);
  if (state.view === "rules") return renderRules(app);
  if (state.view === "about") return renderAbout(app);
  if (state.view === "my") return renderMy(app);
  if (state.view === "legal") return renderLegalPage(app, "legal");
  if (state.view === "privacy") return renderLegalPage(app, "privacy");
  if (state.view === "terms") return renderLegalPage(app, "terms");
  return renderHome(app);
}

/* ---------------- Datos ---------------- */
let statsPromise = null;
function fetchStats() {
  if (!statsPromise) {
    statsPromise = api("/api/stats")
      .then(data => { state.stats = data; return data; })
      .catch(() => null)
      .finally(() => { statsPromise = null; });
  }
  return statsPromise;
}

function filterParams() {
  const f = state.filters;
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.category) params.set("category", f.category);
  if (f.campus) params.set("campus", f.campus);
  if (f.condition) params.set("condition", f.condition);
  if (f.type) params.set("type", f.type);
  if (f.sort) params.set("sort", f.sort);
  return params;
}

async function fetchItemsPage(offset = 0) {
  const params = filterParams();
  params.set("limit", String(PAGE_SIZE));
  params.set("offset", String(offset));
  return api("/api/items?" + params.toString());
}

function setCatalogCount(shown, total) {
  const el = $("#results-count");
  if (!el) return;
  if (total > shown) {
    el.textContent = t("results_partial")
      .replace("{shown}", String(shown))
      .replace("{total}", String(total));
  } else {
    el.textContent = `${shown} ${shown === 1 ? t("results_one") : t("results_found")}`;
  }
}

function loadMoreHtml(page) {
  if (!page.has_more) return "";
  return `<div class="load-more">
    <button type="button" class="btn btn-ghost" id="load-more">${icon("refresh")}${esc(t("load_more"))}</button>
  </div>`;
}

async function loadMoreItems(btn) {
  if (btn.dataset.busy) return;
  btn.dataset.busy = "1";
  const hadFocus = document.activeElement === btn;
  setBusy(btn, true, t("loading_items"));
  try {
    const page = await fetchItemsPage(state.items.length);
    if (!btn.isConnected) return;
    state.items = state.items.concat(page.items);
    const grid = $("#catalog-results .grid-items");
    const firstNewIndex = grid?.childElementCount;
    if (grid && page.items.length) {
      grid.insertAdjacentHTML("beforeend", page.items.map(itemCard).join(""));
      enhance(grid);
    }
    const wrapper = btn.closest(".load-more");
    if (page.has_more) {
      btn.dataset.busy = "";
      setBusy(btn, false);
    } else if (wrapper) {
      wrapper.remove();
    }
    setCatalogCount(state.items.length, page.total);
    if (hadFocus && document.activeElement === document.body) {
      const next = grid?.children[firstNewIndex]?.querySelector(".fav-btn");
      (next || (btn.isConnected ? btn : $("#catalog-title")))?.focus();
    }
  } catch (err) {
    btn.dataset.busy = "";
    setBusy(btn, false);
    if (hadFocus && document.activeElement === document.body) btn.focus();
    toast(errorMessage(err), "error");
  }
}

function hasFilters() {
  const f = state.filters;
  return Boolean(f.q || f.category || f.campus || f.condition || f.type);
}

function clearFilters() {
  state.filters.q = "";
  state.filters.category = "";
  state.filters.campus = "";
  state.filters.condition = "";
  state.filters.type = "";
  state.filters.sort = "recent";
  syncHeroSearch();
}

function syncHeroSearch() {
  const q = $("#q");
  const campus = $("#campus-sel");
  const sort = $("#f-sort");
  if (q) q.value = state.filters.q;
  if (campus) campus.value = state.filters.campus;
  if (sort) sort.value = state.filters.sort;
}

/* ---------------- Impacto y confianza ---------------- */
function fmtNum(value, digits = 1) {
  const n = Number(value) || 0;
  const factor = Math.pow(10, digits);
  const rounded = Math.round(n * factor) / factor;
  const text = String(rounded);
  return state.lang === "en" ? text : text.replace(".", ",");
}

function starsHtml(average, count, opts = {}) {
  const avg = Number(average) || 0;
  const filled = Math.round(avg);
  const stars = [1, 2, 3, 4, 5]
    .map(n => `<span class="star${n <= filled ? " is-on" : ""}" aria-hidden="true">${icon("star")}</span>`)
    .join("");
  const label = count
    ? t("rating_aria").replace("{n}", fmtNum(avg, 1)).replace("{c}", String(count))
    : t("rating_none");
  const text = count
    ? `<span class="stars-count">${fmtNum(avg, 1)} (${count})</span>`
    : `<span class="stars-count is-empty">${esc(t("rating_none_short"))}</span>`;
  return `<span class="stars" role="img" aria-label="${esc(label)}">${stars}${opts.withCount === false ? "" : text}</span>`;
}

function homeFigures(cells, extra = "") {
  return `<dl class="home-figures${extra ? ` ${extra}` : ""}">
    ${cells.map(([label, value]) => `<div><dt>${esc(t(label))}</dt><dd>${esc(String(value))}</dd></div>`).join("")}
  </dl>`;
}

function trustPanel(data) {
  const rating = data.rating || { count: 0, average: 0 };
  const ex = data.exchanges || { completed: 0, given: 0, received: 0 };
  const level = data.level || { key: "semilla", progress: 0, next: null, next_at: null, count: 0 };
  const badges = data.badges || [];
  const remaining = level.next_at ? level.next_at - level.count : 0;
  return `<section class="trust-panel" aria-labelledby="trust-panel-title">
    <div class="trust-head">
      <h2 id="trust-panel-title">${esc(t("trust_panel_title"))}</h2>
      <span class="identity-badge${data.verified ? " academic" : ""}">${icon(data.verified ? "check" : "user")}${esc(data.verified ? t("verified_badge") : t("personal_email"))}</span>
    </div>
    <div class="trust-top">
      <div class="trust-rating">
        ${starsHtml(rating.average, rating.count)}
        <span class="trust-meta">${esc(t("exchanges_completed"))}: <strong>${ex.completed}</strong> · ${esc(t("given_label"))}: ${ex.given} · ${esc(t("received_label"))}: ${ex.received}</span>
      </div>
      <div class="trust-level">
        <span class="level-pill">${icon("leaf")}${esc(t("level_label"))}: <strong>${esc(levelLabel(level.key))}</strong></span>
        <div class="level-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${level.progress}" aria-label="${esc(t("level_label"))}">
          <span data-level-bar></span>
        </div>
        <small>${level.next ? `${esc(t("level_next"))} ${esc(levelLabel(level.next))} · ${remaining} ${esc(t("exchanges_short"))}` : esc(t("level_max"))}</small>
      </div>
    </div>
    <h3 class="trust-sub">${esc(t("badges_title"))}</h3>
    <ul class="badge-row">
      ${badges.map(b => `<li class="badge-chip${b.earned ? " is-earned" : ""}">
        ${icon(b.earned ? "check-circle" : "shield")}${esc(t("badge_" + b.key))}
        <span class="sr-only"> — ${esc(b.earned ? t("badge_earned") : t("badge_locked"))}</span>
      </li>`).join("")}
    </ul>
  </section>`;
}

function ratingList(rating) {
  const list = (rating && rating.recent) || [];
  if (!list.length) return `<p class="muted small">${esc(t("ratings_none"))}</p>`;
  return `<ul class="rating-list">
    ${list.map(r => `<li class="rating-item">
      <p class="rating-row">${starsHtml(r.score, 0, { withCount: false })}<span class="rating-score">${r.score}/5</span><span class="rating-author">${esc(r.rater_name)}</span></p>
      ${r.comment ? `<p class="rating-comment">${esc(r.comment)}</p>` : ""}
    </li>`).join("")}
  </ul>`;
}

function openRate(requestId, itemTitle, onDone) {
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="rate-title">${esc(t("rate_title"))}</h2>
      <p>${esc(t("rate_lead"))}</p>
    </div>
    <form id="rate-form" aria-labelledby="rate-title">
      <p class="rate-item"><span>${esc(t("rate_item_label"))}:</span> ${esc(itemTitle)}</p>
      <fieldset class="rate-field">
        <legend>${esc(t("rate_score_legend"))}</legend>
        <div class="rate-options">
          ${[1, 2, 3, 4, 5].map(n => `<label class="rate-option">
            <input type="radio" name="score" value="${n}"${n === 5 ? " checked" : ""}>
            <span class="rate-option-inner">${icon("star")}<span>${n}</span></span>
          </label>`).join("")}
        </div>
      </fieldset>
      <div class="field">
        <label for="rate-comment">${esc(t("rate_comment"))}</label>
        <textarea id="rate-comment" name="comment" maxlength="300" placeholder="${esc(t("rate_comment_ph"))}"></textarea>
      </div>
      <p class="field-hint">${esc(t("rate_note"))}</p>
      <div class="modal-foot">
        <button class="btn btn-primary" type="submit" data-submit>${icon("star")}${esc(t("rate_submit"))}</button>
        <button class="btn btn-ghost" type="button" data-close>${esc(t("rate_later"))}</button>
      </div>
    </form>`, { labelledBy: "rate-title", sheet: true });

  $("#rate-form").onsubmit = async (e) => {
    e.preventDefault();
    const submit = $("[data-submit]", e.target);
    const fd = new FormData(e.target);
    setBusy(submit, true, t("saving"));
    try {
      state.stats = null;
      await api(`/api/requests/${requestId}/rate`, {
        method: "POST",
        body: JSON.stringify({
          score: Number(fd.get("score")),
          comment: String(fd.get("comment") || "")
        })
      });
      closeModal();
      toast(t("toast_rated"));
      if (onDone) onDone();
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

/* ---------------- Catálogo ---------------- */
function categoryChips() {
  const f = state.filters;
  const chip = (value, label) => {
    const active = (f.category || "") === value;
    return `<button type="button" class="chip${active ? " active" : ""}" data-cat="${esc(value)}" aria-pressed="${active}">${esc(label)}</button>`;
  };
  return [chip("", t("all"))]
    .concat(CATEGORIES.map(c => chip(c, catLabel(c))))
    .join("");
}

function operationChips() {
  return ["", ...TYPES].map(value => {
    const active = state.filters.type === value;
    return `<button type="button" class="chip${active ? " active" : ""}" data-operation="${esc(value)}" aria-pressed="${active}">${esc(value ? typeLabel(value) : t("all"))}</button>`;
  }).join("");
}

function openQuickGuide() {
  openModal(`${closeBtn()}<div class="modal-head"><span class="eyebrow">${icon("leaf")}Campus Circular</span><h2 id="quick-guide-title">${esc(t("how_title"))}</h2></div>
    <div class="steps guide-steps">${[1, 2, 3].map(n => `<div class="step"><span class="step-num" aria-hidden="true">${n}</span><div><strong>${esc(t("how_" + n + "_t"))}</strong><p>${esc(t("how_" + n + "_b"))}</p></div></div>`).join("")}</div>
    <div class="modal-foot"><button type="button" class="btn btn-primary" data-close>${esc(t("browse_catalog"))}</button></div>`, { labelledBy: "quick-guide-title", sheet: true });
}

function activeFilterChips() {
  const f = state.filters;
  const labels = [
    ["q", f.q && `«${f.q}»`],
    ["category", f.category && catLabel(f.category)],
    ["campus", f.campus && campusLabel(f.campus)],
    ["condition", f.condition && condLabel(f.condition)],
    ["type", f.type && typeLabel(f.type)]
  ].filter(([, label]) => label);
  if (!labels.length) return "";
  return `${labels.map(([key, label]) => `<span class="active-filter"><span>${esc(label)}</span><button type="button" data-remove-filter="${key}" aria-label="${esc(t("filter_remove").replace("{value}", label))}">${icon("close")}</button></span>`).join("")}
    <button type="button" class="clear-link" id="clear-all-filters">${esc(t("filters_clear"))}</button>`;
}

function syncFilterUI() {
  $$("#cat-filters .chip").forEach(b => {
    const active = (b.dataset.cat || "") === (state.filters.category || "");
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  $$("#operation-filters .chip").forEach(b => {
    const active = b.dataset.operation === state.filters.type;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  const count = ["campus", "condition", "type"].filter(k => state.filters[k]).length;
  const dot = $("#filter-dot");
  if (dot) {
    dot.textContent = count ? String(count) : "";
    dot.classList.toggle("hidden", !count);
  }
  const box = $("#active-filters");
  if (box) {
    box.innerHTML = activeFilterChips();
    const removeButtons = $$("[data-remove-filter]", box);
    removeButtons.forEach((btn, index) => {
      btn.onclick = () => {
        state.filters[btn.dataset.removeFilter] = "";
        syncHeroSearch();
        refreshCatalog();
        const remaining = $$("[data-remove-filter]", box);
        (remaining[index] || remaining[index - 1] || $("#open-filters"))?.focus({ preventScroll: true });
      };
    });
    const clear = $("#clear-all-filters", box);
    if (clear) clear.onclick = () => {
      clearFilters();
      refreshCatalog();
      $("#open-filters")?.focus({ preventScroll: true });
    };
  }
}

let catalogRequest = 0;

async function refreshCatalog(opts = {}) {
  const box = $("#catalog-results");
  if (!box) return;
  const request = ++catalogRequest;
  syncFilterUI();
  const countEl = $("#results-count");
  const quiet = Boolean(opts.quiet) && Boolean($(".grid-items", box));
  if (countEl) countEl.textContent = quiet ? t("searching") : t("loading_items");
  box.setAttribute("aria-busy", "true");
  if (quiet) {
    box.classList.add("is-loading");
  } else {
    box.classList.remove("is-loading");
    box.innerHTML = `<div class="grid grid-items">${skeletonCards(6)}</div>`;
  }
  let page;
  try {
    page = await fetchItemsPage(0);
  } catch (err) {
    if (request !== catalogRequest || !$("#catalog-results")) return;
    box.innerHTML = emptyState({
      iconName: "alert",
      alert: true,
      title: t("toast_error"),
      text: errorMessage(err),
      actions: [{ id: "retry", label: t("retry"), icon: "refresh", variant: "btn-ghost" }]
    });
    bindEmptyActions(box, { retry: () => refreshCatalog() });
    box.removeAttribute("aria-busy");
    box.classList.remove("is-loading");
    if (countEl) countEl.textContent = "";
    return;
  }
  if (request !== catalogRequest || !$("#catalog-results")) return;
  const items = page.items || [];
  state.items = items;
  state.totalResults = Number(page.total) || 0;
  if (!items.length) {
    const onlyCategory = !state.filters.q && !state.filters.campus && !state.filters.condition && !state.filters.type && state.filters.category;
    box.innerHTML = hasFilters()
      ? emptyState({
          iconName: "search",
          title: t("empty_filter_t"),
          text: t("empty_filter_b"),
          actions: [
            { id: "clear", label: t("filters_clear"), icon: "close", variant: "btn-ghost" },
            { id: "publish", label: onlyCategory ? t("publish_first") : t("publish_cta"), icon: "plus" }
          ]
        })
      : emptyState({
          iconName: "leaf",
          title: t("empty_catalog_t"),
          text: t("empty_catalog_b"),
          actions: [{ id: "publish", label: t("publish_first"), icon: "plus" }]
        });
    bindEmptyActions(box, {
      clear: () => { clearFilters(); refreshCatalog(); },
      publish: () => navigate("publish")
    });
  } else {
    box.innerHTML = `<div class="grid grid-items">${items.map(itemCard).join("")}</div>${loadMoreHtml(page)}`;
    enhance(box);
    const more = $("#load-more", box);
    if (more) more.onclick = () => loadMoreItems(more);
  }
  box.removeAttribute("aria-busy");
  box.classList.remove("is-loading");
  if (countEl) setCatalogCount(items.length, page.total);
}

function favoriteLabel(saved, title) {
  const action = t(saved ? "detail_faved" : "detail_fav");
  return title ? `${action}: ${title}` : action;
}

/* Nota media de las valoraciones públicas: solo aparece si alguien ya opinó. */
function cardRating(it) {
  const c = it.comments || {};
  if (!c.count) return "";
  const label = c.count === 1 ? t("comments_count_one") : t("comments_count").replace("{n}", String(c.count));
  const stars = c.average
    ? `<span class="mini-stars" aria-hidden="true">${[1, 2, 3, 4, 5].map(n => `<span class="star${n <= Math.round(c.average) ? " is-on" : ""}">★</span>`).join("")}</span><span class="mini-avg">${fmtNum(c.average, 1)}</span>`
    : `<span class="mini-label">${esc(t("comments_title"))}</span>`;
  return `<p class="card-rating">${stars}<span class="mini-count">${esc(label)}</span></p>`;
}

function itemCard(it) {
  const isSale = it.exchange_type === "vender";
  const price = isSale ? `€${Number(it.price || 0).toFixed(0)}` : esc(t("free"));
  const saved = Boolean(it.is_favorite);
  const openLabel = `${t("view_item")}: ${it.title}`;
  return `
  <article class="card">
    <div class="card-media${it.image_url ? "" : " is-photo-missing"}">
      ${itemPhoto(it, { alt: it.title, sizes: "(max-width: 519px) calc(100vw - 2.5rem), (max-width: 803px) 46vw, (max-width: 1067px) 31vw, 280px" })}
      <button type="button" class="fav-btn${saved ? " active" : ""}" data-fav="${it.id}" data-item-title="${esc(it.title)}" aria-pressed="${saved}" aria-label="${esc(favoriteLabel(saved, it.title))}">${icon("heart")}</button>
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span class="card-category">${esc(catLabel(it.category))}</span>
        <span class="status-pill status-${esc(it.status)}">${esc(statusLabel(it.status))}</span>
      </div>
      <h3 class="card-title"><button type="button" class="card-open" data-view="${it.id}" aria-label="${esc(openLabel)}"><span>${esc(it.title)}</span>${icon("arrow")}</button></h3>
      <p class="card-location">${icon("pin")}<span>${esc(campusLabel(it.campus))}</span></p>
      <p class="card-location">${icon("tag")}<span>${esc(handLabel(it.handover_point))} · ${esc(condLabel(it.condition))}</span></p>
      ${cardRating(it)}
      <div class="card-foot">
        <div>
          <span class="price${isSale ? "" : " is-free"}">${price}</span>
          ${isSale ? `<span class="price-sub">${esc(t("price_orientative"))}</span>` : ""}
        </div>
        <span class="card-operation">${esc(typeBadge(it.exchange_type))}</span>
      </div>
    </div>
  </article>`;
}

function homeStats(stats) {
  return homeFigures([
    ["stat_items", fmtNum(stats.total_items, 0)],
    ["stat_users", fmtNum(stats.users, 0)]
  ], "stats-row");
}

function option(value, label, selected) {
  return `<option value="${esc(value)}"${selected ? " selected" : ""}>${esc(label)}</option>`;
}

function catalogSortOptions(selected) {
  return ["recent", "price_asc", "price_desc"].map(value => option(value, t(`sort_${value}`), selected === value)).join("");
}

function openFilters() {
  const f = state.filters;
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="filters-title">${esc(t("filters_title"))}</h2>
      <p>${esc(t("filters_subtitle"))}</p>
    </div>
    <form id="filters-form" aria-labelledby="filters-title">
      <div class="field">
        <label for="fl-campus">${esc(t("campus"))}</label>
        <select id="fl-campus" name="campus">
          ${option("", `${t("campus")}: ${t("all")}`, !f.campus)}
          ${CAMPUSES.map(c => option(c, campusLabel(c), f.campus === c)).join("")}
        </select>
      </div>
      <div class="field">
        <label for="fl-condition">${esc(t("condition"))}</label>
        <select id="fl-condition" name="condition">
          ${option("", `${t("condition")}: ${t("all")}`, !f.condition)}
          ${CONDITIONS.map(c => option(c, condLabel(c), f.condition === c)).join("")}
        </select>
      </div>
      <div class="field">
        <label for="fl-type">${esc(t("type"))}</label>
        <select id="fl-type" name="type">
          ${option("", `${t("type")}: ${t("all")}`, !f.type)}
          ${TYPES.map(c => option(c, typeLabel(c), f.type === c)).join("")}
        </select>
      </div>
      <div class="field">
        <label for="fl-sort">${esc(t("sort_by"))}</label>
        <select id="fl-sort" name="sort">
          ${catalogSortOptions(f.sort)}
        </select>
      </div>
      <div class="modal-foot">
        <button class="btn btn-primary" type="submit" id="filters-apply">${esc(t("filters_apply"))}</button>
        <button class="btn btn-ghost" type="button" id="filters-reset">${esc(t("filters_clear"))}</button>
      </div>
    </form>`, { labelledBy: "filters-title", sheet: true });

  // Móvil: cada cambio se aplica al momento (con un debounce mínimo) y el
  // botón pasa a mostrar cuántos objetos hay. Así se filtra sin idas y venidas.
  const form = $("#filters-form");
  const applyBtn = $("#filters-apply");
  const readForm = () => {
    const fd = new FormData(form);
    state.filters.campus = fd.get("campus") || "";
    state.filters.condition = fd.get("condition") || "";
    state.filters.type = fd.get("type") || "";
    state.filters.sort = fd.get("sort") || "recent";
    syncHeroSearch();
  };
  let pending = null;
  const applyLive = () => {
    clearTimeout(pending);
    pending = setTimeout(async () => {
      readForm();
      await refreshCatalog({ quiet: true });
      if (applyBtn && Number.isInteger(state.totalResults)) {
        applyBtn.textContent = t("filters_view").replace("{n}", String(state.totalResults));
      }
    }, 140);
  };
  form.addEventListener("change", applyLive);
  form.onsubmit = (e) => {
    e.preventDefault();
    clearTimeout(pending);
    readForm();
    closeModal();
    refreshCatalog({ quiet: true });
  };
  $("#filters-reset").onclick = () => {
    clearTimeout(pending);
    clearFilters();
    closeModal();
    refreshCatalog({ quiet: true });
  };
}

/* ---------------- Home ---------------- */
async function renderHome(app) {
  const f = state.filters;
  setApp(app, `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">${icon("leaf")}${esc(t("hero_eyebrow"))}</span>
          <h1 id="hero-title">${esc(t("hero_title"))}</h1>
          <p class="lead">${esc(t("hero_lead"))}</p>
          <form class="searchbar" id="hero-search" role="search" aria-labelledby="hero-search-label">
            <label class="search-label" id="hero-search-label" for="q">${esc(t("hero_search_label"))}</label>
            <div class="search-input">
              ${icon("search")}
              <input id="q" type="search" placeholder="${esc(t("hero_search_ph"))}" value="${esc(f.q)}" autocomplete="off">
            </div>
            <label class="sr-only" for="campus-sel">${esc(t("campus"))}</label>
            <select id="campus-sel">
              ${option("", `${t("campus")}: ${t("all")}`, !f.campus)}
              ${CAMPUSES.map(c => option(c, campusLabel(c), f.campus === c)).join("")}
            </select>
            <button class="btn btn-primary" type="submit">${esc(t("hero_search_btn"))}${icon("arrow")}</button>
          </form>
          <div class="hero-ctas">
            <a class="btn btn-link" href="#catalog-title">${esc(t("browse_catalog"))}</a>
            <a class="btn btn-link" id="hero-publish" href="/publicar" data-route="publish">${icon("plus")}${esc(t("publish_cta"))}</a>
          </div>
        </div>
        <div class="hero-visual">
          ${responsiveImage("/static/img/hero-reuse.jpg", { cls: "hero-art", alt: t("hero_image_alt"), priority: true, lazy: false, fallback: "/static/img/items/placeholder.jpg", sizes: "(max-width: 720px) calc(100vw - 2rem), (max-width: 1180px) 44vw, 530px" })}
        </div>
      </div>
      <ul class="hero-badges">
        <li>${icon("shield")}${esc(t("hero_chip_1"))}</li>
        <li>${icon("user")}${esc(t("hero_chip_2"))}</li>
        <li>${icon("leaf")}${esc(t("hero_chip_3"))}</li>
      </ul>
    </section>

    <section class="catalog" aria-labelledby="catalog-title">
      <div class="section-title">
        <h2 id="catalog-title" tabindex="-1">${esc(t("catalog_title"))}</h2>
      </div>
      <div class="catalog-toolbar">
        <div class="chips-scroll" id="cat-filters" role="group" aria-label="${esc(t("f_category"))}">${categoryChips()}</div>
        <div class="chips-scroll operation-scroll" id="operation-filters" role="group" aria-label="${esc(t("f_type"))}">${operationChips()}</div>
        <div class="toolbar-actions">
          <button type="button" class="filter-btn" id="open-filters" aria-haspopup="dialog">
            ${icon("sliders")}${esc(t("filters_btn"))}<span class="filter-dot hidden" id="filter-dot"></span>
          </button>
        </div>
      </div>
      <div class="active-filters" id="active-filters"></div>
      <div class="catalog-meta">
        <p class="results-count" id="results-count" role="status" aria-live="polite">${esc(t("loading_items"))}</p>
        <div class="catalog-sort">
          <label for="f-sort">${esc(t("sort_by"))}</label>
          <select id="f-sort">${catalogSortOptions(f.sort)}</select>
        </div>
      </div>
      <div id="catalog-results"><div class="grid grid-items">${skeletonCards(6)}</div></div>
    </section>

    <div class="home-guide">
      <section class="home-guide-steps" aria-labelledby="home-how-title">
        <h2 id="home-how-title">${esc(t("how_title"))}</h2>
        <ol class="home-steps" role="list">
          ${[1, 2, 3].map(n => `<li class="home-step">
            <h3>${esc(t("how_" + n + "_t"))}</h3><p>${esc(t("how_" + n + "_b"))}</p>
          </li>`).join("")}
        </ol>
      </section>
      <section class="home-guide-trust" aria-labelledby="home-trust-title">
        <h2 id="home-trust-title">${esc(t("trust_title"))}</h2>
        <ul class="clean-list">
          <li>${icon("check")}${esc(t("trust_1"))}</li>
          <li>${icon("check")}${esc(t("trust_2"))}</li>
          <li>${icon("check")}${esc(t("trust_3"))}</li>
        </ul>
        <p class="legal-inline">${legalText(t("about_p3"))}</p>
        <div class="notice payment-banner" role="note">
          <span class="notice-icon" aria-hidden="true">€</span>
          <div><strong>${esc(t("payment_banner_title"))}</strong><p>${esc(t("payment_banner_body"))}</p></div>
        </div>
      </section>
    </div>

    <section class="catalog-summary" aria-labelledby="stats-title">
      <h2 id="stats-title">${esc(t("stats_title"))}</h2>
      <div id="home-stats" aria-busy="${!state.stats}">${state.stats ? homeStats(state.stats) : statSkeleton()}</div>
    </section>`);

  const readHero = () => {
    const q = $("#q");
    const campus = $("#campus-sel");
    state.filters.q = q ? q.value.trim() : "";
    state.filters.campus = campus ? campus.value : "";
  };

  let searchTimer = null;
  const qInput = $("#q");
  if (qInput) {
    qInput.addEventListener("input", () => {
      state.filters.q = qInput.value.trim();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => refreshCatalog({ quiet: true }), 320);
    });
  }

  $("#hero-search").onsubmit = (e) => {
    e.preventDefault();
    clearTimeout(searchTimer);
    readHero();
    refreshCatalog();
    const resultsHeading = $("#catalog-title");
    resultsHeading.focus({ preventScroll: true });
    resultsHeading.scrollIntoView({ block: "start" });
  };
  $("#campus-sel").onchange = () => { readHero(); refreshCatalog(); };
  $$("#cat-filters .chip").forEach(b => {
    b.onclick = () => {
      state.filters.category = b.dataset.cat || "";
      refreshCatalog();
    };
  });
  $$("#operation-filters .chip").forEach(b => {
    b.onclick = () => { state.filters.type = b.dataset.operation; refreshCatalog({ quiet: true }); };
  });
  $("#f-sort").onchange = (e) => {
    state.filters.sort = e.currentTarget.value;
    refreshCatalog({ quiet: true });
  };
  $("#open-filters").onclick = openFilters;

  syncFilterUI();
  refreshCatalog();
  if (!state.stats) {
    const summary = $("#home-stats", app);
    fetchStats().then(stats => {
      if (!summary.isConnected) return;
      summary.innerHTML = stats ? homeStats(stats) : `<p class="figure-note">${esc(t("stats_unavailable"))}</p>`;
      summary.setAttribute("aria-busy", "false");
    });
  }
}

/* ---------------- Publicar ---------------- */
function renderPublish(app) {
  if (!state.user) {
    setApp(app, `
      <div class="page-head">
        <span class="eyebrow">${icon("plus")}${esc(t("nav_publish"))}</span>
        <h1>${esc(t("publish_title"))}</h1>
      </div>
      ${emptyState({
        iconName: "camera",
        title: t("need_login_publish"), heading: "h2",
        text: t("publish_intro"),
        actions: [{ id: "login", label: t("login"), icon: "user" }]
      })}`);
    bindEmptyActions(app, { login: () => openAuth("login") });
    return;
  }

  const chipGroup = (name, legend, values, selected, labelFn, extra = "") => `
    <div class="field choice-field">
      <span class="field-label" id="${name}-label">${esc(legend)}</span>
      <div class="chips-scroll choice-row" role="radiogroup" aria-labelledby="${name}-label" data-choice="${name}">
        ${values.map(v => {
          const on = v === selected;
          return `<button type="button" class="chip choice-chip${on ? " active" : ""}" role="radio" aria-checked="${on}" data-value="${esc(v)}">${esc(labelFn(v))}</button>`;
        }).join("")}
      </div>
      ${extra}
    </div>`;

  setApp(app, `
    <div class="page-head">
      <span class="eyebrow">${icon("plus")}${esc(t("nav_publish"))}</span>
      <h1>${esc(t("publish_title"))}</h1>
      <p class="lead">${esc(t("publish_intro"))}</p>
    </div>
    <div class="publish-layout">
    <form class="form-shell publish-composer" id="publish-form">
      <div class="composer-progress" id="composer-progress">
        <div class="progress-copy"><strong id="progress-count">0/3</strong><span>${esc(t("publish_progress"))}</span></div>
        <div class="progress-track" aria-hidden="true"><span id="progress-fill"></span></div>
        <ul class="progress-steps">
          <li data-step="photo"><button type="button" class="step-jump">${esc(t("publish_check_photo"))}</button></li>
          <li data-step="title"><button type="button" class="step-jump">${esc(t("publish_check_title"))}</button></li>
          <li data-step="consent"><button type="button" class="step-jump">${esc(t("publish_check_consent"))}</button></li>
        </ul>
      </div>

      <section class="form-section composer-step" id="step-media">
        <div class="step-head">
          <span class="step-badge" aria-hidden="true">1</span>
          <div class="step-title">
            <h2>${esc(t("publish_step_media"))}</h2>
            <p>${esc(t("publish_step_media_hint"))}</p>
          </div>
        </div>
        <div class="field">
          <span class="field-label" id="photo-label">${esc(t("f_image"))} <span class="req-mark" aria-hidden="true">*</span><span class="sr-only">${esc(t("required_word"))}</span></span>
          <div class="upload-zone upload-zone-rich" id="upload-zone" tabindex="-1" role="group" aria-labelledby="photo-label photo-action" aria-describedby="photo-help">
            <strong id="photo-action">${esc(t("photo_drop_t"))}</strong>
            <span id="photo-format">${esc(t("photo_drop_b"))}</span>
            <div class="upload-actions">
              <button type="button" class="btn btn-primary" id="photo-take">${icon("camera")}${esc(t("photo_take"))}</button>
              <button type="button" class="btn btn-ghost" id="photo-pick">${icon("image")}${esc(t("photo_pick"))}</button>
            </div>
            <input type="file" id="img-file" accept="image/jpeg,image/png,image/webp">
            <input type="file" id="img-file-camera" accept="image/jpeg,image/png,image/webp" capture="environment">
          </div>
          <input type="hidden" id="img-url" value="">
          <div class="upload-preview-wrap" id="preview-wrap">
            <img id="img-preview" class="upload-preview" alt="${esc(t("photo_preview"))}">
            <div class="upload-preview-tools">
              <button type="button" class="upload-change" id="img-change">${icon("refresh")}${esc(t("photo_change"))}</button>
              <button type="button" class="upload-remove" id="img-remove">${icon("trash")}${esc(t("photo_remove"))}</button>
            </div>
          </div>
          <div class="upload-status hidden" id="upload-status" role="status" aria-live="polite"></div>
          <small id="photo-help">${esc(t("image_required_hint"))}</small>
        </div>
      </section>

      <section class="form-section composer-step" id="step-basics">
        <div class="step-head">
          <span class="step-badge" aria-hidden="true">2</span>
          <div class="step-title">
            <h2>${esc(t("publish_step_basics"))}</h2>
            <p>${esc(t("publish_step_basics_hint"))}</p>
          </div>
        </div>
        <div class="field">
          <label for="p-title">${esc(t("f_title"))} <span class="req-mark" aria-hidden="true">*</span></label>
          <input id="p-title" name="title" required minlength="3" maxlength="80" placeholder="${esc(t("title_ph"))}" autocomplete="off">
          <div class="field-hint"><span>${esc(t("publish_title_hint"))}</span><span class="counter" id="title-counter">0/80</span></div>
        </div>
        ${chipGroup("p-category", t("f_category"), CATEGORIES, CATEGORIES[0], catLabel, `
          <select id="p-category" name="category" class="choice-native" tabindex="-1" aria-hidden="true">${CATEGORIES.map(c => option(c, catLabel(c))).join("")}</select>`)}
        <div class="field choice-field">
          <span class="field-label" id="p-type-label">${esc(t("f_type"))}</span>
          <div class="segment choice-row" role="radiogroup" aria-labelledby="p-type-label" data-choice="p-type">
            ${TYPES.map(v => `<button type="button" class="seg-opt${v === "regalar" ? " active" : ""}" role="radio" aria-checked="${v === "regalar"}" data-value="${esc(v)}">${esc(typeLabel(v))}</button>`).join("")}
          </div>
          <select id="p-type" name="exchange_type" class="choice-native" tabindex="-1" aria-hidden="true">${TYPES.map(c => option(c, typeLabel(c))).join("")}</select>
          <small>${esc(t("publish_type_hint"))}</small>
        </div>
        <div class="field hidden" id="price-field">
          <label for="p-price">${esc(t("f_price"))}</label>
          <div class="price-input">
            <input id="p-price" name="price" type="number" min="0" max="10000" step="1" value="0" inputmode="decimal">
            <span class="price-adorn" aria-hidden="true">€</span>
          </div>
          <small>${esc(t("f_price_hint"))}</small>
        </div>
        <div class="notice hidden" id="payment-notice" role="note">
          <span class="notice-icon" aria-hidden="true">€</span>
          <div><strong>${esc(t("payment_notice_title"))}</strong><p>${esc(t("payment_notice_body"))}</p></div>
        </div>
      </section>

      <details class="form-optional" id="optional-details">
        <summary>
          ${icon("sliders")}
          <span class="summary-text"><strong>${esc(t("form_optional"))}</strong><small>${esc(t("form_optional_hint"))}</small></span>
          ${icon("chevron")}
        </summary>
        <div class="form-section form-section-flush">
          <div class="field">
            <label for="p-desc">${esc(t("f_desc_optional"))}</label>
            <textarea id="p-desc" name="description" maxlength="2000" enterkeyhint="enter" placeholder="${esc(t("desc_hint"))}"></textarea>
            <div class="field-hint"><span>${esc(t("desc_hint"))}</span><span class="counter" id="desc-counter">0/2000</span></div>
          </div>
          ${chipGroup("p-condition", t("f_condition"), CONDITIONS, "bueno", condLabel, `
            <select id="p-condition" name="condition" class="choice-native" tabindex="-1" aria-hidden="true">${CONDITIONS.map(c => option(c, condLabel(c), c === "bueno")).join("")}</select>`)}
          <div class="form-grid">
            <div class="field">
              <label for="p-campus">${esc(t("f_campus"))}</label>
              <select id="p-campus" name="campus">${CAMPUSES.map(c => option(c, campusLabel(c), state.user.campus === c)).join("")}</select>
            </div>
            <div class="field">
              <label for="p-handover">${esc(t("f_handover"))}</label>
              <select id="p-handover" name="handover_point">${HANDOVERS.map(c => option(c, handLabel(c), c === "acordado")).join("")}</select>
            </div>
          </div>
        </div>
      </details>

      <div class="form-section composer-step" id="step-confirm">
        <div class="step-head">
          <span class="step-badge" aria-hidden="true">3</span>
          <div class="step-title">
            <h2>${esc(t("publish_step_final"))}</h2>
            <p>${esc(t("publish_step_final_hint"))}</p>
          </div>
        </div>
        <div class="consent-box">
          <label class="check-row"><input type="checkbox" name="private_seller" id="p-private" required><span>${esc(t("f_private"))}</span></label>
          <p>${esc(t("f_private_hint"))}</p>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary btn-lg" type="submit" id="publish-submit">${icon("plus")}${esc(t("publish_btn"))}</button>
          <button class="btn btn-ghost btn-lg" type="button" id="pub-cancel">${esc(t("cancel"))}</button>
        </div>
      </div>

      <div class="composer-bar" id="composer-bar">
        <div class="composer-bar-info">
          <strong>${esc(t("publish_bar_title"))}</strong>
          <small id="composer-bar-hint">${esc(t("publish_bar_hint"))}</small>
        </div>
        <button class="btn btn-primary" type="submit" id="publish-submit-bar">${icon("plus")}${esc(t("publish_btn"))}</button>
      </div>
    </form>

    <aside class="publish-aside" aria-label="${esc(t("publish_preview_t"))}">
      <p class="aside-label">${esc(t("publish_preview_t"))}</p>
      <article class="card preview-card" id="publish-preview">
        <div class="card-media preview-media" id="preview-media">
          <span class="preview-placeholder" id="preview-placeholder">${icon("image")}<small>${esc(t("publish_preview_empty"))}</small></span>
          <img id="preview-img" class="hidden" alt="">
        </div>
        <div class="card-body">
          <h3 class="card-title" id="preview-title">${esc(t("publish_title"))}</h3>
          <p class="card-meta" id="preview-meta"></p>
          <div class="pill-row"><span class="pill" id="preview-cat"></span><span class="pill grey" id="preview-cond"></span></div>
          <p class="price" id="preview-price"></p>
        </div>
      </article>
      <p class="aside-tip">${icon("info")}<span>${esc(t("publish_tip"))}</span></p>
    </aside>
    </div>`);

  const counter = $("#desc-counter");
  const desc = $("#p-desc");
  const updateCounter = () => {
    const n = desc.value.length;
    counter.textContent = `${n}/2000`;
    counter.classList.toggle("is-near", n > 1700);
  };
  desc.addEventListener("input", () => { updateCounter(); syncComposer(); });
  updateCounter();

  const title = $("#p-title");
  const titleCounter = $("#title-counter");
  const updateTitleCounter = () => {
    const n = title.value.length;
    titleCounter.textContent = `${n}/80`;
    titleCounter.classList.toggle("is-near", n > 70);
  };

  // Los chips sustituyen a los <select> nativos en móvil: misma información,
  // objetivos táctiles grandes y selección visible. El select sigue en el DOM
  // (y en el FormData) sincronizado con el chip activo.
  const bindChoiceGroup = (name, onChange) => {
    const row = $(`[data-choice="${name}"]`);
    const select = $(`#${name}`);
    if (!row || !select) return;
    const paint = ({ scroll = false } = {}) => {
      $$(".choice-chip, .seg-opt", row).forEach(btn => {
        const on = btn.dataset.value === select.value;
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-checked", on ? "true" : "false");
      });
      // Solo al elegir: si no, la primera pintura desplazaría la página.
      const active = $(".active", row);
      if (scroll && active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    row.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-value]");
      if (!btn) return;
      select.value = btn.dataset.value;
      paint({ scroll: true });
      select.dispatchEvent(new Event("change", { bubbles: true }));
      if (onChange) onChange(select.value);
    });
    row.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      const opts = $$("[data-value]", row);
      const idx = opts.findIndex(o => o.dataset.value === select.value);
      const next = opts[(idx + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length];
      if (!next) return;
      e.preventDefault();
      next.click();
      next.focus();
    });
    paint();
  };

  bindChoiceGroup("p-category");
  bindChoiceGroup("p-condition");
  bindChoiceGroup("p-type");

  const syncType = () => {
    const sale = $("#p-type").value === "vender";
    $("#price-field").classList.toggle("hidden", !sale);
    $("#payment-notice").classList.toggle("hidden", !sale);
  };
  $("#p-type").onchange = syncType;
  syncType();

  /* Progreso del asistente + vista previa en vivo */
  const previewImg = $("#preview-img");
  const previewPlaceholder = $("#preview-placeholder");
  const barHint = $("#composer-bar-hint");

  const syncComposer = () => {
    const photo = !!$("#img-url").value;
    const titleOk = title.value.trim().length >= 3;
    const consent = $("#p-private").checked;
    const done = [photo, titleOk, consent].filter(Boolean).length;
    $("#progress-count").textContent = `${done}/3`;
    $("#progress-fill").style.width = `${Math.round((done / 3) * 100)}%`;
    $$("#composer-progress .progress-steps li").forEach(li => {
      li.classList.toggle("is-done", ({ photo, title: titleOk, consent })[li.dataset.step]);
    });
    $("#composer-bar").classList.toggle("is-ready", done === 3);
    if (barHint) {
      barHint.textContent = done === 3
        ? t("publish_bar_ready")
        : t(done === 0 ? "publish_bar_hint" : "publish_bar_pending");
    }
    updateTitleCounter();

    const catSel = $("#p-category").value;
    $("#preview-cat").textContent = catLabel(catSel);
    $("#preview-cond").textContent = condLabel($("#p-condition").value);
    $("#preview-title").textContent = title.value.trim() || t("publish_preview_untitled");
    const sale = $("#p-type").value === "vender";
    const price = Number($("#p-price").value || 0);
    $("#preview-price").textContent = sale && price > 0 ? `${price} €` : typeLabel($("#p-type").value);
    $("#preview-price").classList.toggle("is-free", !(sale && price > 0));
    $("#preview-meta").innerHTML = [campusLabel($("#p-campus").value), handLabel($("#p-handover").value)]
      .filter(Boolean).map(v => `<span>${esc(v)}</span>`).join("");
    const url = $("#img-url").value;
    if (url) {
      previewImg.src = url;
      previewImg.classList.remove("hidden");
      previewPlaceholder.classList.add("hidden");
      $("#preview-media").classList.add("has-photo");
    } else {
      previewImg.classList.add("hidden");
      previewImg.removeAttribute("src");
      previewPlaceholder.classList.remove("hidden");
      $("#preview-media").classList.remove("has-photo");
    }
    const zoneEl = $("#upload-zone");
    zoneEl.classList.toggle("has-photo", photo);
    $("#photo-action").textContent = photo ? t("photo_added") : t("photo_drop_t");
  };

  title.addEventListener("input", syncComposer);
  $("#p-price").addEventListener("input", syncComposer);
  $("#publish-form").addEventListener("change", syncComposer);
  syncComposer();

  const zone = $("#upload-zone");
  const fileInput = $("#img-file");
  const cameraInput = $("#img-file-camera");
  const previewWrap = $("#preview-wrap");
  const preview = $("#img-preview");
  const status = $("#upload-status");

  const uploadFile = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast(t("toast_invalid_image"), "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast(t("photo_drop_b"), "error");
      return;
    }
    status.classList.remove("hidden");
    status.innerHTML = `<span class="spinner" aria-hidden="true"></span>${esc(t("photo_uploading"))}`;
    preview.src = URL.createObjectURL(file);
    previewWrap.classList.add("is-visible");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: state.token ? { Authorization: "Bearer " + state.token } : {},
        body: fd
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.message || data.error || "error");
        err.data = data;
        throw err;
      }
      $("#img-url").value = data.url;
      preview.src = data.url;
      status.innerHTML = `${icon("check-circle")}${esc(t("photo_ready"))}`;
      toast(t("toast_upload"));
      syncComposer();
    } catch (err) {
      status.classList.add("hidden");
      previewWrap.classList.remove("is-visible");
      $("#img-url").value = "";
      toast(errorMessage(err), "error");
      syncComposer();
    }
  };

  fileInput.onchange = () => { uploadFile(fileInput.files[0]); fileInput.value = ""; };
  cameraInput.onchange = () => { uploadFile(cameraInput.files[0]); cameraInput.value = ""; };
  $("#photo-take").onclick = () => cameraInput.click();
  $("#photo-pick").onclick = () => fileInput.click();
  $("#img-change").onclick = () => fileInput.click();
  zone.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    fileInput.click();
  });
  ["dragenter", "dragover"].forEach(evt => zone.addEventListener(evt, (e) => {
    e.preventDefault();
    zone.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach(evt => zone.addEventListener(evt, (e) => {
    e.preventDefault();
    zone.classList.remove("is-dragging");
  }));
  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) uploadFile(file);
  });
  $("#img-remove").onclick = () => {
    $("#img-url").value = "";
    fileInput.value = "";
    cameraInput.value = "";
    previewWrap.classList.remove("is-visible");
    preview.removeAttribute("src");
    zone.focus({ preventScroll: true });
    status.classList.add("hidden");
    syncComposer();
  };
  $("#pub-cancel").onclick = () => navigate("home");
  $$("#composer-progress .progress-steps li").forEach(li => {
    li.addEventListener("click", () => {
      const target = { photo: "#upload-zone", title: "#p-title", consent: "#p-private" }[li.dataset.step];
      const el = $(target);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el.focus) setTimeout(() => el.focus({ preventScroll: true }), 300);
    });
  });

  $("#publish-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.private_seller = fd.get("private_seller") === "on";
    payload.image_url = $("#img-url").value || "";
    payload.price = payload.exchange_type === "vender" ? Number(payload.price || 0) : 0;
    const submit = $("#publish-submit");
    const submitBar = $("#publish-submit-bar");
    if (!payload.image_url) {
      toast(t("toast_image_required"), "error");
      const zone = $("#upload-zone");
      if (zone) {
        zone.classList.add("is-missing");
        zone.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => zone.classList.remove("is-missing"), 1400);
      }
      return;
    }
    setBusy(submit, true, t("publishing"));
    setBusy(submitBar, true, t("publishing"));
    try {
      await api("/api/items", { method: "POST", body: JSON.stringify(payload) });
      toast(t("toast_published"));
      navigate("home");
    } catch (err) {
      setBusy(submit, false);
      setBusy(submitBar, false);
      toast(errorMessage(err), "error");
    }
  };
}

/* ---------------- Puntos de entrega ---------------- */
function renderPoints(app) {
  setApp(app, `
    <div class="page-head">
      <span class="eyebrow">${icon("pin")}${esc(t("nav_points"))}</span>
      <h1>${esc(t("points_title"))}</h1>
      <p class="lead">${esc(t("points_lead"))}</p>
    </div>
    <div class="notice is-soft" role="note">
      <span class="notice-icon" aria-hidden="true">${icon("info")}</span>
      <div><p>${esc(t("points_notice"))}</p></div>
    </div>
    <div class="grid mt-4">
      ${HANDOVERS.map(p => `
        <article class="point-card">
          <span class="point-icon" aria-hidden="true">${icon(POINT_ICONS[p] || "pin")}</span>
          <h2>${esc(t("points_" + p + "_t"))}</h2>
          <p>${esc(t("points_" + p + "_b"))}</p>
          <p class="card-meta mt-auto">${CAMPUSES.map(c => `<span class="pill grey">${esc(campusLabel(c))}</span>`).join("")}</p>
        </article>`).join("")}
    </div>`);
}

/* ---------------- Normas y confianza ---------------- */
function renderRules(app) {
  setApp(app, `
    <div class="page-head">
      <span class="eyebrow">${icon("shield")}${esc(t("nav_rules"))}</span>
      <h1>${esc(t("rules_title"))}</h1>
      <p class="lead">${esc(t("rules_lead"))}</p>
    </div>
    <div class="rules-grid">
      ${[1, 2, 3, 4, 5, 6].map(n => `
        <article class="info-card rule-card">
          <span class="rule-icon" aria-hidden="true">${n}</span>
          <div>
            <h2>${esc(t("rules_" + n + "_t"))}</h2>
            <p>${esc(t("rules_" + n + "_b"))}</p>
          </div>
        </article>`).join("")}
    </div>
    <div class="two-col mt-4">
      <div class="info-card">
        <span class="eyebrow">${esc(t("payment_eyebrow"))}</span>
        <h2>${esc(t("rules_payment_title"))}</h2>
        <p>${esc(t("rules_payment_body"))}</p>
      </div>
      <div class="info-card">
        <span class="eyebrow">${esc(t("account_rights"))}</span>
        <h2>${esc(t("rules_data_title"))}</h2>
        <p>${esc(t("rules_data_body"))}</p>
      </div>
    </div>`);
}

/* ---------------- El proyecto ---------------- */
function renderAbout(app) {
  setApp(app, `
    <div class="page-head">
      <span class="eyebrow">${icon("info")}${esc(t("nav_about"))}</span>
      <h1>${esc(t("about_title"))}</h1>
      <p class="lead">${esc(t("about_lead"))}</p>
    </div>
    <div class="about-layout">
      <div class="info-card">
        <p>${esc(t("about_p1"))}</p>
        <p>${esc(t("about_p2"))}</p>
        <p>${esc(t("about_p3"))}</p>
        <h2 class="mt-5">${esc(t("about_pillars_title"))}</h2>
        <ul class="clean-list">
          <li>${icon("shield")}${esc(t("about_pillar_1"))}</li>
          <li>${icon("user")}${esc(t("about_pillar_2"))}</li>
          <li>${icon("tag")}${esc(t("about_pillar_3"))}</li>
        </ul>
        <p class="team-list"><strong>${esc(t("credit_label"))}</strong>${TEAM_NAMES.map(esc).join(" · ")}</p>
      </div>
      <figure class="team-photo">
        ${responsiveImage("/static/img/equipo-ctc.jpg", { alt: t("photo_caption"), fallback: "/static/img/ctc-congress.png", sizes: "(max-width: 960px) 92vw, 420px" })}
        <figcaption>
          <span>${esc(t("photo_caption"))}</span>
          <span class="muted">${esc(t("photo_privacy"))} <a href="/privacidad" data-route="privacy">${esc(t("footer_privacy"))}</a></span>
        </figcaption>
      </figure>
    </div>`);
}

/* ---------------- Panel de datos ---------------- */
function openPasswordChange() {
  if (!state.user) return;
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="password-title">${esc(t("password_title"))}</h2>
      <p>${esc(t("password_lead"))}</p>
    </div>
    <form id="password-form" aria-labelledby="password-title">
      <div class="field">
        <label for="password-current">${esc(t("password_current"))}</label>
        <input id="password-current" name="current_password" type="password" required autocomplete="current-password" data-autofocus>
      </div>
      <div class="field">
        <label for="password-new">${esc(t("password_new"))}</label>
        <input id="password-new" name="new_password" type="password" required minlength="8" maxlength="128" autocomplete="new-password">
        <small>${esc(t("password_hint"))}</small>
      </div>
      <div class="field">
        <label for="password-repeat">${esc(t("password_repeat"))}</label>
        <input id="password-repeat" name="repeat_password" type="password" required minlength="8" maxlength="128" autocomplete="new-password">
      </div>
      <button class="btn btn-primary btn-block btn-lg" type="submit" data-submit>${icon("check")}${esc(t("password_save"))}</button>
    </form>`, { labelledBy: "password-title", sheet: true });
  $("#password-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const next = String(fd.get("new_password") || "");
    if (next !== String(fd.get("repeat_password") || "")) {
      toast(t("password_mismatch"), "error");
      return;
    }
    const submit = $("[data-submit]", e.target);
    setBusy(submit, true, t("saving"));
    try {
      await api("/api/account/password", {
        method: "POST",
        body: JSON.stringify({
          current_password: String(fd.get("current_password") || ""),
          new_password: next,
        }),
      });
      closeModal();
      toast(t("password_changed"));
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

function openProfileEdit() {
  if (!state.user) return;
  const current = state.user;
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="profile-title">${esc(t("profile_title"))}</h2>
      <p>${esc(t("profile_email_note"))}</p>
    </div>
    <form id="profile-form" aria-labelledby="profile-title">
      <div class="field">
        <label for="profile-name">${esc(t("profile_name"))}</label>
        <input id="profile-name" name="name" type="text" maxlength="60" minlength="2" required value="${esc(current.name || "")}" autocomplete="name" data-autofocus>
      </div>
      <div class="field">
        <label for="profile-campus">${esc(t("profile_campus"))}</label>
        <select id="profile-campus" name="campus">
          ${CAMPUSES.map(c => option(c, campusLabel(c), c === current.campus)).join("")}
        </select>
        <small>${esc(t("profile_campus_hint"))}</small>
      </div>
      <button class="btn btn-primary btn-block btn-lg" type="submit" data-submit>${icon("check")}${esc(t("profile_save"))}</button>
    </form>`, { labelledBy: "profile-title", sheet: true });
  $("#profile-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const submit = $("[data-submit]", e.target);
    setBusy(submit, true, t("saving"));
    try {
      const data = await api("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: String(fd.get("name") || "").trim().replace(/\s+/g, " "),
          campus: fd.get("campus") || current.campus,
        }),
      });
      state.user = data.user;
      closeModal();
      toast(t("profile_saved"));
      renderAuthArea();
      render();
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

function accountToolsHtml() {
  if (!state.user) {
    return `<div class="privacy-panel">
      <h3>${esc(t("account_data_title"))}</h3>
      <p>${esc(t("privacy_login_manage"))}</p>
      <button type="button" class="btn btn-primary btn-sm" data-action="login">${icon("user")}${esc(t("login"))}</button>
    </div>`;
  }
  return `<div class="privacy-panel">
    <div class="privacy-panel-head">
      <div>
        <h3>${esc(t("account_data_title"))}</h3>
        <p>${esc(t("account_data_body"))}</p>
      </div>
      <div class="account-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-action="export">${icon("download")}${esc(t("privacy_export"))}</button>
        <button type="button" class="btn btn-danger btn-sm" data-action="delete">${icon("trash")}${esc(t("privacy_delete"))}</button>
      </div>
    </div>
    <dl class="account-meta">
      <div><dt>${esc(t("account_email"))}</dt><dd>${esc(state.user.email)}</dd></div>
      <div><dt>${esc(t("account_campus"))}</dt><dd>${esc(campusLabel(state.user.campus))}</dd></div>
      <div><dt>${esc(t("account_consent"))}</dt><dd>${state.user.consent_ok ? esc(t("account_consent_ok")) : esc(t("account_consent_old"))} · ${esc(CONFIG.legalVersion)}</dd></div>
      <div><dt>${esc(t("account_rights"))}</dt><dd>${esc(t("account_rights_body"))}</dd></div>
    </dl>
    <p class="muted small">${legalText(t("account_note"))}</p>
  </div>`;
}

async function downloadAccountExport() {
  try {
    const data = await api("/api/account/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campus-circular-export-${(state.user && state.user.id) || "account"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t("toast_account_exported"));
  } catch (e) { toast(errorMessage(e), "error"); }
}

function openDeleteAccount() {
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="delete-title">${esc(t("delete_account_title"))}</h2>
      <p class="danger-text">${esc(t("delete_warning"))}</p>
    </div>
    <form id="delete-account-form" aria-labelledby="delete-title">
      <div class="field">
        <label for="delete-password">${esc(t("delete_password"))}</label>
        <input id="delete-password" name="password" type="password" required autocomplete="current-password" data-autofocus>
      </div>
      <button class="btn btn-danger-solid btn-block" type="submit" data-submit>${icon("trash")}${esc(t("delete_confirm_btn"))}</button>
    </form>`, { labelledBy: "delete-title" });
  $("#delete-account-form").onsubmit = async (e) => {
    e.preventDefault();
    const password = new FormData(e.target).get("password") || "";
    const submit = $("[data-submit]", e.target);
    setBusy(submit, true, t("saving"));
    try {
      await api("/api/account/delete", { method: "DELETE", body: JSON.stringify({ password }) });
      state.token = null;
      state.user = null;
      state.pendingConsent = false;
      localStorage.removeItem("cc_token");
      closeModal();
      renderAuthArea();
      toast(t("toast_account_deleted"));
      navigate("home");
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

/* ---------------- Documentos legales ---------------- */
function legalSections(kind, heading = "h2") {
  const docs = LEGAL_DOCS[state.lang] || LEGAL_DOCS.es;
  const sections = docs[kind] || [];
  return sections.map(sec => `
    <section class="legal-section">
      <${heading}>${esc(sec.h)}</${heading}>
      ${(sec.p || []).map(p => `<p>${legalText(p)}</p>`).join("")}
      ${sec.ul ? `<ul>${sec.ul.map(li => `<li>${legalText(li)}</li>`).join("")}</ul>` : ""}
    </section>`).join("");
}

function renderLegalPage(app, kind) {
  setApp(app, `
    <article class="legal-doc">
      <header class="legal-head">
        ${responsiveImage("/static/img/campus-circular-lockup.png", { fallback: "/static/img/campus-circular-mark-white.png", sizes: "260px" })}
        <div>
          <span class="eyebrow">${icon("shield")}${esc(t("legal_kicker"))} · ${esc(CONFIG.service)}</span>
          <h1>${esc(t(kind + "_title"))}</h1>
          <p class="lead">${esc(t(kind + "_lead"))}</p>
          <p class="muted">${esc(t("legal_updated"))}: ${esc(CONFIG.legalUpdated)} · ${esc(t("legal_version"))}: ${esc(CONFIG.legalVersion)} · ${esc(t("legal_contact_label"))}: <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a></p>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" data-print>${icon("download")}${esc(t("legal_print"))}</button>
      </header>
      ${legalSections(kind)}
      ${kind === "privacy" ? accountToolsHtml() : ""}
      <p class="legal-back"><a href="/" data-route="home">${icon("arrow", "icon-sm")} ${esc(t("back_home"))}</a></p>
    </article>`);
}

/* ---------------- Mi área ---------------- */
function renderMy(app) {
  if (!state.user) {
    setApp(app, `
      <div class="page-head">
        <span class="eyebrow">${icon("user")}${esc(t("my_area"))}</span>
        <h1>${esc(t("my_area"))}</h1>
      </div>
      ${emptyState({
        iconName: "user",
        title: t("need_login"), heading: "h2",
        text: t("account_data_body"),
        actions: [
          { id: "login", label: t("login"), icon: "user" },
          { id: "register", label: t("register"), variant: "btn-ghost" }
        ]
      })}`);
    bindEmptyActions(app, { login: () => openAuth("login"), register: () => openAuth("register") });
    return;
  }

  const tab = state.myTab;
  const initials = esc((state.user.name || "?").trim().charAt(0).toUpperCase() || "?");
  setApp(app, `
    <div class="page-head mb-4">
      <span class="eyebrow">${icon("user")}${esc(t("my_area"))}</span>
      <h1>${esc(state.user.name)}</h1>
      <p class="lead lead-inline">
        <span class="avatar avatar-sm" aria-hidden="true">${initials}</span>
        <span>${esc(campusLabel(state.user.campus))} · ${esc(state.user.email)}</span>
        <span class="identity-badge${(state.user.university_verified || state.user.academic_email) ? " academic" : ""}">${icon((state.user.university_verified || state.user.academic_email) ? "check" : "user")}${esc((state.user.university_verified || state.user.academic_email) ? t("verified_badge") : t("personal_email"))}</span>
      </p>
      <div class="page-head-actions">
        <button type="button" class="btn btn-ghost btn-sm" id="edit-profile">${icon("user")}${esc(t("profile_edit"))}</button>
      </div>
    </div>
    <div id="trust-panel" class="mt-4">
      <div class="trust-panel"><div class="skeleton sk-line w-45"></div><div class="skeleton sk-line w-70 mt-3"></div><div class="skeleton sk-line w-60 mt-3"></div></div>
    </div>
    <div class="segment" role="tablist" aria-label="${esc(t("my_area_subtitle"))}">
      ${MY_TABS.map(x => `<button type="button" role="tab" id="tab-${x.id}" aria-selected="${tab === x.id}" tabindex="${tab === x.id ? 0 : -1}" aria-controls="my-panel" data-tab="${x.id}">${esc(t(x.label))}</button>`).join("")}
    </div>
    <div id="my-panel" role="tabpanel" aria-labelledby="tab-${tab}" class="mt-4">
      ${skeletonRows(3)}
    </div>
    ${accountToolsHtml()}`);

  const editProfile = $("#edit-profile");
  if (editProfile) editProfile.onclick = openProfileEdit;
  const tabs = $$("[role=tab]", app);
  tabs.forEach((b, index) => {
    b.onclick = () => { state.myTab = b.dataset.tab; state.myTabFocus = true; render(); };
    b.onkeydown = (e) => {
      const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      tabs.forEach((tab, i) => { tab.tabIndex = i === next ? 0 : -1; });
      tabs[next].focus();
    };
  });
  if (state.myTabFocus) {
    state.myTabFocus = false;
    const activeTab = $('.segment [aria-selected="true"]');
    if (activeTab) activeTab.focus();
  }
  loadMyTab(tab);
  loadTrustPanel();
}

async function loadTrustPanel() {
  const box = $("#trust-panel");
  if (!box || !state.user) return;
  try {
    const data = await api("/api/trust/me");
    if (!box.isConnected) return;
    box.innerHTML = trustPanel(data);
    const bar = $("[data-level-bar]", box);
    const progress = Math.max(0, Math.min(100, Number((data.level || {}).progress) || 0));
    if (bar) bar.style.width = `${progress}%`;
  } catch (err) {
    if (box.isConnected) {
      box.innerHTML = `<p class="muted small">${icon("info")} ${esc(t("trust_error"))}</p>`;
    }
  }
}

function openItemEditor(item) {
  if (!item) return;
  const isSale = item.exchange_type === "vender";
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="edit-item-title">${esc(t("edit_title"))}</h2>
      <p>${esc(t("edit_hint"))}</p>
    </div>
    <form id="edit-item-form" aria-labelledby="edit-item-title">
      <div class="field">
        <label for="e-title">${esc(t("f_title"))} <span class="req-mark" aria-hidden="true">*</span></label>
        <input id="e-title" name="title" required minlength="3" maxlength="80" value="${esc(item.title || "")}" autocomplete="off" data-autofocus>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="e-category">${esc(t("f_category"))}</label>
          <select id="e-category" name="category">${CATEGORIES.map(c => option(c, catLabel(c), item.category === c)).join("")}</select>
        </div>
        <div class="field">
          <label for="e-type">${esc(t("f_type"))}</label>
          <select id="e-type" name="exchange_type">${TYPES.map(c => option(c, typeLabel(c), item.exchange_type === c)).join("")}</select>
        </div>
        <div class="field${isSale ? "" : " hidden"}" id="e-price-field">
          <label for="e-price">${esc(t("f_price"))}</label>
          <input id="e-price" name="price" type="number" min="0" max="10000" step="1" inputmode="numeric" value="${Number(item.price || 0)}">
        </div>
        <div class="field">
          <label for="e-condition">${esc(t("condition"))}</label>
          <select id="e-condition" name="condition">${CONDITIONS.map(c => option(c, condLabel(c), item.condition === c)).join("")}</select>
        </div>
        <div class="field">
          <label for="e-campus">${esc(t("campus"))}</label>
          <select id="e-campus" name="campus">${CAMPUSES.map(c => option(c, campusLabel(c), item.campus === c)).join("")}</select>
        </div>
        <div class="field">
          <label for="e-point">${esc(t("handover_label"))}</label>
          <select id="e-point" name="handover_point">${HANDOVERS.map(c => option(c, handLabel(c), item.handover_point === c)).join("")}</select>
        </div>
      </div>
      <div class="field">
        <label for="e-desc">${esc(t("f_desc_optional"))}</label>
        <textarea id="e-desc" name="description" maxlength="2000">${esc(item.description || "")}</textarea>
      </div>
      <button class="btn btn-primary btn-block btn-lg" type="submit" data-submit>${icon("check")}${esc(t("edit_save"))}</button>
    </form>`, { labelledBy: "edit-item-title", sheet: true });

  const typeSel = $("#e-type");
  const priceField = $("#e-price-field");
  const syncPriceField = () => priceField.classList.toggle("hidden", typeSel.value !== "vender");
  typeSel.onchange = syncPriceField;

  $("#edit-item-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const submit = $("[data-submit]", form);
    setBusy(submit, true, t("saving"));
    try {
      const data = await api(`/api/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: String(fd.get("title") || "").trim().replace(/\s+/g, " "),
          description: String(fd.get("description") || "").trim(),
          category: fd.get("category"),
          condition: fd.get("condition"),
          exchange_type: fd.get("exchange_type"),
          campus: fd.get("campus"),
          handover_point: fd.get("handover_point"),
          price: Number(fd.get("price") || 0),
        }),
      });
      state.lastItem = data.item;
      closeModal();
      toast(t("edit_saved"));
      state.stats = null;
      if (state.view === "my") loadMyTab(state.myTab, `[data-edit="${item.id}"]`);
      else render();
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

function openItemEditorById(id, fallback) {
  if (fallback) return openItemEditor(fallback);
  api(`/api/items/${id}`)
    .then(d => openItemEditor(d.item))
    .catch(err => toast(errorMessage(err), "error"));
}

function myItemCard(it) {
  return `<article class="list-card">
    ${responsiveImage(itemImage(it), { category: it.category, sizes: "64px" })}
    <div class="list-card-body">
      <div class="list-card-top">
        <h3 class="list-card-title">${esc(it.title)}</h3>
        <span class="status-pill status-${esc(it.status)}">${esc(statusLabel(it.status))}</span>
        ${it.hidden ? `<span class="status-pill status-review">${esc(t("status_review"))}</span>` : ""}
      </div>
      <p class="list-card-meta">${esc(catLabel(it.category))} · ${esc(campusLabel(it.campus))} · ${esc(typeLabel(it.exchange_type))}</p>
      ${cardRating(it)}
      ${it.hidden ? `<p class="review-note">${icon("alert")}${esc(t("review_note").replace("{n}", String(it.reports || 0)))}</p>` : ""}
      <div class="list-card-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-view="${it.id}">${icon("eye")}${esc(t("view_item"))}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-edit="${it.id}">${icon("sliders")}${esc(t("edit_item"))}</button>
        <button type="button" class="btn btn-danger btn-sm" data-del="${it.id}">${icon("trash")}${esc(t("delete_item"))}</button>
      </div>
      <div class="status-switch" role="group" aria-label="${esc(t("status_quick"))}">
        ${["disponible", "reservado", "entregado"].map(st => `
          <button type="button" class="status-opt${it.status === st ? " is-on" : ""}"
                  data-set-status="${it.id}" data-next-status="${st}"
                  aria-pressed="${it.status === st}">${esc(statusLabel(st))}</button>`).join("")}
      </div>
    </div>
  </article>`;
}

function requestCard(r, mode) {
  const isReceived = mode === "received";
  const owner = isReceived ? `<span class="list-card-meta"> · ${esc(r.counterpart_name || r.requester_name || "")}</span>` : "";
  return `<article class="list-card">
    ${responsiveImage(r.item_image || categoryImage("otros"), { category: "otros", sizes: "64px" })}
    <div class="list-card-body">
      <div class="list-card-top">
        <h3 class="list-card-title">${esc(r.item_title)}${owner}</h3>
        <span class="status-pill status-${esc(r.status)}" data-request-status="${r.id}" tabindex="-1">${esc(reqLabel(r.status))}</span>
      </div>
      ${r.handover_point ? `<p class="list-card-meta">${icon("pin")}${esc(t("req_handover"))}: ${esc(handLabel(r.handover_point))}</p>` : ""}
      ${r.message ? `<p class="list-card-message">${esc(r.message)}</p>` : ""}
      ${r.my_rating ? `<p class="list-card-rating">${starsHtml(r.my_rating, 0, { withCount: false })}<span>${esc(t("req_rated").replace("{n}", String(r.my_rating)))}</span></p>` : ""}
      <div class="list-card-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-view="${r.item_id}">${icon("eye")}${esc(t("view_item"))}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-chat="${r.id}" data-chat-item="${esc(r.item_title)}">${icon("inbox")}${esc(t("chat"))}</button>
        ${!isReceived && r.status === "pendiente" ? `<button type="button" class="btn btn-danger btn-sm" data-cancelreq="${r.id}">${esc(t("cancel_req"))}</button>` : ""}
        ${isReceived && r.status === "pendiente" ? `
          <button type="button" class="btn btn-primary btn-sm" data-accept="${r.id}">${icon("check")}${esc(t("accept"))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-reject="${r.id}">${esc(t("reject"))}</button>` : ""}
        ${isReceived && r.status === "aceptada" ? `<button type="button" class="btn btn-primary btn-sm" data-complete="${r.id}">${icon("check-circle")}${esc(t("complete"))}</button>` : ""}
        ${r.can_rate ? `<button type="button" class="btn btn-primary btn-sm" data-rate="${r.id}" data-rate-title="${esc(r.item_title)}">${icon("star")}${esc(t("rate_cta"))}</button>` : ""}
      </div>
    </div>
  </article>`;
}

async function openRequestChat(requestId, itemTitle) {
  const title = t("chat_title").replace("{item}", itemTitle || "");
  const modal = openModal(`${closeBtn()}<div class="modal-head"><span class="eyebrow">${icon("inbox")}${esc(t("chat"))}</span><h2>${esc(title)}</h2></div>
    <div id="request-chat-messages" class="chat-messages" aria-live="polite"></div>
    <form id="request-chat-form" class="chat-form"><label class="sr-only" for="request-chat-input">${esc(t("chat_placeholder"))}</label><textarea id="request-chat-input" maxlength="2000" required placeholder="${esc(t("chat_placeholder"))}"></textarea><button class="btn btn-primary" type="submit">${esc(t("chat_send"))}</button></form>`, { sheet: true });
  const history = $("#request-chat-messages", modal);
  const refresh = async () => {
    const data = await api(`/api/requests/${requestId}/messages`);
    history.innerHTML = (data.messages || []).map(m => `<article class="chat-message${Number(m.sender_id) === Number(state.user?.id) ? " is-mine" : ""}"><strong>${esc(m.sender_name)}</strong><p>${esc(m.body)}</p><time>${esc(new Date(m.created_at).toLocaleString())}</time></article>`).join("") || `<p class="muted">${esc(t("chat_empty"))}</p>`;
    history.scrollTop = history.scrollHeight;
  };
  try { await refresh(); } catch (err) { history.textContent = errorMessage(err); }
  $("#request-chat-form", modal).onsubmit = async (event) => {
    event.preventDefault();
    const field = $("#request-chat-input", modal);
    const body = field.value.trim();
    if (!body) return;
    const submit = $("button[type=submit]", event.currentTarget);
    submit.disabled = true;
    try {
      await api(`/api/requests/${requestId}/messages`, { method: "POST", body: JSON.stringify({ body }) });
      field.value = "";
      await refresh();
    } catch (err) { toast(errorMessage(err), "error"); }
    finally { submit.disabled = false; field.focus(); }
  };
}

async function loadMyTab(tab, focusSelector) {
  const panel = $("#my-panel");
  if (!panel) return;
  const canReturnFocus = () => focusSelector && (document.activeElement === document.body || panel.contains(document.activeElement));
  const keepFocus = canReturnFocus();
  panel.innerHTML = skeletonRows(3);
  let html = "";
  try {
    if (tab === "items") {
      const data = await api("/api/items/mine");
      const mine = data.items || [];
      html = mine.length
        ? `<p class="hint-line">${icon("info")}${esc(t("status_help"))}</p>` + mine.map(myItemCard).join("")
        : emptyState({
        iconName: "leaf",
        title: t("empty_my_items_t"),
        text: t("empty_my_items_b"),
        actions: [{ id: "publish", label: t("publish_cta"), icon: "plus" }]
      });
    } else if (tab === "requests") {
      const data = await api("/api/requests/mine");
      const list = data.requests || [];
      html = list.length ? list.map(r => requestCard(r, "mine")).join("") : emptyState({
        iconName: "inbox",
        title: t("empty_req_t"),
        text: t("empty_req_b"),
        actions: [{ id: "browse", label: t("browse_catalog"), icon: "search", variant: "btn-ghost" }]
      });
    } else if (tab === "received") {
      const data = await api("/api/requests/received");
      const list = data.requests || [];
      html = list.length ? list.map(r => requestCard(r, "received")).join("") : emptyState({
        iconName: "inbox",
        title: t("empty_recv_t"),
        text: t("empty_recv_b"),
        actions: [{ id: "publish", label: t("publish_cta"), icon: "plus" }]
      });
    } else {
      const data = await api("/api/favorites");
      const list = data.items || [];
      html = list.length ? `<div class="grid grid-items">${list.map(itemCard).join("")}</div>` : emptyState({
        iconName: "heart",
        title: t("empty_fav_t"),
        text: t("empty_fav_b"),
        actions: [{ id: "browse", label: t("browse_catalog"), icon: "search", variant: "btn-ghost" }]
      });
    }
  } catch (err) {
    html = emptyState({
      iconName: "alert",
      title: t("toast_error"),
      text: errorMessage(err),
      actions: [{ id: "retry", label: t("retry"), icon: "refresh", variant: "btn-ghost" }]
    });
  }
  if (!panel.isConnected) return;
  panel.innerHTML = html;
  enhance(panel);
  bindEmptyActions(panel, {
    publish: () => navigate("publish"),
    browse: () => navigate("home"),
    retry: () => loadMyTab(state.myTab)
  });
  bindMyActions(panel);
  if (keepFocus && canReturnFocus()) $(focusSelector, panel)?.focus();
}

function bindMyActions(panel) {
  // Estado en un toque: los tres botones del segmentado se excluyen entre sí.
  $$("[data-set-status]", panel).forEach(btn => {
    btn.onclick = async () => {
      const id = Number(btn.dataset.setStatus);
      const next = btn.dataset.nextStatus;
      if (btn.getAttribute("aria-pressed") === "true") return;
      btn.disabled = true;
      try {
        const data = await api(`/api/items/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
        if (state.lastItem && Number(state.lastItem.id) === id) state.lastItem = data.item;
        $$(`[data-set-status="${id}"]`, panel).forEach(b => {
          const on = b.dataset.nextStatus === next;
          b.classList.toggle("is-on", on);
          b.setAttribute("aria-pressed", String(on));
        });
        toast(t("toast_status"));
        state.stats = null;
      } catch (err) {
        toast(errorMessage(err), "error");
      } finally {
        $$(`[data-set-status="${id}"]`, panel).forEach(b => { b.disabled = false; });
      }
    };
  });
  $$("[data-edit]", panel).forEach(b => { b.onclick = () => openItemEditorById(Number(b.dataset.edit)); });
  $$("[data-del]", panel).forEach(b => { b.onclick = () => confirmDeleteItem(Number(b.dataset.del)); });
  const patchRequest = (id, status, okMsg) => async (event) => {
    const btn = event.currentTarget;
    btn.disabled = true;
    try {
      await api(`/api/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast(okMsg);
      state.stats = null;
      if (!panel.isConnected) return;
      loadMyTab(state.myTab, `[data-request-status="${id}"]`);
      loadTrustPanel();
    } catch (err) {
      btn.disabled = false;
      toast(errorMessage(err), "error");
    }
  };
  $$("[data-chat]", panel).forEach(b => { b.onclick = () => openRequestChat(Number(b.dataset.chat), b.dataset.chatItem); });
  $$("[data-cancelreq]", panel).forEach(b => { b.onclick = patchRequest(b.dataset.cancelreq, "cancelada", t("toast_req_status")); });
  $$("[data-accept]", panel).forEach(b => { b.onclick = patchRequest(b.dataset.accept, "aceptada", t("toast_req_status")); });
  $$("[data-reject]", panel).forEach(b => { b.onclick = patchRequest(b.dataset.reject, "rechazada", t("toast_req_status")); });
  $$("[data-complete]", panel).forEach(b => { b.onclick = patchRequest(b.dataset.complete, "completada", t("toast_req_status")); });
  $$("[data-rate]", panel).forEach(b => {
    b.onclick = () => openRate(b.dataset.rate, b.dataset.rateTitle, () => {
      loadMyTab(state.myTab);
      loadTrustPanel();
    });
  });
}

function confirmDeleteItem(id) {
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="confirm-delete-title">${esc(t("confirm_delete_t"))}</h2>
      <p>${esc(t("confirm_delete_b"))}</p>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn btn-ghost" data-close>${esc(t("cancel"))}</button>
      <button type="button" class="btn btn-danger-solid" id="confirm-delete-btn">${icon("trash")}${esc(t("confirm_delete_btn"))}</button>
    </div>`, { labelledBy: "confirm-delete-title" });
  $("#confirm-delete-btn").onclick = async () => {
    const btn = $("#confirm-delete-btn");
    setBusy(btn, true, t("saving"));
    try {
      await api(`/api/items/${id}`, { method: "DELETE" });
      closeModal();
      toast(t("toast_deleted"));
      render();
    } catch (err) {
      setBusy(btn, false);
      toast(errorMessage(err), "error");
    }
  };
}

/* ---------------- Detalle y solicitudes ---------------- */
function commentStars(score) {
  const n = Number(score || 0);
  if (!n) return "";
  let out = `<span class="comment-stars" aria-label="${esc(t("rating_aria").replace("{n}", n).replace("{c}", 1))}">`;
  for (let i = 1; i <= 5; i++) out += `<span class="star${i <= n ? " is-on" : ""}" aria-hidden="true">★</span>`;
  return out + "</span>";
}

function renderItemComment(c) {
  const name = c.user_name || "—";
  return `<article class="comment-card">
    <span class="avatar avatar-sm" aria-hidden="true">${esc(name.trim().charAt(0).toUpperCase() || "?")}</span>
    <div class="comment-main">
      <div class="comment-head">
        <span class="comment-author">${esc(name)}</span>
        ${commentStars(c.score)}
        <time class="comment-date">${esc(new Date(c.created_at).toLocaleDateString())}</time>
      </div>
      ${c.body ? `<p class="comment-body">${esc(c.body)}</p>` : ""}
    </div>
  </article>`;
}

function renderItemCommentsBlock(commentsPayload, item) {
  const summary = commentsPayload.summary || { count: 0, average: 0, score_count: 0 };
  const comments = commentsPayload.items || [];
  const count = summary.count || 0;
  const avg = summary.average || 0;
  const countLabel = count === 1 ? t("comments_count_one") : t("comments_count").replace("{n}", String(count));
  const avgHtml = summary.score_count
    ? `<span class="comment-avg">${starsHtml(avg, summary.score_count)} <span class="muted">${esc(t("comments_avg").replace("{a}", avg.toFixed(1)))}</span></span>`
    : "";
  const listHtml = comments.length
    ? `<div class="comment-list" id="comment-list">${comments.map(renderItemComment).join("")}</div>`
    : `<p class="muted" id="comment-empty">${esc(t("comments_empty"))}</p>`;

  const myComment = item.my_comment;
  const isOwn = state.user && Number(state.user.id) === Number(item.owner_id);
  const moreHtml = commentsPayload.has_more
    ? `<button type="button" class="btn btn-ghost btn-sm btn-block" id="comments-more">${icon("arrow")}${esc(t("comments_more"))}</button>`
    : "";
  let formHtml = "";
  if (isOwn) {
    formHtml = `<p class="comment-note muted">${icon("info")}<span>${esc(t("comments_own"))}</span></p>`;
  } else if (!state.user) {
    formHtml = `<p class="comment-note muted">${esc(t("comments_login"))} <button type="button" class="link-btn" id="comment-login">${esc(t("login"))}</button></p>`;
  } else if (myComment) {
    formHtml = `<div class="comment-note is-done">${icon("check-circle")}<span>${esc(t("comments_already"))}</span></div>`;
  } else {
    formHtml = `<form id="item-comment-form" class="comment-form" novalidate>
      <h4>${esc(t("comments_add"))}</h4>
      <div class="field">
        <span class="field-label">${esc(t("comments_score"))}</span>
        <div class="star-input" role="radiogroup" aria-label="${esc(t("comments_score"))}">
          ${[1,2,3,4,5].map(n => `<label class="star-input-opt"><input type="radio" name="score" value="${n}"><span aria-label="${esc(t("comments_score_aria").replace("{n}", String(n)))}">★</span></label>`).join("")}
          <button type="button" class="star-clear" id="comment-score-clear">${esc(t("comments_score_none"))}</button>
        </div>
      </div>
      <div class="field">
        <label for="comment-body">${esc(t("comments_body"))}</label>
        <textarea id="comment-body" name="body" maxlength="500" rows="3" placeholder="${esc(t("comments_body_ph"))}"></textarea>
      </div>
      <button class="btn btn-primary" type="submit" id="comment-submit">${esc(t("comments_submit"))}</button>
    </form>`;
  }

  return `<section class="detail-section" id="item-comments">
    <div class="comment-section-head">
      <h3>${esc(t("comments_title"))}</h3>
      <div class="comment-summary">${avgHtml}<span class="muted">${esc(countLabel)}</span></div>
    </div>
    ${listHtml}
    ${moreHtml}
    ${formHtml}
  </section>`;
}

async function openItem(id) {
  const modal = openModal(`
    ${closeBtn()}
    <div class="skeleton sk-media-detail" aria-hidden="true"></div>
    <div class="skeleton sk-line w-70 sk-title" aria-hidden="true"></div>
    <div class="skeleton sk-line w-45 sk-subtitle" aria-hidden="true"></div>`,
    { sheet: true, wide: true, label: t("view_item") });
  modal.classList.add("item-detail");

  const isOpen = () => modal.isConnected && !modal.closest(".modal-backdrop").inert;
  let it;
  let commentsPayload = { items: [], summary: { count: 0, average: 0, score_count: 0 } };
  try {
    const [data, cData] = await Promise.all([
      api(`/api/items/${id}`),
      api(`/api/items/${id}/comments`).catch(() => null),
    ]);
    it = data.item;
    if (cData) commentsPayload = cData;
  } catch (e) {
    if (!isOpen()) return;
    closeModal();
    toast(errorMessage(e), "error");
    return;
  }
  if (!isOpen()) return;

  state.lastItem = it;
  const owner = it.owner || {};
  const isOwn = state.user && state.user.id === it.owner_id;
  const isSale = it.exchange_type === "vender";
  const available = it.status === "disponible";
  const price = isSale ? `€${Number(it.price || 0).toFixed(0)}` : esc(t("free"));
  const saved = Boolean(it.is_favorite);

  modal.removeAttribute("aria-label");
  modal.setAttribute("aria-labelledby", "detail-title");
  modal.innerHTML = `
    ${closeBtn()}
    <span class="sheet-handle" aria-hidden="true"></span>
    <div class="detail-intro">
      <div class="detail-media">
        ${itemPhoto(it, { alt: it.title, lazy: false, sizes: "(max-width: 720px) calc(100vw - 2rem), 460px" })}
      </div>
      <div class="detail-summary">
        <div class="detail-kicker"><span class="card-category">${esc(catLabel(it.category))}</span><span class="status-pill status-${esc(it.status)}">${esc(statusLabel(it.status))}</span></div>
        <h2 class="detail-title" id="detail-title">${esc(it.title)}</h2>
        <p class="detail-meta">${esc(typeLabel(it.exchange_type))} · ${esc(condLabel(it.condition))}</p>
        <p class="card-location">${icon("pin")}<span>${esc(campusLabel(it.campus))}</span></p>
        <div class="detail-price-row">
          <div><span class="price">${price}</span>${isSale ? `<span class="price-sub">${esc(t("price_orientative"))}</span>` : ""}</div>
          <p class="card-location">${icon("tag")}<span>${esc(t("handover_label"))}: ${esc(handLabel(it.handover_point))}</span></p>
        </div>
        ${!available && !isOwn ? `<p class="detail-unavailable">${esc(t("detail_unavailable"))}</p>` : ""}
        <div class="detail-actions">
          ${isOwn
            ? `<button type="button" class="btn btn-primary" id="detail-edit">${icon("sliders")}${esc(t("edit_item"))}</button>
               <button type="button" class="btn btn-ghost" id="detail-manage">${icon("grid")}${esc(t("detail_manage"))}</button>`
            : `<button type="button" class="btn btn-primary" id="detail-request"${available ? "" : " disabled"}>${icon("inbox")}${esc(t("detail_request"))}</button>`}
          <button type="button" class="btn btn-ghost" id="detail-fav-btn" aria-pressed="${saved}">
            ${icon("heart")}<span id="detail-fav-label">${esc(saved ? t("detail_faved") : t("detail_fav"))}</span>
          </button>
        </div>
      </div>
    </div>
    <div class="detail-content">
      <section class="detail-section">
        <h3>${esc(t("detail_description"))}</h3>
        <p class="detail-desc">${it.description ? esc(it.description) : `<span class="muted">${esc(t("detail_no_desc"))}</span>`}</p>
      </section>
      <section class="detail-section">
        <h3>${esc(t("owner"))}</h3>
        <div class="owner-card">
          <span class="avatar" aria-hidden="true">${esc((owner.name || "?").charAt(0).toUpperCase())}</span>
          <div class="owner-body">
            <p class="owner-name">${esc(owner.name || "—")}
              <span class="identity-badge${owner.university_verified ? " academic" : ""}">${icon(owner.university_verified ? "check" : "user")}${esc(owner.university_verified ? t("verified_badge") : t("personal_email"))}</span>
            </p>
            <p class="owner-trust">${starsHtml((owner.rating || {}).average, (owner.rating || {}).count)}</p>
            <p class="owner-stats">
              <span>${icon("refresh")}${(owner.exchanges || {}).completed || 0} ${esc(t("exchanges_short"))}</span>
              <span class="level-pill">${esc(t("level_label"))}: ${esc(levelLabel((owner.level || {}).key || "semilla"))}</span>
            </p>
            <small>${esc(t("identity_note"))}</small>
          </div>
        </div>
        <details class="disclosure">
          <summary>${icon("star")}<span>${esc(t("ratings_received"))}</span>${icon("chevron")}</summary>
          <div class="disclosure-body">${ratingList(owner.rating)}</div>
        </details>
      </section>
      ${renderItemCommentsBlock(commentsPayload, it)}
    </div>
    <details class="disclosure">
      <summary>${icon("shield")}<span>${esc(t("detail_handover_h"))}</span>${icon("chevron")}</summary>
      <div class="disclosure-body">
        <p>${esc(t("loan_rules"))}</p>
        <p>${esc(t("detail_privacy_note"))}</p>
      </div>
    </details>
    ${isSale ? `<details class="disclosure">
      <summary>${icon("tag")}<span>${esc(t("detail_payment_h"))}</span>${icon("chevron")}</summary>
      <div class="disclosure-body"><p>${esc(t("detail_payment_notice"))}</p></div>
    </details>` : ""}
    ${isOwn ? "" : `<button type="button" class="report-link" id="detail-report">${icon("alert")}${esc(t("report_open"))}</button>`}
    ${isOwn && it.hidden ? `<p class="review-note">${icon("alert")}${esc(t("review_note").replace("{n}", String(it.reports || 0)))}</p>` : ""}`;
  enhance(modal);

  const toggleFav = async (btn) => {
    if (!state.user) { toast(t("need_login"), "info"); openAuth("login"); return; }
    btn.disabled = true;
    try {
      const d = await api(`/api/items/${id}/favorite`, { method: "POST" });
      toast(d.is_favorite ? t("toast_fav_on") : t("toast_fav_off"));
      btn.setAttribute("aria-pressed", String(d.is_favorite));
      $$("[data-fav]").filter(b => Number(b.dataset.fav) === id).forEach(b => {
        b.classList.toggle("active", d.is_favorite);
        b.setAttribute("aria-pressed", String(d.is_favorite));
        b.setAttribute("aria-label", favoriteLabel(d.is_favorite, b.dataset.itemTitle));
      });
      const label = $("#detail-fav-label", modal);
      if (label) label.textContent = d.is_favorite ? t("detail_faved") : t("detail_fav");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      btn.disabled = false;
    }
  };
  const favBtn = $("#detail-fav-btn", modal);
  if (favBtn) favBtn.onclick = () => toggleFav(favBtn);

  const manageBtn = $("#detail-manage", modal);
  if (manageBtn) manageBtn.onclick = () => { closeModal(); state.myTab = "items"; navigate("my"); };
  const editBtn = $("#detail-edit", modal);
  if (editBtn) editBtn.onclick = () => { closeModal(); openItemEditor(state.lastItem); };
  const reqBtn = $("#detail-request", modal);
  if (reqBtn) reqBtn.onclick = () => {
    if (!state.user) { toast(t("need_login"), "info"); openAuth("login"); return; }
    openRequest(id);
  };
  const reportBtn = $("#detail-report", modal);
  if (reportBtn) reportBtn.onclick = () => {
    if (!state.user) { toast(t("need_login"), "info"); openAuth("login"); return; }
    openReport(it);
  };

  bindItemComments(modal, it, id);
}

/* Comentarios y valoraciones públicas: se re-vinculan tras cada refresco del bloque. */
function bindItemComments(modal, it, id) {
  const login = $("#comment-login", modal);
  if (login) login.onclick = () => openAuth("login");

  const more = $("#comments-more", modal);
  if (more) more.onclick = async () => {
    const list = $("#comment-list", modal);
    const loaded = list ? $$(".comment-card", list).length : 0;
    more.disabled = true;
    try {
      const data = await api(`/api/items/${id}/comments?limit=${loaded + 20}&offset=0`);
      const section = $("#item-comments", modal);
      if (section && data) {
        section.outerHTML = renderItemCommentsBlock(data, it);
        bindItemComments(modal, it, id);
      }
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      const again = $("#comments-more", modal);
      if (again) again.disabled = false;
    }
  };

  const clearScore = $("#comment-score-clear", modal);
  if (clearScore) clearScore.onclick = () => {
    $$("input[name='score']", modal).forEach(r => { r.checked = false; });
  };

  const refreshSection = async (fallback) => {
    const section = $("#item-comments", modal);
    if (!section) return;
    const fresh = await api(`/api/items/${id}/comments`).catch(() => null);
    const payload = fresh || { items: fallback ? [fallback] : [], summary: it.comments || {}, has_more: false };
    section.outerHTML = renderItemCommentsBlock(payload, it);
    bindItemComments(modal, it, id);
  };

  const commentForm = $("#item-comment-form", modal);
  if (commentForm) commentForm.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(commentForm);
    const rawScore = fd.get("score");
    const body = (fd.get("body") || "").trim();
    const score = rawScore ? Number(rawScore) : null;
    if (!body && !score) {
      toast(t("comments_need_something"), "error");
      return;
    }
    const submit = $("#comment-submit", commentForm);
    setBusy(submit, true, t("sending"));
    try {
      const res = await api(`/api/items/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ score, body }),
      });
      toast(t("comments_posted"));
      it.my_comment = res.comment;
      it.comments = res.summary;
      state.lastItem = it;
      await refreshSection(res.comment);
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

function openReport(item) {
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="report-title">${esc(t("report_title"))}</h2>
      <p>${esc(t("report_privacy"))}</p>
    </div>
    <form id="report-form" aria-labelledby="report-title">
      <fieldset class="field report-reasons">
        <legend>${esc(t("report_reason"))}</legend>
        ${REPORT_REASONS.map((reason, i) => `
          <label class="radio-row">
            <input type="radio" name="reason" value="${reason}"${i === 0 ? " checked" : ""}>
            <span>${esc(t("report_reason_" + reason))}</span>
          </label>`).join("")}
      </fieldset>
      <div class="field">
        <label for="report-comment">${esc(t("report_comment"))}</label>
        <textarea id="report-comment" name="comment" maxlength="300" placeholder="${esc(t("report_comment_ph"))}"></textarea>
        <small>${esc(t("report_note"))}</small>
      </div>
      <button class="btn btn-danger btn-block" type="submit" data-submit>${icon("alert")}${esc(t("report_send"))}</button>
    </form>`, { labelledBy: "report-title", sheet: true });
  $("#report-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const submit = $("[data-submit]", e.target);
    setBusy(submit, true, t("sending"));
    try {
      const res = await api(`/api/items/${item.id}/report`, {
        method: "POST",
        body: JSON.stringify({
          reason: fd.get("reason") || "otro",
          comment: fd.get("comment") || "",
        }),
      });
      closeModal();
      toast(res.hidden ? t("report_sent_hidden") : t("report_sent"));
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

function openRequest(itemId) {
  const item = state.lastItem && state.lastItem.id === itemId ? state.lastItem : null;
  const suggestedPoint = (item && HANDOVERS.includes(item.handover_point)) ? item.handover_point : "acordado";
  openModal(`
    ${closeBtn()}
    <div class="modal-head">
      <h2 id="request-title">${esc(t("request_title"))}</h2>
      <p>${esc(t("request_privacy"))}</p>
    </div>
    <form id="request-form" aria-labelledby="request-title">
      <div class="field">
        <label for="request-message">${esc(t("request_msg"))}</label>
        <textarea id="request-message" name="message" maxlength="1000" placeholder="${esc(t("request_msg_ph"))}" data-autofocus></textarea>
      </div>
      <div class="field">
        <label for="request-point">${esc(t("request_point"))}</label>
        <select id="request-point" name="handover_point">
          ${HANDOVERS.map(c => option(c, handLabel(c), c === suggestedPoint)).join("")}
        </select>
        <small>${esc(t("request_point_hint"))}</small>
      </div>
      <button class="btn btn-primary btn-block btn-lg" type="submit" data-submit>${icon("inbox")}${esc(t("request_btn"))}</button>
    </form>`, { labelledBy: "request-title", sheet: true });
  $("#request-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const message = fd.get("message") || "";
    const handover_point = fd.get("handover_point") || "";
    const submit = $("[data-submit]", e.target);
    setBusy(submit, true, t("sending"));
    try {
      const created = await api(`/api/items/${itemId}/request`, { method: "POST", body: JSON.stringify({ message, handover_point }) });
      closeModal();
      toast(t("toast_request"));
      const itemTitle = item?.title || t("detail_request");
      window.setTimeout(() => openRequestChat(created.request.id, itemTitle), 150);
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

/* ---------------- Notifications ---------------- */
let notificationBaseline = null;
async function pollNotifications() {
  if (!state.token || document.hidden) return;
  try {
    const data = await api("/api/notifications");
    const total = Number(data.unread_messages || 0) + Number(data.pending_requests || 0);
    if (notificationBaseline !== null && total > notificationBaseline) {
      toast(data.unread_messages ? t("notify_new_message") : t("notify_new_request"));
      if (state.view === "my" && ["received", "requests"].includes(state.myTab)) loadMyTab(state.myTab);
    }
    notificationBaseline = total;
  } catch (_) { /* best-effort: request lists still work if polling fails */ }
}

/* ---------------- Theme (modo noche) ----------------
   Preferencia explícita en localStorage; si no hay ninguna, se sigue el
   sistema. El interruptor del header guarda siempre un valor explícito, así
   que el usuario manda por encima del sistema a partir de su primer clic. */
const THEME_KEY = "cc-theme";
const prefersDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function storedTheme() {
  try { return localStorage.getItem(THEME_KEY) || ""; } catch (_) { return ""; }
}
function currentTheme() {
  const stored = storedTheme();
  if (stored === "dark" || stored === "light") return stored;
  return prefersDark && prefersDark.matches ? "dark" : "light";
}
function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "dark" ? "#0d1410" : "#12573A";
  root.style.colorScheme = theme;
  syncThemeToggle();
}
function setTheme(theme, { persist = true } = {}) {
  if (persist) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }
  applyTheme(theme);
}
function syncThemeToggle() {
  const btn = $("#theme-toggle");
  if (!btn) return;
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const label = t(dark ? "theme_to_light" : "theme_to_dark");
  btn.setAttribute("aria-label", label);
  btn.setAttribute("title", label);
  btn.setAttribute("aria-pressed", dark ? "true" : "false");
  const use = $("#theme-toggle-icon");
  if (use) use.setAttribute("href", dark ? "#i-sun" : "#i-moon");
}

/* ---------------- Init ---------------- */
async function init() {
  $$(".lang-switch button").forEach(b => {
    b.onclick = () => {
      if (state.lang === b.dataset.lang) return;
      state.lang = b.dataset.lang;
      localStorage.setItem("cc_lang", state.lang);
      if (!state.pendingConsent) closeModal();
      renderAuthArea();
      render();
      syncThemeToggle();
    };
  });

  applyTheme(currentTheme());
  if (prefersDark) {
    const onSystemTheme = () => { if (!storedTheme()) applyTheme(currentTheme()); };
    if (prefersDark.addEventListener) prefersDark.addEventListener("change", onSystemTheme);
    else if (prefersDark.addListener) prefersDark.addListener(onSystemTheme);
  }
  const themeBtn = $("#theme-toggle");
  if (themeBtn) themeBtn.onclick = () => {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  };
  syncThemeToggle();

  window.addEventListener("popstate", (e) => {
    closeModal();
    state.view = (e.state && e.state.view) || PATH_VIEWS[location.pathname] || "home";
    if (!state.pendingConsent) render();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeUserMenu(true);
    if (!state.pendingConsent) closeModal();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest || !e.target.closest(".dropdown")) closeUserMenu();
  });

  try { history.replaceState({ view: state.view }, "", location.pathname || "/"); } catch (e) {}

  renderAuthArea();
  render();

  if (!state.token) return;
  try {
    const data = await api("/api/auth/me");
    state.user = data.user;
    if (!state.user) {
      state.token = null;
      localStorage.removeItem("cc_token");
      renderAuthArea();
      return;
    }
    renderAuthArea();
    // Las vistas privadas no deben pedir datos hasta que el consentimiento sea válido.
    if (!state.user.consent_ok) openConsentUpdate();
    else render();
  } catch (e) {
    state.token = null;
    localStorage.removeItem("cc_token");
    renderAuthArea();
  }
}
document.addEventListener("DOMContentLoaded", init);
window.setInterval(pollNotifications, 20000);

$("#quick-guide").addEventListener("click", openQuickGuide);
