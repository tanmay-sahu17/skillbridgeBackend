import { PrismaClient } from '@prisma/client';
import elasticsearchService from '../services/elasticsearch.service.js';
import { indices } from '../search/mappings.js';

const prisma = new PrismaClient();

const indexMap = {
  User: indices.USERS,
  College: indices.COLLEGES,
  Student: indices.STUDENTS,
};

prisma.$use(async (params, next) => {
  const result = await next(params);

  const indexName = indexMap[params.model];
  if (indexName && elasticsearchService.isHealthy && result) {
    // Fire and forget so we don't block the main DB response
    elasticsearchService.execute(async (client) => {
      if (params.action === 'create' || params.action === 'update') {
        if (result.id) {
          await client.index({
            index: indexName,
            id: result.id,
            document: result
          });
        }
      } else if (params.action === 'delete') {
        if (result.id) {
          await client.delete({
            index: indexName,
            id: result.id
          });
        }
      }
    });
  }

  return result;
});

export default prisma;
