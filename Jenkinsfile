pipeline {
    agent any

    environment {
        FRONTEND_DIR = "frontend"
        BACKEND_DIR = "backend"
        API_URL="http://43.204.36.137:5000"
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
                dir("${BACKEND_DIR}") {
                    sh '''
                        python3 -m venv venv
                        . venv/bin/activate
                        pip install -r requirements.txt
                    '''
                }
            }
        }

        stage('Deploy Flask') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh '''
                        sudo -u ubuntu pm2 delete flask-app || true
                        sudo -u ubuntu pm2 start ./venv/bin/python --name flask-app -- app.py
                    '''
                }
            }
        }


       stage('Deploy Express') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh '''
                        echo "API_URL=${API_URL}" > .env
                        sudo -u ubuntu pm2 restart express-app || \
                        sudo -u ubuntu pm2 start server.js --name express-app
                    '''
                }
            }
        }

    }
}
