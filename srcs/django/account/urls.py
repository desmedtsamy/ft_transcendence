# account/urls.py
from django.urls import path, include
from . import views

app_name = 'account'

urlpatterns = [

	path('current-user/', views.CurrentUserViewAPI.as_view(), name='current-user'),
	path('register/', views.registerViewAPI.as_view(), name='api_login'),
	path('login/', views.LoginViewAPI.as_view(), name='api_login'),
	path('logout/', views.LogoutViewAPI.as_view(), name='api_login'),
	path('42client/', views.Client42ViewAPI.as_view(), name='api_login'),
    path('42callback/', views.callback_42, name='42callback'),
    path('42sync/', views.sync_42, name='42sync'),
    path('settings/', views.UserSettingsView.as_view(), name='register'),
	path('search/', views.SearchUsersAPIView.as_view(), name='search_users_api'),
	path('profile/<str:username>/', views.UserProfileView.as_view(), name='user_profile_api'),
    path('friends/<int:user_id>/', views.UserFriendsListView.as_view(), name='user_friends_list_api'),
    path('matches/<str:username>/', views.UserMatchesListView.as_view(), name='user_matches_list_api'),
	path('friend-requests/<int:user_id>/send/',views.SendFriendRequestView.as_view(), name='send_friend_request_api'),
    path('friend-requests/<int:user_id>/cancel/',views.RemoveFriendRequestView.as_view(), name='cancel_friend_request_api'),
	path('friend-requests/<int:user_id>/accept/',views.AcceptFriendRequestView.as_view(), name='accept_friend_request_api'),
	path('friend-requests/<int:user_id>/reject/',views.RejectFriendRequestView.as_view(), name='reject_friend_request_api'),

]
