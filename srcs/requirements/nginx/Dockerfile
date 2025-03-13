FROM nginx:latest

# Installation des outils nécessaires
RUN apt-get update && apt-get install -y \
    openssl \
    gettext-base  # Pour envsubst, nécessaire pour remplacer les variables dans les templates

# Création du répertoire pour les certificats SSL
RUN mkdir -p /etc/nginx/ssl

# Copier le template de configuration
COPY nginx.conf /etc/nginx/nginx.conf.template

# Créer un script de démarrage
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Définir le script comme point d'entrée
ENTRYPOINT ["/start.sh"]
CMD ["nginx", "-g", "daemon off;"]

#COPY ../frontend /usr/share/nginx/html