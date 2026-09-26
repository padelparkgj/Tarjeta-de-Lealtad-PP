# Imágenes de los avisos: del proyecto viejo al del POS

**26 de septiembre de 2026.** Los 5 avisos con imagen apuntaban al proyecto de Supabase viejo
de la lealtad (`fsuqslgmilyqkutyvvdl`), que se va a apagar. Cada imagen se descargó de su URL
pública, se subió al bucket `announcements` del proyecto del POS **con el mismo nombre de
archivo** y sin permitir sobrescribir, y solo se reescribió `announcements.image_url` después
de comprobar que la URL nueva responde 200 con **los mismos bytes** (tamaño y SHA-256 iguales).
Una fila a la vez, releída después. En el proyecto viejo no se borró nada.

Los otros 3 avisos (los tres «Prueba») no tienen imagen: `image_url` es `null` y así siguen.

| Aviso | id | Archivo | Tamaño | SHA-256 (16) | URL vieja | URL nueva |
|---|---|---|---|---|---|---|
| Torneo Julio | `dbbffe75-9128-4a0e-9151-23464d34cd9e` | `ann-1782585552009.png` | 1.79 MB | `1fe719c9c0a8f48c` | https://fsuqslgmilyqkutyvvdl.supabase.co/storage/v1/object/public/announcements/ann-1782585552009.png | https://mhnwbbfgrpysejuekeau.supabase.co/storage/v1/object/public/announcements/ann-1782585552009.png |
| Curso de Verano | `f7b24a87-5614-409b-866c-0ded2295c754` | `ann-1782780951522.png` | 2.09 MB | `3766f59d94af6a26` | https://fsuqslgmilyqkutyvvdl.supabase.co/storage/v1/object/public/announcements/ann-1782780951522.png | https://mhnwbbfgrpysejuekeau.supabase.co/storage/v1/object/public/announcements/ann-1782780951522.png |
| Clase muestra | `c2dc52a0-dea4-418b-9494-16176f1ba509` | `ann-1782781252041.png` | 2.09 MB | `3766f59d94af6a26` | https://fsuqslgmilyqkutyvvdl.supabase.co/storage/v1/object/public/announcements/ann-1782781252041.png | https://mhnwbbfgrpysejuekeau.supabase.co/storage/v1/object/public/announcements/ann-1782781252041.png |
| Mañaneras | `0198584d-6cce-48cf-9868-23a214caaba7` | `ann-1784074525627.png` | 1.52 MB | `a534773c76a7b981` | https://fsuqslgmilyqkutyvvdl.supabase.co/storage/v1/object/public/announcements/ann-1784074525627.png | https://mhnwbbfgrpysejuekeau.supabase.co/storage/v1/object/public/announcements/ann-1784074525627.png |
| Torneo | `360e075a-e464-4e35-863f-5c7cfebe9d97` | `ann-1787612604259.png` | 21.52 MB | `43d578ece93e7ab4` | https://fsuqslgmilyqkutyvvdl.supabase.co/storage/v1/object/public/announcements/ann-1787612604259.png | https://mhnwbbfgrpysejuekeau.supabase.co/storage/v1/object/public/announcements/ann-1787612604259.png |

«Curso de Verano» y «Clase muestra» son **el mismo archivo** (misma huella) con dos nombres; se
conservaron los dos nombres para que cada aviso siga apuntando al suyo.

Si mañana una imagen se ve rota: la URL vieja de esta tabla es lo que había, mientras el
proyecto viejo viva. Después, solo queda la copia del POS.
