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

## needed for generate users
import random
from django.contrib.auth.hashers import make_password
from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login


class UpdateLastActivityView(View):

	def post(self, request):
		if request.user.is_authenticated:
			try:
				request.user.last_activity = timezone.now()
				request.user.save()
				return JsonResponse({'status': 'success'})
			except Exception as e:
				# Handle errors more specifically
				return JsonResponse({'status': 'error', 'message': str(e)})
		return JsonResponse({'status': 'error', 'message': 'User not authenticated'})

def index(request):
	return render(request,'index.html')

@login_required
def scoreboard_view(request):
	scoreboard = User.objects.order_by('-score')[:20]
	all_users = User.objects.all()
	context = {
		'scoreboard' : scoreboard,
		'all_users' : all_users,
	}
	return render(request,'scoreboard.html', context)



@login_required
@user_passes_test(lambda u: u.is_superuser)
def generate_users_view(request):
	if request.method == 'POST':
		num_users = int(request.POST.get('num_users', 10))
		created_users = 0  # Counter for successfully created users

		first_names = ['John', 'Emma', 'Olivia', 'Liam', 'Noah', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte']
		last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson']

		for i in range(num_users):
			while True:
				username = f"{random.choice(first_names)}{random.choice(last_names)}"
				if not User.objects.filter(username=username).exists():
					break

			email = f"{username}@example.com"
			password = make_password('test')
			score = 42

			User.objects.create_user(username=username, email=email, password=password, score=score)
			created_users += 1

		messages.success(request, f"{created_users} utilisateurs ont été générés avec succès !")
		return redirect('scoreboard')

@login_required
@user_passes_test(lambda u: u.is_superuser)
def create_match_view(request):
	if request.method == 'POST':
		player1_id = request.POST.get('player1')
		player2_id = request.POST.get('player2')
		winner_id = request.POST.get('winner')

		if player1_id and player2_id and winner_id:
			try:
				player1 = User.objects.get(pk=player1_id)
				player2 = User.objects.get(pk=player2_id)
				winner = User.objects.get(pk=winner_id)

				if winner not in [player1, player2]:
					raise ValueError("Le gagnant doit être l'un des joueurs.")

				match = Match.objects.create(winner=winner, duration=42)
				match.players.add(player1, player2)

				winner.score += match.points_at_stake
				winner.wins += 1
				winner.save()

				loser = player1 if winner == player2 else player2
				if loser.score - match.points_at_stake < 0:
					loser.score = 0
				else:
					loser.score -= match.points_at_stake
				loser.losses += 1
				loser.save()

				messages.success(request, f"match created")
				return redirect('scoreboard')
			except (User.DoesNotExist, ValueError) as e:
				print(f"Erreur lors de la création du match : {e}")
	return redirect('home')








