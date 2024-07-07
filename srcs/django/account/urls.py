# account/urls.py
from django.urls import path, include
from . import views

app_name = 'account'

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('settings', views.SettingsView.as_view(), name='settings'),
    path('42callback/', views.callback_42, name='42callback'),
    path('42sync/', views.sync_42, name='42sync'),
	path('friends/', views.friends_view, name='friends'),
	path('remove_friend/<int:friend_id>/', views.remove_friend, name='remove_friend'),
	path('search/', views.search_users_view, name='search_users'),
	path('send_friend_request/', views.send_friend_request, name='send_friend_request'),
	path('accept_friend_request/<int:request_id>/', views.accept_friend_request, name='accept_friend_request'),
	path('reject_friend_request/<int:request_id>/', views.reject_friend_request, name='reject_friend_request'),

]
