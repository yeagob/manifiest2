import Cause from './Cause.js';

describe('Cause Model', () => {
  test('should create a new cause', async () => {
    const causeData = {
      title: 'Test Cause',
      description: 'This is a test cause',
      category: 'test',
      createdBy: 'user-123'
    };

    const cause = await Cause.create(causeData);

    expect(cause.title).toBe(causeData.title);
    expect(cause.description).toBe(causeData.description);
    expect(cause.category).toBe(causeData.category);
    expect(cause.createdBy).toBe(causeData.createdBy);
    expect(cause.supporters).toContain(causeData.createdBy);
    expect(cause.totalSteps).toBe(0);
    expect(cause.isActive).toBe(true);
  });

  test('should add supporter to cause', async () => {
    const cause = await Cause.create({
      title: 'Test Cause',
      description: 'Test',
      createdBy: 'user-123'
    });

    await cause.addSupporter('user-456');

    expect(cause.supporters).toContain('user-456');
    expect(cause.supporters.length).toBe(2); // creator + new supporter
  });

  test('should not add duplicate supporters', async () => {
    const cause = await Cause.create({
      title: 'Test Cause',
      description: 'Test',
      createdBy: 'user-123'
    });

    await cause.addSupporter('user-456');
    await cause.addSupporter('user-456'); // Try to add again

    expect(cause.supporters.filter(id => id === 'user-456').length).toBe(1);
  });

  test('should increment step count', async () => {
    const cause = await Cause.create({
      title: 'Test Cause',
      description: 'Test',
      createdBy: 'user-123'
    });

    await cause.addSteps(100);
    expect(cause.totalSteps).toBe(100);

    await cause.addSteps(50);
    expect(cause.totalSteps).toBe(150);
  });
});
