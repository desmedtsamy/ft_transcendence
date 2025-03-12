from django.urls import re_path
from . import pongGameConsumer
from . import tictactoeGameConsumer
from . import notification_consumer
from . import matchmakingConsumer
websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<game_id>\w+)/(?P<user_id>\w+)$', pongGameConsumer.Consumer.as_asgi()),
    re_path(r'ws/tictactoe/(?P<game_id>\w+)/(?P<user_id>\w+)$', tictactoeGameConsumer.Consumer.as_asgi()),
    re_path(r'ws/notification/(?P<user_id>\w+)$', notification_consumer.NotificationConsumer.as_asgi()),
	re_path(r'ws/matchmaking/(?P<user_id>\w+)$', matchmakingConsumer.Consumer.as_asgi()),
]

# daphne -u /tmp/daphne.sock -b 0.0.0.0 -p 8001 ft_transcendence.asgi:application