from .models import Match
from rest_framework import serializers

class MatchSerializer(serializers.ModelSerializer):
	class Meta:
		model = Match
		fields = ['id', 'player1', 'player2', 'winner', 'created_at', 'score', 'status']