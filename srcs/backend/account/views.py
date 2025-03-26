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
from .models import User, Match, FriendshipRequest
from .serializers import UserSerializer
from game.serializers import MatchSerializer
from .services import *


class CurrentUserViewAPI(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		if not request.user.is_authenticated:
			return Response({'is_authenticated': False}, status=status.HTTP_200_OK)
		
		if not request.user:
			return Response({'error': 'User object is None'}, status=status.HTTP_400_BAD_REQUEST)

		if request.user is None:
			return Response({'error': 'User object is None'}, status=status.HTTP_404_NOT_FOUND)

		serializer = UserSerializer(request.user)
		friends = UserSerializer(request.user.get_friends(), many=True)
		return Response({'is_authenticated': True, 'user': serializer.data, 'friends': friends.data}, status=status.HTTP_200_OK)

class LoginViewAPI(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		username = request.data.get('username')
		if username:
			username = username.lower()
		password = request.data.get('password')
		User.check_user_status()
		user = authenticate(username=username, password=password)
		if user is not None:
			if user.is_online:
				return Response({'error': 'User is already logged in'}, status=status.HTTP_400_BAD_REQUEST)
			login(request, user)   
			serializer = UserSerializer(user)
			return Response(serializer.data, status=status.HTTP_200_OK)
		else:
			return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
		
class registerViewAPI(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		try:
			data = request.data
			# Convertir le username en minuscules
			if 'username' in data and data['username']:
				data = data.copy()  # Créer une copie modifiable des données
				data['username'] = data['username'].lower()
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

class LogoutViewAPI(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		logout(request)
		return Response({'error': 'Logout successful'}, status=status.HTTP_200_OK)
	
class Client42ViewAPI(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		client_id = settings.FORTYTWO_CLIENT_ID
		redirect_uri = settings.FORTYTWO_REDIRECT_URI
		sync_uri = settings.FORTYTWO_SYNC_URI
		return Response({
			'client_id': client_id,
			'redirect_uri': redirect_uri,
			'sync_uri': sync_uri
		}, status=status.HTTP_200_OK)

class Callback42View(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		redirect_uri = settings.FORTYTWO_REDIRECT_URI
		user_data, status = get_42_user_data(request, redirect_uri)
		if status != 200:
			return Response(user_data, status)
		response,status = handle_42_user(request, user_data)
		return Response(response, status=status) 

class Sync42View(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		redirect_uri = settings.FORTYTWO_SYNC_URI
		user_data, status = get_42_user_data(request, redirect_uri)
		if status != 200:
			return Response(user_data, status)
		response,status = handle_42_user(request, user_data, update_existing_user=True)
		return Response(response, status=status)

class UserSettingsView(APIView):
	permission_classes = [IsAuthenticated]

	def patch(self, request, *args, **kwargs):
		user = request.user
		response, status = update_user(user, request)
		return Response(response, status)

class SearchUsersAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, *args, **kwargs):
		query = self.request.query_params.get('query', '')
		user = self.request.user

		friends = user.get_friends()
		friend_requests_sent = FriendshipRequest.objects.filter(from_user=user).values_list('to_user', flat=True)
		friend_requests_received = FriendshipRequest.objects.filter(to_user=user).values_list('from_user', flat=True)

		queryset = User.objects.filter(Q(username__icontains=query)).exclude(pk=user.pk)

		serializer = UserSerializer(queryset, many=True)

		for user_data in serializer.data:
			user_id = user_data['id']
			user_obj = User.objects.get(id=user_id)

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
		
		response, status = send_friend_request(from_user, to_user)
		return Response(response, status=status)

class RemoveFriendshipView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, user_id):
		from_user = request.user
		try:
			to_user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
		response, status = remove_friend(from_user, to_user)
		return Response(response, status=status)

class AcceptFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, user_id):
		to_user = request.user
		try:
			from_user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
		response, status = accept_friend_request(to_user, from_user)
		return Response(response, status=status)

class RejectFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, user_id):
		to_user = request.user
		try:
			from_user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
		
		response, status = delete_friend_request(to_user, from_user)
		return Response(response, status=status)
	
class CancelFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, user_id):
		to_user = request.user
		try:
			from_user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
		
		response, status = delete_friend_request(to_user, from_user)
		return Response(response, status=status)

class FriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		friend_requests = FriendshipRequest.objects.filter(to_user=request.user)
		friend_requests_list = []
		for request in friend_requests:
			friend_requests_list.append(request.from_user)
		serializer = UserSerializer(friend_requests_list, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)

class UserProfileView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, username):
		try:
			user = User.objects.get(username=username)
			selected_game = request.user.selected_game

			friends = request.user.get_friends()
			friend_requests_sent = FriendshipRequest.objects.filter(from_user=request.user).values_list('to_user', flat=True)
			friend_requests_received = FriendshipRequest.objects.filter(to_user=request.user).values_list('from_user', flat=True)

			serializer = UserSerializer(user)

			user_data = serializer.data
			user_data['is_friend'] = user in friends
			user_data['friend_request_sent'] = user.pk in friend_requests_sent
			user_data['friend_request_received'] = user.pk in friend_requests_received
			user_data['rank'] = self.calculate_user_ranking(user, selected_game)

			return Response(user_data, status=status.HTTP_200_OK)

		except User.DoesNotExist:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

	def calculate_user_ranking(self, user,selected_game):
		user_score = user.scores[selected_game]
		users_with_higher_score = User.objects.filter(**{f'scores__{selected_game}__gt': user_score}).count()
		ranking = users_with_higher_score + 1

		return ranking
class UserFriendsListView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		user_id = request.user.id
		try:
			user = User.objects.get(id=user_id)
			friends = user.get_friends()
			serializer = UserSerializer(friends, many=True)
			return Response(serializer.data, status=status.HTTP_200_OK)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)


class UserMatchesListView(generics.ListAPIView):
	serializer_class = MatchSerializer
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, *args, **kwargs):
		user_id = self.kwargs['user_id']
		selected_game = request.data.get('selectedGame')
		try:
			user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
		
		matches = Match.objects.filter(Q(player1=user) | Q(player2=user), game_type=selected_game, status='finished').order_by('-created_at')[:10]
		serializer = self.get_serializer(matches, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)
	
class setSelectedGameView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		game = request.data.get('game')
		user = request.user
		user.selected_game = game
		user.save()
		return Response({'success': 'Game selected successfully.'}, status=status.HTTP_200_OK)