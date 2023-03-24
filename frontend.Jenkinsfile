pipeline {

    agent any

    tools {
        nodejs 'nodejs'
    }

    environment {
        CLIENT_ID = credentials('REACT_APP_CLIENT_ID')
        API_URL = credentials('REACT_APP_API_LINK')
    }

    stages {
        stage("Install Dependencies") {
            when { anyOf { changeset "bdlist-frontend/**/*"; changeset "Jenkinsfile"} }
            steps {
                dir("bdlist-frontend/") {
                    sh 'npm i'
                }
            }
        }
        stage("Build Static Site") {
            when { anyOf { changeset "bdlist-frontend/**/*"; changeset "Jenkinsfile"} }
            steps {
                dir("bdlist-frontend/") {
                    sh 'REACT_APP_CLIENT_ID=$CLIENT_ID REACT_APP_API_LINK=$API_URL  npm run build'
                }
            }
        }
        stage("Deploy to S3 Bucket") {
            when { anyOf { changeset "bdlist-frontend/**/*"; changeset "Jenkinsfile"} }
            steps {
                dir("bdlist-frontend/") {
                    sh 'aws s3 cp build s3://shuttleday.info --recursive'
                }
            }
          }
}