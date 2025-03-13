from django.urls import re_path
from . import pongGameConsumer
from . import tictactoeGameConsumer
from . import notification_consumer
from . import matchmakingConsumer
websocket_urlpatterns = [
    re_path(r'wss/pong/(?P<game_id>\w+)/(?P<user_id>\w+)$', pongGameConsumer.Consumer.as_asgi()),
    re_path(r'wss/tictactoe/(?P<game_id>\w+)/(?P<user_id>\w+)$', tictactoeGameConsumer.Consumer.as_asgi()),
    re_path(r'wss/notification/(?P<user_id>\w+)$', notification_consumer.NotificationConsumer.as_asgi()),
	re_path(r'wss/matchmaking/(?P<user_id>\w+)$', matchmakingConsumer.Consumer.as_asgi()),
]
