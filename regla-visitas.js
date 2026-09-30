// ─────────────────────────────────────────────────────────────
// La regla de visitas del club — en un solo sitio
// ─────────────────────────────────────────────────────────────
// Decidida por Edgar el 26 de septiembre de 2026:
//
//   Ciclo de 7 visitas. La visita 4 del ciclo sale a tarifa Silver; la visita 7 sale
//   gratis. Terminado el ciclo, el contador vuelve a cero.
//   posicion = (visitas_previas mod 7) + 1 · 4 = Silver · 7 = gratis · el resto, normal.
//
//   4ª Silver y 7ª gratis, luego 11ª y 14ª, luego 18ª y 21ª.
//
// La cargan las dos páginas (Landing Page.html y Admin.html) antes que su .jsx, y TODO lo
// que habla de premios la llama: el panel al confirmar una visita, el que la guarda, el
// historial, el contador de la ficha y la tarjeta del socio. Antes el cálculo vivía
// repetido en cuatro sitios, con otra regla (3ª Silver, 6ª gratis), y los textos del socio
// prometían una tercera. No se vuelve a escribir un `% 6` ni un `% 3` fuera de aquí.
//
// ⚠️ «Silver» aquí es la TARIFA. El nivel del socio (tierFor, en app.jsx) tiene nombres
// propios, y members.level es el nivel de juego: tres cosas distintas.
(function () {
  const CICLO = 7;
  const POS_SILVER = 4;
  const POS_GRATIS = 7;

  /**
   * Qué le toca al socio en su siguiente visita, dadas las que ya lleva.
   * @param {number} previas visitas ya registradas
   * @returns {{ visita, posicion, premio, enCiclo, hastaSilver, hastaGratis }}
   *   visita      — número de la siguiente visita (previas + 1)
   *   posicion    — su lugar en el ciclo, de 1 a 7
   *   premio      — 'silver' | 'free' | null (tarifa normal)
   *   enCiclo     — visitas ya hechas en el ciclo actual (0 a 6): los sellos que se pintan
   *   hastaSilver — cuántas visitas faltan, contando la siguiente, para la Silver (1 = la siguiente)
   *   hastaGratis — ídem para la gratis
   */
  function reglaVisitas(previas) {
    const n = Math.max(0, Math.floor(Number(previas) || 0));
    const enCiclo = n % CICLO;
    const posicion = enCiclo + 1;
    const premio = posicion === POS_GRATIS ? 'free' : posicion === POS_SILVER ? 'silver' : null;
    return {
      visita: n + 1,
      posicion,
      premio,
      enCiclo,
      hastaSilver: ((POS_SILVER - posicion + CICLO) % CICLO) + 1,
      hastaGratis: (POS_GRATIS - posicion) + 1,
    };
  }

  /** El premio que tuvo la visita número `n` (1 = la primera). */
  function premioDeVisita(n) {
    return reglaVisitas(n - 1).premio;
  }

  /** Cuántas visitas Silver y cuántas gratis hubo en las primeras `total`. Contadas con la regla, no con una división. */
  function premiosEn(total) {
    let silver = 0, gratis = 0;
    for (let k = 1; k <= total; k++) {
      const p = premioDeVisita(k);
      if (p === 'silver') silver++;
      else if (p === 'free') gratis++;
    }
    return { silver, gratis };
  }

  /**
   * La línea que explica por qué el total y lo que cuenta difieren, o `null` si no difieren.
   * La promoción cuenta desde que el socio se registró en la app (members.vinculado_en); las
   * visitas de antes quedan en su historial y no cuentan. Sin culpar a nadie: es la regla.
   * @param {{ total: number, cuentan: number|null }} conteo  lo que devuelve PPSb.contarVisitas
   * @param {string|null} desde  members.vinculado_en
   * @param {'tu'|'el'} persona  'tu' en la app del socio, 'el' en el panel
   */
  function lineaConteo(conteo, desde, persona) {
    const tu = persona === 'tu';
    if (conteo.cuentan === null) {
      return tu
        ? 'Tu promoción empieza a contar cuando tu cuenta quede registrada en la app. Tus visitas se guardan igual.'
        : 'Aún no participa en la promoción: se dio de alta en el mostrador y no se ha registrado en la app. Sus visitas se guardan igual.';
    }
    if (conteo.cuentan === conteo.total) return null;
    const fecha = desde ? new Date(desde).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const antes = conteo.total - conteo.cuentan;
    return (tu ? `Llevas ${conteo.total} visitas. Para la promoción cuentan ${conteo.cuentan}: las de desde que te registraste en la app`
               : `${conteo.total} visitas en total. Para la promoción cuentan ${conteo.cuentan}: las de desde que se registró en la app`)
      + (fecha ? `, el ${fecha}` : '') + `. ${antes === 1 ? 'La de antes queda' : `Las ${antes} de antes quedan`} en el historial.`;
  }

  window.PPRegla = { reglaVisitas, premioDeVisita, premiosEn, lineaConteo, CICLO, POS_SILVER, POS_GRATIS };
})();
