#!/bin/bash

# Obtenir le nom d'hôte depuis les variables d'environnement ou utiliser une valeur par défaut

# Extraire juste le nom de domaine sans le port pour le certificat
DOMAIN=$(echo ${HOST}:${PORT} | cut -d':' -f1)

# Afficher les valeurs pour le débogage
echo "Using HOST: $HOST"
echo "Using PORT: $PORT"
echo "Using DOMAIN for SSL certificate: $DOMAIN"

# Générer un certificat SSL auto-signé avec le bon nom de domaine
echo "Generating SSL certificate for $DOMAIN..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=42/CN=$DOMAIN" \
    -addext "subjectAltName = DNS:$DOMAIN,DNS:localhost"

# Remplacer les variables dans le template de configuration nginx
envsubst '${HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Exécuter la commande passée en argument (nginx -g daemon off;)
exec "$@" 