from django.db import models

# Represents a financial transaction (income or expense)
class Transaction(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    type = models.CharField(max_length=10, choices=[('Income', 'Income'), ('Expense', 'Expense')])
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True) # Automatically set when created

    class Meta:
        ordering = ['-date', '-created_at'] # Default ordering for transactions

    def __str__(self):
        return f"{self.type} - {self.description} ({self.amount})"

# Represents a budget set for a specific category
class Budget(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='budgets')
    category = models.CharField(max_length=100, unique=False) # Not unique globally, unique per user
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['category']

    def __str__(self):
        return f"Budget for {self.category}: {self.amount}"

# Represents a loan or debt
class Loan(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='loans')
    lender = models.CharField(max_length=255) # Who borrowed from or lent to
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    paid = models.BooleanField(default=False) # True if the loan is settled
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date', 'paid'] # Order by due date, then by paid status

    def __str__(self):
        status = "Paid" if self.paid else "Pending"
        return f"Loan with {self.lender} ({self.amount}) - {status}"
