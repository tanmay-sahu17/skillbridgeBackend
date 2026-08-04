import elasticsearchService from '../services/elasticsearch.service.js';
import { indices, mappings } from './mappings.js';

export const initializeIndices = async () => {
  await elasticsearchService.execute(async (client) => {
    for (const [key, indexName] of Object.entries(indices)) {
      const exists = await client.indices.exists({ index: indexName });
      if (!exists) {
        await client.indices.create({
          index: indexName,
          body: {
            mappings: mappings[indexName]
          }
        });
        console.log(`✅ Elasticsearch index created: ${indexName}`);
      }
    }
  });
};
