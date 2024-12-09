# Generated by Django 5.0.6 on 2024-12-09 16:00

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0012_remove_match_tournamentmatch'),
        ('tournament', '0025_delete_matchdemerde'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournamentmatch',
            name='match',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tournament_match', to='pong.match'),
        ),
        migrations.AlterField(
            model_name='tournamentmatch',
            name='round',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='tournament_matches', to='tournament.round'),
        ),
    ]
