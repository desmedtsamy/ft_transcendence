
from django.contrib import admin
from django.urls import path, include
from .views import ScoreboardView
from django.conf import settings
from django.conf.urls.static import static
from . import views
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/account/', include('account.urls')),
    path('api/scoreboard/', views.ScoreboardView.as_view(), name='scoreboard'),
    path('api/tournament/', include('tournament.urls')),
]

if settings.DEBUG:
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)