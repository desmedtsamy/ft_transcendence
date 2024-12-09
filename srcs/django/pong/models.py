from django.db import models
from tournament.models import TournamentMatch

class Match(models.Model):

	player1 = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='player1_matches')
	player2 = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='player2_matches')
	winner = models.ForeignKey('account.User' , on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches')
	created_at = models.DateTimeField(auto_now_add=True)
	score = models.IntegerField(default=0)
	status = models.CharField(max_length=100, default='pending')

	def start(self):
		print(f"Match {self.id} started")
		if self.player1 == None:
			self.status = 'abort'
			self.winner = self.player2
		elif self.player2 == None:
			self.status = 'abort'
			self.winner = self.player1
		else:
			self.status = 'started'
		self.save()