#  TruthStream - Real-Time Fake News Detection System

A real-time analytics platform that verifies news spreading on social media using Kafka and Elasticsearch.

##  Architecture
```
Fake News Generator → Kafka → Consumer → Elasticsearch → React Dashboard
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

### 4. Start Kafka Consumer
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

-  Real-time news feed
-  Credibility score calculation
-  Category-based filtering
-  Full-text search (Elasticsearch)
-  Trending topics
-  Interactive charts

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
├── news-generator/      # Fake news generator
├── kafka-consumer/      # Kafka consumer → Elasticsearch
├── backend/             # REST API
├── frontend/            # React Dashboard
└── docker-compose.yml   # Docker services
```

##  Stopping Services
```bash
# Stop Docker services
docker-compose down

# Remove data volumes
docker-compose down -v
```

## 🔧 Development

### Adding New Categories

Edit `news-generator/data/categories.js`

### Improving Verification Logic

Edit `kafka-consumer/verification.js`

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