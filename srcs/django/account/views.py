from django.contrib import messages
from requests_oauthlib import OAuth2Session
from django.contrib.auth import authenticate, login
from django.db.models import Q

import json
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework import status, generics, status, permissions
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.conf import settings
from django.http import JsonResponse
from requests_oauthlib import OAuth2Session
from .models import User, Match, FriendshipRequest, Friendship
from .serializers import UserSerializer
from pong.serializers import MatchSerializer
import os
import requests

class CurrentUserViewAPI(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		if not request.user.is_authenticated:
			return Response({'is_authenticated': False}, status=status.HTTP_200_OK)
		# Vérification supplémentaire pour voir si user est None
		if not request.user:
			return Response({'error': 'User object is None'}, status=status.HTTP_400_BAD_REQUEST)

		user = request.user
		if user is None:
			return Response({'error': 'User object is None'}, status=status.HTTP_404_NOT_FOUND)

		# Sérialise l'utilisateur
		serializer = UserSerializer(user)
		return Response({'is_authenticated': True, 'user': serializer.data}, status=status.HTTP_200_OK)

class LoginViewAPI(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		print (username, " ", password)
		user = authenticate(username=username, password=password)
		if user is not None:
			login(request, user)   
			serializer = UserSerializer(user)
			return Response(serializer.data, status=status.HTTP_200_OK)
		else:
			return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutViewAPI(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		logout(request)
		return Response({'detail': 'Logout successful'}, status=status.HTTP_200_OK)
	
class Client42ViewAPI(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		client_id = settings.FORTYTWO_CLIENT_ID
		return Response({'client_id': client_id}, status=status.HTTP_200_OK)
		
class registerViewAPI(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		try:
			data = request.data
		except json.JSONDecodeError:
			return JsonResponse({'error': 'Données JSON invalides'}, status=400)
		serializer = UserSerializer(data=data)
		if serializer.is_valid():
			user = serializer.save()
			user.set_password(data['password'])
			login(request, user)
			return JsonResponse(serializer.data, status=201)
		else:
			return JsonResponse(serializer.errors, status=400)
def get_42_user_data(request, redirect_uri):
	"""
	Fonction utilitaire pour récupérer les données de l'utilisateur 42 à partir du code d'autorisation.
	"""
	client_id = settings.FORTYTWO_CLIENT_ID
	client_secret = settings.FORTYTWO_CLIENT_SECRET
	token_url = 'https://api.intra.42.fr/oauth/token'
	if request.method == 'POST':
		try:
			data = json.loads(request.body)
			code = data.get('code')
		except json.JSONDecodeError:
			return JsonResponse({'success': False, 'error': 'Données JSON invalides.'}, status=400)
	else: 
		code = request.GET.get('code')
	if not code:
		return JsonResponse({'success': False, 'error': 'Code d\'autorisation manquant.'}, status=400)
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
	return user_data

def handle_42_user(request, user_data, update_existing_user=False):
	"""
	Gère la création ou la mise à jour d'un utilisateur à partir des données 42.
	"""
	email = user_data['email']
	intra_id = user_data['id']
	username = user_data['login']
	avatar_url = user_data['image']['link']

	if update_existing_user:
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			return JsonResponse({'success': False, 'error': 'Utilisateur non trouvé.'}, status=404)
	else:
		try:
			user = User.objects.get(intra_id=intra_id)
		except User.DoesNotExist:
			try:
				user = User.objects.get(email=email)
				return JsonResponse({'success': False, 'error': 'Un compte existe déjà avec cet email.'})
			except User.DoesNotExist:
				try:
					user = User.objects.get(username=username)
					messages.error(request, "Un compte existe déjà avec ce nom d'utilisateur.")
					num = 1
					while User.objects.filter(username=username).exists():
						username = f"{user_data['login']}_{num}"
						num += 1
				except User.DoesNotExist:
					pass 
				user = User.objects.create_user(
					username=username,
					email=email,
					intra_id=intra_id,
				)

	# Téléchargement et enregistrement de l'avatar
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
	else:
		print(f"Erreur lors du téléchargement de l'avatar : {avatar_response.status_code}")

	login(request, user)

	return JsonResponse({'success': True, 'user': {
		'username': user.username,
		'email': user.email,
		'intra_id': user.intra_id,
		'avatar': user.avatar.url if user.avatar else None
	}})

# Sync 42 Account
def sync_42(request):
	redirect_uri = 'http://localhost:8000/account/42sync' 
	user_data = get_42_user_data(request, redirect_uri)
	if isinstance(user_data, JsonResponse): # En cas d'erreur dans get_42_user_data
		return user_data
	return handle_42_user(request, user_data, update_existing_user=True)

def callback_42(request):
	redirect_uri = 'http://localhost:8042/42callback'
	user_data = get_42_user_data(request, redirect_uri)
	if isinstance(user_data, JsonResponse):
		return user_data
	return handle_42_user(request, user_data)


class UserSettingsView(APIView):
	permission_classes = [IsAuthenticated]

	def patch(self, request, *args, **kwargs):
		user = request.user
		serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})  # partial=True
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SearchUsersAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, *args, **kwargs):
		# Récupérer le paramètre 'query' de la requête (valeur vide si non précisé)
		query = self.request.query_params.get('query', '')
		user = self.request.user

		# Récupérer les amis, demandes envoyées et reçues
		friends = user.get_friends()
		friend_requests_sent = FriendshipRequest.objects.filter(from_user=user).values_list('to_user', flat=True)
		friend_requests_received = FriendshipRequest.objects.filter(to_user=user).values_list('from_user', flat=True)

		# Construire la queryset pour les utilisateurs à rechercher
		queryset = User.objects.filter(Q(username__icontains=query)).exclude(pk=user.pk)

		# Sérialiser les résultats de la recherche
		serializer = UserSerializer(queryset, many=True)

		# Ajouter les informations dynamiques à la réponse sérialisée
		for user_data in serializer.data:
			user_id = user_data['id']
			user_obj = User.objects.get(id=user_id)  # Récupérer l'utilisateur complet

			user_data['is_friend'] = user_obj in friends
			user_data['friend_request_sent'] = user_obj.pk in friend_requests_sent
			user_data['friend_request_received'] = user_obj.pk in friend_requests_received

		return Response(serializer.data, status=status.HTTP_200_OK)

class SendFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, user_id):
		from_user = request.user
		try:
			to_user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

		# Vérifier si une demande d'ami existe déjà
		existing_request = FriendshipRequest.objects.filter(from_user=from_user, to_user=to_user).first()
		if existing_request:
			return Response({'error': 'Une demande d\'ami a déjà été envoyée à cet utilisateur.'}, status=status.HTTP_400_BAD_REQUEST)

		# Créer la demande d'ami
		friend_request = FriendshipRequest.objects.create(from_user=from_user, to_user=to_user)
		return Response({'success': 'Demande d\'ami envoyée avec succès.'}, status=status.HTTP_201_CREATED)

class RemoveFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, user_id):
		from_user = request.user
		try:
			to_user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

		# Supprimer la demande d'ami (si elle existe)
		FriendshipRequest.objects.filter(from_user=from_user, to_user=to_user).delete()
		return Response({'success': 'Demande d\'ami annulée avec succès.'})
class AcceptFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, user_id):
		to_user = request.user
		try:
			from_user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

		# Vérifier si une demande d'ami existe
		friend_request = FriendshipRequest.objects.filter(from_user=from_user, to_user=to_user).first()
		if not friend_request:
			return Response({'error': 'Demande d\'ami introuvable.'}, status=status.HTTP_404_NOT_FOUND)

		# Créer l'amitié
		Friendship.objects.create(user1=from_user, user2=to_user)
		friend_request.delete()
		return Response({'success': 'Demande d\'ami acceptée avec succès.'})
class RejectFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, user_id):
		to_user = request.user
		try:
			from_user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

		# Vérifier si une demande d'ami existe
		friend_request = FriendshipRequest.objects.filter(from_user=from_user, to_user=to_user).first()
		if not friend_request:
			return Response({'error': 'Demande d\'ami introuvable.'}, status=status.HTTP_404_NOT_FOUND)

		# Supprimer la demande d'ami
		friend_request.delete()
		return Response({'success': 'Demande d\'ami refusée avec succès.'})
	


class UserProfileView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, username, *args, **kwargs):
		try:
			# Récupérer l'utilisateur par son nom d'utilisateur
			user = User.objects.get(username=username)

			# Vérifier si l'utilisateur est l'utilisateur authentifié ou un autre utilisateur
			if user == request.user:
				is_own_profile = True
			else:
				is_own_profile = False

			# Récupérer les amis et les demandes d'amis pour l'utilisateur authentifié
			friends = request.user.get_friends()
			friend_requests_sent = FriendshipRequest.objects.filter(from_user=request.user).values_list('to_user', flat=True)
			friend_requests_received = FriendshipRequest.objects.filter(to_user=request.user).values_list('from_user', flat=True)

			# Sérialiser les informations de l'utilisateur
			serializer = UserSerializer(user)

			# Ajouter des informations supplémentaires à la réponse
			user_data = serializer.data
			user_data['is_friend'] = user in friends
			user_data['friend_request_sent'] = user.pk in friend_requests_sent
			user_data['friend_request_received'] = user.pk in friend_requests_received
			user_data['is_own_profile'] = is_own_profile

			# Retourner la réponse structurée avec l'utilisateur
			return Response(user_data, status=status.HTTP_200_OK)

		except User.DoesNotExist:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserFriendsListView(generics.ListAPIView):
	serializer_class = UserSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):

		user_id = self.kwargs['user_id']
		try:
			user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

		return user.get_friends()

class UserMatchesListView(generics.ListAPIView):
	serializer_class = MatchSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
			username = self.kwargs['username']
			try:
				user = User.objects.get(username=username)
			except User.DoesNotExist:
				return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

			# Retrieve recent matches where the user is a player
			# return Match.objects.filter(players=user).order_by('-created_at')[:10]  # Get the last 10 matches
			return Match.objects.filter(Q(player1=user) | Q(player2=user)).order_by('-created_at')[:10]