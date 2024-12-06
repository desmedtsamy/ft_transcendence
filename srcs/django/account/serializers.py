from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Match, FriendshipRequest, Friendship

class UserSerializer(serializers.ModelSerializer):
    friendship_requests_sent = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    # old_password = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    # new_password2 = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [	'id',
                	'username',
                    'email',
                    'avatar',
					'last_activity',
					'last_connection',
					'is_online',
					'created_at',
					'intra_id',
					'is_admin',
					'score',
					'wins',
					'losses',
					'friendship_requests_sent',
                    'is_online',
					'password']

    def validate_old_password(self, value):
        user = self.context['request'].user
        if value and not user.check_password(value):
            raise serializers.ValidationError("L'ancien mot de passe est incorrect.")
        return value

    def validate(self, data):
        print (data)
        password = data.get('password')
        # new_password2 = data.get('new_password2')
        # if password or new_password2:
        #     if not password or not new_password2:
        #         raise serializers.ValidationError("Les deux nouveaux mots de passe doivent être fournis.")
        #     if password != new_password2:
        #         raise serializers.ValidationError("Les nouveaux mots de passe ne correspondent pas.")
        validate_password(password)
        return data

def update(self, instance, validated_data):
    """
    Met à jour une instance d'utilisateur avec les données validées.
    """

    # Mettre à jour les champs standards
    instance.username = validated_data.get('username', instance.username)
    instance.email = validated_data.get('email', instance.email)

    # Gérer la mise à jour de l'avatar
    avatar = validated_data.get('avatar', None)
    if avatar:
        # Supprimer l'ancien avatar s'il existe
        if instance.avatar:
            instance.avatar.delete()

        # Enregistrer le nouvel avatar
        instance.avatar = avatar

    # Mettre à jour le mot de passe si nécessaire
    password = validated_data.pop('password', None)
    if password:
        instance.set_password(password)

    instance.save()
    return instance

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