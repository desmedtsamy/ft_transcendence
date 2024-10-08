# Generated by Django 5.0.6 on 2024-09-02 10:15

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tournament', '0007_alter_round_matches_alter_tournament_players_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tournament',
            name='rounds',
        ),
        migrations.RemoveField(
            model_name='tournamentmatch',
            name='tournament',
        ),
        migrations.RemoveField(
            model_name='round',
            name='matches',
        ),
        migrations.AddField(
            model_name='round',
            name='matches',
            field=models.ForeignKey(default=2, on_delete=django.db.models.deletion.CASCADE, related_name='round', to='tournament.tournamentmatch'),
            preserve_default=False,
        ),
    ]
