# Generated by Django 5.0.6 on 2024-12-09 14:19

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0006_match_status'),
        ('tournament', '0016_remove_tournamentmatch_player1_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tournamentmatch',
            name='match',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tournament_match', to='pong.match'),
        ),
    ]