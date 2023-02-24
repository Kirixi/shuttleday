pipeline {

    agent any

    tools {
        nodejs 'nodejs'
    }

    environment {
        ENV_VARS     = credentials('shuttleday-env-file')
        scannerHome = tool 'SonarQubeScanner'
    }

    stages {
        stage("SonarQube Analysis") {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner';
                    withSonarQubeEnv() {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
          }
        
        stage ("Build Backend") {
            when { anyOf { changeset "bdlist-backend/**/*"; changeset "Jenkinsfile"} }
            steps {
                dir("bdlist-backend/") {
                    sh 'pnpm i'
                    sh 'pnpm build'
                }
            }
        }
        stage("Deploy changes") {
            when { anyOf { changeset "bdlist-backend/**/*"; changeset "Jenkinsfile"} }
            steps {
                dir("bdlist-backend/") {
                    sh 'sudo docker compose --env-file $ENV_VARS up --build -d'
                }
            }
        }
        
        stage ("Build Frontend") {
            when { anyOf { changeset "bdlist-frontend/**/*"; changeset "Jenkinsfile"} }
            steps {
                sh 'echo hi'
            }
        }
    }
}