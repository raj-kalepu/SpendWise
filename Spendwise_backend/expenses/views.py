from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Transaction, Budget, Loan
from .serializers import TransactionSerializer, BudgetSerializer, LoanSerializer

# --- Data Management ViewSets ---
# ModelViewSets provide CRUD operations (List, Create, Retrieve, Update, Destroy) automatically.

class TransactionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows transactions to be viewed or edited.
    Only allows access to transactions owned by the authenticated user.
    """
    serializer_class = TransactionSerializer
    permission_classes = [permissions.AllowAny]

    # Get only transactions belonging to the current user
    def get_queryset(self):
        return Transaction.objects.all().order_by('-date', '-created_at')

    # Assign the current user to the transaction when creating
    def perform_create(self, serializer):
        serializer.save()

class BudgetViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows budgets to be view ed or edited.
    Only allows access to budgets owned by the authenticated user.
    """
    serializer_class = BudgetSerializer
    permission_classes = [permissions.AllowAny]

    # Get only budgets belonging to the current user
    def get_queryset(self):
        return Budget.objects.all().order_by('category')

    # Assign the current user to the budget when creating
    def perform_create(self, serializer):
        serializer.save()

class LoanViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows loans to be viewed or edited.
    Only allows access to loans owned by the authenticated user.
    """
    serializer_class = LoanSerializer
    permission_classes = [permissions.AllowAny]

    # Get only loans belonging to the current user
    def get_queryset(self):
        return Loan.objects.all().order_by('due_date', 'paid')

    # Assign the current user to the loan when creating
    def perform_create(self, serializer):
        serializer.save()
