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

def set_winner(match_id, winner_id):
	try:
		match = Match.objects.get(id=match_id)
		winner = User.objects.get(id=winner_id)
		match.winner = winner
		match.save()
		print ('Winner set successfully')
		return {'status': 'success', 'message': 'Winner set successfully'}, 200
	except Match.DoesNotExist:
		return {'error': 'Match not found'}, 404
	except User.DoesNotExist:
		return {'error': 'Winner not found'}, 404
	except Exception as e:
		return {'error': str(e)}, 500 
	

def create_match(player1_id, player2_id):
	try:
		player1 = User.objects.get(id=player1_id)
		player2 = User.objects.get(id=player2_id)
		match = Match(player1=player1, player2=player2)
		match.save()
		return match.id
	except User.DoesNotExist:
		return -1
	except Exception as e:
		return -1
	
def set_winner(match_id, winner_id):
	try:
		match = Match.objects.get(id=match_id)
		winner = User.objects.get(id=winner_id)
		match.winner = winner
		match.save()
		return {'status': 'success', 'message': 'Winner set successfully'}, 200
	except Match.DoesNotExist:
		return {'error': 'Match not found'}, 404
	except User.DoesNotExist:
		return {'error': 'Winner not found'}, 404
	except Exception as e:
		return {'error': str(e)}, 500