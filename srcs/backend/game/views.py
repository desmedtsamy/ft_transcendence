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
from .services import create_match

class CreateMatch(generics.CreateAPIView):
	serializer_class = MatchSerializer
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		player1 = request.data.get('player1')
		player2 = request.data.get('player2')
		game_type = request.data.get('game_type')
		match = create_match(player1, player2, game_type)
		if match == -1:
			return Response({"detail": "Erreur lors de la création du match"}, status=400)
		match.start("vs")
		return Response(MatchSerializer(match).data)