from django.db import models

class Tournament(models.Model):
	GAME_TYPES = (
		('pong', 'Pong'),
		('tictactoe', 'Tic-tac-toe'),
	)
	
	selected_game = models.CharField(max_length=20, choices=GAME_TYPES, default='pong')
	name = models.CharField(max_length=100)
	players = models.ManyToManyField("account.User", related_name='tournaments', blank=True) 
	number_of_players = models.PositiveIntegerField(default=4)
	creator = models.ForeignKey("account.User", on_delete=models.SET_NULL, null=True, blank=True, related_name='creator')
	winner = models.ForeignKey("account.User", on_delete=models.SET_NULL, null=True, blank=True, related_name='winner')
	is_finished = models.BooleanField(default=False)
	is_started = models.BooleanField(default=False)

	class Meta:
		unique_together = ('name', 'selected_game')

	def set_start_tournament(self):
		if not self.is_started:
			self.is_started = True
			self.save()
			tournament_matches = TournamentMatch.objects.filter(round__number=1 , round__tournament=self)
			for tournament_match in tournament_matches:
				tournament_match.match.start()

	def delete_tournament(self):
		rounds = self.rounds.all()
		for round in rounds:
			tournament_matches = round.tournament_matches.all()
			for tournament_match in tournament_matches:
				if tournament_match.match:
					if tournament_match.match.status == 'pending':
						tournament_match.match.delete()
				tournament_match.delete()
			round.delete()
		self.delete()

class Round(models.Model):
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, blank=True, null=True, related_name='rounds')
	number = models.PositiveIntegerField()


class TournamentMatch(models.Model):
	round = models.ForeignKey(Round, on_delete=models.CASCADE,default=1, related_name='tournament_matches')
	next_match = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='previous_matches')
	winner_place = models.PositiveIntegerField(default=0)
	match = models.OneToOneField("game.Match", on_delete=models.CASCADE, null=True, blank=True, related_name='tournament_match')

	def end(self, winner):
		if self.next_match:
			if self.winner_place == 1:
				self.next_match.match.player1 = winner
			else:
				self.next_match.match.player2 = winner
			self.next_match.match.save()
			if self.next_match.match.is_ready():
				self.next_match.match.start()
		else:
			tournament = self.round.tournament
			tournament.winner = winner
			tournament.is_finished = True
			tournament.save()