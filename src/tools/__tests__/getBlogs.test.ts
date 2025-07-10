import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { getBlogs } from '../getBlogs.js';
import { GraphQLClient } from 'graphql-request';

// Mock the GraphQLClient
jest.mock('graphql-request', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
}));

describe('getBlogs tool', () => {
  let client: GraphQLClient;

  beforeEach(() => {
    client = new GraphQLClient('');
  });

  it('should have an initialize method', () => {
    expect(getBlogs.initialize).toBeInstanceOf(Function);
  });

  it('should have an execute method', () => {
    getBlogs.initialize(client);
    expect(getBlogs.execute).toBeInstanceOf(Function);
  });
});