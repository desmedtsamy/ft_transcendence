from django.urls import re_path
from . import consumers
from . import notification_consumer
websocket_urlpatterns = [
    re_path(r'ws/game/(?P<game_id>\w+)/(?P<user_id>\w+)$', consumers.PongGameConsumer.as_asgi()),
    re_path(r'ws/notification/(?P<user_id>\w+)$', notification_consumer.NotificationConsumer.as_asgi()),
]

# daphne -u /tmp/daphne.sock -b 0.0.0.0 -p 8001 ft_transcendence.asgi:application