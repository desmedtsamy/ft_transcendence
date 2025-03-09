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
		print(f"Content-Type: {request.content_type}")
		
		# Traiter les données selon le content-type
		if request.content_type == 'application/json':
			# Pour les requêtes JSON
			try:
				player1 = request.data.get('player1')
				player2 = request.data.get('player2')
			except Exception as e:
				print(f"Erreur lors de la récupération des données JSON: {e}")
				return Response({"detail": "Format de données invalide"}, status=400)
		else:
			# Pour les autres types de requêtes
			player1 = request.data.get('player1')
			player2 = request.data.get('player2')
		
		# Afficher les joueurs reçus
		print(f"Création d'un match entre player1: {player1} et player2: {player2}")
		
		# Vérifier que les joueurs sont présents
		if player1 is None or player2 is None:
			return Response({"detail": "Les joueurs sont obligatoires"}, status=400)
		
		# Préparer les données pour le serializer
		data = {}
		try:
			data['player1'] = player1
			data['player2'] = player2
		
			serializer = self.get_serializer(data=data)
			serializer.is_valid(raise_exception=True)
			self.perform_create(serializer)
			
			# Récupérer l'objet match créé
			match = serializer.instance
			
			# Si vous avez besoin d'utiliser une méthode set_player
			# Convertir les IDs en objets User si nécessaire
			user1 = User.objects.get(id=player1) if isinstance(player1, (int, str)) else player1
			user2 = User.objects.get(id=player2) if isinstance(player2, (int, str)) else player2
			
			match.set_player(user1)  # Pour le premier joueur
			match.set_player(user2)  # Pour le deuxième joueur
			
			# Afficher les informations du match créé
			print(f"Match créé avec succès: {serializer.data}")
			
			return Response(serializer.data)
		except Exception as e:
			return Response({"detail": f"Erreur lors de la création du match: {str(e)}"}, status=400)