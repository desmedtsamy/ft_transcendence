from django.urls import re_path
from .consumers import matchmaking
from .consumers import notification
from .consumers import pong
from .consumers import tictactoe


websocket_urlpatterns = [
    re_path(r'wss/pong/(?P<game_id>\w+)/(?P<user_id>\w+)$', pong.Consumer.as_asgi()),
    re_path(r'wss/tictactoe/(?P<game_id>\w+)/(?P<user_id>\w+)$', tictactoe.Consumer.as_asgi()),
    re_path(r'wss/notification/(?P<user_id>\w+)$', notification.Consumer.as_asgi()),
	re_path(r'wss/matchmaking/(?P<user_id>\w+)$', matchmaking.Consumer.as_asgi()),
]
