from django.contrib import admin

from .models import Tournament, TournamentMatch, Round

admin.site.register(Tournament)
admin.site.register(TournamentMatch)
admin.site.register(Round)
