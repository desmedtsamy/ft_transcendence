from .models import Match
from account.models import User
from rest_framework import serializers
from account.serializers import UserSerializer

class MatchSerializer(serializers.ModelSerializer):
	player1 = UserSerializer(read_only=True)
	player2 = UserSerializer(read_only=True)
	class Meta:
		model = Match
		fields = ['id', 'player1', 'player2', 'winner', 'status']
