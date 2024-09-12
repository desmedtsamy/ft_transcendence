from rest_framework import serializers
from .models import User, Match, FriendshipRequest, Friendship

class UserSerializer(serializers.ModelSerializer):
    friendship_requests_sent = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'last_activity', 'last_connection', 'is_online', 'created_at', 'intra_id', 'is_admin', 'score', 'wins', 'losses', 'friendship_requests_sent']

class MatchSerializer(serializers.ModelSerializer):
    players = UserSerializer(many=True, read_only=True)
    winner = UserSerializer(read_only=True)

    class Meta:
        model = Match
        fields = ['id', 'players', 'winner', 'created_at', 'duration', 'points_at_stake']

class FriendshipRequestSerializer(serializers.ModelSerializer):
    from_user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    to_user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = FriendshipRequest
        fields = ['id', 'from_user', 'to_user', 'created_at']

class FriendshipSerializer(serializers.ModelSerializer):
    user1 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    user2 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Friendship
        fields = ['id', 'user1', 'user2', 'created_at']