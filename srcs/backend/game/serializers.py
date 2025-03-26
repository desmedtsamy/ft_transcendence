from .models import Match
from account.models import User
from rest_framework import serializers
from account.serializers import UserSerializer

class MatchSerializer(serializers.ModelSerializer):
	player1 = UserSerializer(read_only=True)
	player2 = UserSerializer(read_only=True)
	winner = UserSerializer(read_only=True)
	data = serializers.JSONField(required=False)
	
	class Meta:
		model = Match
		fields = ['id', 'game_type', 'player1', 'player2', 'winner', 'status', 'data', 'created_at', 'end_date']
