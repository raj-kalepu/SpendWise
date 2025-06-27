from django.contrib import admin

from .models import Transaction, Budget, Loan

# Register your other models with the admin site
admin.site.register(Transaction)
admin.site.register(Budget)
admin.site.register(Loan)
