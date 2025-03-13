# services.py

import math
from django.contrib import messages
from .models import Tournament, TournamentMatch, Round
from django.http import JsonResponse
from account.models import User
from django.db.models import Q
import math
from django.db import transaction
from game.models import Match


def join_tournament(tournament_id, user_id):
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		user = User.objects.get(id=user_id)

		if tournament.is_started:
			return {'error': 'Le tournoi a déjà commencé'}, 400

		if user in tournament.players.all():
			return {'error': 'Vous êtes déjà inscrit à ce tournoi'}, 400

		if tournament.players.count() >= tournament.number_of_players:
			return {'error': 'Le tournoi est complet'}, 400

		tournament.players.add(user)
		tournament.save()
		matchs = TournamentMatch.objects.filter(
			round__tournament=tournament,
			round__number=1
		).filter(Q(match__player1=None) | Q(match__player2=None)).order_by('id')

		if not matchs:
			return {'error': 'Le tournoi est complet'}, 400

		# Prendre le premier match disponible
		tournamentMatch = matchs.first()
		match = tournamentMatch.match
		match.set_player(user)
		match.save()

		if tournament.players.count() == tournament.number_of_players:
			tournament.set_start_tournament()
		return {'status': 'success', 'message': 'Inscription réussie'}, 200
	except Tournament.DoesNotExist:
		return {'error': 'Tournoi introuvable'}, 404
	except User.DoesNotExist:
		return {'error': 'Joueur introuvable'}, 404
	except Exception as e:
		return {'error': str(e)}, 500

def set_start_tournament(tournament_id, user):
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		if user != tournament.creator:
			return {'error': 'Vous n\'êtes pas le créateur du tournoi'}, 403
		if tournament.is_started:
			return {'error': 'Le tournoi a déjà commencé'}, 400
		if tournament.players.count() == 0 :
			return {'error': 'Le tournoi est vide'}, 400
		tournament.set_start_tournament()
		return {'status': 'success', 'message': 'Tournoi commencé'}, 200
	except Tournament.DoesNotExist:
		return {'error': 'Tournoi introuvable'}, 404
	except Exception as e:
		return {'error': str(e)}, 500

def delete_tournament(tournament_id, user):
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		if user != tournament.creator:
			return {'error': 'Vous n\'êtes pas le créateur du tournoi'}, 403
		tournament.delete_tournament()
		return {'status': 'success', 'message': 'Tournoi supprimé'}, 200
	except Tournament.DoesNotExist:
		return {'error': 'Tournoi introuvable'}, 404
	except Exception as e:
		return {'error': str(e)}, 500


def leave_tournament(tournament_id, user_id):
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		user = User.objects.get(id=user_id)

		if tournament.is_started:
			return {'error': 'Le tournoi a déjà commencé'}, 400

		if user not in tournament.players.all():
			return {'error': 'Vous n\'êtes pas inscrit à ce tournoi'}, 400
		tournament.players.remove(user)
		# Supprimer le joueur du match 
		for tournamentMatch in TournamentMatch.objects.filter(round__tournament=tournament):
			match = tournamentMatch.match
			match.delete_player(user)
			

		tournament.save()
		return {'status': 'success', 'message': 'Désinscription réussie'}, 200
	except Tournament.DoesNotExist:
		return {'error': 'Tournoi introuvable'}, 404
	except User.DoesNotExist:
		return {'error': 'Joueur introuvable'}, 404
	except Exception as e:
		return {'error': str(e)}, 500

def create_tournament(name, number_of_players, creator):
	game_type = creator.selected_game
	# Validation du nombre de joueurs
	if not (number_of_players & (number_of_players - 1) == 0):
		return {'error': 'Le nombre de joueurs doit être une puissance de 2'}, 400

	try:
		with transaction.atomic():  # Assurer que toutes les opérations de création sont atomiques
			# Créer le tournoi
			tournament = Tournament.objects.create(name=name,
							number_of_players=number_of_players, creator=creator,
							  selected_game=game_type)

			# Calculer le nombre de rounds (log2 du nombre de joueurs)
			num_rounds = int(math.log2(number_of_players))

			# Stocker les matchs de chaque round
			previous_round_matches = []

			for round_number in range(1, num_rounds + 1):
				round = Round.objects.create(tournament=tournament, number=round_number)
				number_of_matches = number_of_players // (2 ** round_number)
				current_round_matches = []

				for _ in range(number_of_matches):
					match = Match.objects.create(game_type=game_type)
					tournament_match = TournamentMatch.objects.create(round=round, match=match)
					current_round_matches.append(tournament_match)

				# Assigner les next_matchs
				if previous_round_matches:
					for match_index, tournament_match in enumerate(current_round_matches):
						# Relier deux matchs du round précédent à un match du round actuel
						previous_match_1 = previous_round_matches[match_index * 2]
						previous_match_2 = previous_round_matches[match_index * 2 + 1]
						previous_match_1.next_match = tournament_match
						previous_match_2.next_match = tournament_match
						previous_match_1.winner_place = 1
						previous_match_2.winner_place = 2
						previous_match_1.save()
						previous_match_2.save()

					# Sauvegarder tous les matchs des rounds précédents avec les next_matchs assignés
					TournamentMatch.objects.bulk_update(previous_round_matches, ['next_match'])

				# Mettre à jour les matchs précédents pour le prochain round
				previous_round_matches = current_round_matches

		return tournament, 200
	except Exception as e:
		return {'error': str(e)}, 500
	
def set_winner(match_id, winner_id):
	try:
		match = TournamentMatch.objects.get(id=match_id)
		winner = User.objects.get(id=winner_id)

		# Assigner le winner au match
		match.winner = winner
		match.save()

		# Vérifier s'il y a un match suivant
		if match.next_match:
			# Si le match suivant n'a pas encore de player1, on l'assigne ici
			if not match.next_match.player1:
				match.next_match.player1 = winner
			# Sinon, on l'assigne à player2
			elif not match.next_match.player2:
				match.next_match.player2 = winner
			match.next_match.save()
		else:
			# Si pas de match suivant, assigner le winner comme winner du tournoi
			match_round = match.round
			tournament = match_round.tournament
			tournament.winner = winner
			tournament.save()

		return {'status': 'success', 'message': 'Vainqueur défini avec succès.'}
	except TournamentMatch.DoesNotExist:
		return {'status': 'error', 'message': 'Match non trouvé.'}
	except User.DoesNotExist:
		return {'status': 'error', 'message': 'Joueur non trouvé.'}
	except Exception as e:
		return {'status': 'error', 'message': str(e)}


def get_tournament_details(tournament_id):
	try:
		tournament = Tournament.objects.get(pk=tournament_id)
		rounds = tournament.rounds.all()

		data = {
			'id': tournament.id,
			'name': tournament.name,
			'creator': tournament.creator.username,
			'winner': tournament.winner.username if tournament.winner else None,
			'rounds': [
				{
					'number': round.number,
					'matches': [
						{
							'id': tournamentMatch.id,
							'player1': tournamentMatch.match.player1.username if tournamentMatch.match.player1 else None,
							"player1_id" : tournamentMatch.match.player1.id if tournamentMatch.match.player1 else None,
							'player2': tournamentMatch.match.player2.username if tournamentMatch.match.player2 else None,
							"player2_id" : tournamentMatch.match.player2.id if tournamentMatch.match.player2 else None,
							'winner': tournamentMatch.match.winner.username if tournamentMatch.match.winner else None,
						}
						for tournamentMatch in TournamentMatch.objects.filter(round=round).order_by('id')
					]
				}
				for round in rounds
			],
			'is_finished': tournament.is_finished,
			'players' : [player.username for player in tournament.players.all()],
			'is_started': tournament.is_started,
			'number_of_players': tournament.number_of_players,
			'players_count': tournament.players.count()
		}

		return data, 200
	except Tournament.DoesNotExist:
		return {'error': 'Tournoi introuvable'}, 404
	
def update_match_winner(match_id, winner_id):
	try:
		match = TournamentMatch.objects.get(id=match_id)
		winner = User.objects.get(id=winner_id)
		match.winner = winner
		match.save()

		# Si ce match a un next_match, placer le gagnant dans le prochain match
		if match.next_match:
			next_match = match.next_match
			# On assigne le joueur à player1 s'il est vide, sinon à player2
			if not next_match.player1:
				next_match.player1 = winner
			elif not next_match.player2:
				next_match.player2 = winner
			next_match.save()

		return {'status': 'success', 'message': 'Winner updated and moved to next match'}
	except TournamentMatch.DoesNotExist:
		return {'status': 'error', 'message': 'Match not found'}
	except User.DoesNotExist:
		return {'status': 'error', 'message': 'Winner not found'}
	except Exception as e:
		return {'status': 'error', 'message': str(e)}	