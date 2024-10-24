from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/notification/(?P<user_id>\w+)$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/game/(?P<user_id>\w+)$', consumers.PongGameConsumer.as_asgi()),
]

# daphne -u /tmp/daphne.sock -b 0.0.0.0 -p 8001 ft_transcendence.asgi:application