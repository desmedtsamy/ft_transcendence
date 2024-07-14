
from django.contrib import admin
from django.urls import path, include
from .views import index, scoreboard_view, generate_users_view, create_match_view, update_last_activity
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
	path('update_last_activity/', update_last_activity, name='update_last_activity'),
    path('admin/', admin.site.urls),
    path('', index, name='index'),
    path('home', index, name='home'),
    path('pong/', include('pong.urls')),
    path('account/', include('account.urls')),
	path('generate_users/', generate_users_view, name='generate_users'),
	path('create_match/', create_match_view, name='create_match'),
	path('scoreboard/', scoreboard_view, name='scoreboard'),

]

if settings.DEBUG:
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)