pipeline {
    agent any

    environment {
        // Replace this with your actual GitHub username
        GITHUB_USER = 'vedantkhursange'
        DOCKER_REGISTRY = 'ghcr.io'
        IMAGE_NAME = "${DOCKER_REGISTRY}/${GITHUB_USER}/orangy-backend"
        // Short Git SHA for tagging images
        GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        BRANCH_NAME = env.BRANCH_NAME ?: 'dev' // 'dev' or 'main'
        IMAGE_TAG = "${BRANCH_NAME}-${GIT_SHA}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Build & Test') {
            steps {
                dir('orangy-backend') {
                    sh 'mvn clean package -DskipTests'
                    // In a real scenario, you'd run tests: sh 'mvn test'
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('orangy-backend') {
                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                    sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:${BRANCH_NAME}-latest"
                }
            }
        }

        stage('Docker Push') {
            steps {
                // Ensure you have a Jenkins credential named 'github-ghcr-token' of type Username with Password
                withCredentials([usernamePassword(credentialsId: 'github-ghcr-token', passwordVariable: 'GITHUB_TOKEN', usernameVariable: 'GITHUB_USERNAME')]) {
                    sh "echo \$GITHUB_TOKEN | docker login ${DOCKER_REGISTRY} -u \$GITHUB_USERNAME --password-stdin"
                    sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                    sh "docker push ${IMAGE_NAME}:${BRANCH_NAME}-latest"
                }
            }
        }

        stage('Update Manifests Repo') {
            steps {
                // Ensure you have Jenkins credential 'github-pat' for cloning/pushing the manifests repo
                withCredentials([usernamePassword(credentialsId: 'github-pat', passwordVariable: 'GITHUB_TOKEN', usernameVariable: 'GITHUB_USERNAME')]) {
                    sh '''
                    git clone https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/orangy-k8s-manifests.git
                    cd orangy-k8s-manifests
                    git config user.email "jenkins@orangy.com"
                    git config user.name "Jenkins CI"
                    
                    # Determine which overlay to update based on branch
                    if [ "$BRANCH_NAME" = "main" ]; then
                        OVERLAY="prod"
                    else
                        OVERLAY="dev"
                    fi
                    
                    cd overlays/${OVERLAY}
                    kustomize edit set image backend-image=${IMAGE_NAME}:${IMAGE_TAG}
                    
                    git commit -am "Update backend image tag to ${IMAGE_TAG} by Jenkins" || echo "No changes to commit"
                    git push origin main
                    '''
                }
            }
        }
    }
}
