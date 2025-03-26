from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, FriendshipRequest, Friendship

class UserSerializer(serializers.ModelSerializer):
	friendship_requests_sent = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
	password = serializers.CharField(write_only=True, required=False)

	class Meta:
		model = User
		fields = [	'id',
					'username',
					'email',
					'avatar',
					'last_activity',
					'last_connection',
					'is_online',
					'is_staff',
					'scores',
					'wins',
					'intra_id',
					'losses',
					'friendship_requests_sent',
					'password',
					'selected_game'
                    ]

	def validate(self, data):
		password = data.get('password')
		if password :
			validate_password(password)
		return data

	def update(self, instance, validated_data):
		instance.username = validated_data.get('username', instance.username)
		instance.email = validated_data.get('email', instance.email)

		avatar = validated_data.get('avatar', None)
		if avatar:
			if instance.avatar and 'default.png' not in instance.avatar.name:
				instance.avatar.delete()
			instance.avatar = avatar

		password = validated_data.get('password', None)
		if password:
			instance.set_password(password)
            
		instance.save()
		return instance

class FriendshipRequestSerializer(serializers.ModelSerializer):
	from_user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
	to_user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

	class Meta:
		model = FriendshipRequest
		fields = ['id', 'from_user', 'to_user']

class FriendshipSerializer(serializers.ModelSerializer):
	user1 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
	user2 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

	class Meta:
		model = Friendship
		fields = ['id', 'user1', 'user2']