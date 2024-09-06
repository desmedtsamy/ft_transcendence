# serializers.py
from rest_framework import serializers
from .models import User, Match, FriendshipRequest, Friendship

class UserSerializer(serializers.ModelSerializer):
    matches = serializers.SerializerMethodField()
    friends = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'avatar', 'last_activity', 'last_connection', 
            'is_online', 'created_at', 'intra_id', 'is_admin', 'score', 'wins', 
            'losses', 'matches', 'friends', 'friendship_requests_sent'
        ]
        read_only_fields = ['created_at', 'last_connection', 'last_activity']

    def get_matches(self, obj):
        matches = obj.get_matches()
        return MatchSerializer(matches, many=True).data

    def get_friends(self, obj):
        friends = obj.get_friends()
        return UserSerializer(friends, many=True).data


class MatchSerializer(serializers.ModelSerializer):
    players = UserSerializer(many=True, read_only=True)
    winner = UserSerializer(read_only=True)

    class Meta:
        model = Match
        fields = ['id', 'players', 'winner', 'created_at', 'duration', 'points_at_stake']
        read_only_fields = ['created_at', 'points_at_stake']

class FriendshipRequestSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)

    class Meta:
        model = FriendshipRequest
        fields = ['id', 'from_user', 'to_user', 'created_at']
        read_only_fields = ['created_at']

class FriendshipSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'user1', 'user2', 'created_at']
        read_only_fields = ['created_at']