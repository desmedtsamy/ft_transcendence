from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from account.models import User

# Serializer pour l'utilisateur
# class UserSerializer(ModelSerializer):
# 	class Meta:
# 		model = User
# 		fields = ['id', 'username', 'email']  # Ajoute d'autres champs si nécessaire
