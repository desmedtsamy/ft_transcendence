# Generated by Django 5.0.6 on 2024-05-29 08:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0003_user_intra_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='intra_id',
            field=models.IntegerField(blank=True, null=True, unique=True),
        ),
    ]
