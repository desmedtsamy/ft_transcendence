# services.py

def getMatch(match_id):
	try:
		match = Match.objects.get(id=match_id)
		return {'status': 'success', 'match': match}, 200
	except Match.DoesNotExist:
		return {'error': 'Match introuvable'}, 404
	except Exception as e:
		return {'error': str(e)}, 500