# Generated by Django 5.0.6 on 2024-06-10 12:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0005_user_is_admin_friendship_friendshiprequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='score',
            field=models.IntegerField(default=0),
        ),
    ]
