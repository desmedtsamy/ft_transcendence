# Generated by Django 5.0.6 on 2024-12-03 16:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0004_rename_points_at_stake_match_score'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='match',
            name='duration',
        ),
    ]
