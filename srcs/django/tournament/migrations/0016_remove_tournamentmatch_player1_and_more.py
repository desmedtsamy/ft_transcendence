# Generated by Django 5.0.6 on 2024-12-03 14:32

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0001_initial'),
        ('tournament', '0015_tournament_is_finished_tournament_is_started'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tournamentmatch',
            name='player1',
        ),
        migrations.RemoveField(
            model_name='tournamentmatch',
            name='player2',
        ),
        migrations.RemoveField(
            model_name='tournamentmatch',
            name='score',
        ),
        migrations.RemoveField(
            model_name='tournamentmatch',
            name='winner',
        ),
        migrations.AddField(
            model_name='tournamentmatch',
            name='match',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tournament_match', to='pong.match'),
        ),
    ]
