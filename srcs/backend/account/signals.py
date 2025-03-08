from django.contrib.auth.signals import user_logged_out
from django.dispatch import receiver

@receiver(user_logged_out)
def on_user_logged_out(sender, user, **kwargs):
    user.is_online = False
    user.save()
