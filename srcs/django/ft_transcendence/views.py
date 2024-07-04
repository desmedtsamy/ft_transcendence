from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from account.models import User
from django.contrib.auth.decorators import login_required, user_passes_test

## needed for generate users
import random
from django.contrib.auth.hashers import make_password
from django.shortcuts import redirect
from django.contrib import messages


def index(request):
	
	return render(request,'index.html')

@login_required
def home(request):
	top_players = User.objects.order_by('-score')[:10]
	context = {
		'scoreboard' : [
			{'name': p.username, 'score': p.score, 'avatar': p.avatar, 'ratio': f"{p.wins / (p.losses + 1):.2f}" if p.losses > 0  else float('inf')} for p in top_players
		],
	}
	return render(request,'home.html', context)


@login_required
@user_passes_test(lambda u: u.is_admin)
def generate_users_view(request):
	if request.method == 'POST':
		num_users = int(request.POST.get('num_users', 10))

		first_names = ['John', 'Emma', 'Olivia', 'Liam', 'Noah', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte']
		last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson']

		for i in range(num_users):
			username = f"{random.choice(first_names)}{random.choice(last_names)}"
			email = f"{username}@example.com"
			password = make_password('test')

			User.objects.create_user(username=username, email=email, password=password)

		messages.success(request, f"{num_users} utilisateurs ont été générés avec succès !")
		return redirect('home')