from django.contrib import admin
from .models import Game, User, Friendship, FriendshipRequest

admin.site.register(Game)
admin.site.register(User)
admin.site.register(Friendship)
admin.site.register(FriendshipRequest)