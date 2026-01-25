pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    environment {
        PNPM_HOME = "${WORKSPACE}/.pnpm-home"
        PATH = "${env.WORKSPACE}/node_modules/.bin:${env.PATH}"
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
                sh 'chmod +x apps/api-service/mvnw'
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
