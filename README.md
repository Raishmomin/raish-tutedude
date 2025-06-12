# Deployment and CI/CD for Flask and Express on AWS EC2 with Jenkins

## 🔧 Environment Setup

- **EC2 Instance**: Ubuntu 22.04 (Free-tier eligible)
- **Public IP**: http://13.203.66.18
- **Applications**:
  - Flask running on port `http://13.203.66.18:5000/`
  - Express running on port `http://13.203.66.18:3000/`
- **Process Manager**: PM2
- **Screenshots**: Screenshots are stored in screenshot folder

---

## ⚙️ Application Deployment Steps

### EC2 Configuration

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Python & pip
sudo apt install python3-pip -y

# Install Node.js & npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install git -y

# Install PM2
sudo npm install -g pm2

# Cloning
git clone https://github.com/Raishmomin/raish-tutedude

# Flask
cd backend
python3 -m venv venv
 . venv/bin/activate
pip install -r requirements.txt
sudo -u ubuntu pm2 start ./venv/bin/python --name flask-app -- app.py

# Express
cd ..
cd frontend
npm install
echo "API_URL=http://13.203.66.18:5000/" > .env
sudo -u ubuntu pm2 start server.js --name express-app
```


###  Jenkins Installation

```bash

wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb http://pkg.jenkins.io/debian binary/ > \
    /etc/apt/sources.list.d/jenkins.list'
sudo apt install openjdk-17-jdk jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins

```

###  CI/CD pipeline setup

- **EC2 Instance**: Ubuntu 22.04 (Free-tier eligible)
- **Public IP**: http://3.6.126.176
- **Applications**:
  - Flask running on port `http://3.6.126.176:5000`
  - Express running on port `http://3.6.126.176:3000`
- **Process Manager**: PM2

## Install Required Jenkins Plugins

After installing and logging into Jenkins at `http://3.6.126.176:8080`, follow these steps to install the required plugins:

1. Click on **Manage Jenkins** from the left sidebar.
2. Go to **Manage Plugins**.
3. Switch to the **Available** tab.
4. Search for and install the following plugins:
   - **Pipeline**
   - **Git**
   - **NodeJS Plugin**
   - **Python Plugin**
5. After selecting them, click **Install without restart**.

---

### Create the Pipeline Job

1. From the Jenkins dashboard, click **New Item**.
2. Enter a name, e.g., `tutedude-frontend or tutedude-bakend`.
3. Select **Pipeline**, then click **OK**.

### Configure the Pipeline

1. Scroll down to the **Pipeline** section.
2. Set:
   - **Trigger**: `GitHub hook trigger for GITScm polling`
   - **SCM**: `Git`
   - **Repository URL**: `https://github.com/Raishmomin/raish-tutedude`
   - **Branch**: `master-frontend or master-backend` 
   - **Script Path**: `Jenkinsfile.frontend or jenkins.backend` 
