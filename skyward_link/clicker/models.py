from django.db import models

class ShortLink(models.Model):
  short_name = models.CharField(max_length=40)
  long_link = models.CharField(max_length=256)
