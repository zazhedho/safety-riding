# Workshop Management System

A web application to manage workshop operations, including bookings, work orders, customers, and vehicles.

## Features

*   User Management (Register, Login, Logout)
*   Vehicle Management (CRUD)
*   Service Management (CRUD)
*   Booking Management
*   Work Order Management
*   Role-based authentication and authorization

## Tech Stack

*   **Backend:** Go (Gin, GORM)
*   **Frontend:** React
*   **Database:** PostgreSQL
*   **Migrations:** golang-migrate
*   **Containerization:** Docker

## Getting Started

### Prerequisites

*   Go 1.16+
*   Node.js 14+
*   PostgreSQL 13+
*   Docker (optional)

### Installation

**Backend**

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/workshop-management.git
    cd workshop-management
    ```
2.  Install Go dependencies:
    ```sh
    go mod tidy
    ```
3.  Copy the `.env.example` file to `.env` and fill in the required environment variables (e.g., database credentials).
4.  Run the database migrations:
    ```sh
    migrate -database "postgres://user:password@localhost:5432/database_name?sslmode=disable" -path migrations up
    ```
5.  Start the backend server:
    ```sh
    go run main.go
    ```

**Frontend**

1.  Navigate to the frontend directory:
    ```sh
    cd frontend
    ```
2.  Install Node.js dependencies:
    ```sh
    npm install
    ```
3.  Start the React development server:
    ```sh
    npm start
    ```

### Docker

You can also run the application using Docker:

1.  Build the Docker image:
    ```sh
    docker build -t workshop-management .
    ```
2.  Run the Docker container:
    ```sh
    docker run -p 8080:8080 workshop-management
    ```

## API Endpoints

Here is an overview of the available API endpoints:

*   `GET /healthcheck`: Check the service's health.
*   `GET /swagger/*any`: Swagger API documentation.

**Users**

*   `POST /api/user/register`: Register a new user.
*   `POST /api/user/login`: Log in a user.
*   `POST /api/user/logout`: Log out a user.
*   `GET /api/user`: Get the authenticated user.
*   `GET /api/user/:id`: Get a user by ID.
*   `PUT /api/user`: Update the authenticated user.
*   `PUT /api/user/change/password`: Change the user's password.
*   `DELETE /api/user`: Delete the authenticated user.
*   `GET /api/users`: Get all users.

**Vehicles**

*   `GET /api/vehicles`: Get all vehicles.
*   `POST /api/vehicle`: Create a new vehicle.
*   `GET /api/vehicle/:id`: Get a vehicle by ID.
*   `PUT /api/vehicle/:id`: Update a vehicle.
*   `DELETE /api/vehicle/:id`: Delete a vehicle.

**Services**

*   `GET /api/services`: Get all services.
*   `POST /api/service`: Create a new service.
*   `GET /api/service/:id`: Get a service by ID.
*   `PUT /api/service/:id`: Update a service.
*   `DELETE /api/service/:id`: Delete a service.

**Bookings**

*   `GET /api/bookings`: Get all bookings.
*   `POST /api/booking`: Create a new booking.
*   `GET /api/booking/:id`: Get a booking by ID.
*   `PUT /api/booking/:id/status`: Update a booking's status.

**Work Orders**

*   `GET /api/workorders`: Get all work orders.
*   `POST /api/workorder/from-booking/:id`: Create a work order from a booking.
*   `GET /api/workorder/:id`: Get a work order by ID.
*   `PUT /api/workorder/:id/assign-mechanic`: Assign a mechanic to a work order.
*   `PUT /api/workorder/:id/status`: Update a work order's status.
