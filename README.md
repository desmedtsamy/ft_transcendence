# ft_transcendence

### étape 1
Créer le `.env`

Pour le 42auth :
[https://profile.intra.42.fr/oauth/applications](https://profile.intra.42.fr/oauth/applications)
=> Register new app, puis on récupère le UID et le secret
=> redirect uri
http://localhost:8042/42callback
http://localhost:8042/42sync

### étape 2
```bash
make
```

### creer une nouvelle app dans django
```bash
python manage.py startapp newapp
```

python3 manage.py makemigrations && python3 manage.py migrate

V1		django
V0.5	boostrap
V0.5	postgresSQL
V1		standard user management
V1		Oauth 42
V1		Remote players
V1		Another game



V0.5	User and Game Stat Dashboard
X(0.5)	expanding browser compatibility


X(0.5)	Game Customization
X(0.5)	Multiple language supports
X(0.5) GDPR

X(1)	Live chat


matchmaking
fix 1v1
add amis page