# Generated by Django 5.0.6 on 2025-03-26 10:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0004_match_data'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='end_date',
            field=models.DateTimeField(null=True),
        ),
    ]
