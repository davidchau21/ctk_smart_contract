pipeline {
    agent any

    tools {
        nodejs 'Node20' // Yêu cầu đã cấu hình Tool NodeJS 'Node20' trong Jenkins
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timeout(time: 10, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo "📦 Đang tải mã nguồn Smart Contracts..."
                checkout scm
            }
        }

        stage('2. Install Dependencies') {
            steps {
                echo "📥 Cài đặt thư viện phát triển Smart Contracts..."
                sh 'npm install'
            }
        }

        stage('3. Compile Contracts') {
            steps {
                echo "🔨 Biên dịch các Solidity Contracts..."
                sh 'npx hardhat compile'
            }
        }

        stage('4. Run Smart Contract Tests') {
            steps {
                echo "🧪 Chạy các bài kiểm thử tự động (Unit Tests)..."
                sh 'npx hardhat test'
            }
        }

        // Giai đoạn này chỉ chạy khi push lên nhánh main/master để deploy lên Testnet
        stage('5. Deploy to Sepolia Testnet') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo "🚀 Đang deploy Smart Contracts lên Sepolia Testnet..."
                // Cần cấu hình ví deployer trong Jenkins Credentials (Secret Text)
                // để tránh bị lộ Private Key trên Git
                withCredentials([string(credentialsId: 'sepolia-deployer-private-key', variable: 'PRIVATE_KEY')]) {
                    // Chạy script deploy của Hardhat
                    sh 'npx hardhat run scripts/deploy.ts --network sepolia'
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline Smart Contracts chạy THÀNH CÔNG!"
        }
        failure {
            echo "❌ Pipeline Smart Contracts THẤT BẠI!"
        }
    }
}
