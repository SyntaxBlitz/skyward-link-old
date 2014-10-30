from django.contrib import admin
from skyward_link.clicker.models import ShortLink

class ShortLinkAdmin(admin.ModelAdmin):
  pass
admin.site.register(ShortLink, ShortLinkAdmin)  
