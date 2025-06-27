from rest_framework import serializers
from .models import  Transaction, Budget, Loan


# Serializer for Transaction model
class TransactionSerializer(serializers.ModelSerializer):
    # Ensure 'id' is included in the output for frontend use
    id = serializers.ReadOnlyField() 
    
    class Meta:
        model = Transaction
        fields = ('id', 'type', 'description', 'category', 'amount', 'date', 'created_at') # 'user' will be handled by the view
        read_only_fields = ('created_at',)

# Serializer for Budget model
class BudgetSerializer(serializers.ModelSerializer):
    # Ensure 'id' is included in the output for frontend use
    id = serializers.ReadOnlyField()

    class Meta:
        model = Budget
        fields = ('id', 'category', 'amount') # 'user' will be handled by the view

# Serializer for Loan model
class LoanSerializer(serializers.ModelSerializer):
    # Ensure 'id' is included in the output for frontend use
    id = serializers.ReadOnlyField()

    class Meta:
        model = Loan
        fields = ('id', 'lender', 'amount', 'due_date', 'paid', 'created_at') # 'user' will be handled by the view
        read_only_fields = ('created_at',)
