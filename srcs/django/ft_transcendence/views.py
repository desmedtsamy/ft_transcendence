from account.models import User
from account.serializers import UserSerializer

from rest_framework.response import Response
from rest_framework import generics, permissions, status

# class UpdateLastActivityView(View):

# 	def post(self, request):
# 		if request.user.is_authenticated:
# 			try:
# 				request.user.last_activity = timezone.now()
# 				request.user.save()
# 				return JsonResponse({'status': 'success'})
# 			except Exception as e:
# 				# Handle errors more specifically
# 				return JsonResponse({'status': 'error', 'message': str(e)})
# 		return JsonResponse({'status': 'error', 'message': 'User not authenticated'})

class ScoreboardView(generics.ListAPIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		# Récupère les 20 meilleurs joueurs
		users = User.objects.order_by('-score')[:20]
		
		# Sérialise la liste des utilisateurs
		serializer = UserSerializer(users, many=True)
		
		# Retourne la réponse sous forme de JSON avec les utilisateurs
		return Response({'top_players': serializer.data}, status=status.HTTP_200_OK)
	
