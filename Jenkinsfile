pipeline {
    agent any

    environment {
        // Replace this with your actual GitHub username
        GITHUB_USER = 'vedantkhursange'
        DOCKER_REGISTRY = 'ghcr.io'
        IMAGE_NAME = "${DOCKER_REGISTRY}/${GITHUB_USER}/orangy-backend"
        FRONTEND_IMAGE_NAME = "${DOCKER_REGISTRY}/${GITHUB_USER}/orangy-frontend"
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

        stage('Detect Changes') {
            steps {
                script {
                    // Build only what changed; build everything on the first run
                    def changed = sh(script: "git diff --name-only HEAD~5 HEAD 2>/dev/null || echo all", returnStdout: true).trim()
                    env.BUILD_BACKEND = (changed == 'all' || changed.contains('orangy-backend/')) ? 'true' : 'false'
                    env.BUILD_FRONTEND = (changed == 'all' || changed.contains('frontend/')) ? 'true' : 'false'
                    echo "Backend build: ${env.BUILD_BACKEND} | Frontend build: ${env.BUILD_FRONTEND}"
                }
            }
        }

        stage('Backend Build & Test') {
            when { environment name: 'BUILD_BACKEND', value: 'true' }
            steps {
                dir('orangy-backend') {
                    sh 'mvn clean package -DskipTests'
                    // In a real scenario, you'd run tests: sh 'mvn test'
                }
            }
        }

        stage('Backend Docker Build') {
            when { environment name: 'BUILD_BACKEND', value: 'true' }
            steps {
                dir('orangy-backend') {
                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                    sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:${BRANCH_NAME}-latest"
                }
            }
        }

        stage('Frontend Docker Build') {
            when { environment name: 'BUILD_FRONTEND', value: 'true' }
            steps {
                dir('frontend') {
                    // Multi-stage Dockerfile runs npm ci + next build inside the image
                    sh "docker build -t ${FRONTEND_IMAGE_NAME}:${IMAGE_TAG} ."
                    sh "docker tag ${FRONTEND_IMAGE_NAME}:${IMAGE_TAG} ${FRONTEND_IMAGE_NAME}:${BRANCH_NAME}-latest"
                }
            }
        }

        stage('Docker Push') {
            when {
                anyOf {
                    environment name: 'BUILD_BACKEND', value: 'true'
                    environment name: 'BUILD_FRONTEND', value: 'true'
                }
            }
            steps {
                // Ensure you have a Jenkins credential named 'github-ghcr-token' of type Username with Password
                withCredentials([usernamePassword(credentialsId: 'github-ghcr-token', passwordVariable: 'GITHUB_TOKEN', usernameVariable: 'GITHUB_USERNAME')]) {
                    sh "echo \$GITHUB_TOKEN | docker login ${DOCKER_REGISTRY} -u \$GITHUB_USERNAME --password-stdin"
                    script {
                        if (env.BUILD_BACKEND == 'true') {
                            sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                            sh "docker push ${IMAGE_NAME}:${BRANCH_NAME}-latest"
                        }
                        if (env.BUILD_FRONTEND == 'true') {
                            sh "docker push ${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"
                            sh "docker push ${FRONTEND_IMAGE_NAME}:${BRANCH_NAME}-latest"
                        }
                    }
                }
            }
        }

        stage('Update Manifests Repo') {
            when {
                anyOf {
                    environment name: 'BUILD_BACKEND', value: 'true'
                    environment name: 'BUILD_FRONTEND', value: 'true'
                }
            }
            steps {
                // Ensure you have Jenkins credential 'github-pat' for cloning/pushing the manifests repo
                withCredentials([usernamePassword(credentialsId: 'github-pat', passwordVariable: 'GITHUB_TOKEN', usernameVariable: 'GITHUB_USERNAME')]) {
                    sh '''
                    rm -rf orangy-k8s-manifests-ci
                    git clone https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/orangy-k8s-manifests.git orangy-k8s-manifests-ci
                    cd orangy-k8s-manifests-ci
                    git config user.email "jenkins@orangy.com"
                    git config user.name "Jenkins CI"

                    # Determine which overlay to update based on branch
                    if [ "$BRANCH_NAME" = "main" ]; then
                        OVERLAY="prod"
                    else
                        OVERLAY="dev"
                    fi

                    cd overlays/${OVERLAY}
                    if [ "$BUILD_BACKEND" = "true" ]; then
                        kustomize edit set image backend-image=${IMAGE_NAME}:${IMAGE_TAG}
                    fi
                    if [ "$BUILD_FRONTEND" = "true" ]; then
                        kustomize edit set image frontend-image=${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}
                    fi

                    git commit -am "Update image tags to ${IMAGE_TAG} by Jenkins" || echo "No changes to commit"
                    git push origin main
                    '''
                }
            }
        }
    }
}
