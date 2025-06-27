# SpendWise: Your Personal Finance Tracker

SpendWise is a simple yet effective web application designed to help you manage your personal finances. It allows you to track your income and expenses, set budgets, manage loans, and gain insights into your spending habits.

The project is built with a clear separation between its user interface (frontend) and its data management (backend).

## Project Components

### 1. Frontend (User Interface)

* **Technology:** Built using **HTML, CSS (Tailwind CSS), and JavaScript**.
* **Purpose:** This is what you see and interact with in your web browser. It provides a user-friendly dashboard to:
    * **Track Transactions:** Record your income and expenses with details like type, description, category, amount, and date.
    * **Manage Budgets:** Set spending limits for different categories to help you stay within your financial goals.
    * **Handle Loans:** Keep track of money you've lent or borrowed, including due dates and payment status.
    * **Visualize Data:** See your financial health at a glance with charts showing your expenses by category and monthly trends.
    * **Export Data:** Download your transaction data for further analysis.
* **Deployment:** The frontend is deployed on **Vercel**, making it easily accessible online.

### 2. Backend (Data Management & API)

* **Technology:** Developed with **Django (Python web framework)**.
* **Purpose:** This acts as the "brain" of the application. It's responsible for:
    * **Storing Data:** Securely saves all your transaction, budget, and loan information in a database.
    * **Providing an API (Application Programming Interface):** Acts as a bridge between the frontend and the database. When you interact with the frontend (e.g., add a transaction), the frontend sends a request to the backend's API, which then processes the request and updates or retrieves data from the database.
    * **Handling Logic:** Manages the rules and operations for your financial data.
* **Deployment:** The backend is deployed on **Render**, providing a reliable server to run your Django application.

## How They Work Together

The Frontend (Vercel) communicates with the Backend (Render) using HTTP requests (like GET, POST, PUT, DELETE) to send and receive data. For example:

* When you view your transactions, the frontend sends a `GET` request to the backend's `/api/transactions/` endpoint.
* When you add a new transaction, the frontend sends a `POST` request with the transaction details to the same endpoint.

This separation ensures that the application is scalable, maintainable, and robust.

## Getting Started

To run this project locally or understand its structure:

1.  **Backend Setup:** Follow the instructions in the Django backend repository to set up and run the API.
2.  **Frontend Setup:** Follow the instructions in the frontend repository to run the user interface.
3.  **Connect:** Ensure the `BASE_URL` in the frontend's `script.js` file points to your deployed backend API (or `http://localhost:8000` if running locally).

SpendWise helps you take control of your money with a clear and functional interface!
