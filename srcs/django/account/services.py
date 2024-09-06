# services.py

import os
import requests
from django.conf import settings
from django.contrib.auth import login, update_session_auth_hash
from django.contrib import messages
from django.utils import timezone
from requests_oauthlib import OAuth2Session
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import User, FriendshipRequest, Friendship, Match


def create_user_avatar(user, avatar_url):
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

def sync_42_user(request):
    client_id = settings.FORTYTWO_CLIENT_ID
    client_secret = settings.FORTYTWO_CLIENT_SECRET
    token_url = 'https://api.intra.42.fr/oauth/token'
    redirect_uri = 'http://localhost:8000/account/42sync'
    code = request.GET.get('code')
    oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
    token = oauth.fetch_token(token_url, code=code, client_secret=client_secret, include_client_id=True)
    intra_api_url = 'https://api.intra.42.fr/v2/me'
    response = oauth.get(intra_api_url)
    user_data = response.json()

    email = user_data['email']
    intra_id = user_data['id']
    username = user_data['login']
    avatar_url = user_data['image']['link']
    user = User.objects.get(email=email)
    user.intra_id = intra_id
    create_user_avatar(user, avatar_url)
    login(request, user)
    return user

def callback_42_user(request):
    redirect_url = "home"
    client_id = settings.FORTYTWO_CLIENT_ID
    client_secret = settings.FORTYTWO_CLIENT_SECRET
    token_url = 'https://api.intra.42.fr/oauth/token'
    redirect_uri = 'http://localhost:8000/account/42callback'
    code = request.GET.get('code')
    oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
    token = oauth.fetch_token(token_url, code=code, client_secret=client_secret, include_client_id=True)
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
            create_user_avatar(user, avatar_url)
    login(request, user)
    return redirect_url

def search_users(query, user):
    friends = user.get_friends()
    friend_requests_sent = FriendshipRequest.objects.filter(from_user=user).values_list('to_user', flat=True)
    friend_requests_received = FriendshipRequest.objects.filter(to_user=user).values_list('from_user', flat=True)
    users = User.objects.filter(Q(username__icontains=query) | Q(email__icontains=query)).exclude(pk=user.pk)
    return users, friends, friend_requests_sent, friend_requests_received

def handle_friend_request(user, to_user_id):
    try:
        to_user = User.objects.get(id=to_user_id)
        if to_user == user:
            return "Vous ne pouvez pas vous envoyer une demande d'ami."
        elif Friendship.objects.filter(Q(user1=user, user2=to_user) | Q(user1=to_user, user2=user)).exists():
            return f"Vous êtes déjà ami avec {to_user.username} ou une demande est en attente."
        else:
            FriendshipRequest.objects.create(from_user=user, to_user=to_user)
            return f"Demande d'ami envoyée à {to_user.username}."
    except User.DoesNotExist:
        return "Utilisateur introuvable."

def accept_friend_request(from_user_id, to_user):
    try:
        friend_request = FriendshipRequest.objects.get(from_user__id=from_user_id, to_user=to_user)
        friend_request.accept()
        return f"Vous êtes maintenant ami avec {friend_request.from_user.username}."
    except FriendshipRequest.DoesNotExist:
        return "Demande d'ami introuvable."

def reject_friend_request(from_user_id, to_user):
    try:
        friend_request = FriendshipRequest.objects.get(to_user=to_user, from_user_id=from_user_id)
        friend_request.cancel()
        return f"Demande d'ami de {friend_request.from_user.username} refusée."
    except FriendshipRequest.DoesNotExist:
        return "Demande d'ami introuvable."

def remove_friend_request(from_user, to_user_id):
    try:
        friend_request = FriendshipRequest.objects.get(from_user=from_user, to_user_id=to_user_id)
        friend_request.cancel()
        return f"Demande d'ami à {friend_request.to_user.username} annulée."
    except FriendshipRequest.DoesNotExist:
        return "Demande d'ami introuvable."

def remove_friend(user, friend_id):
    friend = get_object_or_404(User, id=friend_id)
    try:
        friendship = Friendship.objects.get(Q(user1=user, user2=friend) | Q(user1=friend, user2=user))
        friendship.remove_friend(friend)
        return f"Vous n'êtes plus ami avec {friend.username}."
    except Friendship.DoesNotExist:
        return "Vous n'êtes pas ami avec cet utilisateur."