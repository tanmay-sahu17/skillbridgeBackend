export const indices = {
  USERS: 'users',
  COLLEGES: 'colleges',
  STUDENTS: 'students'
};

export const mappings = {
  [indices.USERS]: {
    properties: {
      id: { type: 'keyword' },
      name: { type: 'text' },
      email: { type: 'keyword' },
      role: { type: 'keyword' },
      isActive: { type: 'boolean' },
      isEmailVerified: { type: 'boolean' },
      createdAt: { type: 'date' }
    }
  },
  
  [indices.COLLEGES]: {
    properties: {
      id: { type: 'keyword' },
      userId: { type: 'keyword' },
      collegeName: { type: 'text' },
      city: { type: 'keyword' },
      state: { type: 'keyword' },
      officialEmail: { type: 'keyword' },
      status: { type: 'keyword' },
      createdAt: { type: 'date' }
    }
  },
  
  [indices.STUDENTS]: {
    properties: {
      id: { type: 'keyword' },
      userId: { type: 'keyword' },
      collegeId: { type: 'keyword' },
      firstName: { type: 'text' },
      lastName: { type: 'text' },
      course: { type: 'keyword' },
      branch: { type: 'keyword' },
      skills: { type: 'keyword' },
      status: { type: 'keyword' },
      createdAt: { type: 'date' }
    }
  }
};
