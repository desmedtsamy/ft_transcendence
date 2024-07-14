# ft_transcendence

### étape 1
créer le .env 

pour le 42auth
https://profile.intra.42.fr/oauth/applications
=> register new app, puis on recuperer le uid et le secret

### étape 2
make

creation / mise a jour de la db
executer la commande dans le container "web"
python manage.py makemigrations && python manage.py migrate

creation d'un compte admin
python manage.py createsuperuser
