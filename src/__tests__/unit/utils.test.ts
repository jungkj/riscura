describe('Test Setup Verification', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to test utilities', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.mockApiResponse).toBeInstanceOf(Function);
    expect(global.testUtils.createMockUser).toBeInstanceOf(Function);
    expect(global.testUtils.createMockOrganization).toBeInstanceOf(Function);
  });

  it('should have custom matchers', () => {
    expect(5).toBeWithinRange(1, 10);
    expect(15).not.toBeWithinRange(1, 10);
  });

  it('should have proper environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DATABASE_URL).toContain('test');
    expect(process.env.JWT_SECRET).toContain('test');
  });

  it('should create mock user data', () => {
    const mockUser = global.testUtils.createMockUser({
      email: 'custom@test.com',
      role: 'ADMIN',
    });

    expect(mockUser).toMatchObject({
      id: 'test-user-id',
      email: 'custom@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
      organizationId: 'test-org-id',
    });
    expect(mockUser.createdAt).toBeInstanceOf(Date);
    expect(mockUser.updatedAt).toBeInstanceOf(Date);
  });

  it('should create mock organization data', () => {
    const mockOrg = global.testUtils.createMockOrganization({
      name: 'Custom Test Org',
    });

    expect(mockOrg).toMatchObject({
      id: 'test-org-id',
      name: 'Custom Test Org',
    });
    expect(mockOrg.createdAt).toBeInstanceOf(Date);
    expect(mockOrg.updatedAt).toBeInstanceOf(Date);
  });

  it('should mock API responses', () => {
    const mockResponse = global.testUtils.mockApiResponse({ success: true, data: { id: 1 } }, 200);

    expect(mockResponse.status).toBe(200);
    expect(mockResponse.ok).toBe(true);
    expect(mockResponse.json()).resolves.toEqual({
      success: true,
      data: { id: 1 },
    });
  });
});
