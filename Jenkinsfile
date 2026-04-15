pipeline {
    agent any

    environment {
        IMAGE_NAME = "ai-notes-generator"
        CONTAINER_NAME = "ai-notes-container"
        TAG = "${BUILD_NUMBER}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out from GitHub..."
                git branch: 'main', 
                    url: 'https://github.com/Sam717-gg/Ai-notes-generator-app.git'
            }
        }

        stage('Verify Setup') {
            steps {
                echo "Verifying Docker and Node.js are available..."
                bat '''
                    @echo off
                    docker --version
                    node --version
                    npm --version
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image: ${IMAGE_NAME}:${TAG}..."
                bat '''
                    @echo off
                    docker build ^
                        -t %IMAGE_NAME%:%TAG% ^
                        -t %IMAGE_NAME%:latest ^
                        .
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo "Deploying container..."
                bat '''
                    @echo off
                    rem Stop existing container (ignore if not running)
                    docker stop %CONTAINER_NAME% >nul 2>&1

                    rem Remove existing container (ignore if not present)
                    docker rm %CONTAINER_NAME% >nul 2>&1

                    rem Run new container
                    docker run -d ^
                        -p 3000:3000 ^
                        --name %CONTAINER_NAME% ^
                        --restart unless-stopped ^
                        -e NODE_ENV=production ^
                        %IMAGE_NAME%:%TAG%

                    echo Checking container status...
                    docker ps --filter "name=%CONTAINER_NAME%"
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                echo "Verifying deployment..."
                bat '''
                    @echo off
                    set "CONTAINER_STATUS="
                    for /f "delims=" %%i in ('docker ps --filter "name=%CONTAINER_NAME%" --format "{{.Status}}"') do set "CONTAINER_STATUS=%%i"

                    if "%CONTAINER_STATUS%"=="" (
                        echo Container failed to start
                        docker logs %CONTAINER_NAME%
                        exit /b 1
                    )

                    echo Container running: %CONTAINER_STATUS%
                '''
            }
        }

        stage('Cleanup') {
            steps {
                echo "Cleaning up unused Docker resources..."
                bat '''
                    @echo off
                    docker image prune -f --filter "until=72h"
                    docker system prune -f
                '''
            }
        }
    }

    post {
        success {
            echo "Deployment successful"
            echo "Application available at: http://localhost:3000"
        }

        failure {
            echo "Pipeline failed"
            script {
                bat '''
                    @echo off
                    echo Container logs:
                    docker logs %CONTAINER_NAME% >nul 2>&1
                    if errorlevel 1 (
                        echo Container not found
                    ) else (
                        docker logs %CONTAINER_NAME%
                    )
                '''
            }
        }

        cleanup {
            echo "Cleanup: Build ${BUILD_NUMBER} completed"
        }
    }
}
