# views.py

from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from .forms import TournamentForm
from .services import create_tournament, get_tournament_details, update_match_winner, set_winner
from .models import Tournament, TournamentMatch, Round
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt  # Désactive la protection CSRF juste pour le test (attention en prod)
def set_winner_view(request):
    if request.method == 'POST':
        try:
            # Decode JSON
            data = json.loads(request.body)
            match_id = data.get('match_id')
            winner_id = data.get('winner_id')


            if not match_id or not winner_id:
                return JsonResponse({'status': 'error', 'message': 'Match ID et Winner ID sont requis.'})

            # Appel à la fonction set_winner
            try:
                result = set_winner(match_id, winner_id)

                if result.get('status') == 'success':
                    return JsonResponse({'status': 'success', 'message': 'Vainqueur défini avec succès !'})
                else:
                    return JsonResponse({'status': 'error', 'message': result.get('error', 'Erreur inconnue')})
            except Exception as e:
                return JsonResponse({'status': 'error', 'message': str(e)})
        except json.JSONDecodeError as jde:
            return JsonResponse({'status': 'error', 'message': 'Données JSON invalides.'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': 'Méthode non supportée.'})
    
class TournamentsView(View):
	template_name = 'tournament/tournaments.html'
	form = TournamentForm()
	context = {
		'form': form,
	}

	def get(self, request):
		tournaments = Tournament.objects.all()
		self.context = {'tournaments': tournaments, 'form': self.form}
		return render(request, self.template_name, self.context)

	def post(self, request):
		form = TournamentForm(request.POST)
		if not form.is_valid():
			return JsonResponse({'error': 'Données invalides'}, status=400)

		name = form.cleaned_data['name']
		number_of_players = int(form.cleaned_data['number_of_players'])

		tournament, status = create_tournament(name, number_of_players, request.user)
		
		if status == 200:
			return render(request, self.template_name, {'tournaments': Tournament.objects.all(), 'form': self.form})
		else:
			return JsonResponse(tournament, status=status)


class TournamentDetailView(View):
	def get(self, request, tournament_id):
		data, status = get_tournament_details(tournament_id)
		return JsonResponse(data, status=status)
	
class SetWinnerView(View):
	def post(self, request, match_id):
		update_match_winner(match_id, request.user)
		return JsonResponse({'status': 'success'})