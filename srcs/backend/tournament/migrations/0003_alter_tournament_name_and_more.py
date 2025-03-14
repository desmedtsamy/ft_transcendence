# Generated by Django 5.0.6 on 2025-03-14 09:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tournament', '0002_tournamentmatch_winner_place'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tournament',
            name='name',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterUniqueTogether(
            name='tournament',
            unique_together={('name', 'selected_game')},
        ),
    ]
