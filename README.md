# ft_transcendence

### étape 1
Créer le `.env`

Pour le 42auth :
[https://profile.intra.42.fr/oauth/applications](https://profile.intra.42.fr/oauth/applications)
=> Register new app, puis on récupère le UID et le secret
=> redirect uri
http://localhost:8000/account/42callback
http://localhost:8000/account/42sync

### étape 2
```bash
make
```