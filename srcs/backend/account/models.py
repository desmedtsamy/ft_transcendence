from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import Q
from django.utils import timezone
from game.models import Match
from datetime import timedelta
from django.core.cache import cache
from django.contrib.sessions.models import Session

def update_user_status():
	time_threshold_inactive = timezone.now() - timedelta(minutes=2)
	time_threshold_disconnect = timezone.now() - timedelta(minutes=15)

	inactive_users = User.objects.filter(last_activity__lt=time_threshold_inactive, is_online=True)
	for user in User.objects.filter(last_activity__lt=time_threshold_disconnect, is_online=True):
		Session.objects.filter(expire_date__gte=timezone.now(), session_data__contains=str(user.id)).delete()
	inactive_users.update(is_online=False)


class User(AbstractUser):
	GAME_TYPES = (
		('pong', 'Pong'),
		('tictactoe', 'Tic-tac-toe'),
	)
	
	selected_game = models.CharField(max_length=20, choices=GAME_TYPES, default='pong')
	username = models.CharField(max_length=100, unique=True)
	email = models.EmailField(unique=True)
	avatar = models.ImageField(default='profile_pics/default.png', upload_to='profile_pics')
	last_activity = models.DateTimeField(default=timezone.now)
	last_connection = models.DateTimeField(auto_now=True, null=True)
	is_online = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	intra_id = models.IntegerField(unique=True, null=True, blank=True)
	is_admin = models.BooleanField(default=False)
	scores = models.JSONField(default=dict)
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)
	def get_matches(self):
		return Match.objects.filter(Q(player1=self) | Q(player2=self))
	def get_friends(self):
		friendships = Friendship.objects.filter(Q(user1=self) | Q(user2=self))
		friends = []
		for friendship in friendships:
			if friendship.user1 == self:
				friends.append(friendship.user2)
			else:
				friends.append(friendship.user1)
		return friends
	@property
	def friendship_requests_sent(self):
		return FriendshipRequest.objects.filter(from_user=self)
	@staticmethod
	def initialize_scores():
		return {game[0]: 0 for game in User.GAME_TYPES}
	def save(self, *args, **kwargs):
		if not self.scores:
			self.scores = self.initialize_scores()
		super().save(*args, **kwargs)
	
	def check_user_status():
		print("check_user_status")
		last_update = cache.get('last_status_update')
		now = timezone.now()
		if not last_update or (now - last_update).total_seconds() >= 60:
			update_user_status()
			cache.set('last_status_update', now)

class FriendshipRequest(models.Model):
	from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_requests_sent')
	to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_requests_received')
	created_at = models.DateTimeField(auto_now_add=True)

	def save(self, *args, **kwargs):
		if FriendshipRequest.objects.filter(from_user=self.to_user, to_user=self.from_user).exists():
			raise ValueError("Une demande d'ami existe déjà dans l'autre sens.")
		super().save(*args, **kwargs)

	def accept(self):
		Friendship.objects.create(user1=self.from_user, user2=self.to_user)
		self.delete()

	def cancel(self):
		self.delete()

	class Meta:
		unique_together = ('from_user', 'to_user')
class Friendship(models.Model):
	user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships1')
	user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships2')
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('user1', 'user2') 
	
	def save(self, *args, **kwargs):
		if self.user1_id > self.user2_id:
			self.user1, self.user2 = self.user2, self.user1
		super().save(*args, **kwargs)
	def remove_friend(self, friend):
		if friend == self.user1:
			self.delete()
		elif friend == self.user2:
			self.delete()