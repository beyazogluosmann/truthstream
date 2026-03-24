#  TruthStream - Real-Time Fake News Detection System

A real-time analytics platform that verifies news using **Multi-AI Consensus** with Kafka and Elasticsearch.

## 🤖 Multi-AI Verification

TruthStream uses **3 different AI models simultaneously** for fact-checking:
- **Groq (Llama 3.3 70B)** - Fast and reliable
- **Hugging Face (Mistral 7B)** - Open-source intelligence
- **Google Gemini Pro** - Advanced reasoning

### Why Multi-AI?
✅ **Higher Accuracy** - Multiple perspectives reduce bias  
✅ **Consensus Algorithm** - Weighted voting system  
✅ **Confidence Scoring** - Shows agreement level between models  
✅ **Fallback Protection** - Works even if one AI fails  
✅ **Cost Effective** - Uses only free tiers

##  Architecture
```
News Input → Kafka → Multi-AI Verification → Consensus → Elasticsearch → React Dashboard
                      ├─ Groq (40%)
                      ├─ Hugging Face (30%)
                      └─ Gemini (30%)
```

##  Tech Stack

- **Frontend:** React, Chart.js, Axios
- **Backend:** Node.js, Express
- **Message Queue:** Apache Kafka
- **Database:** Elasticsearch
- **Container:** Docker, Docker Compose

##  Requirements

- Docker Desktop (or Docker + Docker Compose)
- Node.js 18+ 
- npm or yarn

##  Installation

### 1. Start Docker Services
```bash
docker-compose up -d
```

This command starts:
- Kafka (port 9092)
- Zookeeper (port 2181)
- Elasticsearch (port 9200)

### 2. Verify Services are Running
```bash
# Check Elasticsearch
curl http://localhost:9200

# Check Kafka
docker logs kafka
```

### 3. Start News Generator
```bash
cd news-generator
npm install
npm start
```

### 4. Configure AI API Keys
```bash
cd kafka-consumer
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your free API keys:**
- Groq: https://console.groq.com/keys
- Hugging Face: https://huggingface.co/settings/tokens  
- Google Gemini: https://makersuite.google.com/app/apikey

### 5. Start Kafka Consumer
```bash
cd kafka-consumer
npm install
npm start
```

### 5. Start Backend API
```bash
cd backend
npm install
npm start
```

### 6. Start Frontend Dashboard
```bash
cd frontend
npm install
npm start
```

Dashboard: http://localhost:3000

##  Features

-  **Multi-AI Verification** - 3 AI models working together
-  **Consensus Algorithm** - Weighted scoring system
-  **Confidence Level** - Shows AI agreement (high/medium/low)
-  Real-time news feed
-  Credibility score calculation
-  Category-based filtering
-  Full-text search (Elasticsearch)
-  Trending topics
-  Interactive charts
-  Provider-specific analysis

##  Dashboard Views

- **Claims Feed:** Incoming news
- **Verification Status:** True/False/Uncertain
- **Category Breakdown:** Distribution by category
- **Search Bar:** Fast search

##  Testing
```bash
# Check data in Elasticsearch
curl http://localhost:9200/news-claims/_search?pretty

# List Kafka topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

##  Project Structure
```
truthstream/
├── kafka-consumer/           # Kafka consumer with Multi-AI
│   ├── providers/            # AI provider modules
│   │   ├── groq.js          # Groq/Llama integration
│   │   ├── huggingface.js   # Hugging Face integration
│   │   └── gemini.js        # Google Gemini integration
│   ├── multi-ai-verification.js  # Consensus orchestrator
│   ├── consumer.js          # Main Kafka consumer
│   └── elasticsearch.js     # Database operations
├── backend/                 # REST API
├── frontend/                # React Dashboard
└── docker-compose.yml       # Docker services
```

##  Stopping Services
```bash
# Stop Docker services
docker-compose down

# Remove data volumes
docker-compose down -v
```

## 🔧 Development

### Configuring AI Providers

Edit `kafka-consumer/multi-ai-verification.js`:
```javascript
const ENABLED_PROVIDERS = ['groq', 'huggingface', 'gemini'];
const PROVIDER_WEIGHTS = {
  groq: 0.4,          // 40% weight
  huggingface: 0.3,   // 30% weight
  gemini: 0.3         // 30% weight
};
```

### Adding New AI Providers

1. Create `providers/your-ai.js`
2. Implement `verifyWithYourAI(claimText)` function
3. Add to `ENABLED_PROVIDERS` array
4. Set weight in `PROVIDER_WEIGHTS`

### Multi-AI Response Format

Each verified claim includes:
```json
{
  "credibility": 75,
  "verified": true,
  "confidence_score": 85,
  "ai_consensus": {
    "agreement_level": "high",
    "successful_providers": 3,
    "processing_time_ms": 2500
  },
  "provider_results": [
    {
      "provider": "groq",
      "credibility": 78,
      "reasoning": "..."
    }
  ]
}
```

##  Notes

- First run will download Docker images (~2-3 GB)
- Kafka may take 30-60 seconds on first startup
- Elasticsearch memory settings can be adjusted in docker-compose.yml

##  Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

##  License

MIT

##  Developer

Built to fight fake news.

---

**Note:** This project is for educational purposes. Production use requires security and scalability improvements.