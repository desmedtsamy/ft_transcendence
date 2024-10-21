from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from account.models import User, Match
from django.contrib.auth.decorators import login_required, user_passes_test
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views import View
from account.serializers import UserSerializer

from rest_framework.response import Response
from rest_framework import generics, permissions, status

# class UpdateLastActivityView(View):

# 	def post(self, request):
# 		if request.user.is_authenticated:
# 			try:
# 				request.user.last_activity = timezone.now()
# 				request.user.save()
# 				return JsonResponse({'status': 'success'})
# 			except Exception as e:
# 				# Handle errors more specifically
# 				return JsonResponse({'status': 'error', 'message': str(e)})
# 		return JsonResponse({'status': 'error', 'message': 'User not authenticated'})

class ScoreboardView(generics.ListAPIView):
	serializer_class = UserSerializer
	permission_classes = [permissions.IsAuthenticated]

	#return 20 best players
	def get_queryset(self):
		return User.objects.order_by('-score')[:20]
	
def chat(request):
	context = {
	}
	return render(request,'pong/pong.html', context)
