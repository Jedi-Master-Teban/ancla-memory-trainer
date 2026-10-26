#!/usr/bin/env bash
# Publica la PWA en la rama gh-pages (GitHub Pages) — ADR-039.
#
#   scripts/desplegar.sh estable "mensaje"   dist/       -> raíz del sitio, SIN tocar alpha/
#   scripts/desplegar.sh alfa    "mensaje"   dist-alfa/  -> alpha/, sin tocar el resto
#
# Por qué no `gh-pages -d dist` a secas: por defecto borra TODO lo que hay en la
# rama antes de añadir, y se llevaría la alfa por delante. Aquí cada canal
# reemplaza solo lo suyo. Los archivos con hash de la versión anterior sí se
# borran, como siempre (el service worker ya lo tiene en cuenta, ADR-030).
#
# `ANCLA_REMOTO` cambia el repositorio destino (para ensayar con uno de juguete).
set -euo pipefail

canal="${1:-}"
mensaje="${2:-Despliegue $(git rev-parse --short HEAD)}"
raiz="$(git rev-parse --show-toplevel)"
remoto="${ANCLA_REMOTO:-$(git -C "$raiz" config --get remote.origin.url)}"

case "$canal" in
  estable) origen="$raiz/dist" ;;
  alfa) origen="$raiz/dist-alfa" ;;
  *) echo "uso: scripts/desplegar.sh estable|alfa [mensaje]" >&2; exit 2 ;;
esac
[ -f "$origen/index.html" ] || { echo "no hay $origen/index.html: construye primero (npm run build:pwa / build:pwa:alfa)" >&2; exit 1; }

trabajo="$(mktemp -d)"
trap 'rm -rf "$trabajo"' EXIT
git clone --quiet --branch gh-pages --single-branch --depth 1 "$remoto" "$trabajo"

if [ "$canal" = "estable" ]; then
  find "$trabajo" -mindepth 1 -maxdepth 1 ! -name .git ! -name alpha -exec rm -rf {} +
  cp -R "$origen/." "$trabajo/"
else
  rm -rf "$trabajo/alpha"
  mkdir "$trabajo/alpha"
  cp -R "$origen/." "$trabajo/alpha/"
fi
touch "$trabajo/.nojekyll"

cd "$trabajo"
git add -A
if git diff --cached --quiet; then
  echo "Sin cambios que publicar."
  exit 0
fi
git commit --quiet -m "$mensaje"
git push --quiet origin gh-pages
echo "Publicado ($canal): $mensaje"
