from django.db import models
from django.db.models import F
from tournament.models import TournamentMatch
from .signals import match_started


class Match(models.Model):
	GAME_TYPES = (
		('pong', 'Pong'),
		('tictactoe', 'Tic-tac-toe'),
	)
	GAME_STATUS = (
		('pending', 'Pending'),
		('started', 'Started'),
		('finished', 'Finished'),
	)
	
	game_type = models.CharField(max_length=20, choices=GAME_TYPES, default='pong')
	player1 = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='player1_matches')
	player2 = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='player2_matches')
	winner  = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches')
	created_at = models.DateTimeField(auto_now_add=True)
	status = models.CharField(max_length=100, default='pending', choices=GAME_STATUS)
	data = models.JSONField(default=dict, blank=True, null=True)

	def start(self, type="tournament"):
		if self.player1 == None and self.player2 == None:
			self.end(None)
		if self.player1 == None:
			self.end(self.player2)
		elif self.player2 == None:
			self.end(self.player1)
		else:
			match_started.send(sender=self, player1_id=self.player1.id, player2_id=self.player2.id, match=self, type=type)
			self.status = 'pending'
			self.save()
		self.save()

	def end(self, winner, match_data=None):
		print(self.id, match_data)
		if match_data:
			if not self.data:
				self.data = {}
			self.data.update(match_data)
		
		self.winner = winner
		if winner:
			looser = self.player1 if self.player1 != winner else self.player2
			if self.game_type not in self.winner.scores:
				self.winner.scores[self.game_type] = 0 
			self.winner.scores[self.game_type] +=42
			self.winner.wins[self.game_type] += 1
			if looser.scores[self.game_type] > 19:
				looser.scores[self.game_type] -=19
			else:
				looser.scores[self.game_type] = 0
			
			looser.losses[self.game_type] += 1
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
	
	def initialize_data(self):
		"""Initialise le dictionnaire de données en fonction du type de jeu"""
		if not self.data:
			self.data = {}
			
		if self.game_type == 'pong':
			if 'duration' not in self.data:
				self.data['duration'] = 0
			if 'scores' not in self.data:
				self.data['scores'] = {1: 0, 2: 0}  # Format {1: score_player1, 2: score_player2}
				
		elif self.game_type == 'tictactoe':
			if 'moves' not in self.data:
				self.data['moves'] = 0
			if 'draws' not in self.data:
				self.data['draws'] = 0
				
	
	def save(self, *args, **kwargs):
		is_new = self.pk is None
		need_init = is_new or not self.data
		
		super().save(*args, **kwargs)
		
		if need_init:
			self.initialize_data()
			Match.objects.filter(pk=self.pk).update(data=self.data)