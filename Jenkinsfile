
pipeline {
    agent any

    environment {
        REGISTRY_HOST = 'docker.io'
        // Replace with your actual Docker Hub username.
        IMAGE_REPOSITORY = 'arun2330/todo-app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Unit Tests') {
            steps {
                sh '''
                    set -eu
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app \
                      node:20-alpine \
                      sh -c 'if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm test -- --runInBand'
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    env.IMAGE = "${env.REGISTRY_HOST}/${env.IMAGE_REPOSITORY}:${env.BUILD_NUMBER}"
                }

                sh '''
                    set -eu
                    docker build -t "$IMAGE" .
                '''
            }
        }

        stage('End-to-End Tests') {
            steps {
                sh '''
                    set -eu
                    docker rm -f todo-e2e >/dev/null 2>&1 || true
                    docker run -d --name todo-e2e \
                      -p 3100:3000 "$IMAGE"
                '''

                script {
                    try {
                        sh '''
                            set -eu
                            ready=false

                            for i in $(seq 1 30); do
                                if curl -fsS http://localhost:3100/health >/dev/null; then
                                    ready=true
                                    break
                                fi
                                sleep 2
                            done

                            if [ "$ready" != true ]; then
                                docker logs todo-e2e
                                echo "Application did not become ready"
                                exit 1
                            fi
                        '''

                        sh '''
                            set -eu
                            docker run --rm \
                              --add-host=host.docker.internal:host-gateway \
                              -e BASE_URL=http://host.docker.internal:3100 \
                              -v "$WORKSPACE:/app" \
                              -w /app \
                              node:20-alpine \
                              sh -c 'if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm run test:e2e'
                        '''
                    } finally {
                        sh 'docker rm -f todo-e2e >/dev/null 2>&1 || true'
                    }
                }
            }
        }

        stage('Push Image') {
            when {
                expression { isMainBranch() }
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-registry',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    sh '''
                        set -eu
                        echo "$DOCKER_PASSWORD" |
                          docker login "$REGISTRY_HOST" \
                            --username "$DOCKER_USER" --password-stdin
                        docker push "$IMAGE"
                        docker logout "$REGISTRY_HOST"
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression { isMainBranch() }
            }
            steps {
                withCredentials([
                    file(
                        credentialsId: 'kubeconfig',
                        variable: 'KUBECONFIG_FILE'
                    )
                ]) {
                    sh '''
                        set -eu
                        sed "s|__IMAGE__|$IMAGE|g" \
                          k8s/deployment.yaml \
                          > k8s/deployment.rendered.yaml

                        export KUBECONFIG="$KUBECONFIG_FILE"

                        kubectl apply -f k8s/deployment.rendered.yaml
                        kubectl rollout status deployment/todo-app \
                          --timeout=180s
                        kubectl get deployments
                        kubectl get pods
                        kubectl get services
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker rm -f todo-e2e >/dev/null 2>&1 || true'
            echo 'Pipeline finished. Check the stage results above.'
        }
    }
}

def isMainBranch() {
    return env.BRANCH_NAME == 'main' ||
           env.GIT_BRANCH == 'main' ||
           env.GIT_BRANCH == 'origin/main'
}
