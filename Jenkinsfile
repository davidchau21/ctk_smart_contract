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
                // Nạp credentials 'ctk_contract' (dạng Secret Text chứa nội dung file .env) và ghi thành file .env
                withCredentials([string(credentialsId: 'ctk_contract', variable: 'ENV_CONTENT')]) {
                    sh """
                        # Ghi nội dung bảo mật từ credential vào file .env
                        echo "\$ENV_CONTENT" > .env
                        
                        # Chạy script deploy lên Sepolia
                        npx hardhat run scripts/deploy.ts --network sepolia
                    """
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
