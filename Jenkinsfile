pipeline {
    agent any

    tools {
        // These names should match the tool names configured in your Jenkins Global Tool Configuration
        // Example: jdk 'jdk17', nodejs 'node20'
        // If tools are not configured, you can remove this block and ensure they are in the PATH.
        jdk 'jdk17'
        nodejs 'node20'
    }

    environment {
        // Ensure pnpm is available. If using the nodejs plugin, npm is usually available.
        PNPM_HOME = "${WORKSPACE}/.pnpm-home"
        PATH = "${env.WORKSPACE}/node_modules/.bin:${env.PATH}"
        
        // Build-time dummy environment variables to satisfy Next.js static generation
        NEXT_PUBLIC_URL_API = "http://localhost:8080/api/v1/grota-financiamentos"
        LOGISTA_SESSION_SECRET = "ci-dummy-secret-logista-1234567890"
        ADMIN_SESSION_SECRET = "ci-dummy-secret-admin-1234567890"
        LOGISTA_API_BASE_URL = "http://localhost:8080/api/v1/grota-financiamentos"
        ADMIN_API_BASE_URL = "http://localhost:8080/api/v1/grota-financiamentos"
        DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1/grota-financiamentos"
        ARCJET_KEY = "aj_ci_test_key"
        APIBRASIL_TOKEN = "ci_test_token"
        APIBRASIL_DEVICE_TOKEN_CPF = "ci_test_device_token"
        NEXT_PUBLIC_LOGISTA_PANEL_URL = "http://localhost:3001"
    }

    stages {
        stage('Environment Check') {
            steps {
                echo "Checking environment versions..."
                sh 'java -version'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Setup Pnpm') {
            steps {
                echo "Setting up pnpm..."
                // Install pnpm locally or check if it's global
                sh 'npm install -g pnpm@9'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "Installing monorepo dependencies..."
                sh 'pnpm install'
            }
        }

        stage('Build Apps') {
            steps {
                echo "Building all applications via Turborepo..."
                // Ensure Maven wrapper is executable for the api-service
                sh 'chmod +x apps/api-service/mvnw'
                
                // Run the global build script defined in the root package.json
                sh 'pnpm build'
            }
        }
    }

    post {
        always {
            echo "CI build finished."
        }
        success {
            echo "Build successful! All applications (admin-console, api-service, dealer-portal, public-site) were built."
        }
        failure {
            echo "Build failed. Please check the console output for errors."
        }
    }
}
