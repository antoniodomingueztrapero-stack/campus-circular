/* Circular Campus — SPA independiente (ES / EN / GL) */
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
  service: BOOT.service || "Circular Campus",
  contactEmail: BOOT.contactEmail || "privacidad@circular-campus.example",
  controller: BOOT.controller || "Equipo Circular Campus (proyecto académico independiente)",
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
    footer_tag: "Reutilización e intercambio de materiales de segunda vida.",
    footer_independent: "Proyecto independiente. No es un servicio oficial de ninguna universidad.",
    footer_explore: "Explorar", footer_legal: "Información legal", footer_legal_notice: "Aviso legal",
    footer_privacy: "Privacidad y datos", footer_terms: "Condiciones de uso", footer_presented: "Presentado en",
    footer_payment_mini: "Sin pagos dentro de la plataforma",
    footer_note: "Prototipo sin ánimo de lucro · sin analítica · sin recursos de terceros · las imágenes de ejemplo son locales.",
    credit_label: "Equipo del proyecto", payment_eyebrow: "Pagos", noscript: "Circular Campus necesita JavaScript para mostrar el catálogo y gestionar la cuenta.",
    title_home: "Explorar", title_publish: "Publicar", title_points: "Puntos de entrega", title_rules: "Normas y confianza",
    title_about: "El proyecto", title_my: "Mi área", title_legal: "Aviso legal", title_privacy: "Privacidad y datos", title_terms: "Condiciones de uso",
    hero_eyebrow: "Reutilizar es sencillo", hero_title: "Lo que ya no usas puede seguir teniendo una buena historia.",
    hero_lead: "Circular Campus es un prototipo independiente para publicar, encontrar y dar una segunda vida a libros, ropa, muebles y material de estudio. Publica, busca y acuerda la entrega en un lugar público.",
    hero_search_ph: "Buscar libros, ropa, muebles…", hero_search_btn: "Buscar", publish_cta: "Publicar un objeto",
    stat_items: "objetos publicados", stat_available: "disponibles ahora", stat_delivered: "entregas marcadas", stat_users: "cuentas creadas",
    payment_banner_title: "Sin pasarela de pago",
    payment_banner_body: "Circular Campus no procesa pagos, no cobra comisiones, no custodia dinero ni garantiza objetos. «Vender» muestra solo un precio orientativo: cualquier pago se acuerda directamente entre particulares, fuera de la plataforma.",
    all: "Todo", search: "Buscar", filters: "Filtros", campus: "Campus", condition: "Estado", type: "Tipo", sort: "Ordenar",
    sort_recent: "Más recientes", sort_price_asc: "Precio: menor a mayor", sort_price_desc: "Precio: mayor a menor",
    results: "objetos", no_results: "No hay objetos con esos filtros. Prueba con otra búsqueda o publica el tuyo.",
    free: "Gratis", price_orientative: "Precio orientativo", view_item: "Ver", items_word: "objetos",
    how_title: "Cómo funciona", how_1_t: "1. Publica", how_1_b: "Foto real, estado honesto y punto de entrega. Sin datos personales en la descripción.",
    how_2_t: "2. Busca y solicita", how_2_b: "Filtra por categoría, campus y estado. Envía una solicitud con un mensaje breve.",
    how_3_t: "3. Queda en público", how_3_b: "Acordad un lugar seguro y marcado como entregado cuando terminéis.",
    trust_title: "Diseñado con criterios claros", trust_1: "Consentimiento explícito, aviso legal, privacidad y condiciones en tres idiomas.",
    trust_2: "Exportación y supresión de cuenta desde Mi área; sin analítica, cookies de terceros ni rastreadores.",
    trust_3: "Imágenes locales, sin pasarela de pago, sin comisiones ni fondos retenidos. Las cifras de impacto son estimaciones transparentes por categoría.",
    login: "Iniciar sesión", register: "Crear cuenta", logout: "Cerrar sesión", my_area: "Mi área",
    my_items: "Mis objetos", my_requests: "Mis solicitudes", received: "Solicitudes recibidas", favorites: "Favoritos",
    publish_title: "Publicar un objeto", publish_intro: "Publica como particular. El precio, si lo hay, es orientativo; Circular Campus no gestiona cobros.",
    f_title: "Título", f_desc: "Descripción", f_category: "Categoría", f_condition: "Estado", f_type: "Tipo de intercambio",
    f_campus: "Campus", f_handover: "Punto de entrega", f_price: "Precio orientativo (€)", f_price_hint: "No se cobra aquí. El importe se acuerda directamente y fuera de la plataforma.",
    f_image: "Foto del objeto", f_image_hint: "Sube una imagen real. Se reescala a 1200 px, se convierte a WebP y se eliminan los metadatos EXIF (incluida la ubicación).",
    upload: "Subir imagen", f_private: "Confirmo que publico como particular", f_private_hint: "No se admiten vendedores profesionales ni actividad comercial habitual.",
    desc_hint: "Describe marcas, defectos y qué incluye. No escribas teléfonos, direcciones ni datos de contacto.",
    publish_btn: "Publicar objeto", cancel: "Cancelar", payment_notice_title: "Pago fuera de Circular Campus",
    payment_notice_body: "La plataforma no intermedia ni procesa el pago. Acordadlo directamente en la entrega, en efectivo o por un medio directo entre particulares. No hay comisión, reembolso ni garantía de Circular Campus.",
    detail_request: "Solicitar", detail_fav: "Guardar", detail_faved: "Guardado", request_title: "Solicitar este objeto",
    request_msg: "Mensaje para la otra persona (opcional)", request_msg_ph: "Hola, me interesa… ¿podemos quedar en un lugar público?",
    request_btn: "Enviar solicitud", request_sent: "Solicitud enviada. La otra persona la verá en su área.",
    request_privacy: "Usa este mensaje solo para coordinar el intercambio. No compartas datos sensibles.",
    owner: "Publicado por", academic_email: "Dominio académico", personal_email: "Correo personal",
    identity_note: "La insignia describe solo el dominio del correo: no acredita matrícula, identidad ni pertenencia institucional.",
    handover_label: "Entrega en", loan_rules: "Si es un préstamo, acordad por escrito la fecha de devolución en la solicitud.",
    detail_payment_notice: "Precio orientativo. Cualquier pago se acuerda directamente entre particulares, fuera de Circular Campus; la plataforma no cobra, retiene fondos ni media en disputas.",
    detail_privacy_note: "No publiques datos de contacto en la descripción; utiliza la solicitud y queda en un lugar público.",
    status_disponible: "Disponible", status_reservado: "Reservado", status_entregado: "Entregado",
    req_pendiente: "Pendiente", req_aceptada: "Aceptada", req_rechazada: "Rechazada", req_cancelada: "Cancelada", req_completada: "Completada",
    accept: "Aceptar", reject: "Rechazar", complete: "Marcar entregado", cancel_req: "Cancelar solicitud",
    mark_available: "Marcar disponible", mark_reserved: "Marcar reservado", mark_delivered: "Marcar entregado", delete_item: "Eliminar",
    points_title: "Puntos de entrega", points_lead: "Estas son sugerencias de lugares públicos y fáciles de encontrar. Elegid siempre un sitio concurrido y, si alguien habilita un espacio físico, debe contar con la autorización de quien lo gestiona.",
    points_notice: "Circular Campus no habilita puntos oficiales: son etiquetas orientativas para acordar la entrega, no espacios reservados ni servicios institucionales.",
    rules_title: "Normas y confianza", rules_lead: "Un intercambio sencillo funciona mejor con información honesta, prudencia y reglas pequeñas y claras.",
    about_title: "El proyecto", about_lead: "Circular Campus es un prototipo independiente presentado en CTC Congress para explorar la reutilización de materiales de segunda vida.",
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
    toast_login: "Sesión iniciada. ¡Bienvenido/a!", toast_register: "Cuenta creada. ¡Bienvenido/a a Circular Campus!", toast_logout: "Sesión cerrada.",
    toast_error: "Algo salió mal. Inténtalo de nuevo.", toast_upload: "Imagen subida.", toast_own_item: "Este es tu objeto. Puedes gestionarlo en Mi área.",
    toast_account_exported: "Datos exportados.", toast_account_deleted: "Cuenta y datos eliminados.", toast_consent_updated: "Consentimiento actualizado.",
    toast_consent_required: "Debes aceptar la política y las condiciones.", toast_private_required: "Confirma que publicas como particular.",
    toast_invalid_image: "Usa una imagen subida a Circular Campus.", toast_unauthorized: "Inicia sesión para continuar.",
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
    rules_payment_title: "Pagos fuera de la plataforma", rules_payment_body: "No hay pasarela de pago, monedero, depósito, comisión ni reembolso gestionado por Circular Campus. El precio es orientativo y cualquier pago directo se acuerda entre particulares, fuera del servicio.",
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
    account_data_title: "Tus datos, bajo tu control", account_data_body: "Consulta qué guarda tu cuenta, descarga una copia o elimínala. La supresión borra perfil, sesiones, publicaciones, favoritos y solicitudes propias.",
    account_email: "Email", account_campus: "Campus", account_consent: "Consentimiento", account_consent_ok: "Vigente", account_consent_old: "Pendiente de renovar",
    account_rights: "Derechos", account_rights_body: "Acceso, rectificación, supresión, oposición, limitación y portabilidad. También puedes reclamar ante la AEPD.",
    account_note: "Para ejercer tus derechos o resolver dudas: {contact}. En un despliegue institucional con datos reales, coordina antes con la delegación de protección de datos correspondiente.",
    privacy_export: "Descargar mis datos", privacy_delete: "Eliminar mi cuenta", privacy_login_manage: "Inicia sesión para gestionar tus datos.",
    delete_account_title: "Eliminar cuenta", delete_warning: "Esta acción es irreversible. Se borrarán tu perfil, sesiones, objetos, favoritos y solicitudes propias. Confirma tu contraseña.",
    delete_password: "Contraseña actual", delete_confirm_btn: "Eliminar definitivamente",
    legal_kicker: "Documento informativo", legal_updated: "Última actualización", legal_version: "Versión", legal_print: "Imprimir / guardar PDF",
    back_home: "Volver al inicio", legal_contact_label: "Contacto",
    legal_title: "Aviso legal", legal_lead: "Información general sobre Circular Campus, su naturaleza independiente y el uso de este sitio.",
    privacy_title: "Política de privacidad y datos", privacy_lead: "Aviso en capas: aquí tienes el resumen y el detalle del tratamiento de datos personales.",
    terms_title: "Condiciones de uso", terms_lead: "Reglas para participar como particular en un prototipo de reutilización sin pagos gestionados por la plataforma.",
    hero_chip_1: "Sin pagos ni comisiones", hero_chip_2: "Datos mínimos", hero_chip_3: "Proyecto independiente",
    type_badge_regalar: "Regalar", type_badge_prestar: "Prestar", type_badge_intercambiar: "Intercambiar", type_badge_vender: "Vender",
    nav_my: "Mi área", nav_points_short: "Puntos", nav_rules_short: "Normas",
    filters_btn: "Filtros", filters_title: "Filtros y orden", filters_subtitle: "Ajusta campus, estado, tipo y orden de los resultados.",
    filters_apply: "Ver resultados", filters_clear: "Limpiar todo", sort_by: "Ordenar por",
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
    faculty: "Facultad",
    fac_none: "Sin especificar",
    fac_ingenieria: "Ingeniería",
    fac_ciencias: "Ciencias",
    fac_salud: "Salud",
    fac_sociales: "Ciencias sociales",
    fac_humanidades: "Humanidades",
    fac_artes: "Artes",
    f_faculty: "Facultad (opcional)",
    hand_conserjeria: "Conserjería",
    points_conserjeria_t: "Conserjería",
    points_conserjeria_b: "Punto de información a la entrada, con personal y zona de paso.",
    impact_title: "Impacto de la comunidad",
    impact_lead: "Estimación a partir de los objetos que ya han cambiado de manos.",
    impact_reused: "objetos reutilizados",
    impact_kg: "kg de residuos evitados (est.)",
    impact_savings: "€ de ahorro estimado",
    impact_note: "Cifras orientativas por categoría: no son una medición ni una auditoría.",
    impact_my_title: "Tu impacto",
    impact_item: "Reutilizarlo evita unos {kg} kg de residuos y {eur} € de gasto (estimación).",
    estimate_word: "estimación",
    trust_panel_title: "Confianza y trayectoria",
    verified_badge: "Estudiante verificado",
    rating_aria: "Valoración: {n} de 5 ({c} valoraciones)",
    rating_none: "Sin valoraciones todavía",
    rating_none_short: "sin valoraciones",
    ratings_received: "Valoraciones recibidas",
    ratings_none: "Todavía no hay valoraciones de este perfil.",
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
    badge_verified: "Estudiante verificado",
    badge_first_delivery: "Primera entrega",
    badge_five_exchanges: "Cinco intercambios",
    badge_ten_kg: "10 kg evitados",
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
    status_help: "Reservado indica que ya hay un acuerdo; entregado cierra el intercambio y suma a tu impacto.",
    req_handover: "Punto propuesto",
    request_point: "Punto de encuentro",
    request_point_hint: "Elige un sitio público y concurrido; podéis ajustarlo al aceptar.",
    req_rated: "Valorado con {n}/5",
    my_impact_error: "No se pudo cargar tu impacto.",
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
    footer_tag: "Reuse and exchange of second-life materials.",
    footer_independent: "Independent project. Not an official service of any university.",
    footer_explore: "Explore", footer_legal: "Legal information", footer_legal_notice: "Legal notice",
    footer_privacy: "Privacy & data", footer_terms: "Terms of use", footer_presented: "Presented at",
    footer_payment_mini: "No payments inside the platform",
    footer_note: "Non-profit prototype · no analytics · no third-party resources · sample images are local.",
    credit_label: "Project team", payment_eyebrow: "Payments", noscript: "Circular Campus needs JavaScript to show the catalogue and manage your account.",
    title_home: "Browse", title_publish: "List an item", title_points: "Handover points", title_rules: "Rules & trust",
    title_about: "The project", title_my: "My area", title_legal: "Legal notice", title_privacy: "Privacy & data", title_terms: "Terms of use",
    hero_eyebrow: "Reuse made simple", hero_title: "What you no longer use can still have a good story.",
    hero_lead: "Circular Campus is an independent prototype for listing, finding and giving a second life to books, clothing, furniture and study materials. List, search and arrange handover in a public place.",
    hero_search_ph: "Search books, clothing, furniture…", hero_search_btn: "Search", publish_cta: "List an item",
    stat_items: "items listed", stat_available: "available now", stat_delivered: "handovers marked", stat_users: "accounts created",
    payment_banner_title: "No payment gateway",
    payment_banner_body: "Circular Campus does not process payments, charge fees, hold funds or guarantee items. “Sell” shows an indicative price only: any payment is agreed directly between private individuals, outside the platform.",
    all: "All", search: "Search", filters: "Filters", campus: "Campus", condition: "Condition", type: "Type", sort: "Sort",
    sort_recent: "Most recent", sort_price_asc: "Price: low to high", sort_price_desc: "Price: high to low",
    results: "items", no_results: "No items match those filters. Try another search or list yours.",
    free: "Free", price_orientative: "Indicative price", view_item: "View", items_word: "items",
    how_title: "How it works", how_1_t: "1. List", how_1_b: "A real photo, an honest condition and a handover point. No personal data in the description.",
    how_2_t: "2. Search & request", how_2_b: "Filter by category, campus and condition. Send a short request message.",
    how_3_t: "3. Meet in public", how_3_b: "Choose a safe public place and mark the item as handed over when you are done.",
    trust_title: "Built with clear choices", trust_1: "Explicit consent, legal notice, privacy policy and terms in three languages.",
    trust_2: "Account export and deletion in My area; no analytics, third-party cookies or trackers.",
    trust_3: "Local images, no payment gateway, no fees or held funds. Impact figures are transparent estimates by category.",
    login: "Log in", register: "Create account", logout: "Log out", my_area: "My area",
    my_items: "My items", my_requests: "My requests", received: "Received requests", favorites: "Favorites",
    publish_title: "List an item", publish_intro: "List as a private individual. Any price is indicative; Circular Campus does not handle payments.",
    f_title: "Title", f_desc: "Description", f_category: "Category", f_condition: "Condition", f_type: "Exchange type",
    f_campus: "Campus", f_handover: "Handover point", f_price: "Indicative price (€)", f_price_hint: "No payment happens here. Settle any amount directly, outside the platform.",
    f_image: "Item photo", f_image_hint: "Upload a real image. It is resized to 1200 px, converted to WebP and stripped of EXIF metadata (including location).",
    upload: "Upload image", f_private: "I confirm I am listing as a private individual", f_private_hint: "Professional sellers and regular commercial activity are not allowed.",
    desc_hint: "Describe marks, defects and what is included. Do not add phone numbers, addresses or contact details.",
    publish_btn: "List item", cancel: "Cancel", payment_notice_title: "Payment outside Circular Campus",
    payment_notice_body: "The platform does not intermediate or process payment. Arrange it directly at handover, in cash or by a direct person-to-person method. Circular Campus charges no fee, offers no refund and gives no guarantee.",
    detail_request: "Request", detail_fav: "Save", detail_faved: "Saved", request_title: "Request this item",
    request_msg: "Message for the other person (optional)", request_msg_ph: "Hi, I'm interested… can we meet somewhere public?",
    request_btn: "Send request", request_sent: "Request sent. The other person will see it in their area.",
    request_privacy: "Use this message only to coordinate the exchange. Do not share sensitive data.",
    owner: "Listed by", academic_email: "Academic domain", personal_email: "Personal email",
    identity_note: "The badge only describes the email domain: it does not prove enrolment, identity or institutional membership.",
    handover_label: "Handover at", loan_rules: "For a loan, agree the return date in writing in the request.",
    detail_payment_notice: "Indicative price. Any payment is agreed directly between private individuals outside Circular Campus; the platform does not charge, hold funds or mediate disputes.",
    detail_privacy_note: "Do not post contact details in the description; use the request and meet in a public place.",
    status_disponible: "Available", status_reservado: "Reserved", status_entregado: "Delivered",
    req_pendiente: "Pending", req_aceptada: "Accepted", req_rechazada: "Rejected", req_cancelada: "Cancelled", req_completada: "Completed",
    accept: "Accept", reject: "Reject", complete: "Mark delivered", cancel_req: "Cancel request",
    mark_available: "Mark available", mark_reserved: "Mark reserved", mark_delivered: "Mark delivered", delete_item: "Delete",
    points_title: "Handover points", points_lead: "These are suggestions for public, easy-to-find places. Always choose a busy location; if a physical space is set up, it must have authorisation from whoever manages it.",
    points_notice: "Circular Campus does not operate official points: these are orientation labels for arranging handover, not reserved spaces or institutional services.",
    rules_title: "Rules & trust", rules_lead: "A simple exchange works best with honest information, caution and a few clear rules.",
    about_title: "The project", about_lead: "Circular Campus is an independent prototype presented at CTC Congress to explore reuse of second-life materials.",
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
    toast_login: "Logged in. Welcome!", toast_register: "Account created. Welcome to Circular Campus!", toast_logout: "Logged out.",
    toast_error: "Something went wrong. Please try again.", toast_upload: "Image uploaded.", toast_own_item: "This is your item. Manage it in My area.",
    toast_account_exported: "Data exported.", toast_account_deleted: "Account and data deleted.", toast_consent_updated: "Consent updated.",
    toast_consent_required: "You must accept the policy and terms.", toast_private_required: "Confirm that you list as a private individual.",
    toast_invalid_image: "Use an image uploaded to Circular Campus.", toast_unauthorized: "Log in to continue.",
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
    rules_payment_title: "Payments outside the platform", rules_payment_body: "There is no payment gateway, wallet, deposit, commission or refund managed by Circular Campus. The price is indicative and any direct payment is agreed between private individuals outside the service.",
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
    account_data_title: "Your data, under your control", account_data_body: "See what your account stores, download a copy or erase it. Deletion removes your profile, sessions, listings, favorites and own requests.",
    account_email: "Email", account_campus: "Campus", account_consent: "Consent", account_consent_ok: "Current", account_consent_old: "Renewal pending",
    account_rights: "Rights", account_rights_body: "Access, rectification, erasure, objection, restriction and portability. You may also complain to the AEPD.",
    account_note: "To exercise your rights or ask a question: {contact}. In an institutional deployment with real data, coordinate first with the relevant data protection officer.",
    privacy_export: "Download my data", privacy_delete: "Delete my account", privacy_login_manage: "Log in to manage your data.",
    delete_account_title: "Delete account", delete_warning: "This action cannot be undone. Your profile, sessions, items, favorites and own requests will be deleted. Confirm your password.",
    delete_password: "Current password", delete_confirm_btn: "Delete permanently",
    legal_kicker: "Information document", legal_updated: "Last updated", legal_version: "Version", legal_print: "Print / save PDF",
    back_home: "Back to home", legal_contact_label: "Contact",
    legal_title: "Legal notice", legal_lead: "General information about Circular Campus, its independent nature and the use of this site.",
    privacy_title: "Privacy & data policy", privacy_lead: "Layered notice: here you have both the summary and the detail of personal-data processing.",
    terms_title: "Terms of use", terms_lead: "Rules for taking part as a private individual in a reuse prototype with no platform-managed payments.",
    hero_chip_1: "No payments or fees", hero_chip_2: "Minimal data", hero_chip_3: "Independent project",
    type_badge_regalar: "Give away", type_badge_prestar: "Lend", type_badge_intercambiar: "Exchange", type_badge_vender: "Sell",
    nav_my: "My area", nav_points_short: "Points", nav_rules_short: "Rules",
    filters_btn: "Filters", filters_title: "Filters & sorting", filters_subtitle: "Adjust campus, condition, type and result order.",
    filters_apply: "Show results", filters_clear: "Clear all", sort_by: "Sort by",
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
    faculty: "Faculty",
    fac_none: "Not specified",
    fac_ingenieria: "Engineering",
    fac_ciencias: "Sciences",
    fac_salud: "Health",
    fac_sociales: "Social sciences",
    fac_humanidades: "Humanities",
    fac_artes: "Arts",
    f_faculty: "Faculty (optional)",
    hand_conserjeria: "Reception desk",
    points_conserjeria_t: "Reception desk",
    points_conserjeria_b: "Information desk at the entrance, staffed and with foot traffic.",
    impact_title: "Community impact",
    impact_lead: "Estimate based on the items that have already changed hands.",
    impact_reused: "items reused",
    impact_kg: "kg of waste avoided (est.)",
    impact_savings: "estimated savings",
    impact_note: "Indicative figures by category: not a measurement or an audit.",
    impact_my_title: "Your impact",
    impact_item: "Reusing it avoids about {kg} kg of waste and {eur} € of spending (estimate).",
    estimate_word: "estimate",
    trust_panel_title: "Trust and track record",
    verified_badge: "Verified student",
    rating_aria: "Rating: {n} out of 5 ({c} reviews)",
    rating_none: "No ratings yet",
    rating_none_short: "no ratings",
    ratings_received: "Reviews received",
    ratings_none: "This profile has no reviews yet.",
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
    badge_verified: "Verified student",
    badge_first_delivery: "First handover",
    badge_five_exchanges: "Five exchanges",
    badge_ten_kg: "10 kg avoided",
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
    status_help: "Reserved means a deal is in place; delivered closes the exchange and adds to your impact.",
    req_handover: "Proposed point",
    request_point: "Handover point",
    request_point_hint: "Choose a public, busy place; you can adjust it when accepting.",
    req_rated: "Rated {n}/5",
    my_impact_error: "Could not load your impact.",
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
    footer_tag: "Reutilización e intercambio de materiais de segunda vida.",
    footer_independent: "Proxecto independente. Non é un servizo oficial de ningunha universidade.",
    footer_explore: "Explorar", footer_legal: "Información legal", footer_legal_notice: "Aviso legal",
    footer_privacy: "Privacidade e datos", footer_terms: "Condicións de uso", footer_presented: "Presentado en",
    footer_payment_mini: "Sen pagos dentro da plataforma",
    footer_note: "Prototipo sen ánimo de lucro · sen analítica · sen recursos de terceiros · as imaxes de exemplo son locais.",
    credit_label: "Equipo do proxecto", payment_eyebrow: "Pagos", noscript: "Circular Campus necesita JavaScript para amosar o catálogo e xestionar a conta.",
    title_home: "Explorar", title_publish: "Publicar", title_points: "Puntos de entrega", title_rules: "Normas e confianza",
    title_about: "O proxecto", title_my: "A miña área", title_legal: "Aviso legal", title_privacy: "Privacidade e datos", title_terms: "Condicións de uso",
    hero_eyebrow: "Reutilizar é sinxelo", hero_title: "O que xa non usas pode seguir tendo unha boa historia.",
    hero_lead: "Circular Campus é un prototipo independente para publicar, atopar e darlle unha segunda vida a libros, roupa, mobles e material de estudo. Publica, busca e acorda a entrega nun lugar público.",
    hero_search_ph: "Buscar libros, roupa, mobles…", hero_search_btn: "Buscar", publish_cta: "Publicar un obxecto",
    stat_items: "obxectos publicados", stat_available: "dispoñibles agora", stat_delivered: "entregas marcadas", stat_users: "contas creadas",
    payment_banner_title: "Sen pasarela de pago",
    payment_banner_body: "Circular Campus non procesa pagos, non cobra comisións, non custodia cartos nin garante obxectos. «Vender» amosa só un prezo orientativo: calquera pago acórdase directamente entre particulares, fóra da plataforma.",
    all: "Todo", search: "Buscar", filters: "Filtros", campus: "Campus", condition: "Estado", type: "Tipo", sort: "Ordenar",
    sort_recent: "Máis recentes", sort_price_asc: "Prezo: de menor a maior", sort_price_desc: "Prezo: de maior a menor",
    results: "obxectos", no_results: "Non hai obxectos con eses filtros. Proba con outra busca ou publica o teu.",
    free: "De balde", price_orientative: "Prezo orientativo", view_item: "Ver", items_word: "obxectos",
    how_title: "Como funciona", how_1_t: "1. Publica", how_1_b: "Foto real, estado honesto e punto de entrega. Sen datos persoais na descrición.",
    how_2_t: "2. Busca e solicita", how_2_b: "Filtra por categoría, campus e estado. Envía unha solicitude cunha mensaxe breve.",
    how_3_t: "3. Queda en público", how_3_b: "Escollede un lugar seguro e marcade como entregado ao rematar.",
    trust_title: "Deseñado con criterios claros", trust_1: "Consentimento explícito, aviso legal, privacidade e condicións en tres idiomas.",
    trust_2: "Exportación e supresión de conta na Miña área; sen analítica, cookies de terceiros nin rastrexadores.",
    trust_3: "Imaxes locais, sen pasarela de pago, sen comisións nin fondos retidos. As cifras de impacto son estimacións transparentes por categoría.",
    login: "Iniciar sesión", register: "Crear conta", logout: "Pechar sesión", my_area: "A miña área",
    my_items: "Os meus obxectos", my_requests: "As miñas solicitudes", received: "Solicitudes recibidas", favorites: "Favoritos",
    publish_title: "Publicar un obxecto", publish_intro: "Publica como particular. O prezo, se o hai, é orientativo; Circular Campus non xestiona cobros.",
    f_title: "Título", f_desc: "Descrición", f_category: "Categoría", f_condition: "Estado", f_type: "Tipo de intercambio",
    f_campus: "Campus", f_handover: "Punto de entrega", f_price: "Prezo orientativo (€)", f_price_hint: "Aquí non se cobra. O importe acórdase directamente e fóra da plataforma.",
    f_image: "Foto do obxecto", f_image_hint: "Sube unha imaxe real. Redimensiónase a 1200 px, convértese a WebP e elimínanse os metadatos EXIF (incluída a localización).",
    upload: "Subir imaxe", f_private: "Confirmo que publico como particular", f_private_hint: "Non se admiten vendedores profesionais nin actividade comercial habitual.",
    desc_hint: "Describe marcas, defectos e que inclúe. Non escribas teléfonos, enderezos nin datos de contacto.",
    publish_btn: "Publicar obxecto", cancel: "Cancelar", payment_notice_title: "Pago fóra de Circular Campus",
    payment_notice_body: "A plataforma non intermedia nin procesa o pago. Acordádeo directamente na entrega, en efectivo ou cun medio directo entre particulares. Non hai comisión, reembolso nin garantía de Circular Campus.",
    detail_request: "Solicitar", detail_fav: "Gardar", detail_faved: "Gardado", request_title: "Solicitar este obxecto",
    request_msg: "Mensaxe para a outra persoa (opcional)", request_msg_ph: "Ola, interésame… podemos quedar nun lugar público?",
    request_btn: "Enviar solicitude", request_sent: "Solicitude enviada. A outra persoa veraa na súa área.",
    request_privacy: "Usa esta mensaxe só para coordinar o intercambio. Non compartas datos sensibles.",
    owner: "Publicado por", academic_email: "Dominio académico", personal_email: "Correo persoal",
    identity_note: "A insignia describe só o dominio do correo: non acredita matrícula, identidade nin pertenza institucional.",
    handover_label: "Entrega en", loan_rules: "Se é un préstamo, acordade por escrito a data de devolución na solicitude.",
    detail_payment_notice: "Prezo orientativo. Calquera pago acórdase directamente entre particulares, fóra de Circular Campus; a plataforma non cobra, retén fondos nin media en disputas.",
    detail_privacy_note: "Non publiques datos de contacto na descrición; usa a solicitude e queda nun lugar público.",
    status_disponible: "Dispoñible", status_reservado: "Reservado", status_entregado: "Entregado",
    req_pendiente: "Pendente", req_aceptada: "Aceptada", req_rechazada: "Rexeitada", req_cancelada: "Cancelada", req_completada: "Completada",
    accept: "Aceptar", reject: "Rexeitar", complete: "Marcar entregado", cancel_req: "Cancelar solicitude",
    mark_available: "Marcar dispoñible", mark_reserved: "Marcar reservado", mark_delivered: "Marcar entregado", delete_item: "Eliminar",
    points_title: "Puntos de entrega", points_lead: "Estas son suxestións de lugares públicos e doados de atopar. Escollede sempre un sitio concorrido e, se alguén habilita un espazo físico, debe contar coa autorización de quen o xestiona.",
    points_notice: "Circular Campus non habilita puntos oficiais: son etiquetas orientativas para acordar a entrega, non espazos reservados nin servizos institucionais.",
    rules_title: "Normas e confianza", rules_lead: "Un intercambio sinxelo funciona mellor con información honesta, prudencia e regras pequenas e claras.",
    about_title: "O proxecto", about_lead: "Circular Campus é un prototipo independente presentado en CTC Congress para explorar a reutilización de materiais de segunda vida.",
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
    toast_login: "Sesión iniciada. Benvido/a!", toast_register: "Conta creada. Benvido/a a Circular Campus!", toast_logout: "Sesión pechada.",
    toast_error: "Algo saíu mal. Inténtao de novo.", toast_upload: "Imaxe subida.", toast_own_item: "Este é o teu obxecto. Xestióao na Miña área.",
    toast_account_exported: "Datos exportados.", toast_account_deleted: "Conta e datos eliminados.", toast_consent_updated: "Consentimento actualizado.",
    toast_consent_required: "Debes aceptar a política e as condicións.", toast_private_required: "Confirma que publicas como particular.",
    toast_invalid_image: "Usa unha imaxe subida a Circular Campus.", toast_unauthorized: "Inicia sesión para continuar.",
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
    rules_payment_title: "Pagos fóra da plataforma", rules_payment_body: "Non hai pasarela de pago, moedeiro, depósito, comisión nin reembolso xestionado por Circular Campus. O prezo é orientativo e calquera pago directo acórdase entre particulares, fóra do servizo.",
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
    account_data_title: "Os teus datos, baixo o teu control", account_data_body: "Consulta que garda a túa conta, descarga unha copia ou elimínaa. A supresión borra perfil, sesións, publicacións, favoritos e solicitudes propias.",
    account_email: "Email", account_campus: "Campus", account_consent: "Consentimento", account_consent_ok: "Vixente", account_consent_old: "Pendente de renovar",
    account_rights: "Dereitos", account_rights_body: "Acceso, rectificación, supresión, oposición, limitación e portabilidade. Tamén podes reclamar ante a AEPD.",
    account_note: "Para exercer os teus dereitos ou resolver dúbidas: {contact}. Nun despregue institucional con datos reais, coordina antes coa delegación de protección de datos correspondente.",
    privacy_export: "Descargar os meus datos", privacy_delete: "Eliminar a miña conta", privacy_login_manage: "Inicia sesión para xestionar os teus datos.",
    delete_account_title: "Eliminar conta", delete_warning: "Esta acción é irreversible. Borraranse o perfil, sesións, obxectos, favoritos e solicitudes propias. Confirma o contrasinal.",
    delete_password: "Contrasinal actual", delete_confirm_btn: "Eliminar definitivamente",
    legal_kicker: "Documento informativo", legal_updated: "Última actualización", legal_version: "Versión", legal_print: "Imprimir / gardar PDF",
    back_home: "Volver ao inicio", legal_contact_label: "Contacto",
    legal_title: "Aviso legal", legal_lead: "Información xeral sobre Circular Campus, a súa natureza independente e o uso deste sitio.",
    privacy_title: "Política de privacidade e datos", privacy_lead: "Aviso por capas: aquí tes o resumo e o detalle do tratamento de datos persoais.",
    terms_title: "Condicións de uso", terms_lead: "Regras para participar como particular nun prototipo de reutilización sen pagos xestionados pola plataforma.",
    hero_chip_1: "Sen pagos nin comisións", hero_chip_2: "Datos mínimos", hero_chip_3: "Proxecto independente",
    type_badge_regalar: "Regalar", type_badge_prestar: "Prestar", type_badge_intercambiar: "Intercambiar", type_badge_vender: "Vender",
    nav_my: "A miña área", nav_points_short: "Puntos", nav_rules_short: "Normas",
    filters_btn: "Filtros", filters_title: "Filtros e orde", filters_subtitle: "Axusta campus, estado, tipo e orde dos resultados.",
    filters_apply: "Ver resultados", filters_clear: "Limpar todo", sort_by: "Ordenar por",
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
    faculty: "Facultade",
    fac_none: "Sen especificar",
    fac_ingenieria: "Enxeñaría",
    fac_ciencias: "Ciencias",
    fac_salud: "Saúde",
    fac_sociales: "Ciencias sociais",
    fac_humanidades: "Humanidades",
    fac_artes: "Artes",
    f_faculty: "Facultade (opcional)",
    hand_conserjeria: "Conserxería",
    points_conserjeria_t: "Conserxería",
    points_conserjeria_b: "Punto de información á entrada, con persoal e zona de paso.",
    impact_title: "Impacto da comunidade",
    impact_lead: "Estimación a partir dos obxectos que xa cambiaron de mans.",
    impact_reused: "obxectos reutilizados",
    impact_kg: "kg de residuos evitados (est.)",
    impact_savings: "€ de aforro estimado",
    impact_note: "Cifras orientativas por categoría: non son unha medición nin unha auditoría.",
    impact_my_title: "O teu impacto",
    impact_item: "Reutilizalo evita uns {kg} kg de residuos e {eur} € de gasto (estimación).",
    estimate_word: "estimación",
    trust_panel_title: "Confianza e traxectoria",
    verified_badge: "Estudante verificado",
    rating_aria: "Valoración: {n} de 5 ({c} valoracións)",
    rating_none: "Sen valoracións aínda",
    rating_none_short: "sen valoracións",
    ratings_received: "Valoracións recibidas",
    ratings_none: "Aínda non hai valoracións deste perfil.",
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
    badge_verified: "Estudante verificado",
    badge_first_delivery: "Primeira entrega",
    badge_five_exchanges: "Cinco intercambios",
    badge_ten_kg: "10 kg evitados",
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
    status_help: "Reservado indica que xa hai un acordo; entregado pecha o intercambio e suma ao teu impacto.",
    req_handover: "Punto proposto",
    request_point: "Punto de encontro",
    request_point_hint: "Escolle un sitio público e concorrido; podedes axustalo ao aceptar.",
    req_rated: "Valorado con {n}/5",
    my_impact_error: "Non se puido cargar o teu impacto.",
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
      { h: "1. Identificación", p: ["El responsable editorial de este prototipo es {controller}. Contacto: {contact}. Circular Campus es el nombre visible del proyecto; no es una sociedad, una tienda ni un servicio administrativo."] },
      { h: "2. Naturaleza independiente", p: ["Circular Campus es un prototipo sin ánimo de lucro presentado en CTC Congress. No utiliza marcas, logotipos ni denominaciones institucionales como propias, y no se presenta como un servicio oficial, avalado o gestionado por ninguna universidad.", "Las denominaciones Vigo, Pontevedra y Ourense se usan únicamente como etiquetas geográficas para organizar entregas."] },
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
      { h: "7. Derechos", p: ["Puedes ejercer acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad. La exportación descarga tus datos propios en JSON; la supresión elimina perfil, sesiones, publicaciones, favoritos y solicitudes propias.", "Escríbenos a {contact}. Si consideras que no se atiende tu solicitud, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD)."] },
      { h: "8. Seguridad y limitaciones", p: ["Se usan contraseñas con hash, tokens de sesión aleatorios, validación en servidor, una política de contenido local y cabeceras de seguridad. No se almacenan contraseñas en texto plano ni se exponen emails en perfiles públicos.", "Este prototipo no verifica matrícula, identidad ni titularidad de los objetos; no dispone de moderación ni reportes. Antes de un despliegue institucional con datos reales, coordina con la delegación de protección de datos correspondiente y realiza una evaluación de riesgos."] },
      { h: "9. Menores", p: ["El servicio está pensado para personas adultas. No se recoge fecha de nacimiento y no se admite el registro de menores de 14 años. Si eres menor de edad, no publiques datos personales ni quedes sin acompañamiento."] },
      { h: "10. Cookies, analítica y recursos de terceros", p: ["No se usan cookies de sesión, cookies publicitarias, analítica, píxeles ni rastreadores. El idioma y el token se guardan en el almacenamiento local del navegador; puedes borrarlos desde su configuración.", "Las imágenes de ejemplo y de categoría se sirven desde este mismo dominio. Para privacidad, no se aceptan URL de imágenes externas en las publicaciones."] },
      { h: "11. Fotografías", p: ["Las fotos de objetos que subas pueden contener datos personales si muestras cartas, pantallas, etiquetas o documentos: revísalas antes de publicar.", "La fotografía de grupo de la página del proyecto forma parte de los materiales del proyecto. Las imágenes de personas son datos personales; si apareces en ella y deseas que se retire, escribe a {contact}."] },
      { h: "12. Valoraciones e impacto", p: ["Tras una entrega completada, ambas partes pueden puntuar de 1 a 5 y dejar un comentario opcional. Se guardan la puntuación, el comentario, la fecha y el vínculo con el intercambio; la media aparece en el perfil público junto al nombre visible de quien valora.", "Las cifras de impacto (objetos reutilizados, kilos evitados y ahorro estimado) se calculan en el servidor a partir de estimaciones por categoría. No proceden de mediciones ni de terceros y no se usan para publicidad ni para decisiones automatizadas."] },
      { h: "13. Cambios", p: ["Los cambios relevantes se reflejarán en el número de versión {version} y en la fecha {updated}. La versión vigente se muestra también en el registro y en Mi área."] },
    ],
    terms: [
      { h: "1. Qué es el servicio", p: ["Circular Campus es un prototipo independiente para que personas particulares publiquen, busquen y soliciten objetos de segunda vida: regalar, prestar, intercambiar o indicar un precio orientativo.", "No es una tienda, un marketplace profesional, un servicio de mensajería, una entidad de pago ni un servicio oficial de ninguna institución."] },
      { h: "2. Independencia y ausencia de verificación", p: ["El proyecto no usa marcas institucionales ni afirma contar con aval, autorización o verificación oficial. La insignia de dominio académico, cuando aparece, es automática y meramente informativa: no comprueba matrícula, identidad ni pertenencia.", "Cualquier punto físico de entrega necesitaría autorización de quien gestione ese espacio. Las etiquetas de puntos de esta web son solo sugerencias."] },
      { h: "3. Cuenta y consentimiento", p: ["Puedes registrarte con cualquier email válido. Debes marcar expresamente la casilla de aceptación de {privacyLink} y {termsLink}, usar una contraseña propia y no compartirla.", "La sesión caduca a los {days} días. Eres responsable de la información que publicas y de mantener tu contraseña en secreto."] },
      { h: "4. Publicaciones permitidas", p: ["Solo se admiten anuncios ocasionales de particulares. Quedan fuera vendedores profesionales, actividad comercial habitual, artículos prohibidos, productos que requieran requisitos especiales y contenido que incluya datos personales de terceros.", "Describe el estado con honestidad, sube una foto real del objeto y no escribas teléfonos, direcciones ni datos bancarios en la descripción."] },
      { h: "5. Pagos fuera de la plataforma", p: ["Circular Campus no procesa pagos, no cobra comisiones, no retiene fondos, no ofrece depósito en garantía, no emite reembolsos, no garantiza objetos ni media en disputas. «Vender» es solo un precio orientativo y un motivo para contactar.", "Si hay contraprestación, se acuerda directamente entre particulares fuera de la plataforma, por ejemplo en efectivo o mediante un pago directo persona a persona en la entrega. Cada persona asume su propio cumplimiento legal y fiscal: la venta habitual o profesional puede activar obligaciones de consumo, IVA, IRPF, LSSI y prevención de blanqueo."] },
      { h: "6. Entregas y solicitudes", p: ["La solicitud sirve para coordinar el intercambio. Elegid un lugar público y concurrido, comprobad el objeto antes de aceptarlo y acordad por escrito la devolución si es un préstamo.", "No hay envíos por correo gestionados por Circular Campus. Marca el objeto como entregado solo cuando la entrega real haya terminado."] },
      { h: "7. Usos prohibidos", p: ["Prohibido publicar datos de contacto en abierto, suplantar identidades, acosar, estafar, vender como profesional, eludir la validación de imágenes, introducir URL externas o intentar usar la plataforma como monedero, escrow o sistema de comisiones.", "Prohibido subir contenido ilegal, peligroso, discriminatorio o que vulnere derechos de terceros."] },
      { h: "8. Responsabilidad", p: ["Circular Campus ofrece una herramienta técnica de publicación y solicitud, pero no verifica objetos, no participa en los acuerdos y no responde por su cumplimiento, estado, precio, pago, devolución o daños.", "El prototipo puede tener errores, reiniciarse o perder datos en un alojamiento gratuito efímero. No lo uses como único repositorio de información importante."] },
      { h: "9. Datos y supresión", p: ["El tratamiento de datos se describe en {privacyLink}. Puedes descargar una copia y eliminar la cuenta desde Mi área, o escribir a {contact}.", "La supresión elimina perfil, sesiones, publicaciones, favoritos y solicitudes propias; no crea una copia de respaldo."] },
      { h: "11. Valoraciones e impacto", p: ["Solo se puede valorar un intercambio cuando la entrega figura como completada. Las valoraciones son públicas, no se editan y deben describir la entrega sin insultos, datos personales ni acusaciones no contrastadas.", "Las cifras de impacto son orientativas y no constituyen una certificación ambiental ni económica."] },
      { h: "11. Cambios y ley aplicable", p: ["Podemos actualizar estas condiciones para reflejar cambios técnicos o legales; la versión vigente es {version}, de {updated}.", "Estas condiciones se interpretan conforme a la normativa española y europea aplicable, en particular RGPD, LOPDGDD y LSSI cuando corresponda. No constituyen asesoramiento jurídico, fiscal o de consumo."] },
    ],
  },
  en: {
    legal: [
      { h: "1. Identification", p: ["The editorial controller of this prototype is {controller}. Privacy contact: {contact}. Circular Campus is the visible project name; it is not a company, a shop or an administrative service."] },
      { h: "2. Independent nature", p: ["Circular Campus is a non-profit prototype presented at CTC Congress. It does not use institutional names, logos or brands as its own and does not present itself as an official, endorsed or managed service of any university.", "Vigo, Pontevedra and Ourense are used only as geographic labels to organise handovers."] },
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
      { h: "7. Rights", p: ["You may exercise access, rectification, erasure, objection, restriction and portability. Export downloads your own data as JSON; erasure deletes the profile, sessions, listings, favorites and own requests.", "Write to {contact}. If your request is not satisfied, you may complain to the Spanish Data Protection Agency (AEPD)."] },
      { h: "8. Security and limitations", p: ["Passwords are hashed, session tokens are random, inputs are validated server-side, resources are local and security headers are set. Passwords are never stored in plain text and emails are not exposed in public profiles.", "This prototype does not verify enrolment, identity or ownership; it has no moderation or reports. Before an institutional deployment with real data, coordinate with the relevant data protection officer and complete a risk assessment."] },
      { h: "9. Minors", p: ["The service is intended for adults. No date of birth is collected and registration by children under 14 is not accepted. Minors should not post personal data or attend handovers unaccompanied."] },
      { h: "10. Cookies, analytics and third-party resources", p: ["No session cookies, advertising cookies, analytics, pixels or trackers are used. Language and token are stored in browser local storage and can be cleared in browser settings.", "Sample and category images are served from this same domain. For privacy, external image URLs are not accepted in listings."] },
      { h: "11. Photographs", p: ["Photos you upload may contain personal data if they show letters, screens, labels or documents: check them before publishing.", "The group photo on the project page is part of the project materials. Images of people are personal data; if you appear in it and want it removed, write to {contact}."] },
      { h: "12. Ratings and impact", p: ["After a completed handover, both parties may rate from 1 to 5 and leave an optional comment. The score, comment, date and link to the exchange are stored; the average appears on the public profile next to the rater's display name.", "Impact figures (items reused, kilograms avoided and estimated savings) are calculated on the server from category estimates. They do not come from measurements or third parties and are not used for advertising or automated decisions."] },
      { h: "13. Changes", p: ["Material changes will be reflected in version {version} and date {updated}. The current version is also shown at registration and in My area."] },
    ],
    terms: [
      { h: "1. What the service is", p: ["Circular Campus is an independent prototype for private individuals to list, find and request second-life items: give away, lend, exchange or show an indicative price.", "It is not a shop, a professional marketplace, a courier service, a payment entity or an official service of any institution."] },
      { h: "2. Independence and no verification", p: ["The project uses no institutional branding and claims no official endorsement, authorisation or verification. An academic-domain badge, when shown, is automatic and informative only: it does not check enrolment, identity or membership.", "Any physical handover point would need authorisation from whoever manages the space. The point labels on this site are suggestions only."] },
      { h: "3. Account and consent", p: ["You may register with any valid email. You must explicitly tick the box accepting {privacyLink} and {termsLink}, use your own password and keep it secret.", "Sessions expire after {days} days. You are responsible for the information you publish and for your password."] },
      { h: "4. Permitted listings", p: ["Only occasional listings by private individuals are allowed. Professional sellers, regular commercial activity, prohibited goods, regulated items requiring special conditions and content containing third-party personal data are excluded.", "Describe condition honestly, upload a real photo and do not put phone numbers, addresses or bank details in the description."] },
      { h: "5. Payments outside the platform", p: ["Circular Campus does not process payments, charge fees, hold funds, provide escrow, issue refunds, guarantee items or mediate disputes. “Sell” is only an indicative price and a reason to make contact.", "Any consideration is agreed directly between private individuals outside the platform, for example in cash or by a direct person-to-person payment at handover. Each person remains responsible for their own legal and tax duties: regular or professional selling can trigger consumer, VAT, income-tax, LSSI and anti-money-laundering obligations."] },
      { h: "6. Handovers and requests", p: ["The request coordinates the exchange. Choose a busy public place, inspect the item before accepting it and agree a return date in writing for a loan.", "Circular Campus does not manage postal shipping. Mark an item as delivered only after the real handover is complete."] },
      { h: "7. Prohibited uses", p: ["Do not post open contact details, impersonate others, harass, defraud, sell professionally, bypass image validation, insert external URLs or try to use the platform as a wallet, escrow or commission system.", "Do not upload illegal, dangerous, discriminatory content or material that infringes third-party rights."] },
      { h: "8. Liability", p: ["Circular Campus provides a technical listing and request tool, but does not verify items, take part in agreements or answer for their performance, condition, price, payment, return or damages.", "The prototype may contain errors, restart or lose data on a free ephemeral host. Do not use it as the only repository for important information."] },
      { h: "9. Data and erasure", p: ["Data processing is described in {privacyLink}. You can download a copy and delete your account from My area, or write to {contact}.", "Erasure removes the profile, sessions, listings, favorites and own requests; it does not create a backup copy."] },
      { h: "11. Ratings and impact", p: ["An exchange can only be rated once the handover is marked as completed. Ratings are public, cannot be edited and must describe the handover without insults, personal data or unverified accusations.", "Impact figures are indicative and are not an environmental or economic certification."] },
      { h: "11. Changes and applicable law", p: ["These terms may be updated to reflect technical or legal changes; the current version is {version}, dated {updated}.", "They are interpreted under applicable Spanish and EU law, in particular GDPR, LOPDGDD and LSSI where relevant. They are not legal, tax or consumer advice."] },
    ],
  },
  gl: {
    legal: [
      { h: "1. Identificación", p: ["O responsable editorial deste prototipo é {controller}. Contacto de privacidade: {contact}. Circular Campus é o nome visible do proxecto; non é unha sociedade, unha tenda nin un servizo administrativo."] },
      { h: "2. Natureza independente", p: ["Circular Campus é un prototipo sen ánimo de lucro presentado en CTC Congress. Non usa marcas, logotipos nin denominacións institucionais como propias, e non se presenta como un servizo oficial, avalado ou xestionado por ningunha universidade.", "As denominacións Vigo, Pontevedra e Ourense úsanse só como etiquetas xeográficas para organizar entregas."] },
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
      { h: "7. Dereitos", p: ["Podes exercer acceso, rectificación, supresión, oposición, limitación do tratamento e portabilidade. A exportación descarga os teus datos propios en JSON; a supresión elimina perfil, sesións, publicacións, favoritos e solicitudes propias.", "Escríbenos a {contact}. Se consideras que non se atende a túa solicitude, podes presentar unha reclamación ante a Axencia Española de Protección de Datos (AEPD)."] },
      { h: "8. Seguridade e limitacións", p: ["Úsanse contrasinais con hash, tokens de sesión aleatorios, validación no servidor, unha política de contido local e cabeceiras de seguridade. Non se almacenan contrasinais en texto plano nin se expoñen emails en perfís públicos.", "Este prototipo non verifica matrícula, identidade nin titularidade dos obxectos; non dispón de moderación nin reportes. Antes dun despregue institucional con datos reais, coordina coa delegación de protección de datos correspondente e realiza unha avaliación de riscos."] },
      { h: "9. Menores", p: ["O servizo está pensado para persoas adultas. Non se recolle data de nacemento e non se admite o rexistro de menores de 14 anos. Se es menor, non publiques datos persoais nin quedes sen acompañamento."] },
      { h: "10. Cookies, analítica e recursos de terceiros", p: ["Non se usan cookies de sesión, cookies publicitarias, analítica, píxeles nin rastrexadores. O idioma e o token gárdanse no almacenamento local do navegador; podes borralos desde a súa configuración.", "As imaxes de exemplo e de categoría sírvense desde este mesmo dominio. Para privacidade, non se aceptan URL de imaxes externas nas publicacións."] },
      { h: "11. Fotografías", p: ["As fotos de obxectos que subas poden conter datos persoais se amosan cartas, pantallas, etiquetas ou documentos: revísaas antes de publicar.", "A fotografía de grupo da páxina do proxecto forma parte dos materiais do proxecto. As imaxes de persoas son datos persoais; se apareces nela e desexas que se retire, escribe a {contact}."] },
      { h: "12. Valoracións e impacto", p: ["Tras unha entrega completada, ambas as partes poden puntuar de 1 a 5 e deixar un comentario opcional. Gárdanse a puntuación, o comentario, a data e o vínculo co intercambio; a media aparece no perfil público xunto ao nome visible de quen valora.", "As cifras de impacto (obxectos reutilizados, quilos evitados e aforro estimado) calcúlanse no servidor a partir de estimacións por categoría. Non proceden de medicións nin de terceiros e non se usan para publicidade nin para decisións automatizadas."] },
      { h: "13. Cambios", p: ["Os cambios relevantes reflectiranse no número de versión {version} e na data {updated}. A versión vixente tamén se amosa no rexistro e na Miña área."] },
    ],
    terms: [
      { h: "1. Que é o servizo", p: ["Circular Campus é un prototipo independente para que persoas particulares publiquen, busquen e soliciten obxectos de segunda vida: regalar, prestar, intercambiar ou indicar un prezo orientativo.", "Non é unha tenda, un marketplace profesional, un servizo de mensaxaría, unha entidade de pago nin un servizo oficial de ningunha institución."] },
      { h: "2. Independencia e ausencia de verificación", p: ["O proxecto non usa marcas institucionais nin afirma contar con aval, autorización ou verificación oficial. A insignia de dominio académico, cando aparece, é automática e só informativa: non comproba matrícula, identidade nin pertenza.", "Calquera punto físico de entrega necesitaría autorización de quen xestione ese espazo. As etiquetas de puntos desta web son só suxestións."] },
      { h: "3. Conta e consentimento", p: ["Podes rexistrarte con calquera email válido. Debes marcar expresamente a caixa de aceptación de {privacyLink} e {termsLink}, usar un contrasinal propio e non compartilo.", "A sesión caduca aos {days} días. Es responsable da información que publicas e de manter o contrasinal en segredo."] },
      { h: "4. Publicacións permitidas", p: ["Só se admiten anuncios ocasionais de particulares. Quedan fóra vendedores profesionais, actividade comercial habitual, artigos prohibidos, produtos con requisitos especiais e contido con datos persoais de terceiros.", "Describe o estado con honestidade, sube unha foto real e non escribas teléfonos, enderezos nin datos bancarios na descrición."] },
      { h: "5. Pagos fóra da plataforma", p: ["Circular Campus non procesa pagos, non cobra comisións, non retén fondos, non ofrece depósito en garantía, non emite reembolsos, non garante obxectos nin media en disputas. «Vender» é só un prezo orientativo e un motivo para contactar.", "Se hai contraprestación, acórdase directamente entre particulares fóra da plataforma, por exemplo en efectivo ou cun pago directo persoa a persoa na entrega. Cada persoa asume o seu propio cumprimento legal e fiscal: a venda habitual ou profesional pode activar obrigas de consumo, IVE, IRPF, LSSI e prevención de branqueo."] },
      { h: "6. Entregas e solicitudes", p: ["A solicitude serve para coordinar o intercambio. Escollede un lugar público e concorrido, comprobade o obxecto antes de aceptalo e acordade por escrito a devolución se é un préstamo.", "Non hai envíos por correo xestionados por Circular Campus. Marca o obxecto como entregado só cando a entrega real rematase."] },
      { h: "7. Usos prohibidos", p: ["Prohíbese publicar datos de contacto en aberto, suplantar identidades, acosar, estafar, vender como profesional, eludir a validación de imaxes, introducir URL externas ou intentar usar a plataforma como moedeiro, escrow ou sistema de comisións.", "Prohíbese subir contido ilegal, perigoso, discriminatorio ou que vulnere dereitos de terceiros."] },
      { h: "8. Responsabilidade", p: ["Circular Campus ofrece unha ferramenta técnica de publicación e solicitude, pero non verifica obxectos, non participa nos acordos e non responde polo seu cumprimento, estado, prezo, pago, devolución ou danos.", "O prototipo pode ter erros, reiniciarse ou perder datos nun aloxamento gratuíto efémero. Non o uses como único repositorio de información importante."] },
      { h: "9. Datos e supresión", p: ["O tratamento de datos descríbese en {privacyLink}. Podes descargar unha copia e eliminar a conta na Miña área, ou escribir a {contact}.", "A supresión elimina perfil, sesións, publicacións, favoritos e solicitudes propias; non crea unha copia de respaldo."] },
      { h: "11. Valoracións e impacto", p: ["Só se pode valorar un intercambio cando a entrega figura como completada. As valoracións son públicas, non se editan e deben describir a entrega sen insultos, datos persoais nin acusacións non contrastadas.", "As cifras de impacto son orientativas e non constitúen unha certificación ambiental nin económica."] },
      { h: "11. Cambios e lei aplicable", p: ["Podemos actualizar estas condicións para reflectir cambios técnicos ou legais; a versión vixente é {version}, de {updated}.", "Estas condicións interprétanse conforme á normativa española e europea aplicable, en particular RGPD, LOPDGDD e LSSI cando corresponda. Non constitúen asesoramento xurídico, fiscal ou de consumo."] },
    ],
  }
};

const CATEGORIES = ["libros", "ropa", "muebles", "estudio", "electronica", "cocina", "electrodomesticos", "deporte", "otros"];
const CONDITIONS = ["nuevo", "como_nuevo", "bueno", "usable"];
const TYPES = ["regalar", "prestar", "intercambiar", "vender"];
const CAMPUSES = ["vigo", "pontevedra", "ourense"];
const HANDOVERS = ["biblioteca", "conserjeria", "cafeteria", "entrada", "punto", "acordado"];
const FACULTIES = ["ingenieria", "ciencias", "salud", "sociales", "humanidades", "artes"];

const initialLang = ["es", "en", "gl"].includes(localStorage.getItem("cc_lang"))
  ? localStorage.getItem("cc_lang") : "es";
const state = {
  lang: initialLang,
  user: null,
  token: localStorage.getItem("cc_token") || null,
  view: BOOT.view || PATH_VIEWS[location.pathname] || "home",
  myTab: "items",
  filters: { q: "", category: "", campus: "", condition: "", type: "", faculty: "", sort: "recent" },
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
const facLabel = (c) => t("fac_" + c);
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

/* ---------------- Toasts ---------------- */
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
    <button type="button" class="toast-close" aria-label="${esc(t("close_toast"))}">${icon("close")}</button>
    <span class="toast-progress" style="animation-duration:${TOAST_DURATION}ms" aria-hidden="true"></span>`;
  el.querySelector(".toast-msg").textContent = message;
  const dismiss = () => {
    if (!el.isConnected || el.classList.contains("is-leaving")) return;
    el.classList.add("is-leaving");
    setTimeout(() => el.remove(), 220);
  };
  el.querySelector(".toast-close").onclick = dismiss;
  root.appendChild(el);
  const timer = setTimeout(dismiss, TOAST_DURATION);
  el.addEventListener("mouseenter", () => clearTimeout(timer), { once: true });
  return el;
}

/* ---------------- Estados vacíos / esqueletos ---------------- */
function emptyState({ iconName = "leaf", title = "", text = "", actions = [] }) {
  return `<div class="empty">
    <span class="empty-icon" aria-hidden="true">${icon(iconName)}</span>
    <h3>${esc(title)}</h3>
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
        <div class="skeleton sk-line w-90"></div>
        <div class="skeleton sk-line w-45"></div>
        <div class="sk-row"><div class="skeleton sk-pill"></div><div class="skeleton sk-pill short"></div></div>
        <div class="skeleton sk-line w-70"></div>
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
  return Array.from({ length: 4 }, () => `
    <div class="stat-card" aria-hidden="true">
      <div class="skeleton sk-stat-icon"></div>
      <div class="sk-stat-body"><div class="skeleton sk-line sk-num"></div>
      <div class="skeleton sk-line sk-stat-label"></div></div>
    </div>`).join("");
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
        b.setAttribute("aria-label", d.is_favorite ? t("detail_faved") : t("detail_fav"));
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
function closeUserMenu() {
  const menu = $("#user-menu");
  const chip = $("#user-chip");
  if (menu && !menu.classList.contains("hidden")) {
    menu.classList.add("hidden");
    if (chip) chip.setAttribute("aria-expanded", "false");
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
    const firstName = esc((state.user.name || "").trim().split(/\s+/)[0] || t("my_area"));
    area.innerHTML = `
      <div class="dropdown">
        <button type="button" class="user-chip" id="user-chip" aria-haspopup="menu" aria-expanded="false" aria-controls="user-menu">
          <span class="avatar" aria-hidden="true">${initials}</span>
          <span class="user-name">${firstName}</span>
          ${state.demo ? `<span class="demo-badge">${esc(t("demo_badge"))}</span>` : ""}
          ${icon("chevron")}
        </button>
        <div class="dropdown-menu hidden" id="user-menu" role="menu" aria-labelledby="user-chip">
          <button type="button" role="menuitem" id="menu-my">${icon("grid")}${esc(t("my_area"))}</button>
          <button type="button" role="menuitem" id="menu-publish">${icon("plus")}${esc(t("nav_publish"))}</button>
          <button type="button" role="menuitem" id="menu-password">${icon("shield")}${esc(t("menu_password"))}</button>
          <button type="button" role="menuitem" id="menu-privacy">${icon("shield")}${esc(t("footer_privacy"))}</button>
          <div class="menu-sep" role="separator"></div>
          <button type="button" role="menuitem" id="menu-logout" class="danger">${icon("logout")}${esc(t("logout"))}</button>
        </div>
      </div>`;
    const chip = $("#user-chip");
    const menu = $("#user-menu");
    const setOpen = (open) => {
      menu.classList.toggle("hidden", !open);
      chip.setAttribute("aria-expanded", String(open));
    };
    chip.onclick = (e) => {
      e.stopPropagation();
      setOpen(menu.classList.contains("hidden"));
    };
    $("#menu-my").onclick = () => { setOpen(false); navigate("my"); };
    $("#menu-publish").onclick = () => { setOpen(false); navigate("publish"); };
    $("#menu-password").onclick = () => { setOpen(false); openPasswordChange(); };
    $("#menu-privacy").onclick = () => { setOpen(false); navigate("privacy"); };
    $("#menu-logout").onclick = () => { setOpen(false); logout(); };
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

function openModal(html, opts = {}) {
  const dismissible = opts.dismissible !== false;
  lastFocused = document.activeElement;
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
  requestAnimationFrame(() => {
    try { target.focus({ preventScroll: true }); } catch (e) {}
  });
  return modal;
}

function closeModal() {
  if (state.pendingConsent) return;
  const root = $("#modal-root");
  if (!root || !root.firstElementChild) return;
  root.innerHTML = "";
  document.body.classList.remove("is-locked");
  if (lastFocused && lastFocused.isConnected) {
    try { lastFocused.focus({ preventScroll: true }); } catch (e) {}
  }
  lastFocused = null;
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
      render();
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
}

function openConsentUpdate() {
  state.pendingConsent = true;
  openModal(`
    <div class="modal-head">
      <h2 id="consent-title">${esc(t("consent_update_title"))}</h2>
      <p>${legalText(t("consent_update_body"))}</p>
    </div>
    <form id="consent-update-form" aria-labelledby="consent-title">
      <div class="consent-box">
        <label class="check-row"><input type="checkbox" name="consent" required><span>${legalText(t("consent_update_check"))}</span></label>
      </div>
      <button class="btn btn-primary btn-block btn-lg" type="submit" data-submit>${esc(t("consent_update_btn"))}</button>
    </form>`, { dismissible: false, labelledBy: "consent-title" });
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
  try { window.scrollTo({ top: 0, behavior: "auto" }); } catch (e) {}
  render();
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
  $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$("[data-nav]").forEach(el => {
    el.onclick = (e) => { e.preventDefault(); navigate(el.dataset.nav); };
    if (el.classList.contains("brand")) return;
    const active = el.dataset.nav === state.view;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  $$("a[data-route]").forEach(a => a.classList.toggle("active", a.dataset.route === state.view));
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
  if (f.faculty) params.set("faculty", f.faculty);
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
  setBusy(btn, true, t("loading_items"));
  try {
    const page = await fetchItemsPage(state.items.length);
    state.items = state.items.concat(page.items);
    const grid = $("#catalog-results .grid-items");
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
  } catch (err) {
    btn.dataset.busy = "";
    setBusy(btn, false);
    toast(errorMessage(err), "error");
  }
}

function hasFilters() {
  const f = state.filters;
  return Boolean(f.q || f.category || f.campus || f.condition || f.type || f.faculty);
}

function clearFilters() {
  state.filters.q = "";
  state.filters.category = "";
  state.filters.campus = "";
  state.filters.condition = "";
  state.filters.type = "";
  state.filters.faculty = "";
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

function impactBand(stats) {
  const imp = (stats && stats.impact) || { reused: 0, kg: 0, savings: 0 };
  const cells = [
    { icon: "refresh", value: fmtNum(imp.reused, 0), label: t("impact_reused") },
    { icon: "leaf", value: `${fmtNum(imp.kg, 1)} kg`, label: t("impact_kg") },
    { icon: "tag", value: `${fmtNum(imp.savings, 0)} €`, label: t("impact_savings") }
  ];
  return `<section class="impact-band" aria-labelledby="impact-title">
    <div class="impact-head">
      <h2 id="impact-title">${icon("leaf")}${esc(t("impact_title"))}</h2>
      <p>${esc(t("impact_lead"))}</p>
    </div>
    <div class="impact-grid">
      ${cells.map(c => `<div class="impact-cell">
        <span class="impact-icon" aria-hidden="true">${icon(c.icon)}</span>
        <div><strong>${esc(c.value)}</strong><span>${esc(c.label)}</span></div>
      </div>`).join("")}
    </div>
    <p class="impact-note">${icon("info")}<span>${esc(t("impact_note"))}</span></p>
  </section>`;
}

function impactCells(impact) {
  const imp = impact || { reused: 0, kg: 0, savings: 0 };
  return [
    { icon: "refresh", value: fmtNum(imp.reused, 0), label: t("impact_reused") },
    { icon: "leaf", value: `${fmtNum(imp.kg, 1)} kg`, label: t("impact_kg") },
    { icon: "tag", value: `${fmtNum(imp.savings, 0)} €`, label: t("impact_savings") }
  ].map(c => `<div class="impact-cell">
      <span class="impact-icon" aria-hidden="true">${icon(c.icon)}</span>
      <div><strong>${esc(c.value)}</strong><span>${esc(c.label)}</span></div>
    </div>`).join("");
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
    <h3 class="trust-sub">${esc(t("impact_my_title"))}</h3>
    <div class="impact-grid impact-grid-inline">${impactCells(data.impact)}</div>
    <h3 class="trust-sub">${esc(t("badges_title"))}</h3>
    <ul class="badge-row">
      ${badges.map(b => `<li class="badge-chip${b.earned ? " is-earned" : ""}">
        ${icon(b.earned ? "check-circle" : "shield")}${esc(t("badge_" + b.key))}
        <span class="sr-only"> — ${esc(b.earned ? t("badge_earned") : t("badge_locked"))}</span>
      </li>`).join("")}
    </ul>
    <p class="impact-note">${icon("info")}<span>${esc(t("impact_note"))}</span></p>
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
  openModal(`${closeBtn()}<div class="modal-head"><span class="eyebrow">${icon("leaf")}Circular Campus</span><h2 id="quick-guide-title">${esc(t("how_title"))}</h2></div>
    <div class="steps guide-steps">${[1, 2, 3].map(n => `<div class="step"><span class="step-num" aria-hidden="true">${n}</span><div><strong>${esc(t("how_" + n + "_t"))}</strong><p>${esc(t("how_" + n + "_b"))}</p></div></div>`).join("")}</div>
    <div class="modal-foot"><button type="button" class="btn btn-primary" data-close>${esc(t("browse_catalog"))}</button></div>`, { labelledBy: "quick-guide-title", sheet: true });
}

function activeFilterChips() {
  const f = state.filters;
  const items = [];
  if (f.q) items.push(`<span class="active-filter">«${esc(f.q)}»<button type="button" data-remove-filter="q" aria-label="${esc(t("filters_clear"))}">${icon("close")}</button></span>`);
  if (f.campus) items.push(`<span class="active-filter">${esc(campusLabel(f.campus))}<button type="button" data-remove-filter="campus" aria-label="${esc(t("filters_clear"))}">${icon("close")}</button></span>`);
  if (f.condition) items.push(`<span class="active-filter">${esc(condLabel(f.condition))}<button type="button" data-remove-filter="condition" aria-label="${esc(t("filters_clear"))}">${icon("close")}</button></span>`);
  if (f.type) items.push(`<span class="active-filter">${esc(typeLabel(f.type))}<button type="button" data-remove-filter="type" aria-label="${esc(t("filters_clear"))}">${icon("close")}</button></span>`);
  if (f.faculty) items.push(`<span class="active-filter">${esc(facLabel(f.faculty))}<button type="button" data-remove-filter="faculty" aria-label="${esc(t("filters_clear"))}">${icon("close")}</button></span>`);
  if (items.length > 1 || f.q) {
    items.push(`<button type="button" class="clear-link" id="clear-all-filters">${esc(t("filters_clear"))}</button>`);
  }
  return items.join("");
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
  const count = ["campus", "condition", "type", "faculty"].filter(k => state.filters[k]).length;
  const dot = $("#filter-dot");
  if (dot) {
    dot.textContent = count ? String(count) : "";
    dot.classList.toggle("hidden", !count);
  }
  const box = $("#active-filters");
  if (box) {
    box.innerHTML = activeFilterChips();
    $$("[data-remove-filter]", box).forEach(btn => {
      btn.onclick = () => {
        state.filters[btn.dataset.removeFilter] = "";
        if (btn.dataset.removeFilter === "q") { const q = $("#q"); if (q) q.value = ""; }
        refreshCatalog();
      };
    });
    const clear = $("#clear-all-filters", box);
    if (clear) clear.onclick = () => { clearFilters(); refreshCatalog(); };
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

function itemCard(it) {
  const isSale = it.exchange_type === "vender";
  const price = isSale ? `€${Number(it.price || 0).toFixed(0)}` : esc(t("free"));
  const saved = Boolean(it.is_favorite);
  const openLabel = `${t("view_item")}: ${it.title}`;
  return `
  <article class="card">
    <div class="card-media">
      <button type="button" class="card-media-open" data-view="${it.id}" aria-label="${esc(openLabel)}">
        ${responsiveImage(itemImage(it), { alt: it.title, category: it.category, sizes: "(max-width: 480px) 92vw, (max-width: 720px) 45vw, 300px" })}
      </button>
      <div class="card-badges">
        <span class="status-pill status-${esc(it.status)}">${esc(statusLabel(it.status))}</span>
        <span class="badge badge-cond">${esc(condLabel(it.condition))}</span>
        <span class="badge badge-type${isSale ? " is-sale" : ""}">${esc(typeBadge(it.exchange_type))}</span>
      </div>
      <button type="button" class="fav-btn${saved ? " active" : ""}" data-fav="${it.id}" aria-pressed="${saved}" aria-label="${esc(saved ? t("detail_faved") : t("detail_fav"))}: ${esc(it.title)}">${icon("heart")}</button>
    </div>
    <div class="card-body">
      <h3 class="card-title">${esc(it.title)}</h3>
      <div class="card-meta">
        <span class="pill">${esc(catLabel(it.category))}</span>
        <span class="card-location">${icon("pin")}${esc(campusLabel(it.campus))}${it.faculty ? ` · ${esc(facLabel(it.faculty))}` : ""}</span>
      </div>
      <p class="card-location">${icon("tag")}${esc(handLabel(it.handover_point))}</p>
      ${it.description ? `<p class="card-desc">${esc(it.description)}</p>` : ""}
      <div class="card-foot">
        <div>
          <span class="price${isSale ? "" : " is-free"}">${price}</span>
          ${isSale ? `<span class="price-sub">${esc(t("price_orientative"))}</span>` : ""}
        </div>
        <button type="button" class="card-cta" data-view="${it.id}">${esc(t("view_item"))}${icon("arrow")}</button>
      </div>
    </div>
  </article>`;
}

function congressMetrics(stats) {
  const s = stats || {};
  const active = Number(s.available) || 0;
  // Orientative estimates for active listings, not verified completed exchanges.
  const kg = active * 2;
  const euros = active * 15;
  const labels = state.lang === "en" ? ["active listings", "potential kg reused", "potential student savings"]
    : state.lang === "gl" ? ["anuncios dispoñibles", "kg potenciais reutilizados", "aforro potencial"]
    : ["artículos disponibles", "kg potenciales reutilizados", "ahorro potencial"];
  return `<div class="congress-metrics" role="group" aria-label="${esc(t("impact_title"))}">
    ${[active, `${kg} kg`, `${euros} €`].map((v, i) => `<div><strong>${esc(String(v))}</strong><span>${esc(labels[i])}</span></div>`).join("")}
  </div><p class="congress-estimate">${esc(state.lang === "en" ? "Illustrative estimate: 2 kg and €15 per active listing; not completed exchanges." : state.lang === "gl" ? "Estimación ilustrativa: 2 kg e 15 € por anuncio dispoñible; non son intercambios completados." : "Estimación ilustrativa: 2 kg y 15 € por artículo disponible; no son intercambios completados.")}</p>`;
}

function statsCards(stats) {
  const s = stats || { total_items: 0, available: 0, delivered: 0, users: 0 };
  const cells = [
    { icon: "leaf", value: s.total_items, label: t("stat_items") },
    { icon: "check-circle", value: s.available, label: t("stat_available") },
    { icon: "shield", value: s.delivered, label: t("stat_delivered") },
    { icon: "user", value: s.users, label: t("stat_users") }
  ];
  return cells.map(c => `
    <div class="stat-card">
      <span class="stat-icon" aria-hidden="true">${icon(c.icon)}</span>
      <div><strong>${Number(c.value) || 0}</strong><span>${esc(c.label)}</span></div>
    </div>`).join("");
}

function option(value, label, selected) {
  return `<option value="${esc(value)}"${selected ? " selected" : ""}>${esc(label)}</option>`;
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
        <label for="fl-faculty">${esc(t("faculty"))}</label>
        <select id="fl-faculty" name="faculty">
          ${option("", `${t("faculty")}: ${t("all")}`, !f.faculty)}
          ${FACULTIES.map(c => option(c, facLabel(c), f.faculty === c)).join("")}
        </select>
      </div>
      <div class="field">
        <label for="fl-sort">${esc(t("sort_by"))}</label>
        <select id="fl-sort" name="sort">
          ${option("recent", t("sort_recent"), f.sort === "recent")}
          ${option("price_asc", t("sort_price_asc"), f.sort === "price_asc")}
          ${option("price_desc", t("sort_price_desc"), f.sort === "price_desc")}
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
    state.filters.faculty = fd.get("faculty") || "";
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
    readForm();
    closeModal();
    refreshCatalog({ quiet: true });
  };
  $("#filters-reset").onclick = () => {
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
          <div class="hero-ctas"><a class="btn btn-primary" href="#catalog-results">${esc(t("browse_catalog"))}${icon("arrow")}</a><button class="btn btn-ghost" type="button" id="hero-publish">${icon("plus")}${esc(t("publish_cta"))}</button></div>
          <form class="searchbar" id="hero-search" role="search" aria-label="${esc(t("search"))}">
            <div class="search-input">
              ${icon("search")}
              <label class="sr-only" for="q">${esc(t("search"))}</label>
              <input id="q" type="search" placeholder="${esc(t("hero_search_ph"))}" value="${esc(f.q)}" autocomplete="off">
            </div>
            <label class="sr-only" for="campus-sel">${esc(t("campus"))}</label>
            <select id="campus-sel">
              ${option("", `${t("campus")}: ${t("all")}`, !f.campus)}
              ${CAMPUSES.map(c => option(c, campusLabel(c), f.campus === c)).join("")}
            </select>
            <button class="btn btn-primary" type="submit">${esc(t("hero_search_btn"))}</button>
            <button class="btn btn-ghost" type="button" id="go-publish">${icon("plus")}${esc(t("publish_cta"))}</button>
          </form>
          <ul class="hero-badges">
            <li>${icon("shield")}${esc(t("hero_chip_1"))}</li>
            <li>${icon("user")}${esc(t("hero_chip_2"))}</li>
            <li>${icon("leaf")}${esc(t("hero_chip_3"))}</li>
          </ul>
        </div>
        ${responsiveImage("/static/img/hero-reuse.jpg", { cls: "hero-art", priority: true, lazy: false, fallback: "/static/img/items/placeholder.jpg", sizes: "(max-width: 960px) 92vw, 460px" })}
      </div>
      <div id="congress-metrics">${state.stats ? congressMetrics(state.stats) : ""}</div>
      <div class="stats-row" id="hero-stats">${state.stats ? statsCards(state.stats) : statSkeleton()}</div>
      <div id="impact-band">${state.stats ? impactBand(state.stats) : ""}</div>
    </section>

    <div class="catalog-toolbar">
      <div class="chips-scroll" id="cat-filters" role="group" aria-label="${esc(t("filters"))}">${categoryChips()}</div>
      <div class="chips-scroll operation-scroll" id="operation-filters" role="group" aria-label="${esc(t("type"))}">${operationChips()}</div>
      <div class="toolbar-actions">
        <button type="button" class="filter-btn" id="open-filters" aria-haspopup="dialog">
          ${icon("sliders")}${esc(t("filters_btn"))}<span class="filter-dot hidden" id="filter-dot" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    <div class="catalog-meta">
      <p class="results-count" id="results-count" role="status" aria-live="polite">${esc(t("loading_items"))}</p>
      <div class="active-filters" id="active-filters"></div>
    </div>

    <div id="catalog-results"><div class="grid grid-items">${skeletonCards(6)}</div></div>

    <div class="two-col mt-8">
      <div class="info-card">
        <h3>${esc(t("how_title"))}</h3>
        <div class="steps">
          ${[1, 2, 3].map(n => `<div class="step">
            <span class="step-num" aria-hidden="true">${n}</span>
            <div><strong>${esc(t("how_" + n + "_t"))}</strong><p>${esc(t("how_" + n + "_b"))}</p></div>
          </div>`).join("")}
        </div>
      </div>
      <div class="info-card">
        <h3>${esc(t("trust_title"))}</h3>
        <ul class="clean-list">
          <li>${icon("check")}${esc(t("trust_1"))}</li>
          <li>${icon("check")}${esc(t("trust_2"))}</li>
          <li>${icon("check")}${esc(t("trust_3"))}</li>
        </ul>
        <p class="legal-inline">${legalText(t("about_p3"))}</p>
      </div>
    </div>

    <div class="notice payment-banner" role="note">
      <span class="notice-icon" aria-hidden="true">€</span>
      <div><strong>${esc(t("payment_banner_title"))}</strong><p>${esc(t("payment_banner_body"))}</p></div>
    </div>`);

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
    const toolbar = $(".catalog-toolbar");
    if (toolbar) {
      const top = toolbar.getBoundingClientRect().top + window.scrollY - 12;
      if (window.scrollY < top - 80) window.scrollTo({ top, behavior: "smooth" });
    }
    const q = $("#q");
    if (q && window.innerWidth < 720) q.blur();
  };
  $("#campus-sel").onchange = () => { readHero(); refreshCatalog(); };
  $("#go-publish").onclick = () => navigate("publish");
  $("#hero-publish").onclick = () => navigate("publish");
  $$("#cat-filters .chip").forEach(b => {
    b.onclick = () => {
      state.filters.category = b.dataset.cat || "";
      refreshCatalog();
    };
  });
  $$("#operation-filters .chip").forEach(b => {
    b.onclick = () => { state.filters.type = b.dataset.operation; refreshCatalog({ quiet: true }); };
  });
  $("#open-filters").onclick = openFilters;

  syncFilterUI();
  refreshCatalog();
  if (!state.stats) {
    fetchStats().then(stats => {
      const box = $("#hero-stats");
      if (box && stats) box.innerHTML = statsCards(stats);
      const metrics = $("#congress-metrics");
      if (metrics && stats) metrics.innerHTML = congressMetrics(stats);
      const impact = $("#impact-band");
      if (impact && stats) impact.innerHTML = impactBand(stats);
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
        title: t("need_login_publish"),
        text: t("publish_intro"),
        actions: [{ id: "login", label: t("login"), icon: "user" }]
      })}`);
    bindEmptyActions(app, { login: () => openAuth("login") });
    return;
  }

  setApp(app, `
    <div class="page-head">
      <span class="eyebrow">${icon("plus")}${esc(t("nav_publish"))}</span>
      <h1>${esc(t("publish_title"))}</h1>
      <p class="lead">${esc(t("publish_intro"))}</p>
    </div>
    <form class="form-shell" id="publish-form">
      <div class="form-section">
        <div class="section-head">
          <h3>${esc(t("form_quick"))}</h3>
          <span class="time-chip">${icon("clock")}${esc(t("form_quick_hint"))}</span>
        </div>
        <div class="field">
          <span class="field-label">${esc(t("f_image"))} <span class="req-mark" aria-hidden="true">*</span><span class="sr-only">${esc(t("required_word"))}</span></span>
          <label class="upload-zone" id="upload-zone" for="img-file">
            ${icon("camera")}
            <strong>${esc(t("photo_drop_t"))}</strong>
            <span>${esc(t("photo_drop_b"))}</span>
            <input type="file" id="img-file" accept="image/jpeg,image/png,image/webp">
          </label>
          <input type="hidden" id="img-url" value="">
          <div class="upload-preview-wrap" id="preview-wrap">
            <img id="img-preview" class="upload-preview" alt="">
            <button type="button" class="upload-remove" id="img-remove">${icon("trash")}${esc(t("photo_remove"))}</button>
          </div>
          <div class="upload-status hidden" id="upload-status" role="status" aria-live="polite"></div>
          <small>${esc(t("image_required_hint"))}</small>
        </div>
        <div class="field">
          <label for="p-title">${esc(t("f_title"))} <span class="req-mark" aria-hidden="true">*</span></label>
          <input id="p-title" name="title" required minlength="3" maxlength="80" placeholder="${esc(t("title_ph"))}" autocomplete="off">
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="p-category">${esc(t("f_category"))} <span class="req-mark" aria-hidden="true">*</span></label>
            <select id="p-category" name="category">${CATEGORIES.map(c => option(c, catLabel(c))).join("")}</select>
          </div>
          <div class="field">
            <label for="p-type">${esc(t("f_type"))} <span class="req-mark" aria-hidden="true">*</span></label>
            <select id="p-type" name="exchange_type">${TYPES.map(c => option(c, typeLabel(c))).join("")}</select>
          </div>
          <div class="field hidden" id="price-field">
            <label for="p-price">${esc(t("f_price"))}</label>
            <input id="p-price" name="price" type="number" min="0" max="10000" step="1" value="0" inputmode="numeric">
            <small>${esc(t("f_price_hint"))}</small>
          </div>
        </div>
        <div class="notice hidden" id="payment-notice" role="note">
          <span class="notice-icon" aria-hidden="true">€</span>
          <div><strong>${esc(t("payment_notice_title"))}</strong><p>${esc(t("payment_notice_body"))}</p></div>
        </div>
      </div>

      <details class="form-optional" id="optional-details">
        <summary>
          ${icon("sliders")}
          <span class="summary-text"><strong>${esc(t("form_optional"))}</strong><small>${esc(t("form_optional_hint"))}</small></span>
          ${icon("chevron")}
        </summary>
        <div class="form-section form-section-flush">
          <div class="field">
            <label for="p-desc">${esc(t("f_desc_optional"))}</label>
            <textarea id="p-desc" name="description" maxlength="2000"></textarea>
            <div class="field-hint"><span>${esc(t("desc_hint"))}</span><span class="counter" id="desc-counter">0/2000</span></div>
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="p-condition">${esc(t("f_condition"))}</label>
              <select id="p-condition" name="condition">${CONDITIONS.map(c => option(c, condLabel(c), c === "bueno")).join("")}</select>
            </div>
            <div class="field">
              <label for="p-campus">${esc(t("f_campus"))}</label>
              <select id="p-campus" name="campus">${CAMPUSES.map(c => option(c, campusLabel(c), state.user.campus === c)).join("")}</select>
            </div>
            <div class="field">
              <label for="p-faculty">${esc(t("f_faculty"))}</label>
              <select id="p-faculty" name="faculty">${option("", t("fac_none"), true)}${FACULTIES.map(c => option(c, facLabel(c))).join("")}</select>
            </div>
            <div class="field">
              <label for="p-handover">${esc(t("f_handover"))}</label>
              <select id="p-handover" name="handover_point">${HANDOVERS.map(c => option(c, handLabel(c), c === "acordado")).join("")}</select>
            </div>
          </div>
        </div>
      </details>

      <div class="form-section">
        <div class="consent-box">
          <label class="check-row"><input type="checkbox" name="private_seller" id="p-private" required><span>${esc(t("f_private"))}</span></label>
          <p>${esc(t("f_private_hint"))}</p>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary btn-lg" type="submit" id="publish-submit">${icon("plus")}${esc(t("publish_btn"))}</button>
          <button class="btn btn-ghost btn-lg" type="button" id="pub-cancel">${esc(t("cancel"))}</button>
        </div>
      </div>
    </form>`);

  const counter = $("#desc-counter");
  const desc = $("#p-desc");
  const updateCounter = () => {
    const n = desc.value.length;
    counter.textContent = `${n}/2000`;
    counter.classList.toggle("is-near", n > 1700);
  };
  desc.addEventListener("input", updateCounter);
  updateCounter();

  const syncType = () => {
    const sale = $("#p-type").value === "vender";
    $("#price-field").classList.toggle("hidden", !sale);
    $("#payment-notice").classList.toggle("hidden", !sale);
  };
  $("#p-type").onchange = syncType;
  syncType();

  const zone = $("#upload-zone");
  const fileInput = $("#img-file");
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
    } catch (err) {
      status.classList.add("hidden");
      previewWrap.classList.remove("is-visible");
      $("#img-url").value = "";
      toast(errorMessage(err), "error");
    }
  };

  fileInput.onchange = () => uploadFile(fileInput.files[0]);
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
    previewWrap.classList.remove("is-visible");
    preview.removeAttribute("src");
    status.classList.add("hidden");
  };
  $("#pub-cancel").onclick = () => navigate("home");

  $("#publish-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.private_seller = fd.get("private_seller") === "on";
    payload.image_url = $("#img-url").value || "";
    payload.price = payload.exchange_type === "vender" ? Number(payload.price || 0) : 0;
    const submit = $("#publish-submit");
    if (!payload.image_url) {
      toast(t("toast_image_required"), "error");
      const zone = $("#upload-zone");
      if (zone) {
        zone.classList.add("is-missing");
        zone.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(() => zone.classList.remove("is-missing"), 1400);
      }
      return;
    }
    setBusy(submit, true, t("publishing"));
    try {
      await api("/api/items", { method: "POST", body: JSON.stringify(payload) });
      toast(t("toast_published"));
      navigate("home");
    } catch (err) {
      setBusy(submit, false);
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
          <h3>${esc(t("points_" + p + "_t"))}</h3>
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
            <h3>${esc(t("rules_" + n + "_t"))}</h3>
            <p>${esc(t("rules_" + n + "_b"))}</p>
          </div>
        </article>`).join("")}
    </div>
    <div class="two-col mt-4">
      <div class="info-card">
        <span class="eyebrow">${esc(t("payment_eyebrow"))}</span>
        <h3>${esc(t("rules_payment_title"))}</h3>
        <p>${esc(t("rules_payment_body"))}</p>
      </div>
      <div class="info-card">
        <span class="eyebrow">${esc(t("account_rights"))}</span>
        <h3>${esc(t("rules_data_title"))}</h3>
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
        <h3 class="mt-5">${esc(t("about_pillars_title"))}</h3>
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
    a.download = `circular-campus-export-${(state.user && state.user.id) || "account"}.json`;
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
function renderLegalPage(app, kind) {
  const docs = LEGAL_DOCS[state.lang] || LEGAL_DOCS.es;
  const sections = docs[kind] || [];
  const rendered = sections.map(sec => `
    <section class="legal-section">
      <h2>${esc(sec.h)}</h2>
      ${(sec.p || []).map(p => `<p>${legalText(p)}</p>`).join("")}
      ${sec.ul ? `<ul>${sec.ul.map(li => `<li>${legalText(li)}</li>`).join("")}</ul>` : ""}
    </section>`).join("");
  setApp(app, `
    <article class="legal-doc">
      <header class="legal-head">
        ${responsiveImage("/static/img/circular-campus-lockup.png", { fallback: "/static/img/circular-campus-mark-white.png", sizes: "260px" })}
        <div>
          <span class="eyebrow">${icon("shield")}${esc(t("legal_kicker"))} · ${esc(CONFIG.service)}</span>
          <h1>${esc(t(kind + "_title"))}</h1>
          <p class="lead">${esc(t(kind + "_lead"))}</p>
          <p class="muted">${esc(t("legal_updated"))}: ${esc(CONFIG.legalUpdated)} · ${esc(t("legal_version"))}: ${esc(CONFIG.legalVersion)} · ${esc(t("legal_contact_label"))}: <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a></p>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" data-print>${icon("download")}${esc(t("legal_print"))}</button>
      </header>
      ${rendered}
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
        title: t("need_login"),
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
      ${MY_TABS.map(x => `<button type="button" role="tab" id="tab-${x.id}" aria-selected="${tab === x.id}" aria-controls="my-panel" data-tab="${x.id}">${esc(t(x.label))}</button>`).join("")}
    </div>
    <div id="my-panel" role="tabpanel" aria-labelledby="tab-${tab}" class="mt-4">
      ${skeletonRows(3)}
    </div>
    ${accountToolsHtml()}`);

  const editProfile = $("#edit-profile");
  if (editProfile) editProfile.onclick = openProfileEdit;
  $$(".segment [data-tab]").forEach(b => {
    b.onclick = () => { state.myTab = b.dataset.tab; state.myTabFocus = true; render(); };
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
    const data = await api("/api/impact/me");
    if (!box.isConnected) return;
    box.innerHTML = trustPanel(data);
    const bar = $("[data-level-bar]", box);
    const progress = Math.max(0, Math.min(100, Number((data.level || {}).progress) || 0));
    if (bar) bar.style.width = `${progress}%`;
  } catch (err) {
    if (box.isConnected) {
      box.innerHTML = `<p class="muted small">${icon("info")} ${esc(t("my_impact_error"))}</p>`;
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
          <label for="e-faculty">${esc(t("faculty"))}</label>
          <select id="e-faculty" name="faculty">
            ${option("", `${t("faculty")}: ${t("all")}`, !item.faculty)}
            ${FACULTIES.map(c => option(c, facLabel(c), item.faculty === c)).join("")}
          </select>
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
          faculty: fd.get("faculty") || "",
          handover_point: fd.get("handover_point"),
          price: Number(fd.get("price") || 0),
        }),
      });
      state.lastItem = data.item;
      closeModal();
      toast(t("edit_saved"));
      state.stats = null;
      if (state.view === "my") loadMyTab(state.myTab);
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
        <span class="status-pill status-${esc(r.status)}">${esc(reqLabel(r.status))}</span>
      </div>
      ${r.handover_point ? `<p class="list-card-meta">${icon("pin")}${esc(t("req_handover"))}: ${esc(handLabel(r.handover_point))}</p>` : ""}
      ${r.message ? `<p class="list-card-message">${esc(r.message)}</p>` : ""}
      ${r.my_rating ? `<p class="list-card-rating">${starsHtml(r.my_rating, 0, { withCount: false })}<span>${esc(t("req_rated").replace("{n}", String(r.my_rating)))}</span></p>` : ""}
      <div class="list-card-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-view="${r.item_id}">${icon("eye")}${esc(t("view_item"))}</button>
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

async function loadMyTab(tab) {
  const panel = $("#my-panel");
  if (!panel) return;
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
      render();
    } catch (err) {
      btn.disabled = false;
      toast(errorMessage(err), "error");
    }
  };
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
async function openItem(id) {
  const modal = openModal(`
    ${closeBtn()}
    <div class="skeleton sk-media-detail" aria-hidden="true"></div>
    <div class="skeleton sk-line w-70 sk-title" aria-hidden="true"></div>
    <div class="skeleton sk-line w-45 sk-subtitle" aria-hidden="true"></div>`,
    { sheet: true, label: t("view_item") });

  let it;
  try {
    const data = await api(`/api/items/${id}`);
    it = data.item;
  } catch (e) {
    closeModal();
    toast(errorMessage(e), "error");
    return;
  }
  if (!modal.isConnected) return;

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
    <div class="detail-media">
      ${responsiveImage(itemImage(it), { alt: it.title, category: it.category, lazy: false, sizes: "(max-width: 720px) 100vw, 640px" })}
      <button type="button" class="fav-btn${saved ? " active" : ""}" data-detail-fav aria-pressed="${saved}" aria-label="${esc(saved ? t("detail_faved") : t("detail_fav"))}">${icon("heart")}</button>
      <div class="card-badges badges-start">
        <span class="status-pill status-${esc(it.status)}">${esc(statusLabel(it.status))}</span>
      </div>
    </div>
    <h2 class="detail-title" id="detail-title">${esc(it.title)}</h2>
    <div class="detail-badges">
      <span class="pill">${esc(catLabel(it.category))}</span>
      <span class="pill grey">${esc(condLabel(it.condition))}</span>
      <span class="pill grey">${esc(typeLabel(it.exchange_type))}</span>
      <span class="pill grey">${esc(campusLabel(it.campus))}</span>
      ${it.faculty ? `<span class="pill grey">${icon("grid")}${esc(facLabel(it.faculty))}</span>` : ""}
    </div>
    <div class="detail-price-row">
      <div><span class="price">${price}</span>${isSale ? `<span class="price-sub">${esc(t("price_orientative"))}</span>` : ""}</div>
      <span class="card-location">${icon("pin")}${esc(t("handover_label"))}: ${esc(handLabel(it.handover_point))}</span>
    </div>
    <section class="detail-section">
      <h3>${esc(t("detail_description"))}</h3>
      <p class="detail-desc">${it.description ? esc(it.description) : `<span class="muted">${esc(t("detail_no_desc"))}</span>`}</p>
      <p class="impact-line">${icon("leaf")}<span>${esc(t("impact_item").replace("{kg}", fmtNum((it.impact || {}).kg, 1)).replace("{eur}", fmtNum((it.impact || {}).savings, 0)))}</span></p>
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
            <span>${icon("leaf")}${fmtNum((owner.impact || {}).kg, 1)} kg</span>
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
    ${!available && !isOwn ? `<p class="danger-text mt-4">${esc(t("detail_unavailable"))}</p>` : ""}
    <div class="detail-actions">
      ${isOwn
        ? `<button type="button" class="btn btn-primary" id="detail-edit">${icon("sliders")}${esc(t("edit_item"))}</button>
           <button type="button" class="btn btn-ghost" id="detail-manage">${icon("grid")}${esc(t("detail_manage"))}</button>`
        : `<button type="button" class="btn btn-primary" id="detail-request"${available ? "" : " disabled"}>${icon("inbox")}${esc(t("detail_request"))}</button>`}
      <button type="button" class="btn btn-ghost" id="detail-fav-btn" aria-pressed="${saved}">
        ${icon("heart")}<span id="detail-fav-label">${esc(saved ? t("detail_faved") : t("detail_fav"))}</span>
      </button>
    </div>
    ${isOwn ? "" : `<button type="button" class="report-link" id="detail-report">${icon("alert")}${esc(t("report_open"))}</button>`}
    ${isOwn && it.hidden ? `<p class="review-note">${icon("alert")}${esc(t("review_note").replace("{n}", String(it.reports || 0)))}</p>` : ""}`;
  enhance(modal);

  const toggleFav = async (btn) => {
    if (!state.user) { toast(t("need_login"), "info"); openAuth("login"); return; }
    btn.disabled = true;
    try {
      const d = await api(`/api/items/${id}/favorite`, { method: "POST" });
      toast(d.is_favorite ? t("toast_fav_on") : t("toast_fav_off"));
      $$("[data-detail-fav]", modal).forEach(b => {
        b.classList.toggle("active", d.is_favorite);
        b.setAttribute("aria-pressed", String(d.is_favorite));
      });
      const favTop = $("[data-detail-fav]", modal);
      if (favTop) favTop.setAttribute("aria-label", d.is_favorite ? t("detail_faved") : t("detail_fav"));
      const label = $("#detail-fav-label", modal);
      if (label) label.textContent = d.is_favorite ? t("detail_faved") : t("detail_fav");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      btn.disabled = false;
    }
  };
  const favTop = $("[data-detail-fav]", modal);
  if (favTop) favTop.onclick = () => toggleFav(favTop);
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
      await api(`/api/items/${itemId}/request`, { method: "POST", body: JSON.stringify({ message, handover_point }) });
      closeModal();
      toast(t("toast_request"));
    } catch (err) {
      setBusy(submit, false);
      toast(errorMessage(err), "error");
    }
  };
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
    };
  });

  let scrollTick = false;
  window.addEventListener("scroll", () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      document.body.classList.toggle("is-scrolled", window.scrollY > 6);
      scrollTick = false;
    });
  }, { passive: true });

  window.addEventListener("popstate", (e) => {
    state.view = (e.state && e.state.view) || PATH_VIEWS[location.pathname] || "home";
    render();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeUserMenu();
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
    render();
    if (!state.user.consent_ok) openConsentUpdate();
  } catch (e) {
    state.token = null;
    localStorage.removeItem("cc_token");
    renderAuthArea();
  }
}
document.addEventListener("DOMContentLoaded", init);

$("#quick-guide").addEventListener("click", openQuickGuide);
