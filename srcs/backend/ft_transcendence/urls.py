
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/account/', include('account.urls')),
    path('api/scoreboard/', views.ScoreboardView.as_view(), name='scoreboard'),
    path('api/tournament/', include('tournament.urls')),
	path("api/game/", include('game.urls')),
	path('api/update_activity/', views.UpdateLastActivityView.as_view(), name='last_activity'),
]

if settings.DEBUG:
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)