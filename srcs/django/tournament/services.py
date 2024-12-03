# services.py

import math
from django.contrib import messages
from .models import Tournament, TournamentMatch, Round
from django.http import JsonResponse
from account.models import User

import math
from django.db import transaction

def create_tournament(name, number_of_players, creator):
    # Validation du nombre de joueurs
    if not (number_of_players & (number_of_players - 1) == 0):
        return {'error': 'Le nombre de joueurs doit être une puissance de 2'}, 400

    try:
        with transaction.atomic():  # Assurer que toutes les opérations de création sont atomiques
            # Créer le tournoi
            tournament = Tournament.objects.create(name=name, number_of_players=number_of_players, creator=creator)

            # Calculer le nombre de rounds (log2 du nombre de joueurs)
            num_rounds = int(math.log2(number_of_players))

            # Stocker les matchs de chaque round
            previous_round_matches = []

            # Créer les rounds et les matchs
            for round_number in range(1, num_rounds + 1):
                round = Round.objects.create(tournament=tournament, number=round_number)
                number_of_matches = number_of_players // (2 ** round_number)
                current_round_matches = [
                    TournamentMatch(round=round) for _ in range(number_of_matches)
                ]
                
                # Sauvegarder tous les matchs du round actuel en une seule fois
                TournamentMatch.objects.bulk_create(current_round_matches)

                # Assigner les next_matchs
                if previous_round_matches:
                    # Chaque match des rounds précédents doit pointer vers le next match du round actuel
                    for match_index, match in enumerate(current_round_matches):
                        previous_match_1 = previous_round_matches[match_index * 2]
                        previous_match_2 = previous_round_matches[match_index * 2 + 1]
                        previous_match_1.next_match = match
                        previous_match_2.next_match = match

                    # Sauvegarder tous les matchs des rounds précédents avec les next_matchs assignés
                    TournamentMatch.objects.bulk_update(previous_round_matches, ['next_match'])

                # Sauvegarder les matchs du round actuel pour le prochain round
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
        rounds = tournament.round_set.all()  # Utilise "round_set" pour la relation ForeignKey

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
                            'id': match.id,
                            'player1': match.player1.username if match.player1 else None,
							"player1_id" : match.player1.id if match.player1 else None,
                            'player2': match.player2.username if match.player2 else None,
							"player2_id" : match.player2.id if match.player2 else None,
                            'winner': match.winner.username if match.winner else None,
                            'score': match.score,
                        }
                        for match in TournamentMatch.objects.filter(round=round).order_by('id')
                    ]
                }
                for round in rounds
            ],
            'is_finished': tournament.is_finished,
            'is_started': tournament.is_started,
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