# views.py

from .services import create_tournament, join_tournament, leave_tournament, get_tournament_details, delete_tournament
from .models import Tournament
from game.models import Match
from rest_framework import generics, permissions
from .serializers import TournamentSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

class TournamentDetailView(APIView):
	permission_classes = [AllowAny]
	def get(self, request,tournament_id):
		data, status = get_tournament_details(tournament_id)
		return Response(data, status=status)

class JoinTournamentView(APIView):
	permission_classes = [permissions.IsAuthenticated]
	def post(self, request):
		data = request.data
		user = request.user
		tournament_id = data.get('tournamentId')
		if not tournament_id:
			return Response({'error': 'ID de tournoi requis.'}, status=status.HTTP_400_BAD_REQUEST)
		data,status = join_tournament(tournament_id, user.id);
		return Response(data, status=status)

class declineTournamentView(APIView):
	permission_classes = [permissions.IsAuthenticated]
	
	def post(self, request):
		data = request.data
		match_id = data.get('match_id')
		user_id = data.get('user_id')
		
		match = Match.objects.get(id=match_id)
		if match.player1.id == user_id:
			match.end(match.player2)
		else :
			match.end(match.player1)
		return Response({
				'success': True,
				'message': 'Vous avez refusé de participer au match de tournoi.'
			}, status=status.HTTP_200_OK)

class deleteTournamentView(APIView):
	permission_classes = [permissions.IsAuthenticated]
	def post(self, request):
		data = request.data
		user = request.user
		tournament_id = data.get('tournamentId')
		if not tournament_id:
			return Response({'error': 'ID de tournoi requis.'}, status=status.HTTP_400_BAD_REQUEST)
		data,status = delete_tournament(tournament_id, user);
		return Response(data, status=status)

class leaveTournamentView(APIView):
	permission_classes = [permissions.IsAuthenticated]
	def post(self, request):
		data = request.data
		user = request.user
		tournament_id = data.get('tournamentId')
		if not tournament_id:
			return Response({'error': 'ID de tournoi requis.'}, status=status.HTTP_400_BAD_REQUEST)
		data,status = leave_tournament(tournament_id, user.id);
		return Response(data, status=status)

class GetTournamentsView(generics.ListAPIView):
	permission_classes = [AllowAny]
	def post(self, request):
		selected_game = request.data.get('selectedGame')
		tournaments = Tournament.objects.filter(selected_game=selected_game)
		serializer = TournamentSerializer(tournaments, many=True)
		return Response({'tournaments': serializer.data}, status=status.HTTP_200_OK)
	
class CreateTournamentView(generics.CreateAPIView):
	serializer_class = TournamentSerializer
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		if serializer.is_valid():
			tournament, status_code = create_tournament(
				serializer.validated_data['name'],
				serializer.validated_data['number_of_players'],
				request.user
			)
			if status_code == 200:
				tournament_data = TournamentSerializer(tournament).data
				print (tournament_data)
				return Response(tournament_data, status=status.HTTP_201_CREATED)
			else:
				return Response(tournament, status=status_code)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)