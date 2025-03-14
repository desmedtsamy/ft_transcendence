# services.py

from game.models import Match
from account.models import User

def getMatch(matchId):
	try:
		match = Match.objects.get(id=matchId)
		return match
	except Match.DoesNotExist:
		return {'error': 'Match not found'}, 404
	except Exception as e:
		return {'error': str(e)}, 500
	
def create_match(player1_id, player2_id, game_type):
	try:
		player1 = User.objects.get(id=player1_id)
		player2 = User.objects.get(id=player2_id)
		match = Match(player1=player1, player2=player2, game_type=game_type)
		match.save()
		return match
	except User.DoesNotExist:
		return -1
	except Exception as e:
		return -1