# Generated by Django 5.0.6 on 2024-12-09 15:44

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0010_alter_match_player1_alter_match_player2_and_more'),
        ('tournament', '0025_delete_matchdemerde'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='tournamentMatch',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='match', to='tournament.tournamentmatch'),
        ),
    ]
