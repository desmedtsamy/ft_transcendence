from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from django.views import View

def index(request):
	return render(request,'pong/index.html')