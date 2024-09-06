# account/urls.py
from django.urls import path, include
from .views import set_winner_view
from . import views

app_name = 'tournament'

urlpatterns = [
    path('', views.TournamentsView.as_view(), name='tournaments'),
    path('<int:tournament_id>/', views.TournamentDetailView.as_view(), name='tournament_detail'),
	path('set_winner/<int:match_id>/', views.SetWinnerView.as_view(), name='set_winner'),
	path('set-winner/', set_winner_view, name='set_winner'),
]



# fetch(`/tournament/${tournamentId}/`)
# 	.then(response => response.json())
# 	.then(data => {	
# 		document.getElementById('tournament_name').textContent = data.name;
# 		renderTournament(data);
# 	});