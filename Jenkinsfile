pipeline {
    agent any

    environment {
        FRONTEND_DIR = "frontend"
        BACKEND_DIR = "backend"
    }

    stages {
        stage('Checkout') {
            steps {
                dir('.') {
                    git 'https://github.com/Raishmomin/raish-tutedude'
                }
            }
        }

        stage('Install Express Dependencies') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('Install Flask Dependencies') {
            steps {
                sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install -r requirements.txt
                    '''

            }
        }


        stage('Deploy Express') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'pm2 restart express-app || pm2 start server.js --name express-app'
                }
            }
        }

        stage('Deploy Flask') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh 'pm2 restart flask-app || pm2 start app.py --name flask-app'
                }
            }
        }
    }
}
