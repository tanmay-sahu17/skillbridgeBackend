import { Client } from '@elastic/elasticsearch';

class ElasticsearchService {
  constructor() {
    this.client = null;
    this.isHealthy = false;
    this.init();
  }

  init() {
    const node = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
    const username = process.env.ELASTICSEARCH_USERNAME || 'elastic';
    const password = process.env.ELASTICSEARCH_PASSWORD;

    if (!password) {
      console.warn('⚠️ Elasticsearch: ELASTICSEARCH_PASSWORD is not set. Service is disabled.');
      return;
    }

    try {
      this.client = new Client({
        node,
        auth: {
          username,
          password,
        },
        // In local development with self-signed certs, you might need to rejectUnauthorized: false
        tls: {
          rejectUnauthorized: false
        }
      });
      this.checkHealth();
    } catch (error) {
      console.error('❌ Failed to initialize Elasticsearch client:', error.message);
    }
  }

  async checkHealth() {
    if (!this.client) return false;

    try {
      const health = await this.client.cluster.health();
      this.isHealthy = health.status === 'green' || health.status === 'yellow';
      if (this.isHealthy) {
        console.log('✅ Elasticsearch connected successfully.');
      }
      return this.isHealthy;
    } catch (error) {
      this.isHealthy = false;
      console.warn('⚠️ Elasticsearch is unreachable. Search will fallback to DB queries.', error.message);
      return false;
    }
  }

  /**
   * Safe execution wrapper for Elasticsearch operations.
   * Prevents application crash if Elasticsearch is down.
   */
  async execute(operation, fallbackValue = null) {
    if (!this.isHealthy || !this.client) {
      return fallbackValue;
    }
    
    try {
      return await operation(this.client);
    } catch (error) {
      console.error('❌ Elasticsearch operation failed:', error.message);
      // Optional: re-check health if connection drops
      if (error.meta && error.meta.statusCode === 502) {
         this.isHealthy = false;
      }
      return fallbackValue;
    }
  }
}

const elasticsearchService = new ElasticsearchService();
export default elasticsearchService;
