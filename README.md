# Micro-Volunteer Platform

A full-stack application connecting users who need help with volunteers ready to offer their support. This platform facilitates the creation of tasks, allows volunteers to accept them, and manages the interaction between users and volunteers seamlessly.

## Key Features

*   **User Authentication:** Secure registration and login for both regular users and volunteers.
*   **Task Creation:** Users can post tasks, specifying the description, location, number of volunteers needed, and urgency.
*   **Volunteer Dashboard:** Volunteers can view a list of available tasks and accept the ones they are interested in.
*   **User Dashboard:** Users can see the tasks they have created and track the number of volunteers who have accepted.
*   **Real-time Updates:** The platform provides immediate feedback on actions like task creation and acceptance.

## Technologies Used

*   **Frontend:** React, Vite, TypeScript
*   **Backend:** Node.js, Express, MongoDB, Mongoose
*   **Routing:** React Router
*   **Development:** Concurrently (for running both servers), Nodemon (for backend hot-reloading)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your machine.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repository-name.git
    cd your-repository-name
    ```

2.  **Install root dependencies:**
    This will install the necessary packages for the frontend and the `concurrently` tool.
    ```sh
    npm install
    ```

3.  **Install server dependencies:**
    Navigate to the server directory and install its specific dependencies.
    ```sh
    cd server
    npm install
    cd ..
    ```

### Environment Variables

The backend server requires a `.env` file for configuration.

1.  Create a file named `.env` in the `server/` directory.
2.  Add the following environment variables to the file, replacing the placeholder with your MongoDB connection string:

    ```env
    MONGO_URI=mongodb+srv://<your-username>:<your-password>@<your-cluster-url>/<your-database-name>
    PORT=3000
    ```

### Running the Application

Once the installation is complete and the environment variables are set, you can start both the frontend and backend servers with a single command from the **root directory**:

```sh
npm start
```

This will:
*   Start the frontend Vite development server (usually on `http://localhost:5173`).
*   Start the backend Node.js server (on `http://localhost:3000`).

You can now open your browser and navigate to the frontend URL to use the application.
