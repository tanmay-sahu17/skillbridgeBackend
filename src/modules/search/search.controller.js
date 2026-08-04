import asyncHandler from '../../utils/asyncHandler.js';
import elasticsearchService from '../../services/elasticsearch.service.js';
import { indices } from '../../search/mappings.js';
import prisma from '../../core/prisma.js';

export const syncAllToElasticsearch = asyncHandler(async (req, res) => {
  if (!elasticsearchService.isHealthy) {
    return res.status(503).json({ success: false, message: 'Elasticsearch is not reachable' });
  }

  // 1. Sync Users
  const users = await prisma.user.findMany();
  for (const user of users) {
    await elasticsearchService.client.index({
      index: indices.USERS,
      id: user.id,
      document: user
    });
  }

  // 2. Sync Colleges
  const colleges = await prisma.college.findMany();
  for (const college of colleges) {
    await elasticsearchService.client.index({
      index: indices.COLLEGES,
      id: college.id,
      document: college
    });
  }

  // 3. Sync Students
  const students = await prisma.student.findMany();
  for (const student of students) {
    await elasticsearchService.client.index({
      index: indices.STUDENTS,
      id: student.id,
      document: student
    });
  }

  res.status(200).json({ success: true, message: 'All data successfully synced to Elasticsearch' });
});

export const searchEntities = asyncHandler(async (req, res) => {
  const { query, type = 'all', page = 1, limit = 10 } = req.query;
  const size = parseInt(limit, 10);
  const from = (parseInt(page, 10) - 1) * size;

  if (!query) {
    return res.status(400).json({ success: false, message: 'Query parameter is required' });
  }

  if (!elasticsearchService.isHealthy) {
    // Fallback logic here if needed (e.g., query Prisma directly)
    return res.status(503).json({ success: false, message: 'Elasticsearch is down, search is temporarily unavailable.' });
  }

  let targetIndices = [];
  if (type === 'students') targetIndices.push(indices.STUDENTS);
  else if (type === 'colleges') targetIndices.push(indices.COLLEGES);
  else if (type === 'users') targetIndices.push(indices.USERS);
  else targetIndices = [indices.STUDENTS, indices.COLLEGES, indices.USERS];

  const searchResponse = await elasticsearchService.client.search({
    index: targetIndices,
    from,
    size,
    body: {
      query: {
        multi_match: {
          query: query,
          fuzziness: 'AUTO' // Handles typos
        }
      }
    }
  });

  const results = searchResponse.hits.hits.map(hit => ({
    _index: hit._index,
    _id: hit._id,
    _score: hit._score,
    _source: hit._source
  }));

  res.status(200).json({
    success: true,
    total: searchResponse.hits.total.value,
    page: parseInt(page, 10),
    limit: size,
    results
  });
});
