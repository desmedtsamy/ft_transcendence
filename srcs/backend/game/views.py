from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions
from .models import Match
from .serializers import MatchSerializer

class CreateMatch(generics.CreateAPIView):
	serializer_class = MatchSerializer
	# queryset = Match.objects.all()
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		return Response(serializer.data)