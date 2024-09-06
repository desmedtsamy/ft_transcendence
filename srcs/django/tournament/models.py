from django.db import models
from account.models import User

class Tournament(models.Model):
    name = models.CharField(max_length=100, unique=True)
    players = models.ManyToManyField(User, related_name='tournaments')
    number_of_players = models.PositiveIntegerField(default=4)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='creator')
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='winner')

class Round(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    number = models.PositiveIntegerField()
    #matches = models.ForeignKey('TournamentMatch', on_delete=models.CASCADE, related_name='round_in_tournament', null=True, blank=True)

class TournamentMatch(models.Model):
    #tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    round = models.ForeignKey(Round, on_delete=models.CASCADE,default=1)
    player1 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='player1_matches')
    player2 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='player2_matches')
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='winner_matches')
    score = models.CharField(max_length=20, null=True, blank=True)
    next_match = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='previous_matches')