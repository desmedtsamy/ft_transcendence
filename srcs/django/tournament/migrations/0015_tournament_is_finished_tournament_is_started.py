# Generated by Django 5.0.6 on 2024-12-02 19:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tournament', '0014_alter_tournament_players'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournament',
            name='is_finished',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='tournament',
            name='is_started',
            field=models.BooleanField(default=False),
        ),
    ]
