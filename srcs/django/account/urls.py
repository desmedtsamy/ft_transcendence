# account/urls.py
from django.urls import path, include
from . import views

app_name = 'account'

urlpatterns = [
    #path('login_OLD/', views.LoginView.as_view(), name='login_OLD'),
    #path('logout_OLD/', views.LogoutView.as_view(), name='logout_OLD'),
    #path('register/', views.RegisterView.as_view(), name='register'),
    #path('settings', views.SettingsView.as_view(), name='settings'),
    # path('42callback_old/', views.callback_42_old, name='42callback_old'),
	# path('friends/', views.friends_view, name='friends'),
	# path('search/', views.search_users_view, name='search_users'),
	# path('send_friend_request/', views.send_friend_request, name='send_friend_request'),
	# path('send_friend_request/<int:user_id>/', views.send_friend_request, name='send_friend_request'),
	# path('accept_friend_request/<int:user_id>/', views.accept_friend_request, name='accept_friend_request'),
	# path('reject_friend_request/<int:user_id>/', views.reject_friend_request, name='reject_friend_request'),
	# path('remove_friend_request/<int:user_id>/', views.remove_friend_request, name='remove_friend_request'),
	# path('remove_friend/<int:friend_id>/', views.remove_friend, name='remove_friend'),
	# path('profile/<str:username>/', views.profile_view, name='profile'),
	

	
	path('current-user/', views.CurrentUserViewAPI.as_view(), name='current-user'),
	path('login/', views.LoginViewAPI.as_view(), name='api_login'),
	path('register/', views.registerViewAPI.as_view(), name='api_login'),
	path('logout/', views.LogoutViewAPI.as_view(), name='api_login'),
	path('42client/', views.Client42ViewAPI.as_view(), name='api_login'),
    path('42callback/', views.callback_42, name='42callback'),
    path('42sync/', views.sync_42, name='42sync'),
	
]
