
pipeline {
    agent any

    environment {
        REGISTRY_HOST = 'docker.io'

        // Replace with your Docker Hub username/repository.
        IMAGE_REPOSITORY = 'YOUR_DOCKERHUB_USERNAME/todo-app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Unit Tests') {
            steps {
                bat '''
                    docker run --rm ^
                      -v "%WORKSPACE%:/app" ^
                      -w /app ^
                      node:20-alpine ^
                      sh -c "npm install && npm test"
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    env.IMAGE = "${env.REGISTRY_HOST}/${env.IMAGE_REPOSITORY}:${env.BUILD_NUMBER}"
                }

                bat '''
                    docker build -t "%IMAGE%" .
                '''
            }
        }

        stage('End-to-End Tests') {
            steps {
                bat '''
                    docker rm -f todo-e2e 2>NUL
                    docker run -d --name todo-e2e -p 3100:3000 "%IMAGE%"
                '''

                script {
                    try {
                        // Wait for the app to become healthy.
                        powershell '''
                            $ready = $false

                            for ($i = 0; $i -lt 30; $i++) {
                                try {
                                    $response = Invoke-RestMethod `
                                        -Uri "http://localhost:3100/health" `
                                        -TimeoutSec 2

                                    if ($response.status -eq "ok") {
                                        $ready = $true
                                        break
                                    }
                                } catch {
                                    Start-Sleep -Seconds 2
                                }
                            }

                            if (-not $ready) {
                                docker logs todo-e2e
                                throw "Application did not become healthy"
                            }
                        '''

                        bat '''
                            docker run --rm ^
                              -e BASE_URL=http://host.docker.internal:3100 ^
                              -v "%WORKSPACE%:/app" ^
                              -w /app ^
                              node:20-alpine ^
                              sh -c "npm install && npm run test:e2e"
                        '''
                    } finally {
                        bat 'docker rm -f todo-e2e 2>NUL'
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
                    bat '''
                        echo %DOCKER_PASSWORD% | docker login %REGISTRY_HOST% -u %DOCKER_USER% --password-stdin
                        if errorlevel 1 exit /b 1

                        docker push "%IMAGE%"
                        if errorlevel 1 exit /b 1

                        docker logout %REGISTRY_HOST%
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
                    script {
                        // Render the manifest with the exact image built above.
                        powershell '''
                            $yaml = Get-Content "k8s/deployment.yaml" -Raw
                            $yaml = $yaml.Replace("__IMAGE__", $env:IMAGE)
                            Set-Content -Path "k8s/deployment.rendered.yaml" `
                                -Value $yaml -Encoding ascii
                        '''

                        bat '''
                            set "KUBECONFIG=%KUBECONFIG_FILE%"
                            kubectl apply -f k8s/deployment.rendered.yaml
                            if errorlevel 1 exit /b 1

                            kubectl rollout status deployment/todo-app --timeout=180s
                            if errorlevel 1 exit /b 1

                            kubectl get deployments
                            kubectl get pods
                            kubectl get services
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            bat 'docker rm -f todo-e2e 2>NUL'
            echo 'Pipeline finished. Check the stage results above.'
        }
    }
}

def isMainBranch() {
    return env.BRANCH_NAME == 'main' ||
           env.GIT_BRANCH == 'main' ||
           env.GIT_BRANCH == 'origin/main'
}
