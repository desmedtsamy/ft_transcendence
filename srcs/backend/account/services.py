import os
import json
import requests
from django.conf import settings
from requests_oauthlib import OAuth2Session
from .models import User, FriendshipRequest, Friendship
from .serializers import UserSerializer
from django.contrib.auth import login
from django.db.models import Q
from account.signals import friend_request_created

def get_42_user_data(request, redirect_uri):
	client_id = settings.FORTYTWO_CLIENT_ID
	client_secret = settings.FORTYTWO_CLIENT_SECRET
	token_url = 'https://api.intra.42.fr/oauth/token'
	try:
		data = request.data
		code = data.get('code')
	except json.JSONDecodeError:
		return {'error': 'Données JSON invalides.'}, 400
	if not code:
		return {'error': 'Code d\'autorisation manquant.'}, 400
	oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
	token = oauth.fetch_token(
		token_url,
		code=code,
		client_secret=client_secret,
		include_client_id=True
	)
	intra_api_url = 'https://api.intra.42.fr/v2/me'
	response = oauth.get(intra_api_url)
	user_data = response.json()
	return user_data, 200

def generate_unique_email(email):
    local_part, domain = email.split("@")  # Sépare l'adresse en deux parties
    num = 1
    new_email = email

    while User.objects.filter(email=new_email).exists():
        new_email = f"{local_part}+{num}@{domain}"
        num += 1

    return new_email

def handle_42_user(request, user_data, update_existing_user=False):
	email = user_data['email']
	first_name = user_data['first_name']
	last_name = user_data['last_name']
	intra_id = user_data['id']
	username = user_data['login']
	avatar_url = user_data['image']['link']
	if update_existing_user:
		user = request.user
		if user.intra_id and user.intra_id != intra_id:
			return {'error': 'Vous ne pouvez pas mettre à jour un utilisateur existant avec des données d\'un autre utilisateur.'}, 400
		if User.objects.filter(intra_id=intra_id).exclude(id=user.id).exists():
			return {'error': 'Un utilisateur avec cet ID 42 existe déjà.'}, 400
	else:
		user = User.objects.filter(intra_id=intra_id).first()

		if not user:
			num = 1
			while User.objects.filter(username=username).exists():
				username = f"{user_data['login']}_{num}"
				num += 1
			email = generate_unique_email(user_data['email'])
			
			user = User.objects.create_user(
				username=username,
				email=email,
			)
	user.intra_id = intra_id
	user.first_name = first_name
	user.last_name = last_name
	avatar_response = requests.get(avatar_url)
	if avatar_response.status_code == 200:
		try:
			os.makedirs(os.path.join(settings.MEDIA_ROOT, 'profile_pics'), exist_ok=True)
			with open(os.path.join(settings.MEDIA_ROOT, f'profile_pics/{user.username}.jpg'), 'wb') as f:
				f.write(avatar_response.content)
			user.avatar = f'profile_pics/{user.username}.jpg'
			user.save()
		except Exception as e:
			print(f"Erreur lors de l'enregistrement de l'avatar : {e}")

	login(request, user)
	serializer = UserSerializer(user)
	return {'success': True, 'user': serializer.data}, 200

def update_user(user, request):
	if 'old_password' in request.data and request.data["old_password"]:
		old_password = request.data["old_password"]
		if not user.check_password(old_password):
			return {'error': "L'ancien mot de passe est incorrect."}, 400
	
	serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
	if serializer.is_valid():
		serializer.save()
		login(request,user)
		return {'success': 'Profil mis à jour avec succès.'}, 200
	else:
		return {'error': serializer.errors}, 400


def send_friend_request(from_user, to_user):
	existing_request = FriendshipRequest.objects.filter(from_user=from_user, to_user=to_user).first()
	if existing_request:
		return {'error': 'Une demande d\'ami a déjà été envoyée à cet utilisateur.'}, 400
	FriendshipRequest.objects.create(from_user=from_user, to_user=to_user)
	friend_request_created.send(sender=None , from_user=from_user, to_user=to_user)
	return {'success': 'Demande d\'ami envoyée avec succès.'}, 201


def remove_friend(from_user, to_user):
	friendship = Friendship.objects.filter(
		(Q(user1=from_user) & Q(user2=to_user)) | 
		(Q(user1=to_user) & Q(user2=from_user))
	).first()
	
	if not friendship:
		return {'error': 'Vous n\'êtes pas amis avec cet utilisateur.'}, 400
	friendship.delete()
	return {'success': 'Ami supprimé avec succès.'}, 200

def accept_friend_request(to_user, from_user):
	friend_request = FriendshipRequest.objects.filter(from_user=from_user, to_user=to_user).first()
	if not friend_request:
		return {'error': 'Demande d\'ami introuvable.'}, 404
	Friendship.objects.create(user1=from_user, user2=to_user)
	friend_request.delete()
	return {'success': 'Demande d\'ami acceptée avec succès.'}, 200

def delete_friend_request(to_user, from_user):
	friend_request = FriendshipRequest.objects.filter(from_user=from_user, to_user=to_user).first()
	if not friend_request:
		friend_request = FriendshipRequest.objects.filter(from_user=to_user, to_user=from_user).first()
		if not friend_request:
			return {'error': 'Demande d\'ami introuvable.'}, 404
	friend_request.delete()
	return {'success': 'Demande d\'ami refusée avec succès.'}, 200