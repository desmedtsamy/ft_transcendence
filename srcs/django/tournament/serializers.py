from .models import Tournament
from rest_framework import serializers

class TournamentSerializer(serializers.ModelSerializer):
    creator = serializers.ReadOnlyField(source='creator.username')

    class Meta:
        model = Tournament
        fields = ['id', 'name', 'number_of_players', 'creator', 'players']