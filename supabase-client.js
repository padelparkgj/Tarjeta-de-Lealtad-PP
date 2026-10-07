// ─────────────────────────────────────────────────────────────
// Supabase client — auth + datos de la lealtad
// ─────────────────────────────────────────────────────────────
// La base es la del POS (septiembre de 2026). Tres cambios de forma respecto a la
// base vieja se absorben AQUÍ, para que las pantallas sigan recibiendo lo mismo:
//
//  · members.id ya no es el id de la cuenta: la cuenta vive en members.user_id.
//  · visits y signups ya no copian el nombre: se lee de members por la llave foránea
//    (member_id → members.member_id) y se devuelve como member_name, que es lo que leen
//    las pantallas.
//
// ⚠️ La credencial (member_id) la genera la base. Nada aquí la inventa.
//
// ⚠️ **Nada de torneos** (v3.6, Edgar, 6 de octubre de 2026): los torneos de socios se juegan en
// otra app, y aquí solo se anuncian como un aviso más. Nada lee ni escribe tournaments,
// tournament_pairs ni tournament_matches. `signups` se queda: es la inscripción a cualquier
// aviso con allow_signup (una clase, una clínica), no solo a torneos.
//
// ⚠️ **Solo la app de socios usa este archivo** (v3.7, 7 de octubre de 2026): el panel de
// recepción se apagó y lo hace el POS. Lo que solo el panel llamaba —es_personal, la lista de
// socios y de visitas, registrar una visita, crear, editar y borrar avisos, subir su imagen y
// los inscritos de un aviso— se fue con él. No se vuelve a poner aquí: es trabajo del POS.
(function () {
  const cfg = window.PPGJ_CONFIG;
  const sb  = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);

  // ── Nombres leídos de members ─────────────────────────────
  const conNombre = (row) => {
    if (!row) return row;
    const { members, ...resto } = row;
    return { ...resto, member_name: members?.name || '' };
  };
  const mapear = (fn) => (res) => (res.error || !res.data) ? res : { ...res, data: Array.isArray(res.data) ? res.data.map(fn) : fn(res.data) };

  window.PPSb = {
    // ── Auth ──────────────────────────────────────────────────
    // Los datos de la ficha viajan en los metadatos de la cuenta: el proyecto pide
    // confirmar el correo, así que al registrarse todavía no hay sesión y la ficha no
    // se puede crear en ese momento. Se crea en el primer inicio de sesión
    // (vincularSocio), leyendo de aquí lo que la persona escribió.
    signUp(email, password, ficha) {
      return sb.auth.signUp({
        email, password,
        options: {
          data: ficha,
          emailRedirectTo: location.origin + location.pathname,
        },
      });
    },
    signIn(email, password) {
      return sb.auth.signInWithPassword({ email, password });
    },
    signOut() {
      return sb.auth.signOut();
    },
    getSession() {
      return sb.auth.getSession();
    },
    getUser() {
      return sb.auth.getUser();
    },
    onAuthChange(callback) {
      return sb.auth.onAuthStateChange(callback);
    },

    // ── Members table ─────────────────────────────────────────
    // La ficha de la cuenta con sesión. `maybeSingle`: no tener ficha no es un error,
    // es el caso de quien acaba de confirmar su correo.
    getMember(userId) {
      return sb.from('members').select('*').eq('user_id', userId).maybeSingle();
    },
    // La función decide sola: enlaza la ficha sin cuenta que tenga el correo de la
    // sesión (conserva credencial y visitas) o crea una nueva. Devuelve el member_id.
    vincularSocio(nombre, telefono, birth) {
      return sb.rpc('vincular_socio', {
        p_nombre:   nombre,
        p_telefono: telefono || null,
        p_birth:    birth || null,   // la columna es date: '' no es una fecha
      });
    },
    updateMyLevel(userId, level) {
      return sb.from('members').update({ level }).eq('user_id', userId).select('member_id');
    },

    // ── Visits table ──────────────────────────────────────────
    // Las visitas se registran solo en el POS (v3.7). Aquí solo se leen las del socio.
    // Todas las visitas de un socio, contadas EN LA BASE (count, sin traer filas). Es el total
    // del historial y del nivel (Bronce…Leyenda); NO es la promoción, que es promocionDe.
    // Devuelve { data: número, error }: una lectura caída no es «0 visitas».
    async contarVisitas(memberId) {
      const r = await sb.from('visits').select('id', { count: 'exact', head: true }).eq('member_id', memberId);
      if (r.error) return { data: null, error: r.error };
      if (r.count === null) return { data: null, error: new Error('la base no devolvió el conteo de visitas') };
      return { data: r.count, error: null };
    },
    // ── La promoción: la calcula la base, y solo la base ───────
    // promocion_de(p_member_id) es la misma función que usa el POS (v3.4, 5 de octubre de 2026;
    // antes esta app tenía su propia copia del ciclo, borrada en la v3.4). El jsonb llega TAL CUAL; las
    // pantallas leen sus llaves y no calculan nada:
    //   participa, vinculado_en, visitas_cuentan,
    //   visitas[]          { id, numero, dia, posicion, premio, regla_id }  — solo las que cuentan
    //   ciclo_actual       { regla_id, ciclo, visita_silver, visita_gratis, hechas }
    //   siguiente          { numero, posicion, premio, regla_id }
    //   proxima_con_premio { numero, posicion, premio } | null
    // premio: 'silver' | 'gratis' | null. Si no participa, `participa: false` y lo demás no se lee.
    // Personal consulta a cualquiera; un socio, solo la suya (42501 si no). Sin regla que rija el
    // día de una visita, la base contesta P0001: eso no es una lectura caída, es un dato que falta.
    promocionDe(memberId) {
      return sb.rpc('promocion_de', { p_member_id: memberId });
    },
    // La regla en vigor HOY (hoy_negocio()), para los textos generales: la bienvenida y
    // Beneficios (v3.5). regla_vigente() no recibe argumentos, la ejecutan anon y authenticated
    // —funciona sin sesión— y devuelve UNA fila { ciclo, visita_silver, visita_gratis,
    // vigente_desde }, que PostgREST entrega como arreglo: `.single()` la vuelve objeto, y cero
    // filas es un error, no una regla vacía.
    // ⚠️ No es lo que le toca a un socio: un socio a medio ciclo conserva la regla con la que lo
    // empezó. Su tarjeta lee promocionDe → ciclo_actual.
    // Si falla, la pantalla no promete números: dice que pregunten en recepción.
    reglaVigente() {
      return sb.rpc('regla_vigente').single();
    },
    // Una fecha SIN hora de la base ('YYYY-MM-DD', una columna `date`) como fecha local de ese
    // día. `new Date('1990-03-29')` la lee como medianoche UTC, que en el club es el 28: por eso
    // el cumpleaños salía un día antes en el perfil. Se separan año, mes y día; no se suman horas.
    // Devuelve null si el texto no es una fecha: no se inventa un día.
    fechaSinHora(texto) {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto || '');
      return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
    },
    // Los sellos del ciclo en curso, leídos de ciclo_actual: cuántos, cuáles llevan premio y
    // cuántos van llenos. Con la regla que diga la base, no con un 7 escrito aquí.
    puntosDelCiclo(c) {
      return Array.from({ length: c.ciclo }, (_, k) => {
        const i = k + 1;
        return { i, lleno: i <= c.hechas, premio: i === c.visita_gratis ? 'gratis' : i === c.visita_silver ? 'silver' : null };
      });
    },
    // Cada visita que cuenta, por su id: { numero, premio }. Las de antes de vinculado_en no
    // están, y en el historial no llevan número ni premio.
    porVisita(promo) {
      return new Map((promo.participa ? promo.visitas : []).map(v => [v.id, v]));
    },
    // Lo que se dice cuando promocionDe no contestó. Nunca un ciclo en cero: un cero inventado
    // se lee como «no tienes nada acumulado».
    faltaPromocion(error) {
      if (error && error.code === 'P0001') {
        const dia = (error.message || '').match(/\d{4}-\d{2}-\d{2}/);
        return `No se puede calcular la promoción: falta la regla de visitas${dia ? ` del ${dia[0]}` : ''}. Avisa en el mostrador.`;
      }
      return 'No se pudo leer la promoción. Revisa la conexión y vuelve a abrir esta pantalla.';
    },
    // La línea que explica por qué el total y lo que cuenta difieren, o `null` si no difieren.
    // Las dos cifras y la fecha vienen de la base: `total` de contarVisitas (null si no se pudo
    // leer), lo demás de promocionDe. Sin culpar a nadie: es la regla. Le habla al socio, de tú:
    // la versión en tercera persona era del panel de recepción, que ya no existe (v3.7).
    lineaConteo(total, promo) {
      if (!promo.participa) {
        return 'Tu promoción empieza a contar cuando tu cuenta quede registrada en la app. Tus visitas se guardan igual.';
      }
      const cuentan = promo.visitas_cuentan;
      if (total === null || cuentan === total) return null;
      const fecha = promo.vinculado_en ? new Date(promo.vinculado_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      const antes = total - cuentan;
      return `Llevas ${total} visitas. Para la promoción cuentan ${cuentan}: las de desde que te registraste en la app`
        + (fecha ? `, el ${fecha}` : '') + `. ${antes === 1 ? 'La de antes queda' : `Las ${antes} de antes quedan`} en el historial.`;
    },
    getMemberVisits(memberId) {
      return sb.from('visits')
        .select('*, members(name)')
        .eq('member_id', memberId)
        .order('visited_at', { ascending: false })
        .then(mapear(conNombre));
    },

    // ── Announcements table ───────────────────────────────────
    // Solo se leen los que se ven. Crearlos, editarlos y borrarlos es del POS (Socios → Avisos).
    getAnnouncements() {
      return sb.from('announcements')
        .select('*')
        .eq('active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });
    },

    // ── Signups table ─────────────────────────────────────────
    signUpForEvent(announcementId, memberId) {
      return sb.from('signups').upsert({
        announcement_id: announcementId,
        member_id:       memberId,
      });
    },
    cancelSignup(announcementId, memberId) {
      return sb.from('signups').delete()
        .eq('announcement_id', announcementId)
        .eq('member_id', memberId);
    },
    getMemberSignups(memberId) {
      return sb.from('signups').select('*, members(name)').eq('member_id', memberId)
        .order('signed_up_at', { ascending: false })
        .then(mapear(conNombre));
    },
  };
})();
