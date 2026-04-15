pipeline {
    agent any

    environment {
        IMAGE_NAME = "ai-notes-generator"
        CONTAINER_NAME = "ai-notes-container"
        REGISTRY = "docker.io"
        TAG = "${BUILD_NUMBER}"
        TIMESTAMP = sh(script: "date +%Y%m%d_%H%M%S", returnStdout: true).trim()
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📦 Checking out from GitHub..."
                git branch: 'main', 
                    url: 'https://github.com/Sam717-gg/Ai-notes-generator-app.git'
            }
        }

        stage('Verify Setup') {
            steps {
                echo "✅ Verifying Docker and Node.js are available..."
                sh '''
                    docker --version
                    node --version
                    npm --version
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🔨 Building Docker image: ${IMAGE_NAME}:${TAG}..."
                sh '''
                    docker build \
                        --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
                        --build-arg VCS_REF=$(git rev-parse --short HEAD) \
                        -t ${IMAGE_NAME}:${TAG} \
                        -t ${IMAGE_NAME}:latest \
                        .
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo "🚀 Deploying container..."
                sh '''
                    # Stop existing container (ignore if not running)
                    docker stop ${CONTAINER_NAME} 2>/dev/null || true
                    
                    # Remove existing container
                    docker rm ${CONTAINER_NAME} 2>/dev/null || true
                    
                    # Run new container
                    docker run -d \
                        -p 3000:3000 \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -e NODE_ENV=production \
                        ${IMAGE_NAME}:${TAG}
                    
                    # Wait for container to be healthy
                    sleep 3
                    echo "Checking container status..."
                    docker ps -f name=${CONTAINER_NAME}
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                echo "🔍 Verifying deployment..."
                sh '''
                    CONTAINER_STATUS=$(docker ps --filter="name=${CONTAINER_NAME}" --format="{{.Status}}")
                    if [ -z "$CONTAINER_STATUS" ]; then
                        echo "❌ Container failed to start!"
                        docker logs ${CONTAINER_NAME}
                        exit 1
                    fi
                    echo "✅ Container running: $CONTAINER_STATUS"
                '''
            }
        }

        stage('Cleanup') {
            steps {
                echo "🧹 Cleaning up unused Docker resources..."
                sh '''
                    docker image prune -f --filter "until=72h"
                    docker system prune -f
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Deployment Successful!"
            echo "🌐 Application available at: http://localhost:3000"
        }

        failure {
            echo "❌ Pipeline Failed!"
            sh '''
                echo "Container logs:"
                docker logs ${CONTAINER_NAME} || echo "Container not found"
            '''
        }

        cleanup {
            echo "Cleanup: Build ${BUILD_NUMBER} completed"
        }
    }
}
