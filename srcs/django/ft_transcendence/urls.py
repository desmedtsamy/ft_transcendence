
from django.contrib import admin
from django.urls import path, include
from .views import index, home, generate_users_view
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='index'),
    path('home', home, name='home'),
    path('pong/', include('pong.urls')),
    path('account/', include('account.urls')),
	path('generate_users/', generate_users_view, name='generate_users'),

]

if settings.DEBUG:
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)