# Generated by Django 5.0.6 on 2024-07-04 09:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0006_user_score'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='last_connection',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
    ]
