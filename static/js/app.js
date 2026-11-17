/* Campus Circular — CTC-07 · Frontend SPA (ES / EN / GL) */
"use strict";

const API = "";
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------------- i18n ---------------- */
const I18N = {
  es: {
    nav_home:"Explorar", nav_publish:"Publicar", nav_points:"Puntos de intercambio", nav_rules:"Normas y confianza", nav_about:"El proyecto",
    footer_tag:"Reutilización e intercambio de materiales universitarios.",
    footer_research:"Proyecto CTC-07 · Design Thinking · Universidade de Vigo. Investigación con 26 respuestas y 6 entrevistas (octubre 2026).",
    hero_title:"Lo que ya no usas puede ser lo que otro necesita.",
    hero_lead:"Campus Circular conecta a estudiantes de la Universidade de Vigo con materiales en buen estado que ya no se utilizan: libros, ropa, muebles, calculadoras y mucho más. Publica, busca y acuerda la entrega en el campus.",
    hero_search_ph:"Buscar libros, ropa, muebles…",
    hero_search_btn:"Buscar",
    stat_items:"objetos publicados", stat_available:"disponibles ahora", stat_delivered:"ya reutilizados", stat_users:"estudiantes registrados",
    all:"Todo", search:"Buscar", filters:"Filtros", campus:"Campus", condition:"Estado", type:"Tipo", sort:"Ordenar",
    sort_recent:"Más recientes", sort_price_asc:"Precio: menor a mayor", sort_price_desc:"Precio: mayor a menor",
    results:"objetos", no_results:"No hay objetos con esos filtros. Prueba con otra búsqueda o publica el tuyo.",
    publish_cta:"Publicar un objeto", free:"Gratis",
    login:"Iniciar sesión", register:"Crear cuenta", logout:"Cerrar sesión", my_area:"Mi área",
    my_items:"Mis objetos", my_requests:"Mis solicitudes", received:"Solicitudes recibidas", favorites:"Favoritos",
    publish_title:"Publicar un objeto",
    f_title:"Título", f_desc:"Descripción", f_category:"Categoría", f_condition:"Estado", f_type:"Tipo de intercambio",
    f_campus:"Campus", f_handover:"Punto de entrega", f_price:"Precio (€, solo si vendes)", f_image:"Foto (URL o sube una imagen)",
    f_image_ph:"https://… o /static/uploads/…", upload:"Subir imagen",
    desc_hint:"Describe el estado con honestidad: marcas, defectos, qué incluye. Las fotos y la descripción del estado son la función de confianza más valorada (18/26 en la encuesta CTC-07).",
    publish_btn:"Publicar objeto", cancel:"Cancelar",
    detail_request:"Solicitar", detail_fav:"Guardar", detail_faved:"Guardado",
    request_title:"Solicitar este objeto", request_msg:"Mensaje para el propietario (opcional)",
    request_msg_ph:"Hola, me interesa… ¿podemos quedar en el punto de intercambio?",
    request_btn:"Enviar solicitud", request_sent:"Solicitud enviada. El propietario la verá en su área.",
    owner:"Propietario/a", verified:"Verificado/a UVigo", not_verified:"Sin verificar",
    handover_label:"Entrega en", loan_rules:"Normas claras de préstamo y devolución. Si es un préstamo, acorda fecha de devolución en el mensaje.",
    status_disponible:"Disponible", status_reservado:"Reservado", status_entregado:"Entregado",
    req_pendiente:"Pendiente", req_aceptada:"Aceptada", req_rechazada:"Rechazada", req_cancelada:"Cancelada", req_completada:"Completada",
    accept:"Aceptar", reject:"Rechazar", complete:"Marcar entregado", cancel_req:"Cancelar solicitud",
    mark_available:"Marcar disponible", mark_reserved:"Marcar reservado", mark_delivered:"Marcar entregado", delete_item:"Eliminar",
    points_title:"Puntos de intercambio en el campus",
    points_lead:"La mitad de los encuestados (13/26) prefiere un punto de intercambio habilitado en el campus. Queda en un lugar público, entre clases, sin desplazamientos extra.",
    rules_title:"Normas y confianza",
    rules_lead:"Estado (77%) y confianza (50%) son las principales preocupaciones. Estas normas responden directamente a lo que pidió el alumnado.",
    about_title:"El proyecto CTC-07",
    about_lead:"Campus Circular nace de una investigación de Design Thinking con estudiantes de la Universidade de Vigo.",
    auth_login_title:"Iniciar sesión", auth_register_title:"Crear cuenta",
    auth_name:"Nombre", auth_email:"Email", auth_password:"Contraseña", auth_degree:"Titulación (opcional)",
    auth_email_hint:"Con email @alumnos.uvigo.es / @uvigo.gal obtienes la insignia de verificado UVigo.",
    auth_btn_login:"Entrar", auth_btn_register:"Registrarme",
    auth_no_account:"¿No tienes cuenta?", auth_have_account:"¿Ya tienes cuenta?",
    need_login:"Inicia sesión para continuar.", need_login_publish:"Inicia sesión para publicar un objeto.",
    demo_hint:"Crea tu cuenta con tu email de la UVigo y publica tu primer objeto.",
    toast_published:"Objeto publicado correctamente.", toast_deleted:"Objeto eliminado.",
    toast_status:"Estado actualizado.", toast_fav_on:"Guardado en favoritos.", toast_fav_off:"Eliminado de favoritos.",
    toast_request:"Solicitud enviada.", toast_req_status:"Solicitud actualizada.",
    toast_login:"Sesión iniciada. ¡Bienvenido/a!", toast_register:"Cuenta creada. ¡Bienvenido/a a Campus Circular!",
    toast_logout:"Sesión cerrada.", toast_error:"Algo salió mal. Inténtalo de nuevo.",
    toast_upload:"Imagen subida.", toast_own_item:"Este es tu objeto. Puedes gestionarlo en Mi área.",
    cat_libros:"Libros de texto / apuntes", cat_ropa:"Ropa", cat_muebles:"Muebles", cat_estudio:"Calculadoras / material de estudio",
    cat_electronica:"Electrónica / accesorios", cat_cocina:"Cocina / hogar", cat_electrodomesticos:"Pequeños electrodomésticos",
    cat_deporte:"Deporte y ocio", cat_otros:"Otros",
    cond_nuevo:"Nuevo", cond_como_nuevo:"Como nuevo", cond_bueno:"Bueno", cond_usable:"Usable con marcas",
    type_regalar:"Regalar", type_prestar:"Prestar", type_intercambiar:"Intercambiar", type_vender:"Vender",
    campus_vigo:"Vigo", campus_pontevedra:"Pontevedra", campus_ourense:"Ourense",
    hand_biblioteca:"Biblioteca", hand_entrada:"Entrada principal", hand_cafeteria:"Cafetería", hand_punto:"Punto de intercambio habilitado", hand_acordado:"Lugar acordado",
    my_empty_items:"Aún no has publicado ningún objeto.", my_empty_requests:"No tienes solicitudes enviadas.",
    my_empty_received:"No has recibido solicitudes todavía.", my_empty_favs:"No tienes favoritos. Toca el corazón en un objeto para guardarlo.",
    view_item:"Ver", items_word:"objetos",
    research_title:"Lo que dice la investigación",
    research_body:"26 respuestas (15 EN + 11 ES) y 6 entrevistas. 81% tenía objetos útiles que ya no necesitaba; 69% había conseguido algo de segunda mano en el último año. Ropa (92%) y libros (62%) lideran oferta y demanda. El estado (77%) y la confianza (50%) son las barreras principales. Por eso esta web exige foto y descripción del estado, verificación UVigo, normas claras y puntos de entrega en el campus.",
    how_title:"Cómo funciona",
    how_1_t:"1. Publica", how_1_b:"Foto + estado honesto + punto de entrega. En un minuto.",
    how_2_t:"2. Busca y solicita", how_2_b:"Filtra por categoría, campus y estado. Envía tu solicitud con un mensaje.",
    how_3_t:"3. Queda en el campus", how_3_b:"Punto de intercambio público entre clases. Marca como entregado al terminar.",
    rules_1_t:"Fotos y estado real", rules_1_b:"Describe marcas y defectos. Si algo no coincide, no lo aceptes.",
    rules_2_t:"Verificación UVigo", rules_2_b:"Prioriza perfiles verificados con email institucional.",
    rules_3_t:"Préstamos con fecha", rules_3_b:"Acuerda la devolución por escrito en la solicitud.",
    rules_4_t:"Entregas seguras", rules_4_b:"Lugares públicos del campus, nunca en domicilios de desconocidos.",
    rules_5_t:"Comunicación amable", rules_5_b:"Responde en 48 h. Si no puedes, cancela con tiempo.",
    rules_6_t:"Sin envíos por correo", rules_6_b:"Todo se entrega en mano en el campus para evitar problemas.",
    points_biblioteca_t:"Biblioteca", points_biblioteca_b:"Punto más votado. Queda en la entrada o recepción.",
    points_entrada_t:"Entrada principal", points_entrada_b:"Visible y fácil de encontrar entre clases.",
    points_cafeteria_t:"Cafetería", points_cafeteria_b:"Ideal antes o después de clase.",
    points_punto_t:"Punto de intercambio habilitado", points_punto_b:"Zona designada para dejar y recoger objetos.",
    points_acordado_t:"Lugar acordado", points_acordado_b:"Acordad un lugar público concreto en el mensaje.",
    about_p1:"Campus Circular conecta a estudiantes con materiales universitarios en buen estado que ya no utilizan con quienes los necesitan, para reducir residuos y gastos y facilitar el acceso a materiales.",
    about_p2:"La propuesta es una plataforma digital para publicar, buscar y solicitar materiales, con descripción del estado, confianza entre usuarios y organización de la entrega. Para funcionar debe ser accesible, sencilla y generar confianza.",
    about_p3:"Este sitio es la versión funcional del prototipo propuesto en el Abstract CTC-07. Los datos de demostración son ficticios y están inspirados en las categorías y necesidades detectadas en la investigación.",
    team_title:"Equipo CTC-07",
    lang_name:"Español",
  },
  en: {
    nav_home:"Browse", nav_publish:"List an item", nav_points:"Exchange points", nav_rules:"Rules & trust", nav_about:"The project",
    footer_tag:"Reuse and exchange of university materials.",
    footer_research:"Project CTC-07 · Design Thinking · Universidade de Vigo. Research with 26 responses and 6 interviews (October 2026).",
    hero_title:"What you no longer use may be what someone else needs.",
    hero_lead:"Campus Circular connects University of Vigo students with good-condition materials that are no longer used: books, clothing, furniture, calculators and more. List, find and arrange handover on campus.",
    hero_search_ph:"Search books, clothing, furniture…",
    hero_search_btn:"Search",
    stat_items:"items listed", stat_available:"available now", stat_delivered:"already reused", stat_users:"registered students",
    all:"All", search:"Search", filters:"Filters", campus:"Campus", condition:"Condition", type:"Type", sort:"Sort",
    sort_recent:"Most recent", sort_price_asc:"Price: low to high", sort_price_desc:"Price: high to low",
    results:"items", no_results:"No items match those filters. Try another search or list yours.",
    publish_cta:"List an item", free:"Free",
    login:"Log in", register:"Create account", logout:"Log out", my_area:"My area",
    my_items:"My items", my_requests:"My requests", received:"Received requests", favorites:"Favorites",
    publish_title:"List an item",
    f_title:"Title", f_desc:"Description", f_category:"Category", f_condition:"Condition", f_type:"Exchange type",
    f_campus:"Campus", f_handover:"Handover point", f_price:"Price (€, only if selling)", f_image:"Photo (URL or upload an image)",
    f_image_ph:"https://… or /static/uploads/…", upload:"Upload image",
    desc_hint:"Describe the condition honestly: marks, defects, what's included. Photos and condition descriptions are the most valued trust feature (18/26 in the CTC-07 survey).",
    publish_btn:"List item", cancel:"Cancel",
    detail_request:"Request", detail_fav:"Save", detail_faved:"Saved",
    request_title:"Request this item", request_msg:"Message for the owner (optional)",
    request_msg_ph:"Hi, I'm interested… can we meet at the exchange point?",
    request_btn:"Send request", request_sent:"Request sent. The owner will see it in their area.",
    owner:"Owner", verified:"UVigo verified", not_verified:"Not verified",
    handover_label:"Handover at", loan_rules:"Clear borrowing and return rules. If it's a loan, agree a return date in the message.",
    status_disponible:"Available", status_reservado:"Reserved", status_entregado:"Delivered",
    req_pendiente:"Pending", req_aceptada:"Accepted", req_rechazada:"Rejected", req_cancelada:"Cancelled", req_completada:"Completed",
    accept:"Accept", reject:"Reject", complete:"Mark delivered", cancel_req:"Cancel request",
    mark_available:"Mark available", mark_reserved:"Mark reserved", mark_delivered:"Mark delivered", delete_item:"Delete",
    points_title:"Campus exchange points",
    points_lead:"Half of respondents (13/26) prefer a designated campus exchange point. Meet in a public place, between classes, with no extra trips.",
    rules_title:"Rules & trust",
    rules_lead:"Condition (77%) and trust (50%) are the main concerns. These rules respond directly to what students asked for.",
    about_title:"Project CTC-07",
    about_lead:"Campus Circular comes from Design Thinking research with University of Vigo students.",
    auth_login_title:"Log in", auth_register_title:"Create account",
    auth_name:"Name", auth_email:"Email", auth_password:"Password", auth_degree:"Degree (optional)",
    auth_email_hint:"With an @alumnos.uvigo.es / @uvigo.gal email you get the UVigo verified badge.",
    auth_btn_login:"Log in", auth_btn_register:"Sign up",
    auth_no_account:"No account yet?", auth_have_account:"Already have an account?",
    need_login:"Log in to continue.", need_login_publish:"Log in to list an item.",
    demo_hint:"Create your account with your UVigo email and list your first item.",
    toast_published:"Item listed successfully.", toast_deleted:"Item deleted.",
    toast_status:"Status updated.", toast_fav_on:"Saved to favorites.", toast_fav_off:"Removed from favorites.",
    toast_request:"Request sent.", toast_req_status:"Request updated.",
    toast_login:"Logged in. Welcome!", toast_register:"Account created. Welcome to Campus Circular!",
    toast_logout:"Logged out.", toast_error:"Something went wrong. Please try again.",
    toast_upload:"Image uploaded.", toast_own_item:"This is your item. Manage it in My area.",
    cat_libros:"Textbooks / Notes", cat_ropa:"Clothing", cat_muebles:"Furniture", cat_estudio:"Calculators / Study equipment",
    cat_electronica:"Electronics / Accessories", cat_cocina:"Kitchen / Household", cat_electrodomesticos:"Small appliances",
    cat_deporte:"Sports & Leisure", cat_otros:"Other",
    cond_nuevo:"New", cond_como_nuevo:"Like new", cond_bueno:"Good", cond_usable:"Usable with marks",
    type_regalar:"Give away", type_prestar:"Lend", type_intercambiar:"Exchange", type_vender:"Sell",
    campus_vigo:"Vigo", campus_pontevedra:"Pontevedra", campus_ourense:"Ourense",
    hand_biblioteca:"Library", hand_entrada:"Main entrance", hand_cafeteria:"Cafeteria", hand_punto:"Designated exchange point", hand_acordado:"Agreed location",
    my_empty_items:"You haven't listed any items yet.", my_empty_requests:"You have no sent requests.",
    my_empty_received:"You haven't received any requests yet.", my_empty_favs:"No favorites yet. Tap the heart on an item to save it.",
    view_item:"View", items_word:"items",
    research_title:"What the research says",
    research_body:"26 responses (15 EN + 11 ES) and 6 interviews. 81% had usable items they no longer needed; 69% had obtained something second-hand in the past year. Clothing (92%) and books (62%) lead supply and demand. Condition (77%) and trust (50%) are the main barriers. That's why this site requires a photo and condition description, UVigo verification, clear rules and campus handover points.",
    how_title:"How it works",
    how_1_t:"1. List", how_1_b:"Photo + honest condition + handover point. In one minute.",
    how_2_t:"2. Search & request", how_2_b:"Filter by category, campus and condition. Send your request with a message.",
    how_3_t:"3. Meet on campus", how_3_b:"Public exchange point between classes. Mark as delivered when done.",
    rules_1_t:"Real photos & condition", rules_1_b:"Describe marks and defects. If something doesn't match, don't accept it.",
    rules_2_t:"UVigo verification", rules_2_b:"Prioritise verified profiles with institutional email.",
    rules_3_t:"Loans with a date", rules_3_b:"Agree the return in writing in the request.",
    rules_4_t:"Safe handovers", rules_4_b:"Public campus places, never at a stranger's home.",
    rules_5_t:"Kind communication", rules_5_b:"Reply within 48 h. If you can't, cancel in time.",
    rules_6_t:"No postal shipping", rules_6_b:"Everything is handed over in person on campus.",
    points_biblioteca_t:"Library", points_biblioteca_b:"Most voted point. Meet at the entrance or reception.",
    points_entrada_t:"Main entrance", points_entrada_b:"Visible and easy to find between classes.",
    points_cafeteria_t:"Cafeteria", points_cafeteria_b:"Ideal before or after class.",
    points_punto_t:"Designated exchange point", points_punto_b:"Designated area to drop off and pick up items.",
    points_acordado_t:"Agreed location", points_acordado_b:"Agree a specific public place in the message.",
    about_p1:"Campus Circular connects students who have usable materials they no longer need with students who can use them, reducing waste and expenses while improving access to study resources.",
    about_p2:"The proposal is a digital platform to list, search for and request materials, taking into account item descriptions, user trust and handover arrangements. To work, it must be accessible, easy to use and build trust.",
    about_p3:"This site is the functional version of the prototype proposed in the CTC-07 Abstract. Demo data is fictional and inspired by the categories and needs found in the research.",
    team_title:"Team CTC-07",
    lang_name:"English",
  },
  gl: {
    nav_home:"Explorar", nav_publish:"Publicar", nav_points:"Puntos de intercambio", nav_rules:"Normas e confianza", nav_about:"O proxecto",
    footer_tag:"Reutilización e intercambio de materiais universitarios.",
    footer_research:"Proxecto CTC-07 · Design Thinking · Universidade de Vigo. Investigación con 26 respostas e 6 entrevistas (outubro 2026).",
    hero_title:"O que xa non usas pode ser o que outro necesita.",
    hero_lead:"Campus Circular conecta ao alumnado da Universidade de Vigo con materiais en bo estado que xa non se utilizan: libros, roupa, mobles, calculadoras e moito máis. Publica, busca e acorda a entrega no campus.",
    hero_search_ph:"Buscar libros, roupa, mobles…",
    hero_search_btn:"Buscar",
    stat_items:"obxectos publicados", stat_available:"dispoñibles agora", stat_delivered:"xa reutilizados", stat_users:"estudantes rexistrados",
    all:"Todo", search:"Buscar", filters:"Filtros", campus:"Campus", condition:"Estado", type:"Tipo", sort:"Ordenar",
    sort_recent:"Máis recentes", sort_price_asc:"Prezo: de menor a maior", sort_price_desc:"Prezo: de maior a menor",
    results:"obxectos", no_results:"Non hai obxectos con eses filtros. Proba con outra busca ou publica o teu.",
    publish_cta:"Publicar un obxecto", free:"De balde",
    login:"Iniciar sesión", register:"Crear conta", logout:"Pechar sesión", my_area:"A miña área",
    my_items:"Os meus obxectos", my_requests:"As miñas solicitudes", received:"Solicitudes recibidas", favorites:"Favoritos",
    publish_title:"Publicar un obxecto",
    f_title:"Título", f_desc:"Descrición", f_category:"Categoría", f_condition:"Estado", f_type:"Tipo de intercambio",
    f_campus:"Campus", f_handover:"Punto de entrega", f_price:"Prezo (€, só se vendes)", f_image:"Foto (URL ou sobe unha imaxe)",
    f_image_ph:"https://… ou /static/uploads/…", upload:"Subir imaxe",
    desc_hint:"Describe o estado con honestidade: marcas, defectos, que inclúe. As fotos e a descrición do estado son a función de confianza máis valorada (18/26 na enquisa CTC-07).",
    publish_btn:"Publicar obxecto", cancel:"Cancelar",
    detail_request:"Solicitar", detail_fav:"Gardar", detail_faved:"Gardado",
    request_title:"Solicitar este obxecto", request_msg:"Mensaxe para o propietario (opcional)",
    request_msg_ph:"Ola, me interesa… podemos quedar no punto de intercambio?",
    request_btn:"Enviar solicitude", request_sent:"Solicitude enviada. O propietario vera a na súa área.",
    owner:"Propietario/a", verified:"Verificado/a UVigo", not_verified:"Sen verificar",
    handover_label:"Entrega en", loan_rules:"Normas claras de préstamo e devolución. Se é un préstamo, acordade a data de devolución na mensaxe.",
    status_disponible:"Dispoñible", status_reservado:"Reservado", status_entregado:"Entregado",
    req_pendiente:"Pendente", req_aceptada:"Aceptada", req_rechazada:"Rexeitada", req_cancelada:"Cancelada", req_completada:"Completada",
    accept:"Aceptar", reject:"Rexeitar", complete:"Marcar entregado", cancel_req:"Cancelar solicitude",
    mark_available:"Marcar dispoñible", mark_reserved:"Marcar reservado", mark_delivered:"Marcar entregado", delete_item:"Eliminar",
    points_title:"Puntos de intercambio no campus",
    points_lead:"A metade dos enquisados (13/26) prefire un punto de intercambio habilitado no campus. Queda nun lugar público, entre clases, sen desprazamentos extra.",
    rules_title:"Normas e confianza",
    rules_lead:"O estado (77%) e a confianza (50%) son as principais preocupacións. Estas normas responden directamente ao que pediu o alumnado.",
    about_title:"O proxecto CTC-07",
    about_lead:"Campus Circular nace dunha investigación de Design Thinking con estudantes da Universidade de Vigo.",
    auth_login_title:"Iniciar sesión", auth_register_title:"Crear conta",
    auth_name:"Nome", auth_email:"Email", auth_password:"Contrasinal", auth_degree:"Titulación (opcional)",
    auth_email_hint:"Con email @alumnos.uvigo.es / @uvigo.gal obtés a insignia de verificado UVigo.",
    auth_btn_login:"Entrar", auth_btn_register:"Rexistrarme",
    auth_no_account:"Non tes conta?", auth_have_account:"Xa tes conta?",
    need_login:"Inicia sesión para continuar.", need_login_publish:"Inicia sesión para publicar un obxecto.",
    demo_hint:"Crea a túa conta co teu email da UVigo e publica o teu primeiro obxecto.",
    toast_published:"Obxecto publicado correctamente.", toast_deleted:"Obxecto eliminado.",
    toast_status:"Estado actualizado.", toast_fav_on:"Gardado en favoritos.", toast_fav_off:"Eliminado de favoritos.",
    toast_request:"Solicitude enviada.", toast_req_status:"Solicitude actualizada.",
    toast_login:"Sesión iniciada. Benvido/a!", toast_register:"Conta creada. Benvido/a a Campus Circular!",
    toast_logout:"Sesión pechada.", toast_error:"Algo saíu mal. Inténtao de novo.",
    toast_upload:"Imaxe subida.", toast_own_item:"Este é o teu obxecto. Xestiónao en A miña área.",
    cat_libros:"Libros de texto / apuntes", cat_ropa:"Roupa", cat_muebles:"Mobles", cat_estudio:"Calculadoras / material de estudo",
    cat_electronica:"Electrónica / accesorios", cat_cocina:"Cociña / fogar", cat_electrodomesticos:"Pequenos electrodomésticos",
    cat_deporte:"Deporte e lecer", cat_otros:"Outros",
    cond_nuevo:"Novo", cond_como_nuevo:"Como novo", cond_bueno:"Bo", cond_usable:"Usable con marcas",
    type_regalar:"Regalar", type_prestar:"Prestar", type_intercambiar:"Intercambiar", type_vender:"Vender",
    campus_vigo:"Vigo", campus_pontevedra:"Pontevedra", campus_ourense:"Ourense",
    hand_biblioteca:"Biblioteca", hand_entrada:"Entrada principal", hand_cafeteria:"Cafetería", hand_punto:"Punto de intercambio habilitado", hand_acordado:"Lugar acordado",
    my_empty_items:"Aínda non publicaches ningún obxecto.", my_empty_requests:"Non tes solicitudes enviadas.",
    my_empty_received:"Aínda non recibiches solicitudes.", my_empty_favs:"Non tes favoritos. Toca o corazón nun obxecto para gardalo.",
    view_item:"Ver", items_word:"obxectos",
    research_title:"O que di a investigación",
    research_body:"26 respostas (15 EN + 11 ES) e 6 entrevistas. O 81% tiña obxectos útiles que xa non necesitaba; o 69% conseguira algo de segunda man no último ano. A roupa (92%) e os libros (62%) lideran oferta e demanda. O estado (77%) e a confianza (50%) son as barreiras principais. Por iso esta web esixe foto e descrición do estado, verificación UVigo, normas claras e puntos de entrega no campus.",
    how_title:"Como funciona",
    how_1_t:"1. Publica", how_1_b:"Foto + estado honesto + punto de entrega. Nun minuto.",
    how_2_t:"2. Busca e solicita", how_2_b:"Filtra por categoría, campus e estado. Envía a túa solicitude cunha mensaxe.",
    how_3_t:"3. Queda no campus", how_3_b:"Punto de intercambio público entre clases. Marca como entregado ao rematar.",
    rules_1_t:"Fotos e estado real", rules_1_b:"Describe marcas e defectos. Se algo non coincide, non o aceptes.",
    rules_2_t:"Verificación UVigo", rules_2_b:"Prioriza perfís verificados con email institucional.",
    rules_3_t:"Préstamos con data", rules_3_b:"Acordade a devolución por escrito na solicitude.",
    rules_4_t:"Entregas seguras", rules_4_b:"Lugares públicos do campus, nunca en domicilios de descoñecidos.",
    rules_5_t:"Comunicación amable", rules_5_b:"Responde en 48 h. Se non podes, cancela con tempo.",
    rules_6_t:"Sen envíos por correo", rules_6_b:"Todo entrégase en man no campus para evitar problemas.",
    points_biblioteca_t:"Biblioteca", points_biblioteca_b:"Punto máis votado. Queda na entrada ou recepción.",
    points_entrada_t:"Entrada principal", points_entrada_b:"Visible e fácil de atopar entre clases.",
    points_cafeteria_t:"Cafetería", points_cafeteria_b:"Ideal antes ou despois de clase.",
    points_punto_t:"Punto de intercambio habilitado", points_punto_b:"Zona designada para deixar e recoller obxectos.",
    points_acordado_t:"Lugar acordado", points_acordado_b:"Acordade un lugar público concreto na mensaxe.",
    about_p1:"Campus Circular conecta a estudantes con materiais universitarios en bo estado que xa non utilizan con quen os necesita, para reducir residuos e gastos e facilitar o acceso a materiais.",
    about_p2:"A proposta é unha plataforma dixital para publicar, buscar e solicitar materiais, con descrición do estado, confianza entre usuarios e organización da entrega. Para funcionar debe ser accesible, sinxela e xerar confianza.",
    about_p3:"Este sitio é a versión funcional do prototipo proposto no Abstract CTC-07. Os datos de demostración son ficticios e están inspirados nas categorías e necesidades detectadas na investigación.",
    team_title:"Equipo CTC-07",
    lang_name:"Galego",
  }
};

const CATEGORIES = ["libros","ropa","muebles","estudio","electronica","cocina","electrodomesticos","deporte","otros"];
const CONDITIONS = ["nuevo","como_nuevo","bueno","usable"];
const TYPES = ["regalar","prestar","intercambiar","vender"];
const CAMPUSES = ["vigo","pontevedra","ourense"];
const HANDOVERS = ["biblioteca","entrada","cafeteria","punto","acordado"];

const state = {
  lang: localStorage.getItem("cc_lang") || "es",
  user: null,
  token: localStorage.getItem("cc_token") || null,
  view: "home",
  myTab: "items",
  filters: { q:"", category:"", campus:"", condition:"", type:"", sort:"recent" },
  items: [],
  stats: null,
};

const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || I18N.es[k] || k;
const catLabel = (c) => t("cat_"+c);
const condLabel = (c) => t("cond_"+c);
const typeLabel = (c) => t("type_"+c);
const campusLabel = (c) => t("campus_"+c);
const handLabel = (c) => t("hand_"+c);
const statusLabel = (s) => t("status_"+s);
const reqLabel = (s) => t("req_"+s);

/* ---------------- API ---------------- */
async function api(path, opts={}) {
  const headers = { "Content-Type":"application/json", ...(opts.headers||{}) };
  if (state.token) headers["Authorization"] = "Bearer " + state.token;
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || "error");
    err.data = data;
    throw err;
  }
  return data;
}

function toast(msg, isError=false) {
  const root = $("#toast-root");
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(()=> el.remove(), 3800);
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
        <button class="user-chip" id="user-chip">
          <span class="avatar">${initials}</span>
          <span>${esc(state.user.name)}${state.user.verified ? " ✓" : ""}</span>
        </button>
        <div class="dropdown-menu hidden" id="user-menu">
          <button id="menu-my">${esc(t("my_area"))}</button>
          <button id="menu-publish">${esc(t("nav_publish"))}</button>
          <button id="menu-logout">${esc(t("logout"))}</button>
        </div>
      </div>`;
    $("#user-chip").onclick = (e) => { e.stopPropagation(); $("#user-menu").classList.toggle("hidden"); };
    document.addEventListener("click", () => { const m=$("#user-menu"); if(m) m.classList.add("hidden"); }, {once:true});
    $("#menu-my").onclick = () => navigate("my");
    $("#menu-publish").onclick = () => navigate("publish");
    $("#menu-logout").onclick = logout;
  }
}

async function logout() {
  try { await api("/api/auth/logout", {method:"POST"}); } catch(e) {}
  state.token = null; state.user = null;
  localStorage.removeItem("cc_token");
  renderAuthArea(); toast(t("toast_logout")); navigate("home");
}

function openModal(html) {
  $("#modal-root").innerHTML = `<div class="modal-backdrop" id="backdrop"><div class="modal">${html}</div></div>`;
  $("#backdrop").addEventListener("click", (e)=>{ if(e.target.id==="backdrop") closeModal(); });
}
function closeModal(){ $("#modal-root").innerHTML=""; }
function closeBtn(){ return `<button class="close" onclick="closeModal()" aria-label="Close">✕</button>`; }
window.closeModal = closeModal;

function openAuth(mode="login") {
  const isLogin = mode==="login";
  openModal(`
    ${closeBtn()}
    <h2>${esc(isLogin ? t("auth_login_title") : t("auth_register_title"))}</h2>
    <p class="muted">${esc(t("demo_hint"))}</p>
    <form id="auth-form">
      ${isLogin ? "" : `<div class="field"><label>${esc(t("auth_name"))}</label><input name="name" required minlength="2" maxlength="60"></div>`}
      <div class="field"><label>${esc(t("auth_email"))}</label><input name="email" type="email" required></div>
      <div class="field"><label>${esc(t("auth_password"))}</label><input name="password" type="password" required minlength="6"></div>
      ${isLogin ? "" : `
        <div class="form-grid">
          <div class="field"><label>${esc(t("campus"))}</label>
            <select name="campus">${CAMPUSES.map(c=>`<option value="${c}">${esc(campusLabel(c))}</option>`).join("")}</select></div>
          <div class="field"><label>${esc(t("auth_degree"))}</label><input name="degree" maxlength="80"></div>
        </div>
        <small>${esc(t("auth_email_hint"))}</small>`}
      <div style="margin-top:16px"><button class="btn btn-primary btn-block" type="submit">${esc(isLogin ? t("auth_btn_login") : t("auth_btn_register"))}</button></div>
    </form>
    <p style="text-align:center;margin-top:12px">
      ${isLogin ? esc(t("auth_no_account")) : esc(t("auth_have_account"))}
      <button class="btn btn-ghost btn-sm" id="switch-auth">${esc(isLogin ? t("register") : t("login"))}</button>
    </p>`);
  $("#switch-auth").onclick = () => openAuth(isLogin ? "register" : "login");
  $("#auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    try {
      const data = await api(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method:"POST", body: JSON.stringify(payload)
      });
      state.token = data.token; state.user = data.user;
      localStorage.setItem("cc_token", data.token);
      closeModal(); renderAuthArea();
      toast(isLogin ? t("toast_login") : t("toast_register"));
      render();
    } catch(err) {
      toast(err.message || t("toast_error"), true);
    }
  };
}

/* ---------------- Views ---------------- */
function navigate(view) {
  state.view = view;
  window.scrollTo({top:0, behavior:"smooth"});
  render();
}
window.navigate = navigate;

async function render() {
  const app = $("#app");
  document.documentElement.lang = state.lang;
  $$(".lang-switch button").forEach(b => b.classList.toggle("active", b.dataset.lang===state.lang));
  $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$("[data-nav]").forEach(b => b.onclick = () => navigate(b.dataset.nav));

  if (state.view==="home") return renderHome(app);
  if (state.view==="publish") return renderPublish(app);
  if (state.view==="points") return renderPoints(app);
  if (state.view==="rules") return renderRules(app);
  if (state.view==="about") return renderAbout(app);
  if (state.view==="my") return renderMy(app);
  return renderHome(app);
}

async function loadStats() {
  try { state.stats = await api("/api/stats"); } catch(e) { state.stats = null; }
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
  const data = await api("/api/items?" + params.toString());
  state.items = data.items || [];
}

function itemCard(it) {
  const price = it.exchange_type==="vender" ? `€${Number(it.price).toFixed(0)}` : esc(t("free"));
  const img = it.image_url || "";
  return `
  <article class="card">
    <div class="card-img">
      ${img ? `<img src="${esc(img)}" alt="${esc(it.title)}" loading="lazy" onerror="this.style.display='none'">` : ""}
      <span class="badge">${esc(condLabel(it.condition))}</span>
      <span class="badge badge-type">${esc(typeLabel(it.exchange_type))}</span>
      <button class="fav-btn ${it.is_favorite?"active":""}" data-fav="${it.id}" aria-label="Favorite">${it.is_favorite?"♥":"♡"}</button>
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
        <span class="price">${price}</span>
        <button class="btn btn-primary btn-sm" data-view="${it.id}">${esc(t("view_item"))}</button>
      </div>
    </div>
  </article>`;
}

async function renderHome(app) {
  await loadStats();
  await loadItems();
  const s = state.stats || {total_items:0, available:0, delivered:0, users:0};
  const f = state.filters;
  app.innerHTML = `
    <section class="hero">
      <h1>${esc(t("hero_title"))}</h1>
      <p class="lead">${esc(t("hero_lead"))}</p>
      <form class="searchbar" id="hero-search">
        <input id="q" type="search" placeholder="${esc(t("hero_search_ph"))}" value="${esc(f.q)}">
        <select id="campus-sel">
          <option value="">${esc(t("campus"))}: ${esc(t("all"))}</option>
          ${CAMPUSES.map(c=>`<option value="${c}" ${f.campus===c?"selected":""}>${esc(campusLabel(c))}</option>`).join("")}
        </select>
        <button class="btn btn-primary" type="submit">${esc(t("hero_search_btn"))}</button>
        <button class="btn btn-ghost" type="button" id="go-publish">${esc(t("publish_cta"))}</button>
      </form>
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
      <button class="chip ${!f.category?"active":""}" data-cat="">${esc(t("all"))}</button>
      ${CATEGORIES.map(c=>`<button class="chip ${f.category===c?"active":""}" data-cat="${c}">${esc(catLabel(c))}</button>`).join("")}
    </div>
    <div class="filter-row">
      <select id="f-condition">
        <option value="">${esc(t("condition"))}: ${esc(t("all"))}</option>
        ${CONDITIONS.map(c=>`<option value="${c}" ${f.condition===c?"selected":""}>${esc(condLabel(c))}</option>`).join("")}
      </select>
      <select id="f-type">
        <option value="">${esc(t("type"))}: ${esc(t("all"))}</option>
        ${TYPES.map(c=>`<option value="${c}" ${f.type===c?"selected":""}>${esc(typeLabel(c))}</option>`).join("")}
      </select>
      <select id="f-sort">
        <option value="recent" ${f.sort==="recent"?"selected":""}>${esc(t("sort_recent"))}</option>
        <option value="price_asc" ${f.sort==="price_asc"?"selected":""}>${esc(t("sort_price_asc"))}</option>
        <option value="price_desc" ${f.sort==="price_desc"?"selected":""}>${esc(t("sort_price_desc"))}</option>
      </select>
    </div>

    ${state.items.length ? `<div class="grid">${state.items.map(itemCard).join("")}</div>`
      : `<div class="empty">${esc(t("no_results"))}</div>`}

    <div class="two-col" style="margin-top:28px">
      <div class="info-card">
        <h3>${esc(t("how_title"))}</h3>
        <p><strong>${esc(t("how_1_t"))}</strong> — ${esc(t("how_1_b"))}</p>
        <p><strong>${esc(t("how_2_t"))}</strong> — ${esc(t("how_2_b"))}</p>
        <p><strong>${esc(t("how_3_t"))}</strong> — ${esc(t("how_3_b"))}</p>
      </div>
      <div class="info-card">
        <h3>${esc(t("research_title"))}</h3>
        <p>${esc(t("research_body"))}</p>
      </div>
    </div>`;

  $("#hero-search").onsubmit = (e)=>{ e.preventDefault(); state.filters.q=$("#q").value.trim(); state.filters.campus=$("#campus-sel").value; render(); };
  $("#go-publish").onclick = ()=> navigate("publish");
  $$("#cat-filters .chip").forEach(b=> b.onclick=()=>{ state.filters.category=b.dataset.cat; render(); });
  $("#f-condition").onchange = (e)=>{ state.filters.condition=e.target.value; render(); };
  $("#f-type").onchange = (e)=>{ state.filters.type=e.target.value; render(); };
  $("#f-sort").onchange = (e)=>{ state.filters.sort=e.target.value; render(); };
  $$("[data-view]").forEach(b=> b.onclick=()=> openItem(+b.dataset.view));
  $$("[data-fav]").forEach(b=> b.onclick= async ()=>{
    if(!state.user){ toast(t("need_login"), true); openAuth("login"); return; }
    try{
      const d = await api(`/api/items/${b.dataset.fav}/favorite`, {method:"POST"});
      toast(d.is_favorite ? t("toast_fav_on") : t("toast_fav_off"));
      render();
    }catch(e){ toast(e.message||t("toast_error"), true); }
  });
}

function renderPublish(app) {
  if (!state.user) {
    app.innerHTML = `<div class="empty" style="margin-top:30px"><p>${esc(t("need_login_publish"))}</p>
      <button class="btn btn-primary" id="pub-login">${esc(t("login"))}</button></div>`;
    $("#pub-login").onclick = ()=> openAuth("login");
    return;
  }
  app.innerHTML = `
    <div class="section-title"><h2>${esc(t("publish_title"))}</h2></div>
    <div class="info-card" style="max-width:820px">
      <form id="publish-form">
        <div class="field"><label>${esc(t("f_title"))}</label><input name="title" required minlength="3" maxlength="80" placeholder="Ej.: Libro de Derecho Civil"></div>
        <div class="field"><label>${esc(t("f_desc"))}</label><textarea name="description" required minlength="10" maxlength="2000" placeholder="..."></textarea><small>${esc(t("desc_hint"))}</small></div>
        <div class="form-grid">
          <div class="field"><label>${esc(t("f_category"))}</label>
            <select name="category">${CATEGORIES.map(c=>`<option value="${c}">${esc(catLabel(c))}</option>`).join("")}</select></div>
          <div class="field"><label>${esc(t("f_condition"))}</label>
            <select name="condition">${CONDITIONS.map(c=>`<option value="${c}">${esc(condLabel(c))}</option>`).join("")}</select></div>
          <div class="field"><label>${esc(t("f_type"))}</label>
            <select name="exchange_type" id="pub-type">${TYPES.map(c=>`<option value="${c}">${esc(typeLabel(c))}</option>`).join("")}</select></div>
          <div class="field" id="price-field" style="display:none"><label>${esc(t("f_price"))}</label><input name="price" type="number" min="0" max="10000" step="1" value="0"></div>
          <div class="field"><label>${esc(t("f_campus"))}</label>
            <select name="campus">${CAMPUSES.map(c=>`<option value="${c}" ${state.user.campus===c?"selected":""}>${esc(campusLabel(c))}</option>`).join("")}</select></div>
          <div class="field"><label>${esc(t("f_handover"))}</label>
            <select name="handover_point">${HANDOVERS.map(c=>`<option value="${c}">${esc(handLabel(c))}</option>`).join("")}</select></div>
        </div>
        <div class="field"><label>${esc(t("f_image"))}</label>
          <input name="image_url" id="img-url" placeholder="${esc(t("f_image_ph"))}">
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input type="file" id="img-file" accept="image/*">
            <button type="button" class="btn btn-ghost btn-sm" id="upload-btn">${esc(t("upload"))}</button>
          </div>
          <img id="img-preview" class="hidden" style="margin-top:10px;width:100%;max-height:240px;object-fit:cover;border-radius:12px" alt="">
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" type="submit">${esc(t("publish_btn"))}</button>
          <button class="btn btn-ghost" type="button" id="pub-cancel">${esc(t("cancel"))}</button>
        </div>
      </form>
    </div>`;
  $("#pub-type").onchange = (e)=>{ $("#price-field").style.display = e.target.value==="vender" ? "block" : "none"; };
  $("#img-url").oninput = (e)=>{ const v=e.target.value.trim(); const p=$("#img-preview"); if(v){p.src=v; p.classList.remove("hidden");} else p.classList.add("hidden"); };
  $("#upload-btn").onclick = async ()=>{
    const file = $("#img-file").files[0];
    if(!file){ toast(t("toast_error"), true); return; }
    const fd = new FormData(); fd.append("file", file);
    try{
      const res = await fetch("/api/upload", {method:"POST", headers: state.token?{"Authorization":"Bearer "+state.token}:{}, body: fd});
      const data = await res.json();
      if(!res.ok) throw new Error(data.message||"error");
      $("#img-url").value = data.url; $("#img-preview").src = data.url; $("#img-preview").classList.remove("hidden");
      toast(t("toast_upload"));
    }catch(e){ toast(e.message||t("toast_error"), true); }
  };
  $("#pub-cancel").onclick = ()=> navigate("home");
  $("#publish-form").onsubmit = async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.price = payload.exchange_type==="vender" ? Number(payload.price||0) : 0;
    try{
      await api("/api/items", {method:"POST", body: JSON.stringify(payload)});
      toast(t("toast_published")); navigate("home");
    }catch(err){ toast(err.message||t("toast_error"), true); }
  };
}

function renderPoints(app) {
  const pts = ["biblioteca","entrada","cafeteria","punto","acordado"];
  app.innerHTML = `
    <div class="section-title"><h2>${esc(t("points_title"))}</h2></div>
    <p class="muted" style="max-width:760px">${esc(t("points_lead"))}</p>
    <div class="grid" style="margin-top:18px">
      ${pts.map(p=>`
        <div class="point-card">
          <h3>📍 ${esc(t("points_"+p+"_t"))}</h3>
          <p class="muted">${esc(t("points_"+p+"_b"))}</p>
          <p><span class="pill">${esc(campusLabel("vigo"))}</span> <span class="pill grey">${esc(campusLabel("pontevedra"))}</span> <span class="pill grey">${esc(campusLabel("ourense"))}</span></p>
        </div>`).join("")}
    </div>`;
}

function renderRules(app) {
  const rules = [1,2,3,4,5,6];
  app.innerHTML = `
    <div class="section-title"><h2>${esc(t("rules_title"))}</h2></div>
    <p class="muted" style="max-width:760px">${esc(t("rules_lead"))}</p>
    <div class="grid" style="margin-top:18px">
      ${rules.map(n=>`
        <div class="info-card">
          <h3>${esc(t("rules_"+n+"_t"))}</h3>
          <p class="muted">${esc(t("rules_"+n+"_b"))}</p>
        </div>`).join("")}
    </div>
    <div class="info-card" style="margin-top:18px">
      <h3>${esc(t("research_title"))}</h3>
      <p>${esc(t("research_body"))}</p>
    </div>`;
}

function renderAbout(app) {
  app.innerHTML = `
    <div class="section-title"><h2>${esc(t("about_title"))}</h2></div>
    <p class="muted" style="max-width:820px">${esc(t("about_lead"))}</p>
    <div class="info-card" style="max-width:820px">
      <p>${esc(t("about_p1"))}</p>
      <p>${esc(t("about_p2"))}</p>
      <p>${esc(t("about_p3"))}</p>
      <h3 style="margin-top:20px">${esc(t("team_title"))}</h3>
      <p class="muted">Antonio Domínguez Trapero · Pavlo Kovalenko · Karen Itzel Sandoval Ramos · Okechukwu Patrick Okeh · Fernando Heriberto Cardenas Rubi · Alba Grille Louro · Filip Juran · Greypher Alisander Garcia Alvarado · Jacob Schaal</p>
      <div class="kpi-row">
        <div class="kpi"><strong>26</strong><span>encuestas</span></div>
        <div class="kpi"><strong>6</strong><span>entrevistas</span></div>
        <div class="kpi"><strong>81%</strong><span>con objetos para dar</span></div>
        <div class="kpi"><strong>77%</strong><span>preocupados por el estado</span></div>
      </div>
    </div>`;
}

async function renderMy(app) {
  if (!state.user) {
    app.innerHTML = `<div class="empty" style="margin-top:30px"><p>${esc(t("need_login"))}</p>
      <button class="btn btn-primary" id="my-login">${esc(t("login"))}</button></div>`;
    $("#my-login").onclick = ()=> openAuth("login");
    return;
  }
  const tab = state.myTab;
  let content = "";
  if (tab==="items") {
    const data = await api("/api/items?status=&sort=recent").catch(()=>({items:[]}));
    const mine = (data.items||[]).filter(i=> i.owner_id===state.user.id);
    content = mine.length ? mine.map(it=>`
      <div class="list-item">
        ${it.image_url?`<img src="${esc(it.image_url)}" alt="">`:""}
        <div class="grow"><strong>${esc(it.title)}</strong><br>
          <span class="muted">${esc(catLabel(it.category))} · ${esc(campusLabel(it.campus))} · ${esc(typeLabel(it.exchange_type))}</span></div>
        <span class="status-pill status-${esc(it.status)}">${esc(statusLabel(it.status))}</span>
        <button class="btn btn-ghost btn-sm" data-view="${it.id}">${esc(t("view_item"))}</button>
        <select data-status="${it.id}">
          <option value="disponible" ${it.status==="disponible"?"selected":""}>${esc(t("status_disponible"))}</option>
          <option value="reservado" ${it.status==="reservado"?"selected":""}>${esc(t("status_reservado"))}</option>
          <option value="entregado" ${it.status==="entregado"?"selected":""}>${esc(t("status_entregado"))}</option>
        </select>
        <button class="btn btn-danger btn-sm" data-del="${it.id}">${esc(t("delete_item"))}</button>
      </div>`).join("") : `<div class="empty">${esc(t("my_empty_items"))}</div>`;
  } else if (tab==="requests") {
    const data = await api("/api/requests/mine").catch(()=>({requests:[]}));
    content = data.requests.length ? data.requests.map(r=>`
      <div class="list-item">
        ${r.item_image?`<img src="${esc(r.item_image)}" alt="">`:""}
        <div class="grow"><strong>${esc(r.item_title)}</strong><br>
          <span class="muted">${esc(r.message||"—")}</span></div>
        <span class="status-pill status-${esc(r.status)}">${esc(reqLabel(r.status))}</span>
        ${r.status==="pendiente" ? `<button class="btn btn-ghost btn-sm" data-cancelreq="${r.id}">${esc(t("cancel_req"))}</button>` : ""}
      </div>`).join("") : `<div class="empty">${esc(t("my_empty_requests"))}</div>`;
  } else if (tab==="received") {
    const data = await api("/api/requests/received").catch(()=>({requests:[]}));
    content = data.requests.length ? data.requests.map(r=>`
      <div class="list-item">
        ${r.item_image?`<img src="${esc(r.item_image)}" alt="">`:""}
        <div class="grow"><strong>${esc(r.item_title)}</strong> · ${esc(r.requester_name)}<br>
          <span class="muted">${esc(r.message||"—")}</span></div>
        <span class="status-pill status-${esc(r.status)}">${esc(reqLabel(r.status))}</span>
        ${r.status==="pendiente" ? `
          <button class="btn btn-primary btn-sm" data-accept="${r.id}">${esc(t("accept"))}</button>
          <button class="btn btn-ghost btn-sm" data-reject="${r.id}">${esc(t("reject"))}</button>` : ""}
        ${r.status==="aceptada" ? `<button class="btn btn-primary btn-sm" data-complete="${r.id}">${esc(t("complete"))}</button>` : ""}
      </div>`).join("") : `<div class="empty">${esc(t("my_empty_received"))}</div>`;
  } else if (tab==="favorites") {
    const data = await api("/api/favorites").catch(()=>({items:[]}));
    content = data.items.length ? `<div class="grid">${data.items.map(itemCard).join("")}</div>` : `<div class="empty">${esc(t("my_empty_favs"))}</div>`;
  }

  app.innerHTML = `
    <div class="section-title"><h2>${esc(t("my_area"))} · ${esc(state.user.name)}</h2>
      <p>${state.user.verified ? "✓ " + esc(t("verified")) : esc(t("not_verified"))} · ${esc(state.user.degree||"")}</p></div>
    <div class="tabs">
      <button data-tab="items" class="${tab==="items"?"active":""}">${esc(t("my_items"))}</button>
      <button data-tab="requests" class="${tab==="requests"?"active":""}">${esc(t("my_requests"))}</button>
      <button data-tab="received" class="${tab==="received"?"active":""}">${esc(t("received"))}</button>
      <button data-tab="favorites" class="${tab==="favorites"?"active":""}">${esc(t("favorites"))}</button>
    </div>
    ${content}`;

  $$("[data-tab]").forEach(b=> b.onclick=()=>{ state.myTab=b.dataset.tab; render(); });
  $$("[data-view]").forEach(b=> b.onclick=()=> openItem(+b.dataset.view));
  $$("[data-status]").forEach(sel=> sel.onchange = async ()=>{
    try{ await api(`/api/items/${sel.dataset.status}`, {method:"PATCH", body: JSON.stringify({status: sel.value})}); toast(t("toast_status")); render(); }
    catch(e){ toast(e.message||t("toast_error"), true); }
  });
  $$("[data-del]").forEach(b=> b.onclick = async ()=>{
    if(!confirm(t("delete_item")+"?")) return;
    try{ await api(`/api/items/${b.dataset.del}`, {method:"DELETE"}); toast(t("toast_deleted")); render(); }
    catch(e){ toast(e.message||t("toast_error"), true); }
  });
  $$("[data-cancelreq]").forEach(b=> b.onclick = async ()=>{
    try{ await api(`/api/requests/${b.dataset.cancelreq}`, {method:"PATCH", body: JSON.stringify({status:"cancelada"})}); toast(t("toast_req_status")); render(); }
    catch(e){ toast(e.message||t("toast_error"), true); }
  });
  $$("[data-accept]").forEach(b=> b.onclick = async ()=>{
    try{ await api(`/api/requests/${b.dataset.accept}`, {method:"PATCH", body: JSON.stringify({status:"aceptada"})}); toast(t("toast_req_status")); render(); }
    catch(e){ toast(e.message||t("toast_error"), true); }
  });
  $$("[data-reject]").forEach(b=> b.onclick = async ()=>{
    try{ await api(`/api/requests/${b.dataset.reject}`, {method:"PATCH", body: JSON.stringify({status:"rechazada"})}); toast(t("toast_req_status")); render(); }
    catch(e){ toast(e.message||t("toast_error"), true); }
  });
  $$("[data-complete]").forEach(b=> b.onclick = async ()=>{
    try{ await api(`/api/requests/${b.dataset.complete}`, {method:"PATCH", body: JSON.stringify({status:"completada"})}); toast(t("toast_req_status")); render(); }
    catch(e){ toast(e.message||t("toast_error"), true); }
  });
  $$("[data-fav]").forEach(b=> b.onclick = async ()=>{
    try{ const d = await api(`/api/items/${b.dataset.fav}/favorite`, {method:"POST"}); toast(d.is_favorite?t("toast_fav_on"):t("toast_fav_off")); render(); }
    catch(e){ toast(e.message||t("toast_error"), true); }
  });
}

/* ---------------- Item detail ---------------- */
async function openItem(id) {
  try {
    const data = await api(`/api/items/${id}`);
    const it = data.item;
    const owner = it.owner || {};
    const isOwn = state.user && state.user.id===it.owner_id;
    const price = it.exchange_type==="vender" ? `€${Number(it.price).toFixed(0)}` : esc(t("free"));
    openModal(`
      ${closeBtn()}
      ${it.image_url?`<img class="detail-img" src="${esc(it.image_url)}" alt="${esc(it.title)}" onerror="this.style.display='none'">`:""}
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
        <span class="avatar">${esc((owner.name||"?").charAt(0).toUpperCase())}</span>
        <div>
          <strong>${esc(owner.name||"—")}</strong> ${owner.verified?`<span class="verified">✓ ${esc(t("verified"))}</span>`:`<span class="muted">${esc(t("not_verified"))}</span>`}<br>
          <span class="muted">${esc(t("handover_label"))}: ${esc(handLabel(it.handover_point))} · ${esc(campusLabel(it.campus))}</span>
        </div>
        <span class="price" style="margin-left:auto">${price}</span>
      </div>
      <p class="muted" style="font-size:14px">${esc(t("loan_rules"))}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
        ${isOwn
          ? `<button class="btn btn-ghost" id="detail-manage">${esc(t("my_area"))}</button>`
          : `<button class="btn btn-primary" id="detail-request" ${it.status!=="disponible"?"disabled":""}>${esc(t("detail_request"))}</button>`}
        <button class="btn btn-ghost" id="detail-fav">${it.is_favorite?esc(t("detail_faved")):esc(t("detail_fav"))}</button>
      </div>`);
    const favBtn = $("#detail-fav");
    if (favBtn) favBtn.onclick = async ()=>{
      if(!state.user){ toast(t("need_login"), true); openAuth("login"); return; }
      try{ const d = await api(`/api/items/${id}/favorite`, {method:"POST"}); toast(d.is_favorite?t("toast_fav_on"):t("toast_fav_off")); openItem(id); }
      catch(e){ toast(e.message||t("toast_error"), true); }
    };
    const manageBtn = $("#detail-manage");
    if (manageBtn) manageBtn.onclick = ()=>{ closeModal(); navigate("my"); };
    const reqBtn = $("#detail-request");
    if (reqBtn) reqBtn.onclick = ()=>{
      if(!state.user){ toast(t("need_login"), true); openAuth("login"); return; }
      openRequest(id);
    };
  } catch(e) { toast(e.message||t("toast_error"), true); }
}

function openRequest(itemId) {
  openModal(`
    ${closeBtn()}
    <h2>${esc(t("request_title"))}</h2>
    <form id="request-form">
      <div class="field"><label>${esc(t("request_msg"))}</label>
        <textarea name="message" maxlength="1000" placeholder="${esc(t("request_msg_ph"))}"></textarea></div>
      <button class="btn btn-primary btn-block" type="submit">${esc(t("request_btn"))}</button>
    </form>`);
  $("#request-form").onsubmit = async (e)=>{
    e.preventDefault();
    const message = new FormData(e.target).get("message") || "";
    try{
      await api(`/api/items/${itemId}/request`, {method:"POST", body: JSON.stringify({message})});
      closeModal(); toast(t("toast_request"));
    }catch(err){ toast(err.message||t("toast_error"), true); }
  };
}

/* ---------------- Init ---------------- */
async function init() {
  $$(".lang-switch button").forEach(b=>{
    b.onclick = ()=>{
      state.lang = b.dataset.lang;
      localStorage.setItem("cc_lang", state.lang);
      renderAuthArea(); render();
    };
  });
  if (state.token) {
    try {
      const data = await api("/api/auth/me");
      state.user = data.user;
      if (!state.user) { state.token=null; localStorage.removeItem("cc_token"); }
    } catch(e) { state.token=null; localStorage.removeItem("cc_token"); }
  }
  renderAuthArea();
  render();
}
document.addEventListener("DOMContentLoaded", init);
