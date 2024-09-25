# ft_transcendence

### étape 1
Créer le `.env`

Pour le 42auth :
[https://profile.intra.42.fr/oauth/applications](https://profile.intra.42.fr/oauth/applications)
=> Register new app, puis on récupère le UID et le secret
=> redirect uri
http://localhost/42callback
http://localhost/42sync

### étape 2
```bash
make
```

### creer une nouvelle app dans django
```bash
python manage.py startapp newapp
```



API

/api/current-user/
retourne l'utilisateur courant.

/api/login/
permets de se connecter
/api/logout/
permets de se deco





python3 manage.py makemigrations && python3 manage.py migrate

V1	django
V0.5	User and Game Stat Dashboard
V0.5	postgresSQL
V1	standard user management
V1	Oauth 42
X1	Another game
X1	Remote players

X(0.5)	Game Customization
X(1)		Live chat
X(0.5) GDPR
X(0.5)	expanding browser compatibility
X(0.5)	Multiple language supports

