from django.db import models
from django.db.models import F
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
	status = models.CharField(max_length=100, default='pending')

	def start(self):
		if self.player1 == None and self.player2 == None:
			self.end(None)
		if self.player1 == None:
			self.end(self.player2)
		elif self.player2 == None:
			self.end(self.player1)
		else:
			self.status = 'started'
			match_started.send(sender=self, player1_id=self.player1.id, player2_id=self.player2.id, match=self)
			self.save()
		self.save()

	def end(self, winner):
		self.winner = winner
		looser = self.player1 if self.player1 != winner else self.player2
		if winner:
			if self.game_type not in self.winner.scores:
				self.winner.scores[self.game_type] = 0 
			self.winner.scores[self.game_type] +=42
			self.winner.wins += 1
			looser.scores[self.game_type] -=21
			looser.losses += 1
			self.winner.save()
			looser.save()
		self.status = 'finished'
		self.save()
		
		if hasattr(self, 'tournament_match') and self.tournament_match:
			self.tournament_match.end(winner)

	def set_player(self, player):
		if self.player1 == None:
			self.player1 = player
		elif self.player2 == None:
			self.player2 = player
		self.save()

	def delete_player(self, player):
		if self.player1 == player:
			self.player1 = None
		elif self.player2 == player:
			self.player2 = None
		self.save()

	def is_ready(self):
		return self.player1 != None and self.player2 != None