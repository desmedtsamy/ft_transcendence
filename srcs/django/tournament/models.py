from django.db import models
from account.models import User
from pong.models import Match

class Tournament(models.Model):
	name = models.CharField(max_length=100, unique=True)
	players = models.ManyToManyField(User, related_name='tournaments', blank=True) 
	number_of_players = models.PositiveIntegerField(default=4)
	creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='creator')
	winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='winner')
	is_finished = models.BooleanField(default=False)
	is_started = models.BooleanField(default=False)

class Round(models.Model):
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
	number = models.PositiveIntegerField()
	#matches = models.ForeignKey('TournamentMatch', on_delete=models.CASCADE, related_name='round_in_tournament', null=True, blank=True)

class TournamentMatch(models.Model):
	#tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
	round = models.ForeignKey(Round, on_delete=models.CASCADE,default=1)
	match = models.OneToOneField(
		Match,
		on_delete=models.CASCADE,
		null=True,
		blank=True,
		related_name='tournament_match'
	)
	next_match = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='previous_matches')