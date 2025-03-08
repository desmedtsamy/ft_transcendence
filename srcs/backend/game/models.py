from django.db import models
from tournament.models import TournamentMatch
from .signals import match_started

class Match(models.Model):
	GAME_TYPES = (
		('pong', 'Pong'),
		('tictactoe', 'Tic-tac-toe'),
	)
	
	game_type = models.CharField(max_length=20, choices=GAME_TYPES, default='pong')
	player1 = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='player1_matches')
	player2 = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='player2_matches')
	winner  = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches')
	created_at = models.DateTimeField(auto_now_add=True)
	score = models.IntegerField(default=0)
	status = models.CharField(max_length=100, default='pending')

	def start(self):
		print(f"Match {self.id} started")
		if self.player1 == None:
			self.end(self.player2)
		elif self.player2 == None:
			self.end(self.player1)
		else:
			self.status = 'started'
			# NotificationConsumer().start_match(self.player1.id, self.player2.id)
			match_started.send(sender=self, player1_id=self.player1.id, player2_id=self.player2.id, match_id=self.id)
			self.save()
		self.save()
	def end(self, winner):
		self.winner = winner
		if self.game_type not in self.winner.scores:
			self.winner.scores[self.game_type] = 0 
		self.winner.scores[self.game_type] +=42
		self.winner.save()
		self.status = 'finished'
		self.save()
		# NotificationConsumer().end_match(self.player1.id, self.player2.id, winner.id)
		if self.tournament_match:
			self.tournament_match.end(winner)

