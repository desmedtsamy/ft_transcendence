# account/urls.py
from django.urls import path
# from .views import set_winner_view
from . import views

app_name = 'tournament'

urlpatterns = [
    # path('', views.TournamentsView.as_view(), name='tournaments'),
	# path('set_winner/<int:match_id>/', views.SetWinnerView.as_view(), name='set_winner'),
	# path('set-winner/', set_winner_view, name='set_winner'),
	
    path('<int:tournament_id>/', views.TournamentDetailView.as_view(), name='tournament_detail'),
	path('getTournaments/', views.GetTournamentsView.as_view(), name='getTournaments'),
	path('create_tournament/', views.CreateTournamentView.as_view(), name='createTournament'),
	path('join_tournament/', views.JoinTournamentView.as_view()),
	path('leave_tournament/', views.leaveTournamentView.as_view()),
	path('delete_tournament/', views.deleteTournamentView.as_view()),
	path('set_start_tournament/', views.startTournamentView.as_view()),
	
]
