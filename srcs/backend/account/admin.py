from django.contrib import admin
from .models import Match, User, Friendship, FriendshipRequest
admin.site.register(Match)
admin.site.register(User)
admin.site.register(Friendship)
admin.site.register(FriendshipRequest)