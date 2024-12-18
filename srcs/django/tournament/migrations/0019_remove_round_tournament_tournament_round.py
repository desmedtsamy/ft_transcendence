# Generated by Django 5.0.6 on 2024-12-09 14:50

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tournament', '0018_alter_tournament_creator_alter_tournament_winner_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='round',
            name='tournament',
        ),
        migrations.AddField(
            model_name='tournament',
            name='Round',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='Rounds', to='tournament.round'),
        ),
    ]
