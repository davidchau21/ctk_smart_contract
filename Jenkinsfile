pipeline {
    agent any

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

        stage('5. Deploy to Sepolia Testnet') {
            steps {
                echo "🚀 Đang chuẩn bị môi trường và deploy Smart Contracts..."
                // Sử dụng ID thực tế của file cấu hình trên Jenkins của bạn
                configFileProvider([configFile(fileId: 'ctk_contract', targetLocation: '.env')]) {
                    // Chạy script deploy lên Sepolia (Hardhat sẽ tự đọc file .env vừa được nạp)
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
