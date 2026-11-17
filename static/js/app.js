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
  legalUpdated: BOOT.legalUpdated || "17 de noviembre de 2026",
  sessionDays: Number(BOOT.sessionDays) || 30,
  paymentOption: BOOT.paymentOption || "A",
};

const ROUTE_PATHS = {
  home: "/", publish: "/publicar", points: "/puntos", rules: "/normas",
  about: "/proyecto", my: "/mi-area", legal: "/aviso-legal",
  privacy: "/privacidad", terms: "/condiciones",
};
const PATH_VIEWS = Object.fromEntries(
  Object.entries(ROUTE_PATHS).map(([view, path]) => [path, view])
);

/* ---------------- i18n ---------------- */
const I18N = {
  es: {
    skip_content: "Saltar al contenido", close: "Cerrar", brand_tag: "Proyecto independiente · CTC Congress",
    nav_home: "Explorar", nav_publish: "Publicar", nav_points: "Puntos de entrega", nav_rules: "Normas y confianza", nav_about: "El proyecto",
    footer_tag: "Reutilización e intercambio de materiales de segunda vida.",
    footer_independent: "Proyecto independiente. No es un servicio oficial de ninguna universidad.",
    footer_explore: "Explorar", footer_legal: "Información legal", footer_legal_notice: "Aviso legal",
    footer_privacy: "Privacidad y datos", footer_terms: "Condiciones de uso", footer_presented: "Presentado en",
    footer_payment_mini: "Opción A · sin pagos dentro de la plataforma",
    footer_note: "Prototipo sin ánimo de lucro · sin analítica · sin recursos de terceros · las imágenes de ejemplo son locales.",
    credit_label: "Una idea de", noscript: "Circular Campus necesita JavaScript para mostrar el catálogo y gestionar la cuenta.",
    title_home: "Explorar", title_publish: "Publicar", title_points: "Puntos de entrega", title_rules: "Normas y confianza",
    title_about: "El proyecto", title_my: "Mi área", title_legal: "Aviso legal", title_privacy: "Privacidad y datos", title_terms: "Condiciones de uso",
    hero_eyebrow: "Reutilizar es sencillo", hero_title: "Lo que ya no usas puede seguir teniendo una buena historia.",
    hero_lead: "Circular Campus es un prototipo independiente para publicar, encontrar y dar una segunda vida a libros, ropa, muebles y material de estudio. Publica, busca y acuerda la entrega en un lugar público.",
    hero_search_ph: "Buscar libros, ropa, muebles…", hero_search_btn: "Buscar", publish_cta: "Publicar un objeto",
    stat_items: "objetos publicados", stat_available: "disponibles ahora", stat_delivered: "entregas marcadas", stat_users: "cuentas creadas",
    payment_banner_title: "Opción A · sin pasarela de pago",
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
    trust_3: "Imágenes locales, sin PSP, sin comisiones, sin fondos retenidos y sin promesas de impacto inventadas.",
    login: "Iniciar sesión", register: "Crear cuenta", logout: "Cerrar sesión", my_area: "Mi área",
    my_items: "Mis objetos", my_requests: "Mis solicitudes", received: "Solicitudes recibidas", favorites: "Favoritos",
    publish_title: "Publicar un objeto", publish_intro: "Publica como particular. El precio, si lo hay, es orientativo; Circular Campus no gestiona cobros.",
    f_title: "Título", f_desc: "Descripción", f_category: "Categoría", f_condition: "Estado", f_type: "Tipo de intercambio",
    f_campus: "Campus", f_handover: "Punto de entrega", f_price: "Precio orientativo (€)", f_price_hint: "No se cobra aquí. El importe se acuerda directamente y fuera de la plataforma.",
    f_image: "Foto del objeto", f_image_hint: "Sube una imagen real. No se permiten URL externas; evita que aparezcan datos personales.",
    upload: "Subir imagen", f_private: "Confirmo que publico como particular", f_private_hint: "No se admiten vendedores profesionales ni actividad comercial habitual.",
    desc_hint: "Describe marcas, defectos y qué incluye. No escribas teléfonos, direcciones ni datos de contacto.",
    publish_btn: "Publicar objeto", cancel: "Cancelar", payment_notice_title: "Pago fuera de Circular Campus",
    payment_notice_body: "Opción A: la plataforma no intermedia ni procesa el pago. Acordadlo directamente en la entrega, en efectivo o por un medio directo entre particulares. No hay comisión, reembolso ni garantía de Circular Campus.",
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
    auth_minimum: "Resumen: guardamos nombre, email, contraseña cifrada, campus y los contenidos que publiques. Puedes exportarlos o borrarlos desde Mi área.",
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
    rules_payment_title: "Opción A · pagos fuera de la plataforma", rules_payment_body: "No hay PSP, monedero, depósito, comisión ni reembolso gestionado por Circular Campus. El precio es orientativo y cualquier pago directo se acuerda entre particulares, fuera del servicio.",
    rules_data_title: "Datos mínimos", rules_data_body: "Solo pedimos lo necesario para la cuenta y la publicación. Puedes exportar tus datos o eliminar la cuenta; no usamos analítica ni publicidad de terceros.",
    points_biblioteca_t: "Biblioteca", points_biblioteca_b: "Zona de paso sencilla; queda en la entrada o recepción.",
    points_entrada_t: "Entrada principal", points_entrada_b: "Visible y fácil de encontrar entre clases.",
    points_cafeteria_t: "Cafetería", points_cafeteria_b: "Lugar concurrido antes o después de clase.",
    points_punto_t: "Punto público señalizado", points_punto_b: "Solo si el espacio está autorizado para dejar y recoger objetos.",
    points_acordado_t: "Lugar público acordado", points_acordado_b: "Acordad un sitio concreto, seguro y visible en el mensaje.",
    about_p1: "La idea es sencilla: facilitar que objetos en buen estado encuentren a otra persona antes de convertirse en residuo, sin crear una tienda, un monedero ni un servicio oficial.",
    about_p2: "La web permite publicar, buscar, guardar favoritos y solicitar materiales. La información sobre el estado y un punto de entrega claro sustituyen a las promesas comerciales: cada acuerdo es entre particulares.",
    about_p3: "Esta versión es un prototipo sin ánimo de lucro. Los objetos de ejemplo son ficticios, las imágenes son locales y el despliegue gratuito puede usar una base de datos efímera. No sustituye a una evaluación jurídica, fiscal o de protección de datos antes de un uso real con datos personales.",
    about_pillars_title: "Tres decisiones deliberadas", about_pillar_1: "Independencia: sin marca institucional ni afirmación de servicio oficial.",
    about_pillar_2: "Privacidad: consentimiento, minimización, exportación, supresión y cero rastreadores.",
    about_pillar_3: "Pagos: Opción A. Ninguna comisión ni custodia de fondos; acuerdos directos fuera de la plataforma.",
    photo_caption: "Foto de equipo aportada para el proyecto.", photo_privacy: "Si apareces en la imagen y prefieres que se retire, escríbenos.",
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
    lang_name: "Español",
  },
  en: {
    skip_content: "Skip to content", close: "Close", brand_tag: "Independent project · CTC Congress",
    nav_home: "Browse", nav_publish: "List an item", nav_points: "Handover points", nav_rules: "Rules & trust", nav_about: "The project",
    footer_tag: "Reuse and exchange of second-life materials.",
    footer_independent: "Independent project. Not an official service of any university.",
    footer_explore: "Explore", footer_legal: "Legal information", footer_legal_notice: "Legal notice",
    footer_privacy: "Privacy & data", footer_terms: "Terms of use", footer_presented: "Presented at",
    footer_payment_mini: "Option A · no payments inside the platform",
    footer_note: "Non-profit prototype · no analytics · no third-party resources · sample images are local.",
    credit_label: "An idea by", noscript: "Circular Campus needs JavaScript to show the catalogue and manage your account.",
    title_home: "Browse", title_publish: "List an item", title_points: "Handover points", title_rules: "Rules & trust",
    title_about: "The project", title_my: "My area", title_legal: "Legal notice", title_privacy: "Privacy & data", title_terms: "Terms of use",
    hero_eyebrow: "Reuse made simple", hero_title: "What you no longer use can still have a good story.",
    hero_lead: "Circular Campus is an independent prototype for listing, finding and giving a second life to books, clothing, furniture and study materials. List, search and arrange handover in a public place.",
    hero_search_ph: "Search books, clothing, furniture…", hero_search_btn: "Search", publish_cta: "List an item",
    stat_items: "items listed", stat_available: "available now", stat_delivered: "handovers marked", stat_users: "accounts created",
    payment_banner_title: "Option A · no payment gateway",
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
    trust_3: "Local images, no PSP, no fees, no held funds and no invented impact claims.",
    login: "Log in", register: "Create account", logout: "Log out", my_area: "My area",
    my_items: "My items", my_requests: "My requests", received: "Received requests", favorites: "Favorites",
    publish_title: "List an item", publish_intro: "List as a private individual. Any price is indicative; Circular Campus does not handle payments.",
    f_title: "Title", f_desc: "Description", f_category: "Category", f_condition: "Condition", f_type: "Exchange type",
    f_campus: "Campus", f_handover: "Handover point", f_price: "Indicative price (€)", f_price_hint: "No payment happens here. Settle any amount directly, outside the platform.",
    f_image: "Item photo", f_image_hint: "Upload a real image. External URLs are not allowed; avoid visible personal data.",
    upload: "Upload image", f_private: "I confirm I am listing as a private individual", f_private_hint: "Professional sellers and regular commercial activity are not allowed.",
    desc_hint: "Describe marks, defects and what is included. Do not add phone numbers, addresses or contact details.",
    publish_btn: "List item", cancel: "Cancel", payment_notice_title: "Payment outside Circular Campus",
    payment_notice_body: "Option A: the platform does not intermediate or process payment. Arrange it directly at handover, in cash or by a direct person-to-person method. Circular Campus charges no fee, offers no refund and gives no guarantee.",
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
    rules_payment_title: "Option A · payments outside the platform", rules_payment_body: "There is no PSP, wallet, deposit, commission or refund managed by Circular Campus. The price is indicative and any direct payment is agreed between private individuals outside the service.",
    rules_data_title: "Minimal data", rules_data_body: "We ask only for what the account and listing need. You can export your data or delete your account; we use no analytics or third-party advertising.",
    points_biblioteca_t: "Library", points_biblioteca_b: "Easy meeting spot; use the entrance or reception.",
    points_entrada_t: "Main entrance", points_entrada_b: "Visible and easy to find between classes.",
    points_cafeteria_t: "Cafeteria", points_cafeteria_b: "Busy place before or after class.",
    points_punto_t: "Marked public point", points_punto_b: "Only if the space is authorised for drop-off and pick-up.",
    points_acordado_t: "Agreed public place", points_acordado_b: "Agree a specific, safe and visible spot in the message.",
    about_p1: "The idea is simple: help usable items find another person before they become waste, without creating a shop, a wallet or an official service.",
    about_p2: "The site lets people list, search, save favorites and request materials. Honest condition details and a clear handover point replace commercial promises: each agreement is between private individuals.",
    about_p3: "This version is a non-profit prototype. Sample items are fictional, images are local and the free deployment may use an ephemeral database. It does not replace legal, tax or data-protection review before real use with personal data.",
    about_pillars_title: "Three deliberate decisions", about_pillar_1: "Independence: no institutional branding or claim of an official service.",
    about_pillar_2: "Privacy: consent, minimisation, export, erasure and zero trackers.",
    about_pillar_3: "Payments: Option A. No fees or held funds; direct agreements outside the platform.",
    photo_caption: "Team photo provided for the project.", photo_privacy: "If you appear in the image and would like it removed, contact us.",
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
    lang_name: "English",
  },
  gl: {
    skip_content: "Saltar ao contido", close: "Pechar", brand_tag: "Proxecto independente · CTC Congress",
    nav_home: "Explorar", nav_publish: "Publicar", nav_points: "Puntos de entrega", nav_rules: "Normas e confianza", nav_about: "O proxecto",
    footer_tag: "Reutilización e intercambio de materiais de segunda vida.",
    footer_independent: "Proxecto independente. Non é un servizo oficial de ningunha universidade.",
    footer_explore: "Explorar", footer_legal: "Información legal", footer_legal_notice: "Aviso legal",
    footer_privacy: "Privacidade e datos", footer_terms: "Condicións de uso", footer_presented: "Presentado en",
    footer_payment_mini: "Opción A · sen pagos dentro da plataforma",
    footer_note: "Prototipo sen ánimo de lucro · sen analítica · sen recursos de terceiros · as imaxes de exemplo son locais.",
    credit_label: "Unha idea de", noscript: "Circular Campus necesita JavaScript para amosar o catálogo e xestionar a conta.",
    title_home: "Explorar", title_publish: "Publicar", title_points: "Puntos de entrega", title_rules: "Normas e confianza",
    title_about: "O proxecto", title_my: "A miña área", title_legal: "Aviso legal", title_privacy: "Privacidade e datos", title_terms: "Condicións de uso",
    hero_eyebrow: "Reutilizar é sinxelo", hero_title: "O que xa non usas pode seguir tendo unha boa historia.",
    hero_lead: "Circular Campus é un prototipo independente para publicar, atopar e darlle unha segunda vida a libros, roupa, mobles e material de estudo. Publica, busca e acorda a entrega nun lugar público.",
    hero_search_ph: "Buscar libros, roupa, mobles…", hero_search_btn: "Buscar", publish_cta: "Publicar un obxecto",
    stat_items: "obxectos publicados", stat_available: "dispoñibles agora", stat_delivered: "entregas marcadas", stat_users: "contas creadas",
    payment_banner_title: "Opción A · sen pasarela de pago",
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
    trust_3: "Imaxes locais, sen PSP, sen comisións, sen fondos retidos e sen métricas de impacto inventadas.",
    login: "Iniciar sesión", register: "Crear conta", logout: "Pechar sesión", my_area: "A miña área",
    my_items: "Os meus obxectos", my_requests: "As miñas solicitudes", received: "Solicitudes recibidas", favorites: "Favoritos",
    publish_title: "Publicar un obxecto", publish_intro: "Publica como particular. O prezo, se o hai, é orientativo; Circular Campus non xestiona cobros.",
    f_title: "Título", f_desc: "Descrición", f_category: "Categoría", f_condition: "Estado", f_type: "Tipo de intercambio",
    f_campus: "Campus", f_handover: "Punto de entrega", f_price: "Prezo orientativo (€)", f_price_hint: "Aquí non se cobra. O importe acórdase directamente e fóra da plataforma.",
    f_image: "Foto do obxecto", f_image_hint: "Sube unha imaxe real. Non se permiten URL externas; evita datos persoais visibles.",
    upload: "Subir imaxe", f_private: "Confirmo que publico como particular", f_private_hint: "Non se admiten vendedores profesionais nin actividade comercial habitual.",
    desc_hint: "Describe marcas, defectos e que inclúe. Non escribas teléfonos, enderezos nin datos de contacto.",
    publish_btn: "Publicar obxecto", cancel: "Cancelar", payment_notice_title: "Pago fóra de Circular Campus",
    payment_notice_body: "Opción A: a plataforma non intermediou nin procesa o pago. Acordádeo directamente na entrega, en efectivo ou cun medio directo entre particulares. Non hai comisión, reembolso nin garantía de Circular Campus.",
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
    auth_minimum: "Resumo: gardamos nome, email, contrasinal cifrado, campus e os contidos que publiques. Podes exportalos ou borralos na Miña área.",
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
    rules_payment_title: "Opción A · pagos fóra da plataforma", rules_payment_body: "Non hai PSP, moedeiro, depósito, comisión nin reembolso xestionado por Circular Campus. O prezo é orientativo e calquera pago directo acórdase entre particulares, fóra do servizo.",
    rules_data_title: "Datos mínimos", rules_data_body: "Só pedimos o necesario para a conta e a publicación. Podes exportar os datos ou eliminar a conta; non usamos analítica nin publicidade de terceiros.",
    points_biblioteca_t: "Biblioteca", points_biblioteca_b: "Zona de paso sinxela; queda na entrada ou recepción.",
    points_entrada_t: "Entrada principal", points_entrada_b: "Visible e doado de atopar entre clases.",
    points_cafeteria_t: "Cafetería", points_cafeteria_b: "Lugar concorrido antes ou despois de clase.",
    points_punto_t: "Punto público sinalizado", points_punto_b: "Só se o espazo está autorizado para deixar e recoller obxectos.",
    points_acordado_t: "Lugar público acordado", points_acordado_b: "Acordade un sitio concreto, seguro e visible na mensaxe.",
    about_p1: "A idea é sinxela: facilitar que obxectos en bo estado atopen outra persoa antes de converterse en residuo, sen crear unha tenda, unha moedeira nin un servizo oficial.",
    about_p2: "A web permite publicar, buscar, gardar favoritos e solicitar materiais. A información sobre o estado e un punto de entrega claro substitúen as promesas comerciais: cada acordo é entre particulares.",
    about_p3: "Esta versión é un prototipo sen ánimo de lucro. Os obxectos de exemplo son ficticios, as imaxes son locais e o despregue gratuíto pode usar unha base de datos efémera. Non substitúe unha avaliación xurídica, fiscal ou de protección de datos antes dun uso real con datos persoais.",
    about_pillars_title: "Tres decisións deliberadas", about_pillar_1: "Independencia: sen marca institucional nin afirmación de servizo oficial.",
    about_pillar_2: "Privacidade: consentimento, minimización, exportación, supresión e cero rastrexadores.",
    about_pillar_3: "Pagos: Opción A. Ningunha comisión nin custodia de fondos; acordos directos fóra da plataforma.",
    photo_caption: "Foto de equipo achegada para o proxecto.", photo_privacy: "Se apareces na imaxe e prefires que se retire, escríbenos.",
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
      { h: "4. Contenidos y propiedad intelectual", p: ["El código, los textos, las ilustraciones vectoriales y el diseño se publican para este prototipo. La marca gráfica de CTC Congress y la fotografía de equipo se usan como materiales aportados para el proyecto; no se cede su titularidad.", "Los contenidos publicados por las personas usuarias siguen siendo suyos. Al publicar, permiten únicamente su mostrado dentro del servicio mientras la cuenta o el objeto existan."] },
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
      { h: "8. Seguridad y limitaciones", p: ["Se usan contraseñas con hash, tokens de sesión aleatorios, validación en servidor, una política de contenido local y cabeceras de seguridad. No se almacenan contraseñas en texto plano ni se exponen emails en perfiles públicos.", "Este prototipo no verifica matrícula, identidad ni titularidad de los objetos; aún no dispone de moderación, reportes ni chat en tiempo real. Antes de un despliegue institucional con datos reales, coordina con la delegación de protección de datos correspondiente y realiza una evaluación de riesgos."] },
      { h: "9. Menores", p: ["El servicio está pensado para personas adultas. No se recoge fecha de nacimiento y no se admite el registro de menores de 14 años. Si eres menor de edad, no publiques datos personales ni quedes sin acompañamiento."] },
      { h: "10. Cookies, analítica y recursos de terceros", p: ["No se usan cookies de sesión, cookies publicitarias, analítica, píxeles ni rastreadores. El idioma y el token se guardan en el almacenamiento local del navegador; puedes borrarlos desde su configuración.", "Las imágenes de ejemplo y de categoría se sirven desde este mismo dominio. Para privacidad, no se aceptan URL de imágenes externas en las publicaciones."] },
      { h: "11. Fotografías", p: ["Las fotos de objetos que subas pueden contener datos personales si muestras cartas, pantallas, etiquetas o documentos: revísalas antes de publicar.", "La fotografía de grupo de la página del proyecto se muestra porque fue aportada para CTC Congress. Las imágenes de personas son datos personales; si apareces en ella y deseas que se retire, escribe a {contact}."] },
      { h: "12. Cambios", p: ["Los cambios relevantes se reflejarán en el número de versión {version} y en la fecha {updated}. La versión vigente se muestra también en el registro y en Mi área."] },
    ],
    terms: [
      { h: "1. Qué es el servicio", p: ["Circular Campus es un prototipo independiente para que personas particulares publiquen, busquen y soliciten objetos de segunda vida: regalar, prestar, intercambiar o indicar un precio orientativo.", "No es una tienda, un marketplace profesional, un servicio de mensajería, una entidad de pago ni un servicio oficial de ninguna institución."] },
      { h: "2. Independencia y ausencia de verificación", p: ["El proyecto no usa marcas institucionales ni afirma contar con aval, autorización o verificación oficial. La insignia de dominio académico, cuando aparece, es automática y meramente informativa: no comprueba matrícula, identidad ni pertenencia.", "Cualquier punto físico de entrega necesitaría autorización de quien gestione ese espacio. Las etiquetas de puntos de esta web son solo sugerencias."] },
      { h: "3. Cuenta y consentimiento", p: ["Puedes registrarte con cualquier email válido. Debes marcar expresamente la casilla de aceptación de {privacyLink} y {termsLink}, usar una contraseña propia y no compartirla.", "La sesión caduca a los {days} días. Eres responsable de la información que publicas y de mantener tu contraseña en secreto."] },
      { h: "4. Publicaciones permitidas", p: ["Solo se admiten anuncios ocasionales de particulares. Quedan fuera vendedores profesionales, actividad comercial habitual, artículos prohibidos, productos que requieran requisitos especiales y contenido que incluya datos personales de terceros.", "Describe el estado con honestidad, sube una foto real del objeto y no escribas teléfonos, direcciones ni datos bancarios en la descripción."] },
      { h: "5. Opción A: pagos fuera de la plataforma", p: ["Decisión explícita: no se ha integrado ningún PSP porque un proveedor totalmente gratuito para la persona que publica no existe una vez hay un cobro. Las tarifas oficiales de Stripe y PayPal aplican comisiones por transacción; Redsys/Bizum requieren contrato bancario y pueden tener costes por operación o mantenimiento.", "Por tanto, Circular Campus no procesa pagos, no cobra comisiones, no retiene fondos, no ofrece depósito en garantía, no emite reembolsos, no garantiza objetos ni media en disputas. «Vender» es solo un precio orientativo y un motivo para contactar.", "Si hay contraprestación, se acuerda directamente entre particulares fuera de la plataforma, por ejemplo en efectivo o mediante un pago directo persona a persona en la entrega. Cada persona asume su propio cumplimiento legal y fiscal: la venta habitual o profesional puede activar obligaciones de consumo, IVA, IRPF, LSSI y prevención de blanqueo.", "Una futura pasarela solo se plantearía con un proveedor de servicios de pago regulado, cuentas conectadas y verificación KYC; nunca con un monedero propio, custodia de fondos o comisiones ocultas."] },
      { h: "6. Entregas y solicitudes", p: ["La solicitud sirve para coordinar el intercambio. Elegid un lugar público y concurrido, comprobad el objeto antes de aceptarlo y acordad por escrito la devolución si es un préstamo.", "No hay envíos por correo gestionados por Circular Campus. Marca el objeto como entregado solo cuando la entrega real haya terminado."] },
      { h: "7. Usos prohibidos", p: ["Prohibido publicar datos de contacto en abierto, suplantar identidades, acosar, estafar, vender como profesional, eludir la validación de imágenes, introducir URL externas o intentar usar la plataforma como monedero, escrow o sistema de comisiones.", "Prohibido subir contenido ilegal, peligroso, discriminatorio o que vulnere derechos de terceros."] },
      { h: "8. Responsabilidad", p: ["Circular Campus ofrece una herramienta técnica de publicación y solicitud, pero no verifica objetos, no participa en los acuerdos y no responde por su cumplimiento, estado, precio, pago, devolución o daños.", "El prototipo puede tener errores, reiniciarse o perder datos en un alojamiento gratuito efímero. No lo uses como único repositorio de información importante."] },
      { h: "9. Datos y supresión", p: ["El tratamiento de datos se describe en {privacyLink}. Puedes descargar una copia y eliminar la cuenta desde Mi área, o escribir a {contact}.", "La supresión elimina perfil, sesiones, publicaciones, favoritos y solicitudes propias; no crea una copia de respaldo."] },
      { h: "10. Cambios y ley aplicable", p: ["Podemos actualizar estas condiciones para reflejar cambios técnicos o legales; la versión vigente es {version}, de {updated}.", "Estas condiciones se interpretan conforme a la normativa española y europea aplicable, en particular RGPD, LOPDGDD y LSSI cuando corresponda. No constituyen asesoramiento jurídico, fiscal o de consumo."] },
    ],
  },
  en: {
    legal: [
      { h: "1. Identification", p: ["The editorial controller of this prototype is {controller}. Privacy contact: {contact}. Circular Campus is the visible project name; it is not a company, a shop or an administrative service."] },
      { h: "2. Independent nature", p: ["Circular Campus is a non-profit prototype presented at CTC Congress. It does not use institutional names, logos or brands as its own and does not present itself as an official, endorsed or managed service of any university.", "Vigo, Pontevedra and Ourense are used only as geographic labels to organise handovers."] },
      { h: "3. General information and LSSI", p: ["This demo version does not carry out an economic online activity: it does not sell, charge, process payments or provide professional services. For that reason no tax ID, business address or registry details are provided.", "If the project later becomes an economic information-society service, the permanent, easy, direct and free information duties of article 10 of Spanish Law 34/2002 (LSSI) must be completed first, together with a consumer, tax and commerce review."] },
      { h: "4. Content and intellectual property", p: ["The code, texts, vector illustrations and design are published for this prototype. The CTC Congress mark and the team photograph are materials provided for the project; ownership is not transferred.", "User-generated content remains its author's. By listing an item, the author allows only its display within the service while the account or listing exists."] },
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
      { h: "8. Security and limitations", p: ["Passwords are hashed, session tokens are random, inputs are validated server-side, resources are local and security headers are set. Passwords are never stored in plain text and emails are not exposed in public profiles.", "This prototype does not verify enrolment, identity or ownership; it has no moderation, reports or real-time chat yet. Before an institutional deployment with real data, coordinate with the relevant data protection officer and complete a risk assessment."] },
      { h: "9. Minors", p: ["The service is intended for adults. No date of birth is collected and registration by children under 14 is not accepted. Minors should not post personal data or attend handovers unaccompanied."] },
      { h: "10. Cookies, analytics and third-party resources", p: ["No session cookies, advertising cookies, analytics, pixels or trackers are used. Language and token are stored in browser local storage and can be cleared in browser settings.", "Sample and category images are served from this same domain. For privacy, external image URLs are not accepted in listings."] },
      { h: "11. Photographs", p: ["Photos you upload may contain personal data if they show letters, screens, labels or documents: check them before publishing.", "The group photo on the project page is shown because it was provided for CTC Congress. Images of people are personal data; if you appear in it and want it removed, write to {contact}."] },
      { h: "12. Changes", p: ["Material changes will be reflected in version {version} and date {updated}. The current version is also shown at registration and in My area."] },
    ],
    terms: [
      { h: "1. What the service is", p: ["Circular Campus is an independent prototype for private individuals to list, find and request second-life items: give away, lend, exchange or show an indicative price.", "It is not a shop, a professional marketplace, a courier service, a payment entity or an official service of any institution."] },
      { h: "2. Independence and no verification", p: ["The project uses no institutional branding and claims no official endorsement, authorisation or verification. An academic-domain badge, when shown, is automatic and informative only: it does not check enrolment, identity or membership.", "Any physical handover point would need authorisation from whoever manages the space. The point labels on this site are suggestions only."] },
      { h: "3. Account and consent", p: ["You may register with any valid email. You must explicitly tick the box accepting {privacyLink} and {termsLink}, use your own password and keep it secret.", "Sessions expire after {days} days. You are responsible for the information you publish and for your password."] },
      { h: "4. Permitted listings", p: ["Only occasional listings by private individuals are allowed. Professional sellers, regular commercial activity, prohibited goods, regulated items requiring special conditions and content containing third-party personal data are excluded.", "Describe condition honestly, upload a real photo and do not put phone numbers, addresses or bank details in the description."] },
      { h: "5. Option A: payments outside the platform", p: ["Explicit decision: no PSP has been integrated because a provider that is completely free for the publisher does not exist once a charge succeeds. Official Stripe and PayPal rates charge per transaction; Redsys/Bizum require a bank contract and may carry per-operation or maintenance costs.", "Therefore Circular Campus does not process payments, charge fees, hold funds, provide escrow, issue refunds, guarantee items or mediate disputes. “Sell” is only an indicative price and a reason to make contact.", "Any consideration is agreed directly between private individuals outside the platform, for example in cash or by a direct person-to-person payment at handover. Each person remains responsible for their own legal and tax duties: regular or professional selling can trigger consumer, VAT, income-tax, LSSI and anti-money-laundering obligations.", "A future gateway would only be considered with a regulated payment provider, connected accounts and KYC verification; never with a proprietary wallet, fund custody or hidden fees."] },
      { h: "6. Handovers and requests", p: ["The request coordinates the exchange. Choose a busy public place, inspect the item before accepting it and agree a return date in writing for a loan.", "Circular Campus does not manage postal shipping. Mark an item as delivered only after the real handover is complete."] },
      { h: "7. Prohibited uses", p: ["Do not post open contact details, impersonate others, harass, defraud, sell professionally, bypass image validation, insert external URLs or try to use the platform as a wallet, escrow or commission system.", "Do not upload illegal, dangerous, discriminatory content or material that infringes third-party rights."] },
      { h: "8. Liability", p: ["Circular Campus provides a technical listing and request tool, but does not verify items, take part in agreements or answer for their performance, condition, price, payment, return or damages.", "The prototype may contain errors, restart or lose data on a free ephemeral host. Do not use it as the only repository for important information."] },
      { h: "9. Data and erasure", p: ["Data processing is described in {privacyLink}. You can download a copy and delete your account from My area, or write to {contact}.", "Erasure removes the profile, sessions, listings, favorites and own requests; it does not create a backup copy."] },
      { h: "10. Changes and applicable law", p: ["These terms may be updated to reflect technical or legal changes; the current version is {version}, dated {updated}.", "They are interpreted under applicable Spanish and EU law, in particular GDPR, LOPDGDD and LSSI where relevant. They are not legal, tax or consumer advice."] },
    ],
  },
  gl: {
    legal: [
      { h: "1. Identificación", p: ["O responsable editorial deste prototipo é {controller}. Contacto de privacidade: {contact}. Circular Campus é o nome visible do proxecto; non é unha sociedade, unha tenda nin un servizo administrativo."] },
      { h: "2. Natureza independente", p: ["Circular Campus é un prototipo sen ánimo de lucro presentado en CTC Congress. Non usa marcas, logotipos nin denominacións institucionais como propias, e non se presenta como un servizo oficial, avalado ou xestionado por ningunha universidade.", "As denominacións Vigo, Pontevedra e Ourense úsanse só como etiquetas xeográficas para organizar entregas."] },
      { h: "3. Información xeral e LSSI", p: ["Esta versión de demostración non realiza unha actividade económica en liña: non vende, non cobra, non xestiona pagos nin ofrece servizos profesionais. Por iso non se facilitan NIF, domicilio mercantil nin datos rexistrais.", "Se no futuro o proxecto presta un servizo da sociedade da información con carácter económico, antes deberán completarse os deberes de información permanente, doada, directa e gratuíta do artigo 10 da Lei 34/2002 (LSSI), e revisarse obrigas de consumo, fiscais e de comercio."] },
      { h: "4. Contidos e propiedade intelectual", p: ["O código, os textos, as ilustracións vectoriais e o deseño publícanse para este prototipo. A marca gráfica de CTC Congress e a fotografía de equipo úsanse como materiais achegados para o proxecto; non se cede a súa titularidade.", "Os contidos publicados polas persoas usuarias seguen sendo seus. Ao publicar, permiten só a súa visualización dentro do servizo mentres existan a conta ou o obxecto."] },
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
      { h: "8. Seguridade e limitacións", p: ["Úsanse contrasinais con hash, tokens de sesión aleatorios, validación no servidor, unha política de contido local e cabeceiras de seguridade. Non se almacenan contrasinais en texto plano nin se expoñen emails en perfís públicos.", "Este prototipo non verifica matrícula, identidade nin titularidade dos obxectos; aínda non dispón de moderación, reportes nin chat en tempo real. Antes dun despregue institucional con datos reais, coordina coa delegación de protección de datos correspondente e realiza unha avaliación de riscos."] },
      { h: "9. Menores", p: ["O servizo está pensado para persoas adultas. Non se recolle data de nacemento e non se admite o rexistro de menores de 14 anos. Se es menor, non publiques datos persoais nin quedes sen acompañamento."] },
      { h: "10. Cookies, analítica e recursos de terceiros", p: ["Non se usan cookies de sesión, cookies publicitarias, analítica, píxeles nin rastrexadores. O idioma e o token gárdanse no almacenamento local do navegador; podes borralos desde a súa configuración.", "As imaxes de exemplo e de categoría sírvense desde este mesmo dominio. Para privacidade, non se aceptan URL de imaxes externas nas publicacións."] },
      { h: "11. Fotografías", p: ["As fotos de obxectos que subas poden conter datos persoais se amosan cartas, pantallas, etiquetas ou documentos: revísaas antes de publicar.", "A fotografía de grupo da páxina do proxecto amósase porque foi achegada para CTC Congress. As imaxes de persoas son datos persoais; se apareces nela e desexas que se retire, escribe a {contact}."] },
      { h: "12. Cambios", p: ["Os cambios relevantes reflectiranse no número de versión {version} e na data {updated}. A versión vixente tamén se amosa no rexistro e na Miña área."] },
    ],
    terms: [
      { h: "1. Que é o servizo", p: ["Circular Campus é un prototipo independente para que persoas particulares publiquen, busquen e soliciten obxectos de segunda vida: regalar, prestar, intercambiar ou indicar un prezo orientativo.", "Non é unha tenda, un marketplace profesional, un servizo de mensaxaría, unha entidade de pago nin un servizo oficial de ningunha institución."] },
      { h: "2. Independencia e ausencia de verificación", p: ["O proxecto non usa marcas institucionais nin afirma contar con aval, autorización ou verificación oficial. A insignia de dominio académico, cando aparece, é automática e só informativa: non comproba matrícula, identidade nin pertenza.", "Calquera punto físico de entrega necesitaría autorización de quen xestione ese espazo. As etiquetas de puntos desta web son só suxestións."] },
      { h: "3. Conta e consentimento", p: ["Podes rexistrarte con calquera email válido. Debes marcar expresamente a caixa de aceptación de {privacyLink} e {termsLink}, usar un contrasinal propio e non compartilo.", "A sesión caduca aos {days} días. Es responsable da información que publicas e de manter o contrasinal en segredo."] },
      { h: "4. Publicacións permitidas", p: ["Só se admiten anuncios ocasionais de particulares. Quedan fóra vendedores profesionais, actividade comercial habitual, artigos prohibidos, produtos con requisitos especiais e contido con datos persoais de terceiros.", "Describe o estado con honestidade, sube unha foto real e non escribas teléfonos, enderezos nin datos bancarios na descrición."] },
      { h: "5. Opción A: pagos fóra da plataforma", p: ["Decisión explícita: non se integrou ningún PSP porque un provedor totalmente gratuíto para quen publica non existe unha vez hai un cobro. As tarifas oficiais de Stripe e PayPal aplican comisións por transacción; Redsys/Bizum requiren contrato bancario e poden ter custos por operación ou mantemento.", "Polo tanto, Circular Campus non procesa pagos, non cobra comisións, non retén fondos, non ofrece depósito en garantía, non emite reembolsos, non garante obxectos nin media en disputas. «Vender» é só un prezo orientativo e un motivo para contactar.", "Se hai contraprestación, acórdase directamente entre particulares fóra da plataforma, por exemplo en efectivo ou cun pago directo persoa a persoa na entrega. Cada persoa asume o seu propio cumprimento legal e fiscal: a venda habitual ou profesional pode activar obrigas de consumo, IVE, IRPF, LSSI e prevención de branqueo.", "Unha futura pasarela só se plantearía cun provedor de servizos de pago regulado, contas conectadas e verificación KYC; nunca cun moedeiro propio, custodia de fondos ou comisións ocultas."] },
      { h: "6. Entregas e solicitudes", p: ["A solicitude serve para coordinar o intercambio. Escollede un lugar público e concorrido, comprobade o obxecto antes de aceptalo e acordade por escrito a devolución se é un préstamo.", "Non hai envíos por correo xestionados por Circular Campus. Marca o obxecto como entregado só cando a entrega real rematase."] },
      { h: "7. Usos prohibidos", p: ["Prohíbese publicar datos de contacto en aberto, suplantar identidades, acosar, estafar, vender como profesional, eludir a validación de imaxes, introducir URL externas ou intentar usar a plataforma como moedeiro, escrow ou sistema de comisións.", "Prohíbese subir contido ilegal, perigoso, discriminatorio ou que vulnere dereitos de terceiros."] },
      { h: "8. Responsabilidade", p: ["Circular Campus ofrece unha ferramenta técnica de publicación e solicitude, pero non verifica obxectos, non participa nos acordos e non responde polo seu cumprimento, estado, prezo, pago, devolución ou danos.", "O prototipo pode ter erros, reiniciarse ou perder datos nun aloxamento gratuíto efémero. Non o uses como único repositorio de información importante."] },
      { h: "9. Datos e supresión", p: ["O tratamento de datos descríbese en {privacyLink}. Podes descargar unha copia e eliminar a conta na Miña área, ou escribir a {contact}.", "A supresión elimina perfil, sesións, publicacións, favoritos e solicitudes propias; non crea unha copia de respaldo."] },
      { h: "10. Cambios e lei aplicable", p: ["Podemos actualizar estas condicións para reflectir cambios técnicos ou legais; a versión vixente é {version}, de {updated}.", "Estas condicións interprétanse conforme á normativa española e europea aplicable, en particular RGPD, LOPDGDD e LSSI cando corresponda. Non constitúen asesoramento xurídico, fiscal ou de consumo."] },
    ],
  }
};

const CATEGORIES = ["libros", "ropa", "muebles", "estudio", "electronica", "cocina", "electrodomesticos", "deporte", "otros"];
const CONDITIONS = ["nuevo", "como_nuevo", "bueno", "usable"];
const TYPES = ["regalar", "prestar", "intercambiar", "vender"];
const CAMPUSES = ["vigo", "pontevedra", "ourense"];
const HANDOVERS = ["biblioteca", "entrada", "cafeteria", "punto", "acordado"];

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
  stats: null,
  pendingConsent: false,
};

const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || I18N.es[k] || k;
const catLabel = (c) => t("cat_" + c);
const condLabel = (c) => t("cond_" + c);
const typeLabel = (c) => t("type_" + c);
const campusLabel = (c) => t("campus_" + c);
const handLabel = (c) => t("hand_" + c);
const statusLabel = (s) => t("status_" + s);
const reqLabel = (s) => t("req_" + s);
const categoryImage = (c) => `/static/img/items/${CATEGORIES.includes(c) ? c : "placeholder"}.svg`;
const itemImage = (it) => it.image_url || categoryImage(it.category);

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

/* ---------------- API y errores ---------------- */
async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (state.token) headers.Authorization = "Bearer " + state.token;
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || "error");
    err.data = data;
    throw err;
  }
  return data;
}

const ERROR_KEYS = {
  consent_required: "toast_consent_required",
  private_seller_required: "toast_private_required",
  invalid_image_url: "toast_invalid_image",
  unauthorized: "toast_unauthorized",
  email_taken: "toast_email_taken",
  invalid_credentials: "toast_invalid_credentials",
  invalid_password: "toast_invalid_password",
};
function errorMessage(err) {
  const code = err && err.data && err.data.error;
  if (code && ERROR_KEYS[code]) return t(ERROR_KEYS[code]);
  return (err && err.message) || t("toast_error");
}

function toast(msg, isError = false) {
  const root = $("#toast-root");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), 4200);
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
      img.src = img.dataset.fallbackSrc || categoryImage(img.dataset.category || "otros");
    });
  });
}
function bindViewButtons(root = document) {
  $$("[data-view]", root).forEach(b => { b.onclick = () => openItem(Number(b.dataset.view)); });
}
function bindFavButtons(root = document) {
  $$("[data-fav]", root).forEach(b => b.onclick = async () => {
    if (!state.user) { toast(t("need_login"), true); openAuth("login"); return; }
    try {
      const d = await api(`/api/items/${b.dataset.fav}/favorite`, { method: "POST" });
      toast(d.is_favorite ? t("toast_fav_on") : t("toast_fav_off"));
      render();
    } catch (e) { toast(errorMessage(e), true); }
  });
}
function bindAccountTools(root = document) {
  $$('[data-action="export"]', root).forEach(b => { b.onclick = downloadAccountExport; });
  $$('[data-action="delete"]', root).forEach(b => { b.onclick = openDeleteAccount; });
  $$('[data-action="login"]', root).forEach(b => { b.onclick = () => openAuth("login"); });
}
function enhance(root) {
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
function renderAuthArea() {
  const area = $("#auth-area");
  if (!state.user) {
    area.innerHTML = `
      <button class="btn btn-ghost btn-sm" id="btn-login">${esc(t("login"))}</button>
      <button class="btn btn-primary btn-sm" id="btn-register">${esc(t("register"))}</button>`;
    $("#btn-login").onclick = () => openAuth("login");
    $("#btn-register").onclick = () => openAuth("register");
  } else {
    const initials = esc(state.user.name.trim().charAt(0).toUpperCase());
    area.innerHTML = `
      <div class="dropdown">
        <button class="user-chip" id="user-chip" aria-haspopup="true" aria-expanded="false">
          <span class="avatar">${initials}</span><span>${esc(state.user.name)}</span>
        </button>
        <div class="dropdown-menu hidden" id="user-menu">
          <button id="menu-my">${esc(t("my_area"))}</button>
          <button id="menu-publish">${esc(t("nav_publish"))}</button>
          <button id="menu-privacy">${esc(t("footer_privacy"))}</button>
          <button id="menu-logout">${esc(t("logout"))}</button>
        </div>
      </div>`;
    $("#user-chip").onclick = (e) => {
      e.stopPropagation();
      const menu = $("#user-menu");
      menu.classList.toggle("hidden");
      $("#user-chip").setAttribute("aria-expanded", String(!menu.classList.contains("hidden")));
    };
    document.addEventListener("click", () => {
      const m = $("#user-menu");
      if (m) m.classList.add("hidden");
      const chip = $("#user-chip");
      if (chip) chip.setAttribute("aria-expanded", "false");
    }, { once: true });
    $("#menu-my").onclick = () => navigate("my");
    $("#menu-publish").onclick = () => navigate("publish");
    $("#menu-privacy").onclick = () => navigate("privacy");
    $("#menu-logout").onclick = logout;
  }
}

async function logout() {
  try { await api("/api/auth/logout", { method: "POST" }); } catch (e) {}
  state.token = null; state.user = null; state.pendingConsent = false;
  localStorage.removeItem("cc_token");
  renderAuthArea(); toast(t("toast_logout")); navigate("home");
}

function openModal(html, opts = {}) {
  const dismissible = opts.dismissible !== false;
  $("#modal-root").innerHTML = `<div class="modal-backdrop" id="backdrop"><div class="modal${opts.wide ? " modal-wide" : ""}" role="dialog" aria-modal="true">${html}</div></div>`;
  const backdrop = $("#backdrop");
  if (dismissible) {
    backdrop.addEventListener("click", (e) => { if (e.target.id === "backdrop") closeModal(); });
  }
  enhance(backdrop);
}
function closeModal() {
  if (state.pendingConsent) return;
  $("#modal-root").innerHTML = "";
}
function closeBtn() {
  return state.pendingConsent ? "" : `<button class="close" data-close aria-label="${esc(t("close"))}">✕</button>`;
}
window.closeModal = closeModal;

function openAuth(mode = "login") {
  const isLogin = mode === "login";
  openModal(`
    ${closeBtn()}
    <h2>${esc(isLogin ? t("auth_login_title") : t("auth_register_title"))}</h2>
    <p class="muted">${esc(t("demo_hint"))}</p>
    <form id="auth-form">
      ${isLogin ? "" : `<div class="field"><label>${esc(t("auth_name"))}</label><input name="name" required minlength="2" maxlength="60" autocomplete="name"></div>`}
      <div class="field"><label>${esc(t("auth_email"))}</label><input name="email" type="email" required autocomplete="email"><small>${esc(t("auth_email_hint"))}</small></div>
      <div class="field"><label>${esc(t("auth_password"))}</label><input name="password" type="password" required minlength="8" autocomplete="${isLogin ? "current-password" : "new-password"}"><small>${esc(t("auth_password_hint"))}</small></div>
      ${isLogin ? "" : `
        <div class="field"><label>${esc(t("auth_campus"))}</label>
          <select name="campus">${CAMPUSES.map(c => `<option value="${c}">${esc(campusLabel(c))}</option>`).join("")}</select></div>
        <div class="consent-box">
          <label class="check-row"><input type="checkbox" name="consent" required><span>${legalText(t("auth_consent"))}</span></label>
          <p class="muted">${esc(t("auth_minimum"))}</p>
        </div>`}
      <div style="margin-top:16px"><button class="btn btn-primary btn-block" type="submit">${esc(isLogin ? t("auth_btn_login") : t("auth_btn_register"))}</button></div>
    </form>
    <p style="text-align:center;margin-top:12px">
      ${esc(isLogin ? t("auth_no_account") : t("auth_have_account"))}
      <button class="btn btn-ghost btn-sm" id="switch-auth">${esc(isLogin ? t("register") : t("login"))}</button>
    </p>`);
  $("#switch-auth").onclick = () => openAuth(isLogin ? "register" : "login");
  $("#auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    if (!isLogin) {
      payload.consent = fd.get("consent") === "on";
      payload.legal_version = CONFIG.legalVersion;
    }
    try {
      const data = await api(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST", body: JSON.stringify(payload)
      });
      state.token = data.token; state.user = data.user;
      localStorage.setItem("cc_token", data.token);
      closeModal(); renderAuthArea();
      toast(isLogin ? t("toast_login") : t("toast_register"));
      render();
    } catch (err) { toast(errorMessage(err), true); }
  };
}

function openConsentUpdate() {
  state.pendingConsent = true;
  openModal(`
    <h2>${esc(t("consent_update_title"))}</h2>
    <p>${legalText(t("consent_update_body"))}</p>
    <form id="consent-update-form">
      <div class="consent-box">
        <label class="check-row"><input type="checkbox" name="consent" required><span>${legalText(t("consent_update_check"))}</span></label>
      </div>
      <button class="btn btn-primary btn-block" type="submit">${esc(t("consent_update_btn"))}</button>
    </form>`, { dismissible: false });
  $("#consent-update-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const data = await api("/api/account/consent", {
        method: "POST", body: JSON.stringify({ consent: fd.get("consent") === "on", legal_version: CONFIG.legalVersion })
      });
      state.user = data.user;
      state.pendingConsent = false;
      closeModal(); renderAuthArea(); toast(t("toast_consent_updated")); render();
    } catch (err) { toast(errorMessage(err), true); }
  };
}

/* ---------------- Navegación ---------------- */
function navigate(view, opts = {}) {
  state.view = view;
  const path = ROUTE_PATHS[view] || "/";
  if (!opts.fromPopState && location.pathname !== path) {
    history.pushState({ view }, "", path);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}
window.navigate = navigate;

async function render() {
  const app = $("#app");
  document.documentElement.lang = state.lang;
  document.title = `${t("title_" + state.view) || CONFIG.service} · ${CONFIG.service}`;
  $$(".lang-switch button").forEach(b => b.classList.toggle("active", b.dataset.lang === state.lang));
  $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$("[data-nav]").forEach(b => {
    b.onclick = (e) => { e.preventDefault(); navigate(b.dataset.nav); };
    b.classList.toggle("active", b.dataset.nav === state.view);
  });
  $$("a[data-route]").forEach(a => a.classList.toggle("active", a.dataset.route === state.view));
  bindRouteLinks(document);

  if (state.view === "home") return renderHome(app);
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

async function loadStats() {
  try { state.stats = await api("/api/stats"); } catch (e) { state.stats = null; }
}
async function loadItems() {
  const f = state.filters;
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.category) params.set("category", f.category);
  if (f.campus) params.set("campus", f.campus);
  if (f.condition) params.set("condition", f.condition);
  if (f.type) params.set("type", f.type);
  if (f.sort) params.set("sort", f.sort);
  try {
    const data = await api("/api/items?" + params.toString());
    state.items = data.items || [];
  } catch (e) {
    state.items = [];
    toast(errorMessage(e), true);
  }
}

function itemCard(it) {
  const isSale = it.exchange_type === "vender";
  const price = isSale ? `€${Number(it.price).toFixed(0)}` : esc(t("free"));
  return `
  <article class="card">
    <div class="card-img">
      <img src="${esc(itemImage(it))}" alt="${esc(it.title)}" loading="lazy" data-fallback data-category="${esc(it.category)}">
      <span class="badge">${esc(condLabel(it.condition))}</span>
      <span class="badge badge-type${isSale ? " sale" : ""}">${esc(typeLabel(it.exchange_type))}</span>
      <button class="fav-btn ${it.is_favorite ? "active" : ""}" data-fav="${it.id}" aria-label="${esc(t("detail_fav"))}">${it.is_favorite ? "♥" : "♡"}</button>
    </div>
    <div class="card-body">
      <h3>${esc(it.title)}</h3>
      <div class="card-meta">
        <span class="pill">${esc(catLabel(it.category))}</span>
        <span class="pill grey">${esc(campusLabel(it.campus))}</span>
        <span>${esc(handLabel(it.handover_point))}</span>
      </div>
      <p class="card-desc">${esc(it.description)}</p>
      <div class="card-foot">
        <div><span class="price">${price}</span>${isSale ? `<small class="price-sub">${esc(t("price_orientative"))}</small>` : ""}</div>
        <button class="btn btn-primary btn-sm" data-view="${it.id}">${esc(t("view_item"))}</button>
      </div>
    </div>
  </article>`;
}

async function renderHome(app) {
  await loadStats();
  await loadItems();
  const s = state.stats || { total_items: 0, available: 0, delivered: 0, users: 0 };
  const f = state.filters;
  setApp(app, `
    <section class="hero">
      <div class="hero-grid">
        <div>
          <span class="eyebrow">${esc(t("hero_eyebrow"))}</span>
          <h1>${esc(t("hero_title"))}</h1>
          <p class="lead">${esc(t("hero_lead"))}</p>
          <form class="searchbar" id="hero-search">
            <input id="q" type="search" placeholder="${esc(t("hero_search_ph"))}" value="${esc(f.q)}">
            <select id="campus-sel" aria-label="${esc(t("campus"))}">
              <option value="">${esc(t("campus"))}: ${esc(t("all"))}</option>
              ${CAMPUSES.map(c => `<option value="${c}" ${f.campus === c ? "selected" : ""}>${esc(campusLabel(c))}</option>`).join("")}
            </select>
            <button class="btn btn-primary" type="submit">${esc(t("hero_search_btn"))}</button>
            <button class="btn btn-ghost" type="button" id="go-publish">${esc(t("publish_cta"))}</button>
          </form>
        </div>
        <img class="hero-art" src="/static/img/hero-reuse.svg" alt="" data-fallback data-fallback-src="/static/img/circular-campus-mark-white.png">
      </div>
      <div class="notice payment-banner" role="note">
        <span class="notice-icon" aria-hidden="true">€</span>
        <div><strong>${esc(t("payment_banner_title"))}</strong><p>${esc(t("payment_banner_body"))}</p></div>
      </div>
      <div class="hero-stats">
        <div class="stat"><strong>${s.total_items}</strong><span>${esc(t("stat_items"))}</span></div>
        <div class="stat"><strong>${s.available}</strong><span>${esc(t("stat_available"))}</span></div>
        <div class="stat"><strong>${s.delivered}</strong><span>${esc(t("stat_delivered"))}</span></div>
        <div class="stat"><strong>${s.users}</strong><span>${esc(t("stat_users"))}</span></div>
      </div>
    </section>

    <div class="section-title">
      <h2>${esc(t("nav_home"))}</h2>
      <p>${state.items.length} ${esc(t("results"))}</p>
    </div>
    <div class="filters" id="cat-filters">
      <button class="chip ${!f.category ? "active" : ""}" data-cat="">${esc(t("all"))}</button>
      ${CATEGORIES.map(c => `<button class="chip ${f.category === c ? "active" : ""}" data-cat="${c}">${esc(catLabel(c))}</button>`).join("")}
    </div>
    <div class="filter-row">
      <select id="f-condition" aria-label="${esc(t("condition"))}">
        <option value="">${esc(t("condition"))}: ${esc(t("all"))}</option>
        ${CONDITIONS.map(c => `<option value="${c}" ${f.condition === c ? "selected" : ""}>${esc(condLabel(c))}</option>`).join("")}
      </select>
      <select id="f-type" aria-label="${esc(t("type"))}">
        <option value="">${esc(t("type"))}: ${esc(t("all"))}</option>
        ${TYPES.map(c => `<option value="${c}" ${f.type === c ? "selected" : ""}>${esc(typeLabel(c))}</option>`).join("")}
      </select>
      <select id="f-sort" aria-label="${esc(t("sort"))}">
        <option value="recent" ${f.sort === "recent" ? "selected" : ""}>${esc(t("sort_recent"))}</option>
        <option value="price_asc" ${f.sort === "price_asc" ? "selected" : ""}>${esc(t("sort_price_asc"))}</option>
        <option value="price_desc" ${f.sort === "price_desc" ? "selected" : ""}>${esc(t("sort_price_desc"))}</option>
      </select>
    </div>
    ${state.items.length ? `<div class="grid">${state.items.map(itemCard).join("")}</div>` : `<div class="empty">${esc(t("no_results"))}</div>`}

    <div class="two-col" style="margin-top:28px">
      <div class="info-card">
        <h3>${esc(t("how_title"))}</h3>
        <p><strong>${esc(t("how_1_t"))}</strong> — ${esc(t("how_1_b"))}</p>
        <p><strong>${esc(t("how_2_t"))}</strong> — ${esc(t("how_2_b"))}</p>
        <p><strong>${esc(t("how_3_t"))}</strong> — ${esc(t("how_3_b"))}</p>
      </div>
      <div class="info-card">
        <h3>${esc(t("trust_title"))}</h3>
        <ul class="clean-list">
          <li>${esc(t("trust_1"))}</li><li>${esc(t("trust_2"))}</li><li>${esc(t("trust_3"))}</li>
        </ul>
        <p class="legal-inline">${legalText(t("about_p3"))}</p>
      </div>
    </div>`);

  $("#hero-search").onsubmit = (e) => {
    e.preventDefault();
    state.filters.q = $("#q").value.trim();
    state.filters.campus = $("#campus-sel").value;
    render();
  };
  $("#go-publish").onclick = () => navigate("publish");
  $$("#cat-filters .chip").forEach(b => b.onclick = () => { state.filters.category = b.dataset.cat; render(); });
  $("#f-condition").onchange = (e) => { state.filters.condition = e.target.value; render(); };
  $("#f-type").onchange = (e) => { state.filters.type = e.target.value; render(); };
  $("#f-sort").onchange = (e) => { state.filters.sort = e.target.value; render(); };
}

function renderPublish(app) {
  if (!state.user) {
    setApp(app, `<div class="empty" style="margin-top:30px"><p>${esc(t("need_login_publish"))}</p>
      <button class="btn btn-primary" id="pub-login">${esc(t("login"))}</button></div>`);
    $("#pub-login").onclick = () => openAuth("login");
    return;
  }
  setApp(app, `
    <div class="section-title"><h2>${esc(t("publish_title"))}</h2></div>
    <p class="muted" style="max-width:820px">${esc(t("publish_intro"))}</p>
    <div class="info-card" style="max-width:820px">
      <form id="publish-form">
        <div class="field"><label>${esc(t("f_title"))}</label><input name="title" required minlength="3" maxlength="80" placeholder="Ej.: Lámpara de escritorio LED"></div>
        <div class="field"><label>${esc(t("f_desc"))}</label><textarea name="description" required minlength="10" maxlength="2000"></textarea><small>${esc(t("desc_hint"))}</small></div>
        <div class="form-grid">
          <div class="field"><label>${esc(t("f_category"))}</label><select name="category">${CATEGORIES.map(c => `<option value="${c}">${esc(catLabel(c))}</option>`).join("")}</select></div>
          <div class="field"><label>${esc(t("f_condition"))}</label><select name="condition">${CONDITIONS.map(c => `<option value="${c}">${esc(condLabel(c))}</option>`).join("")}</select></div>
          <div class="field"><label>${esc(t("f_type"))}</label><select name="exchange_type" id="pub-type">${TYPES.map(c => `<option value="${c}">${esc(typeLabel(c))}</option>`).join("")}</select></div>
          <div class="field hidden" id="price-field"><label>${esc(t("f_price"))}</label><input name="price" type="number" min="0" max="10000" step="1" value="0"><small>${esc(t("f_price_hint"))}</small></div>
          <div class="field"><label>${esc(t("f_campus"))}</label><select name="campus">${CAMPUSES.map(c => `<option value="${c}" ${state.user.campus === c ? "selected" : ""}>${esc(campusLabel(c))}</option>`).join("")}</select></div>
          <div class="field"><label>${esc(t("f_handover"))}</label><select name="handover_point">${HANDOVERS.map(c => `<option value="${c}">${esc(handLabel(c))}</option>`).join("")}</select></div>
        </div>
        <div class="notice hidden" id="payment-notice" role="note">
          <span class="notice-icon" aria-hidden="true">€</span>
          <div><strong>${esc(t("payment_notice_title"))}</strong><p>${esc(t("payment_notice_body"))}</p></div>
        </div>
        <div class="field"><label>${esc(t("f_image"))}</label>
          <input type="hidden" id="img-url" value="">
          <input type="file" id="img-file" accept="image/*">
          <div style="margin-top:8px"><button type="button" class="btn btn-ghost btn-sm" id="upload-btn">${esc(t("upload"))}</button></div>
          <small>${esc(t("f_image_hint"))}</small>
          <img id="img-preview" class="hidden upload-preview" alt="" data-fallback data-fallback-src="/static/img/items/placeholder.svg">
        </div>
        <div class="consent-box">
          <label class="check-row"><input type="checkbox" name="private_seller" required><span>${esc(t("f_private"))}</span></label>
          <p class="muted">${esc(t("f_private_hint"))}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" type="submit">${esc(t("publish_btn"))}</button>
          <button class="btn btn-ghost" type="button" id="pub-cancel">${esc(t("cancel"))}</button>
        </div>
      </form>
    </div>`);

  const syncType = () => {
    const sale = $("#pub-type").value === "vender";
    $("#price-field").classList.toggle("hidden", !sale);
    $("#payment-notice").classList.toggle("hidden", !sale);
  };
  $("#pub-type").onchange = syncType;
  syncType();
  $("#img-file").onchange = () => {
    const file = $("#img-file").files[0];
    const preview = $("#img-preview");
    if (!file) { preview.classList.add("hidden"); return; }
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
  };
  $("#upload-btn").onclick = async () => {
    const file = $("#img-file").files[0];
    if (!file) { toast(t("toast_error"), true); return; }
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST", headers: state.token ? { Authorization: "Bearer " + state.token } : {}, body: fd
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || data.error || "error"); err.data = data; throw err;
      }
      $("#img-url").value = data.url;
      $("#img-preview").src = data.url;
      $("#img-preview").classList.remove("hidden");
      toast(t("toast_upload"));
    } catch (err) { toast(errorMessage(err), true); }
  };
  $("#pub-cancel").onclick = () => navigate("home");
  $("#publish-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.private_seller = fd.get("private_seller") === "on";
    payload.image_url = $("#img-url").value || "";
    payload.price = payload.exchange_type === "vender" ? Number(payload.price || 0) : 0;
    try {
      await api("/api/items", { method: "POST", body: JSON.stringify(payload) });
      toast(t("toast_published")); navigate("home");
    } catch (err) { toast(errorMessage(err), true); }
  };
}

function renderPoints(app) {
  const pts = HANDOVERS;
  setApp(app, `
    <div class="section-title"><h2>${esc(t("points_title"))}</h2></div>
    <p class="muted" style="max-width:820px">${esc(t("points_lead"))}</p>
    <div class="notice" role="note"><span class="notice-icon" aria-hidden="true">i</span><div><p>${esc(t("points_notice"))}</p></div></div>
    <div class="grid" style="margin-top:18px">
      ${pts.map(p => `
        <div class="point-card">
          <h3>📍 ${esc(t("points_" + p + "_t"))}</h3>
          <p class="muted">${esc(t("points_" + p + "_b"))}</p>
          <p><span class="pill">${esc(campusLabel("vigo"))}</span> <span class="pill grey">${esc(campusLabel("pontevedra"))}</span> <span class="pill grey">${esc(campusLabel("ourense"))}</span></p>
        </div>`).join("")}
    </div>`);
}

function renderRules(app) {
  const rules = [1, 2, 3, 4, 5, 6];
  setApp(app, `
    <div class="section-title"><h2>${esc(t("rules_title"))}</h2></div>
    <p class="muted" style="max-width:820px">${esc(t("rules_lead"))}</p>
    <div class="grid" style="margin-top:18px">
      ${rules.map(n => `
        <div class="info-card"><h3>${esc(t("rules_" + n + "_t"))}</h3><p class="muted">${esc(t("rules_" + n + "_b"))}</p></div>`).join("")}
    </div>
    <div class="two-col" style="margin-top:18px">
      <div class="info-card"><span class="eyebrow">${esc(CONFIG.paymentOption)}</span><h3>${esc(t("rules_payment_title"))}</h3><p>${esc(t("rules_payment_body"))}</p></div>
      <div class="info-card"><span class="eyebrow">RGPD · LOPDGDD</span><h3>${esc(t("rules_data_title"))}</h3><p>${esc(t("rules_data_body"))}</p></div>
    </div>`);
}

function renderAbout(app) {
  setApp(app, `
    <div class="section-title"><h2>${esc(t("about_title"))}</h2></div>
    <p class="lead-block">${esc(t("about_lead"))}</p>
    <div class="about-layout">
      <div class="info-card">
        <p>${esc(t("about_p1"))}</p>
        <p>${esc(t("about_p2"))}</p>
        <p>${esc(t("about_p3"))}</p>
        <h3>${esc(t("about_pillars_title"))}</h3>
        <ul class="clean-list">
          <li>${esc(t("about_pillar_1"))}</li><li>${esc(t("about_pillar_2"))}</li><li>${esc(t("about_pillar_3"))}</li>
        </ul>
      </div>
      <figure class="team-photo">
        <img src="/static/img/equipo-ctc.jpg" alt="${esc(t("photo_caption"))}" loading="lazy" data-fallback data-fallback-src="/static/img/ctc-congress.png">
        <figcaption>
          <span>${esc(t("photo_caption"))}</span>
          <span class="muted">${esc(t("photo_privacy"))} <a href="/privacidad" data-route="privacy">${esc(t("footer_privacy"))}</a></span>
        </figcaption>
      </figure>
    </div>`);
}

function accountToolsHtml() {
  if (!state.user) {
    return `<div class="privacy-panel">
      <h3>${esc(t("account_data_title"))}</h3>
      <p>${esc(t("privacy_login_manage"))}</p>
      <button class="btn btn-primary btn-sm" data-action="login">${esc(t("login"))}</button>
    </div>`;
  }
  return `<div class="privacy-panel">
    <div class="privacy-panel-head">
      <div>
        <h3>${esc(t("account_data_title"))}</h3>
        <p>${esc(t("account_data_body"))}</p>
      </div>
      <div class="account-actions">
        <button class="btn btn-ghost btn-sm" data-action="export">${esc(t("privacy_export"))}</button>
        <button class="btn btn-danger btn-sm" data-action="delete">${esc(t("privacy_delete"))}</button>
      </div>
    </div>
    <dl class="account-meta">
      <div><dt>${esc(t("account_email"))}</dt><dd>${esc(state.user.email)}</dd></div>
      <div><dt>${esc(t("account_campus"))}</dt><dd>${esc(campusLabel(state.user.campus))}</dd></div>
      <div><dt>${esc(t("account_consent"))}</dt><dd>${state.user.consent_ok ? esc(t("account_consent_ok")) : esc(t("account_consent_old"))} · ${esc(CONFIG.legalVersion)}</dd></div>
      <div><dt>${esc(t("account_rights"))}</dt><dd>${esc(t("account_rights_body"))}</dd></div>
    </dl>
    <p class="muted">${legalText(t("account_note"))}</p>
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
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t("toast_account_exported"));
  } catch (e) { toast(errorMessage(e), true); }
}

function openDeleteAccount() {
  openModal(`
    ${closeBtn()}
    <h2>${esc(t("delete_account_title"))}</h2>
    <p class="danger-text">${esc(t("delete_warning"))}</p>
    <form id="delete-account-form">
      <div class="field"><label>${esc(t("delete_password"))}</label><input name="password" type="password" required autocomplete="current-password"></div>
      <button class="btn btn-danger btn-block" type="submit">${esc(t("delete_confirm_btn"))}</button>
      <button class="btn btn-ghost btn-block" type="button" data-close style="margin-top:8px">${esc(t("cancel"))}</button>
    </form>`);
  $("#delete-account-form").onsubmit = async (e) => {
    e.preventDefault();
    const password = new FormData(e.target).get("password") || "";
    try {
      await api("/api/account/delete", { method: "DELETE", body: JSON.stringify({ password }) });
      state.token = null; state.user = null; state.pendingConsent = false;
      localStorage.removeItem("cc_token");
      closeModal(); renderAuthArea(); toast(t("toast_account_deleted")); navigate("home");
    } catch (err) { toast(errorMessage(err), true); }
  };
}

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
        <img src="/static/img/circular-campus-lockup.png" alt="" data-fallback data-fallback-src="/static/img/circular-campus-mark-white.png">
        <div>
          <span class="eyebrow">${esc(t("legal_kicker"))} · ${esc(CONFIG.service)}</span>
          <h1>${esc(t(kind + "_title"))}</h1>
          <p class="lead">${esc(t(kind + "_lead"))}</p>
          <p class="muted">${esc(t("legal_updated"))}: ${esc(CONFIG.legalUpdated)} · ${esc(t("legal_version"))}: ${esc(CONFIG.legalVersion)} · ${esc(t("legal_contact_label"))}: <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a></p>
        </div>
        <button class="btn btn-ghost btn-sm" data-print>${esc(t("legal_print"))}</button>
      </header>
      ${rendered}
      ${kind === "privacy" ? accountToolsHtml() : ""}
      <p class="legal-back"><a href="/" data-route="home">← ${esc(t("back_home"))}</a></p>
    </article>`);
}

async function renderMy(app) {
  if (!state.user) {
    setApp(app, `<div class="empty" style="margin-top:30px"><p>${esc(t("need_login"))}</p>
      <button class="btn btn-primary" id="my-login">${esc(t("login"))}</button></div>`);
    $("#my-login").onclick = () => openAuth("login");
    return;
  }
  const tab = state.myTab;
  let content = "";
  if (tab === "items") {
    const data = await api("/api/items?status=&sort=recent").catch(() => ({ items: [] }));
    const mine = (data.items || []).filter(i => i.owner_id === state.user.id);
    content = mine.length ? mine.map(it => `
      <div class="list-item">
        <img src="${esc(itemImage(it))}" alt="" data-fallback data-category="${esc(it.category)}">
        <div class="grow"><strong>${esc(it.title)}</strong><br><span class="muted">${esc(catLabel(it.category))} · ${esc(campusLabel(it.campus))} · ${esc(typeLabel(it.exchange_type))}</span></div>
        <span class="status-pill status-${esc(it.status)}">${esc(statusLabel(it.status))}</span>
        <button class="btn btn-ghost btn-sm" data-view="${it.id}">${esc(t("view_item"))}</button>
        <select data-status="${it.id}" aria-label="${esc(t("status_disponible"))}">
          <option value="disponible" ${it.status === "disponible" ? "selected" : ""}>${esc(t("status_disponible"))}</option>
          <option value="reservado" ${it.status === "reservado" ? "selected" : ""}>${esc(t("status_reservado"))}</option>
          <option value="entregado" ${it.status === "entregado" ? "selected" : ""}>${esc(t("status_entregado"))}</option>
        </select>
        <button class="btn btn-danger btn-sm" data-del="${it.id}">${esc(t("delete_item"))}</button>
      </div>`).join("") : `<div class="empty">${esc(t("my_empty_items"))}</div>`;
  } else if (tab === "requests") {
    const data = await api("/api/requests/mine").catch(() => ({ requests: [] }));
    content = data.requests.length ? data.requests.map(r => `
      <div class="list-item">
        <img src="${esc(r.item_image || categoryImage("otros"))}" alt="" data-fallback data-category="otros">
        <div class="grow"><strong>${esc(r.item_title)}</strong><br><span class="muted">${esc(r.message || "—")}</span></div>
        <span class="status-pill status-${esc(r.status)}">${esc(reqLabel(r.status))}</span>
        ${r.status === "pendiente" ? `<button class="btn btn-ghost btn-sm" data-cancelreq="${r.id}">${esc(t("cancel_req"))}</button>` : ""}
      </div>`).join("") : `<div class="empty">${esc(t("my_empty_requests"))}</div>`;
  } else if (tab === "received") {
    const data = await api("/api/requests/received").catch(() => ({ requests: [] }));
    content = data.requests.length ? data.requests.map(r => `
      <div class="list-item">
        <img src="${esc(r.item_image || categoryImage("otros"))}" alt="" data-fallback data-category="otros">
        <div class="grow"><strong>${esc(r.item_title)}</strong> · ${esc(r.requester_name)}<br><span class="muted">${esc(r.message || "—")}</span></div>
        <span class="status-pill status-${esc(r.status)}">${esc(reqLabel(r.status))}</span>
        ${r.status === "pendiente" ? `<button class="btn btn-primary btn-sm" data-accept="${r.id}">${esc(t("accept"))}</button><button class="btn btn-ghost btn-sm" data-reject="${r.id}">${esc(t("reject"))}</button>` : ""}
        ${r.status === "aceptada" ? `<button class="btn btn-primary btn-sm" data-complete="${r.id}">${esc(t("complete"))}</button>` : ""}
      </div>`).join("") : `<div class="empty">${esc(t("my_empty_received"))}</div>`;
  } else if (tab === "favorites") {
    const data = await api("/api/favorites").catch(() => ({ items: [] }));
    content = data.items.length ? `<div class="grid">${data.items.map(itemCard).join("")}</div>` : `<div class="empty">${esc(t("my_empty_favs"))}</div>`;
  }

  setApp(app, `
    <div class="section-title">
      <h2>${esc(t("my_area"))} · ${esc(state.user.name)}</h2>
      <p>${state.user.academic_email ? esc(t("academic_email")) : esc(t("personal_email"))} · ${esc(t("identity_note"))}</p>
    </div>
    <div class="tabs">
      <button data-tab="items" class="${tab === "items" ? "active" : ""}">${esc(t("my_items"))}</button>
      <button data-tab="requests" class="${tab === "requests" ? "active" : ""}">${esc(t("my_requests"))}</button>
      <button data-tab="received" class="${tab === "received" ? "active" : ""}">${esc(t("received"))}</button>
      <button data-tab="favorites" class="${tab === "favorites" ? "active" : ""}">${esc(t("favorites"))}</button>
    </div>
    ${content}
    ${accountToolsHtml()}`);

  $$("[data-tab]").forEach(b => b.onclick = () => { state.myTab = b.dataset.tab; render(); });
  $$("[data-status]").forEach(sel => sel.onchange = async () => {
    try { await api(`/api/items/${sel.dataset.status}`, { method: "PATCH", body: JSON.stringify({ status: sel.value }) }); toast(t("toast_status")); render(); }
    catch (e) { toast(errorMessage(e), true); }
  });
  $$("[data-del]").forEach(b => b.onclick = async () => {
    if (!confirm(t("delete_item") + "?")) return;
    try { await api(`/api/items/${b.dataset.del}`, { method: "DELETE" }); toast(t("toast_deleted")); render(); }
    catch (e) { toast(errorMessage(e), true); }
  });
  $$("[data-cancelreq]").forEach(b => b.onclick = async () => {
    try { await api(`/api/requests/${b.dataset.cancelreq}`, { method: "PATCH", body: JSON.stringify({ status: "cancelada" }) }); toast(t("toast_req_status")); render(); }
    catch (e) { toast(errorMessage(e), true); }
  });
  $$("[data-accept]").forEach(b => b.onclick = async () => {
    try { await api(`/api/requests/${b.dataset.accept}`, { method: "PATCH", body: JSON.stringify({ status: "aceptada" }) }); toast(t("toast_req_status")); render(); }
    catch (e) { toast(errorMessage(e), true); }
  });
  $$("[data-reject]").forEach(b => b.onclick = async () => {
    try { await api(`/api/requests/${b.dataset.reject}`, { method: "PATCH", body: JSON.stringify({ status: "rechazada" }) }); toast(t("toast_req_status")); render(); }
    catch (e) { toast(errorMessage(e), true); }
  });
  $$("[data-complete]").forEach(b => b.onclick = async () => {
    try { await api(`/api/requests/${b.dataset.complete}`, { method: "PATCH", body: JSON.stringify({ status: "completada" }) }); toast(t("toast_req_status")); render(); }
    catch (e) { toast(errorMessage(e), true); }
  });
}

/* ---------------- Detalle y solicitudes ---------------- */
async function openItem(id) {
  try {
    const data = await api(`/api/items/${id}`);
    const it = data.item;
    const owner = it.owner || {};
    const isOwn = state.user && state.user.id === it.owner_id;
    const isSale = it.exchange_type === "vender";
    const price = isSale ? `€${Number(it.price).toFixed(0)}` : esc(t("free"));
    openModal(`
      ${closeBtn()}
      <img class="detail-img" src="${esc(itemImage(it))}" alt="${esc(it.title)}" data-fallback data-category="${esc(it.category)}">
      <h2 style="margin-top:14px">${esc(it.title)}</h2>
      <div class="card-meta">
        <span class="pill">${esc(catLabel(it.category))}</span>
        <span class="pill">${esc(condLabel(it.condition))}</span>
        <span class="pill grey">${esc(typeLabel(it.exchange_type))}</span>
        <span class="pill grey">${esc(campusLabel(it.campus))}</span>
        <span class="status-pill status-${esc(it.status)}">${esc(statusLabel(it.status))}</span>
      </div>
      <p style="margin-top:12px">${esc(it.description)}</p>
      <div class="owner-box">
        <span class="avatar">${esc((owner.name || "?").charAt(0).toUpperCase())}</span>
        <div>
          <strong>${esc(owner.name || "—")}</strong>
          <span class="identity-badge ${owner.academic_email ? "academic" : ""}">${owner.academic_email ? esc(t("academic_email")) : esc(t("personal_email"))}</span>
          <small class="muted">${esc(t("identity_note"))}</small><br>
          <span class="muted">${esc(t("handover_label"))}: ${esc(handLabel(it.handover_point))} · ${esc(campusLabel(it.campus))}</span>
        </div>
        <div class="owner-price"><span class="price">${price}</span>${isSale ? `<small class="price-sub">${esc(t("price_orientative"))}</small>` : ""}</div>
      </div>
      ${isSale ? `<div class="notice" role="note"><span class="notice-icon" aria-hidden="true">€</span><div><p>${esc(t("detail_payment_notice"))}</p></div></div>` : ""}
      <p class="muted" style="font-size:14px">${esc(t("loan_rules"))}</p>
      <p class="muted" style="font-size:14px">${esc(t("detail_privacy_note"))}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
        ${isOwn ? `<button class="btn btn-ghost" id="detail-manage">${esc(t("my_area"))}</button>`
                : `<button class="btn btn-primary" id="detail-request" ${it.status !== "disponible" ? "disabled" : ""}>${esc(t("detail_request"))}</button>`}
        <button class="btn btn-ghost" id="detail-fav">${it.is_favorite ? esc(t("detail_faved")) : esc(t("detail_fav"))}</button>
      </div>`);
    const favBtn = $("#detail-fav");
    if (favBtn) favBtn.onclick = async () => {
      if (!state.user) { toast(t("need_login"), true); openAuth("login"); return; }
      try {
        const d = await api(`/api/items/${id}/favorite`, { method: "POST" });
        toast(d.is_favorite ? t("toast_fav_on") : t("toast_fav_off"));
        openItem(id);
      } catch (e) { toast(errorMessage(e), true); }
    };
    const manageBtn = $("#detail-manage");
    if (manageBtn) manageBtn.onclick = () => { closeModal(); navigate("my"); };
    const reqBtn = $("#detail-request");
    if (reqBtn) reqBtn.onclick = () => {
      if (!state.user) { toast(t("need_login"), true); openAuth("login"); return; }
      openRequest(id);
    };
  } catch (e) { toast(errorMessage(e), true); }
}

function openRequest(itemId) {
  openModal(`
    ${closeBtn()}
    <h2>${esc(t("request_title"))}</h2>
    <p class="muted">${esc(t("request_privacy"))}</p>
    <form id="request-form">
      <div class="field"><label>${esc(t("request_msg"))}</label><textarea name="message" maxlength="1000" placeholder="${esc(t("request_msg_ph"))}"></textarea></div>
      <button class="btn btn-primary btn-block" type="submit">${esc(t("request_btn"))}</button>
    </form>`);
  $("#request-form").onsubmit = async (e) => {
    e.preventDefault();
    const message = new FormData(e.target).get("message") || "";
    try {
      await api(`/api/items/${itemId}/request`, { method: "POST", body: JSON.stringify({ message }) });
      closeModal(); toast(t("toast_request"));
    } catch (err) { toast(errorMessage(err), true); }
  };
}

/* ---------------- Init ---------------- */
async function init() {
  $$(".lang-switch button").forEach(b => {
    b.onclick = () => {
      state.lang = b.dataset.lang;
      localStorage.setItem("cc_lang", state.lang);
      renderAuthArea(); render();
    };
  });
  window.addEventListener("popstate", (e) => {
    state.view = (e.state && e.state.view) || PATH_VIEWS[location.pathname] || "home";
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !state.pendingConsent) closeModal();
  });
  try { history.replaceState({ view: state.view }, "", location.pathname || "/"); } catch (e) {}

  if (state.token) {
    try {
      const data = await api("/api/auth/me");
      state.user = data.user;
      if (!state.user) {
        state.token = null;
        localStorage.removeItem("cc_token");
      } else if (!state.user.consent_ok) {
        openConsentUpdate();
      }
    } catch (e) {
      state.token = null;
      localStorage.removeItem("cc_token");
    }
  }
  renderAuthArea();
  render();
}
document.addEventListener("DOMContentLoaded", init);
