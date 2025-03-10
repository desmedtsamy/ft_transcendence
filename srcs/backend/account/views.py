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
from game.serializers import MatchSerializer
import os
import requests
from .services import send_friend_request, remove_friend, accept_friend_request, delete_friend_request, get_42_user_data, handle_42_user


class CurrentUserViewAPI(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		if not request.user.is_authenticated:
			return Response({'is_authenticated': False}, status=status.HTTP_200_OK)
		
		if not request.user:
			return Response({'error': 'User object is None'}, status=status.HTTP_400_BAD_REQUEST)

		user = request.user
		if user is None:
			return Response({'error': 'User object is None'}, status=status.HTTP_404_NOT_FOUND)

		serializer = UserSerializer(user)
		return Response({'is_authenticated': True, 'user': serializer.data}, status=status.HTTP_200_OK)

class LoginViewAPI(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		User.check
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
		return Response({'client_id': client_id}, status=status.HTTP_200_OK)

class Callback42View(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		redirect_uri = 'http://localhost:8042/42callback'
		user_data, status = get_42_user_data(request, redirect_uri)
		if status != 200:
			return Response(user_data, status)
		print("ca passe ici")
		response,status = handle_42_user(request, user_data)
		return Response(response, status=status) 

class Sync42View(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		redirect_uri = 'http://localhost:8042/42sync' 
		user_data, status = get_42_user_data(request, redirect_uri)
		if status != 200:
			return Response(user_data, status)
		response,status = handle_42_user(request, user_data, update_existing_user=True)
		print(response)
		print(status)
		return Response(response, status=status)

class UserSettingsView(APIView):
	permission_classes = [IsAuthenticated]

	def patch(self, request, *args, **kwargs):
		user = request.user
		serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
		print(from_user)
		print(to_user)
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

	def get(self, request, username, *args, **kwargs):
		try:
			user = User.objects.get(username=username)

			is_own_profile = user == request.user

			friends = request.user.get_friends()
			friend_requests_sent = FriendshipRequest.objects.filter(from_user=request.user).values_list('to_user', flat=True)
			friend_requests_received = FriendshipRequest.objects.filter(to_user=request.user).values_list('from_user', flat=True)

			serializer = UserSerializer(user)

			user_data = serializer.data
			user_data['is_friend'] = user in friends
			user_data['friend_request_sent'] = user.pk in friend_requests_sent
			user_data['friend_request_received'] = user.pk in friend_requests_received
			user_data['is_own_profile'] = is_own_profile

			return Response(user_data, status=status.HTTP_200_OK)

		except User.DoesNotExist:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserFriendsListView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request, *args, **kwargs):
		user_id = self.kwargs['user_id']
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
		
		matches = Match.objects.filter(Q(player1=user) | Q(player2=user), game_type=selected_game).order_by('-created_at')[:10]
		
		# Sérialiser les objets Match avant de les retourner
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