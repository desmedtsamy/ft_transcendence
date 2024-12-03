from django.db import models

class Match(models.Model):

	player1 = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='player1_matches')
	player2 = models.ForeignKey('account.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='player2_matches')
	winner = models.ForeignKey('account.User', on_delete=models.CASCADE, related_name='won_matches', null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	duration = models.IntegerField(default=42)
	score = models.IntegerField(default=0)
