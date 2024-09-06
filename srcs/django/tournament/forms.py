from django import forms
from .models import Tournament

class NumberOfPlayersField(forms.ChoiceField):
    def __init__(self, choices, **kwargs):
        super().__init__(choices=choices, **kwargs)

class TournamentForm(forms.Form):
    name = forms.CharField(max_length=255)
    number_of_players = NumberOfPlayersField(choices=[(2, 2), (4, 4), (8, 8), (16, 16)])