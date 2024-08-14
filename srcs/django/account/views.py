from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import login, logout
from django.contrib import messages
from django.views.generic import View
from django.conf import settings
from requests_oauthlib import OAuth2Session
from django.views.generic.edit import UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.urls import reverse_lazy
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.db.models import Q
import requests
import os
from .models import User, FriendshipRequest, Friendship, Match
from .forms import LoginForm, RegisterForm, UserSettingsForm
from django.utils import timezone
from django.views.decorators.csrf import csrf_protect


class LoginView(View):
	template_name = 'account/login.html'
	form_class = LoginForm

	def get(self, request):
		return render(request, self.template_name, {'form': self.form_class,
														'fortytwo_client_id': settings.FORTYTWO_CLIENT_ID,
														})
	def post(self, request):
		form = self.form_class(request, data=request.POST)
		if form.is_valid():
			user = form.get_user()
			login(request, user)
			messages.success(request, f"Bienvenue, {user.username} !")
			return redirect('home')
		else:
			messages.error(request, "Nom d'utilisateur ou mot de passe incorrect.")
			return render(request, self.template_name, {'form': form})

class LogoutView(View):
	def get(self, request):
		logout(request)
		messages.success(request, "Vous êtes maintenant déconnecté.")
		return redirect('index')

class RegisterView(View):
	template_name = 'account/register.html'
	form_class = RegisterForm

	def get(self, request):
		return render(request, self.template_name, {'form': self.form_class,
														'fortytwo_client_id': settings.FORTYTWO_CLIENT_ID,
														})
	def post(self, request):
		form = self.form_class(request.POST)
		if form.is_valid():
			user = form.save()
			login(request, user)
			messages.success(request, f"Bienvenue, {user.username} !")
			return redirect('home')
		return render(request, self.template_name, {'form': form})

class SettingsView(LoginRequiredMixin, UpdateView):
	model = User
	form_class = UserSettingsForm
	template_name = 'account/settings.html'
	success_url = reverse_lazy('home')  # Redirige vers la page de paramètres après la mise à jour

	def get_object(self, queryset=None):
		return self.request.user
	def form_valid(self, form):
			user = form.save()
			if form.cleaned_data.get('new_password1'):
				user.set_password(form.cleaned_data['new_password1'])  # Hash le nouveau mot de passe
				user.save()
				update_session_auth_hash(self.request, user)  # Met à jour la session
				messages.success(self.request, "Votre mot de passe a été changé avec succès.")

			messages.success(self.request, 'Vos paramètres ont été mis à jour.')
			return super().form_valid(form)
	


def sync_42(request):
	client_id = settings.FORTYTWO_CLIENT_ID
	client_secret = settings.FORTYTWO_CLIENT_SECRET
	authorization_base_url = 'https://api.intra.42.fr/oauth/authorize'
	token_url = 'https://api.intra.42.fr/oauth/token'
	redirect_uri = 'http://localhost:8000/account/42sync'
	code = request.GET.get('code')
	oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
	token = oauth.fetch_token(
		token_url,
		code=code,
		client_secret=client_secret,
		include_client_id=True
	)
	intra_api_url = 'https://api.intra.42.fr/v2/me'
	response = oauth.get(intra_api_url)
	user_data = response.json()

	email = user_data['email']
	intra_id = user_data['id']
	username = user_data['login']
	avatar_url = user_data['image']['link']
	user = User.objects.get(email=email)
	user.intra_id = intra_id
	avatar_response = requests.get(avatar_url)
	if avatar_response.status_code == 200:
		try:
			os.makedirs(os.path.join(settings.MEDIA_ROOT, 'profile_pics'), exist_ok=True)
			with open(os.path.join(settings.MEDIA_ROOT, f'profile_pics/{user.username}.jpg'), 'wb') as f:
				f.write(avatar_response.content)
			user.avatar = f'profile_pics/{user.username}.jpg'
			user.save()
		except Exception as e: 
			print(f"Erreur lors de l'enregistrement de l'avatar : {e}")
	else:
		print(f"Erreur lors du téléchargement de l'avatar : {avatar_response.status_code}")
	login(request, user)
	return redirect('home')

def callback_42(request):
	redirect_url = "home"
	client_id = settings.FORTYTWO_CLIENT_ID
	client_secret = settings.FORTYTWO_CLIENT_SECRET
	authorization_base_url = 'https://api.intra.42.fr/oauth/authorize'
	token_url = 'https://api.intra.42.fr/oauth/token'
	redirect_uri = 'http://localhost:8000/account/42callback'
	code = request.GET.get('code')
	oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
	token = oauth.fetch_token(
		token_url,
		code=code,
		client_secret=client_secret,
		include_client_id=True
	)
	intra_api_url = 'https://api.intra.42.fr/v2/me'
	response = oauth.get(intra_api_url)
	user_data = response.json()

	email = user_data['email']
	intra_id = user_data['id']
	username = user_data['login']
	avatar_url = user_data['image']['link']
	try:
		user = User.objects.get(intra_id=intra_id)
	except User.DoesNotExist:
		try:
			user = User.objects.get(email=email)
			messages.error(request, "Un compte existe déjà avec cet email.")
			return redirect('account:login')
		except User.DoesNotExist:
			try:
				user = User.objects.get(username=user_data['login'])
				messages.error(request, "Un compte existe déjà avec ce nom d'utilisateur.")
				num = 1
				while User.objects.filter(username=username).exists():
					username = f"{user_data['login']}_{num}"
					num += 1
				redirect_url = 'account:settings'
			except User.DoesNotExist:
				redirect_url = 'home'
			user = User.objects.create_user(
				username=username,
				email=email,
				intra_id=intra_id,
			)
			avatar_response = requests.get(avatar_url)
			if avatar_response.status_code == 200:
				try:
					os.makedirs(os.path.join(settings.MEDIA_ROOT, 'profile_pics'), exist_ok=True)
					with open(os.path.join(settings.MEDIA_ROOT, f'profile_pics/{user.username}.jpg'), 'wb') as f:
						f.write(avatar_response.content)
					user.avatar = f'profile_pics/{user.username}.jpg'
					user.save()
				except Exception as e: 
					print(f"Erreur lors de l'enregistrement de l'avatar : {e}")
			else:
				print(f"Erreur lors du téléchargement de l'avatar : {avatar_response.status_code}")
	login(request, user)
	return redirect(redirect_url)

@login_required
@csrf_protect
def search_users_view(request):
	if request.method == 'POST':
		pass  # Gérer la soumission du formulaire de recherche si nécessaire (actuellement vide)

	query = request.GET.get('query', '')
	user = request.user
	now = timezone.now()

	# Récupération des amis, demandes d'amis envoyées et reçues
	friends = user.get_friends()
	friend_requests_sent = FriendshipRequest.objects.filter(from_user=user).values_list('to_user', flat=True)
	friend_requests_received = FriendshipRequest.objects.filter(to_user=user).values_list('from_user', flat=True)

	# Recherche des utilisateurs en excluant l'utilisateur courant
	users = User.objects.filter(
		Q(username__icontains=query) | Q(email__icontains=query)
	).exclude(pk=user.pk)

	# Requête AJAX
	if request.headers.get('x-requested-with') == 'XMLHttpRequest':
		print(f"ajax")
		html = render_to_string('account/search_results.html', {
			'users': users, 
			'friends': friends, 
			'friend_requests_sent': list(friend_requests_sent), 
			'friend_requests_received': list(friend_requests_received),
			'now': now.isoformat()
		})  
		return HttpResponse(html)

	# Requête normale
	return render(request, 'account/search.html', {
		'users': users, 
		'query': query,
		'friends': friends, 
		'friend_requests_sent': list(friend_requests_sent),
		'friend_requests_received': list(friend_requests_received),
		'now': now
	})


@login_required
def friends_view(request):
	friend_requests = FriendshipRequest.objects.filter(to_user=request.user)
	all_users = User.objects.all()
	friends = request.user.get_friends()
	return render(request, 'account/friends.html', {
		'friend_requests': friend_requests,
		'all_users': all_users,
		'friends' : friends
	})

@login_required
def send_friend_request(request, user_id):
	if request.method == 'POST':
		try:
			to_user = User.objects.get(id=user_id)
			if to_user == request.user:
				messages.error(request, "Vous ne pouvez pas vous envoyer une demande d'ami.")
			elif Friendship.objects.filter(Q(user1=request.user, user2=to_user) | Q(user1=to_user, user2=request.user)).exists():
				messages.warning(request, f"Vous êtes déjà ami avec {to_user.username} ou une demande est en attente.")
			else:
				FriendshipRequest.objects.create(from_user=request.user, to_user=to_user)
				messages.success(request, f"Demande d'ami envoyée à {to_user.username}.")
		except User.DoesNotExist:
			messages.error(request, "Utilisateur introuvable.")
	return redirect('account:search_users')

@login_required
def accept_friend_request(request, user_id):
	try:
		friend_request = FriendshipRequest.objects.get(from_user__id=user_id, to_user=request.user)
		friend_request.accept()
		messages.success(request, f"Vous êtes maintenant ami avec {friend_request.from_user.username}.")
	except FriendshipRequest.DoesNotExist:
		messages.error(request, "Demande d'ami introuvable.")
	return redirect('account:search_users') 

@login_required
def reject_friend_request(request, user_id):
	try:
		# Filtrer par to_user (vous) et from_user (celui qui a envoyé la demande)
		friend_request = FriendshipRequest.objects.get(to_user=request.user, from_user_id=user_id) 
		friend_request.cancel()  # Refuse la demande
		messages.success(request, f"Demande d'ami de {friend_request.from_user.username} refusée.")
	except FriendshipRequest.DoesNotExist:
		messages.error(request, "Demande d'ami introuvable.")
	return redirect('account:search_users')

@login_required
def remove_friend_request(request, user_id):
	try:
		# Filtrer par from_user (vous) et to_user (celui à qui la demande a été envoyée)
		friend_request = FriendshipRequest.objects.get(from_user=request.user, to_user_id=user_id)
		friend_request.cancel()  # Annule la demande
		messages.success(request, f"Demande d'ami à {friend_request.to_user.username} annulée.")
	except FriendshipRequest.DoesNotExist:
		messages.error(request, "Demande d'ami introuvable.")
	return redirect('account:search_users')

@login_required
def remove_friend(request, friend_id):
	friend = get_object_or_404(User, id=friend_id)

	try:
		friendship = Friendship.objects.get(
			Q(user1=request.user, user2=friend) | Q(user1=friend, user2=request.user)
		)
	except Friendship.DoesNotExist:
		messages.error(request, "Vous n'êtes pas ami avec cet utilisateur.")
		return redirect('account:search_users')

	friendship.remove_friend(friend)
	messages.success(request, f"Vous n'êtes plus ami avec {friend.username}.")
	return redirect('account:search_users')

@login_required
def profile_view(request, username):
	user = get_object_or_404(User, username=username)

	if user.wins + user.losses > 0:
		ratio = round(user.wins / (user.wins + user.losses) * 100, 1)
	else:
		ratio = 0

	matches = Match.objects.filter(players=user).order_by('-created_at')
	recent_matches = Match.objects.filter(players=user).order_by('-created_at')[:5]
	is_friend = Friendship.objects.filter(Q(user1=request.user, user2=user) | Q(user1=user, user2=request.user)).exists()
	friend_request_sent = FriendshipRequest.objects.filter(from_user=request.user, to_user=user).exists()
	friend_request_received = FriendshipRequest.objects.filter(from_user=user, to_user=request.user).exists()

	return render(request, 'account/profile.html', {
		'profile_user': user,
		'ratio': ratio,
		'recent_matches': recent_matches,
		'matches': matches,
        'is_friend': is_friend,
        'friend_request_sent': friend_request_sent,
        'friend_request_received': friend_request_received
	})