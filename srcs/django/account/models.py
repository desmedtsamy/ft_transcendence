from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import Q
from django.utils import timezone

class User(AbstractUser):
	username = models.CharField(max_length=100, unique=True)
	email = models.EmailField(unique=True)
	avatar = models.ImageField(default='profile_pics/default.png', upload_to='profile_pics')
	last_activity = models.DateTimeField(default=timezone.now)
	last_connection = models.DateTimeField(auto_now=True, null=True)
	is_online = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	intra_id = models.IntegerField(unique=True, null=True, blank=True)
	is_admin = models.BooleanField(default=False)
	score = models.IntegerField(default=0)
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
	

class Match(models.Model):
	players = models.ManyToManyField(User, related_name='matches')
	winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='won_matches')
	created_at = models.DateTimeField(auto_now_add=True)
	duration = models.IntegerField(default=42)
	points_at_stake = models.IntegerField(default=0)

	def save(self, *args, **kwargs):
		# Calculer les points en jeu avant de sauvegarder le match
		self.points_at_stake = self.duration
		super().save(*args, **kwargs)
	
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