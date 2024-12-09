# NX WEB TEMPLATE

## Description

This is an **Nx TypeScript Web Development Template** designed for seamless project development and scalability.

-   **Backend**: Powered by **NestJS**, offering a robust and modular server-side architecture.
-   **Frontend**: Built with **React**, providing a modern and dynamic client experience.
-   **Structure**: Organized into clearly defined apps:
    -   **Server**: The backend application.
    -   **Client**: The frontend application.
-   **Libraries**: Includes shared **TypeScript**, **React**, and **NestJS** libraries for reusability and consistency across the project.
-   **Usage**: Ideal for **junior developers** prototyping new projects.

To explore specific configurations, refer to the options selected during Nx command executions.

---

## Step by step

This step-by-step guide sets up an Nx monorepo with a NestJS server, a React client, and shared libraries for a structured development environment. Here's a breakdown:

### Explanation of Steps:

1. **Change Directory:**

    - Navigate to the directory where you want to create your Nx workspace.

    ```bash
    cd C:\\atari-monk\\code
    ```

2. **Create Nx Workspace:**

    - Creates a new Nx workspace configured for NestJS with a server application named `server`.

    ```bash
    npx create-nx-workspace@latest nx-web-test --preset=nest --appName=server --ci=skip --formatter=prettier --e2eTestRunner=none --docker=false
    ```

    Then navigate to the workspace directory:

    ```bash
    cd nx-web-test
    ```

3. **Install Nx Plugins:**

    - Adds Nx plugins for React, JavaScript, and NestJS development.

    ```bash
    npm install --save-dev @nx/react @nx/js @nx/nest
    ```

    Verify installation:

    ```bash
    npm list
    ```

4. **Generate React Client:**

    - Generates a React app in the `apps/client` folder using Vite, without routing or E2E tests.

    ```bash
    nx generate @nx/react:app apps/client --style=styled-jsx --routing=false --bundler=vite --linter=eslint --unitTestRunner=vitest --e2eTestRunner=none
    ```

5. **Generate NestJS Library:**

    - Creates a NestJS library for shared logic between the server and other services.

    ```bash
    nx g @nx/nest:library packages/shared-nest
    ```

6. **Generate TypeScript Library:**

    - Adds a shared TypeScript library for general reusable logic and types.

    ```bash
    nx generate @nx/js:library packages/shared --style=styled-jsx --linter=eslint --unitTestRunner=vitest --bundler=vite
    ```

7. **Generate React Library:**

    - Creates a library for reusable UI components in the React app.

    ```bash
    nx g @nx/react:lib packages/shared-ui --style none --bundler=vite --linter=eslint --unitTestRunner=vitest
    ```

---

These steps will set up a modular Nx workspace for a full-stack project.

---

## Script for automation

```powershell
# nx_web_template.ps1

# Step 1: Prompt for the target directory
$defaultDir = Get-Location
$targetDir = Read-Host "Enter the directory where the NX workspace should be created (default: $defaultDir)"

# Use the default directory if no input is given
if (-not $targetDir) {
    $targetDir = $defaultDir
}

# Step 2: Ensure the target directory exists
if (-not (Test-Path $targetDir)) {
    Write-Host "Directory $targetDir does not exist. Creating it..."
    New-Item -ItemType Directory -Path $targetDir
}

# Step 3: Prompt for the workspace name
$workspaceName = Read-Host "Enter the workspace name (default: nx-web-test)"
if (-not $workspaceName) {
    $workspaceName = "nx-web-test"  # Default workspace name if nothing is entered
}

# Step 4: Change to the target directory
Set-Location -Path $targetDir
Write-Host "Changing directory to $targetDir..."

# Step 5: Create the NX workspace with the dynamic workspace name
Write-Host "Creating NX workspace $workspaceName..."
npx create-nx-workspace@latest $workspaceName --preset=nest --appName=server --ci=skip --formatter=prettier --e2eTestRunner=none --docker=false

# Step 6: Move into the newly created project directory
Set-Location -Path "$targetDir\$workspaceName"

# Step 7: Install NX plugins as devDependencies
Write-Host "Installing NX plugins as dev dependencies..."
npm install --save-dev @nx/react @nx/js @nx/nest

# Step 8: Generate the necessary apps and libraries
Write-Host "Generating apps and libraries..."
nx generate @nx/react:app apps/client --style=styled-jsx --routing=false --bundler=vite --linter=eslint --unitTestRunner=vitest --e2eTestRunner=none
nx g @nx/nest:library packages/shared-nest
nx generate @nx/js:library packages/shared --style=styled-jsx --linter=eslint --unitTestRunner=vitest --bundler=vite
nx g @nx/react:lib packages/shared-ui --style none --bundler=vite --linter=eslint --unitTestRunner=vitest

Write-Host "Setup completed successfully!"
```
