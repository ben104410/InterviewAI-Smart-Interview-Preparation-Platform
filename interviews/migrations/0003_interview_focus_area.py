from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("interviews", "0002_interview_is_followup_interview_parent_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="interview",
            name="focus_area",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
    ]