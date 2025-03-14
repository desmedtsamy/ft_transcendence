from .models import Tournament
from rest_framework import serializers

class TournamentSerializer(serializers.ModelSerializer):
	creator = serializers.ReadOnlyField(source='creator.username')
	players_count = serializers.SerializerMethodField()
	class Meta:
		model = Tournament
		fields = ['id', 'name', 'number_of_players', 'creator', 'players', 'number_of_players', 'players_count', 'winner', 'is_finished', 'is_started']

	def get_players_count(self, obj):
		return obj.players.count()