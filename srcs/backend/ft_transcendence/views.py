from account.models import User
from account.serializers import UserSerializer
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import generics, permissions, status

class ScoreboardView(generics.ListAPIView):
	permission_classes = [AllowAny]

	def post(self, request):
		users = User.objects.all() 
		selected_game = request.data.get('selectedGame')

		sorted_users = sorted(users, key=lambda user: user.scores.get(selected_game, 0), reverse=True)[:10]

		serializer = UserSerializer(sorted_users, many=True)	
		return Response({'top_players': serializer.data}, status=status.HTTP_200_OK)
	

class UpdateLastActivityView(generics.UpdateAPIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		user = request.user
		user.last_activity = timezone.now()
		user.save()
		return Response({'status': 'success'}, status=status.HTTP_200_OK)
