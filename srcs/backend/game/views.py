from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions
from .models import Match
from .serializers import MatchSerializer
from account.models import User
import json

class CreateMatch(generics.CreateAPIView):
	serializer_class = MatchSerializer
	# queryset = Match.objects.all()
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		player1 = request.data.get('player1')
		player2 = request.data.get('player2')
		data = {}
		try:
			data['player1'] = player1
			data['player2'] = player2
		
			serializer = self.get_serializer(data=data)
			serializer.is_valid(raise_exception=True)
			self.perform_create(serializer)
			
			match = serializer.instance
			
			user1 = User.objects.get(id=player1) if isinstance(player1, (int, str)) else player1
			user2 = User.objects.get(id=player2) if isinstance(player2, (int, str)) else player2
			
			match.set_player(user1)
			match.set_player(user2)
			match.save()
			match.start()
			return Response(serializer.data)
		except Exception as e:
			return Response({"detail": f"Erreur lors de la création du match: {str(e)}"}, status=400)