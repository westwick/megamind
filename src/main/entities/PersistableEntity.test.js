import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import PersistableEntity from './PersistableEntity.js';
import PersistableProperty from './PersistableProperty.js';

class TestEntity extends PersistableEntity {
  name = new PersistableProperty('name');
  description = new PersistableProperty('value');
}

describe('PersistableEntity', () => {
  beforeEach(async () => {
    await TestEntity.clear();
  });

  it('should create and persist a new entity', async () => {
    const entity = await TestEntity.create('test1');
    entity.name = 'Test Entity';
    entity.description = 'This is a test entity';
    await entity.save();

    const savedEntity = await TestEntity.find('test1');
    expect(savedEntity).toBeDefined();
    expect(savedEntity.name).toBe('Test Entity');
    expect(savedEntity.description).toBe('This is a test entity');
  });

  it('should get an existing entity', async () => {
    let entity = await TestEntity.create('test1', {
      name: 'Test Entity',
      description: 'This is a test entity',
    });
    await entity.save();

    entity = await TestEntity.exists('test1');
    expect(entity).toBeTruthy();

    entity = await TestEntity.find('test1');
    expect(entity).toBeDefined();
    expect(entity.name).toBe('Test Entity');
    expect(entity.description).toBe('This is a test entity');
  });

  it('should return null for non-existent entity', async () => {
    const entity = await TestEntity.exists('nonexistent');
    expect(entity).toBeFalsy();
  });

  it('should get all entities', async () => {
    let entity = await TestEntity.create('test1', {
      name: 'Entity 1',
      description: 'This is a test entity 1',
    });
    await entity.save();

    entity = await TestEntity.create('test2', {
      name: 'Entity 2',
      description: 'This is a test entity 2',
    });
    await entity.save();

    const entities = await TestEntity.all();
    expect(entities).toHaveLength(2);
    expect(entities[0].name).toBe('Entity 1');
    expect(entities[1].name).toBe('Entity 2');
    expect(entities[0].description).toBe('This is a test entity 1');
    expect(entities[1].description).toBe('This is a test entity 2');
  });

  it('should create multiple entities with createAll', async () => {
    const entitiesToCreate = [
      {
        _id: 'yang',
        name: 'Yang Yin',
        description: 'Half-Ogre Mystic',
      },
      {
        _id: 'soul',
        name: 'Soul Guardian',
        description: 'Nekojin Warlock',
      },
    ];

    const entities = await TestEntity.createAll(entitiesToCreate, '/users/all');

    expect(entities).toHaveLength(2);
    expect(entities[0]._id).toBe('yang');
    expect(entities[0].name).toBe('Yang Yin');
    expect(entities[0].description).toBe('Half-Ogre Mystic');
    expect(entities[1]._id).toBe('soul');
    expect(entities[1].name).toBe('Soul Guardian');
    expect(entities[1].description).toBe('Nekojin Warlock');
    await Promise.all(entities.map((entity) => entity.save()));

    // Verify entities were persisted
    const savedEntities = await TestEntity.all('/users/all');
    expect(savedEntities).toHaveLength(2);
    expect(savedEntities[0].name).toSatisfy((name) => ['Yang Yin', 'Soul Guardian'].includes(name));
    expect(savedEntities[1].name).toSatisfy((name) => ['Yang Yin', 'Soul Guardian'].includes(name));
  });

  it('should handle rollbacks', async () => {
    const entity = await TestEntity.create('test1');

    entity.name = 'Test Entity';
    entity.description = 'This is a test entity';

    await entity.save();

    entity.transaction();
    entity.name = 'New Entity';
    entity.description = 'This is a new entity';
    entity.rollback();

    // Changes should be saved after commit
    const savedEntity = await TestEntity.find('test1');
    expect(savedEntity.name).toBe('Test Entity');
    expect(savedEntity.description).toBe('This is a test entity');
  });

  it('should handle transaction rollbacks', async () => {
    const entity = await TestEntity.create('test1', {
      name: 'Original Name',
      description: 'This is a test entity',
    });

    // Verify initial state
    const initialEntity = await TestEntity.find('test1');
    expect(initialEntity.name).toBe('Original Name');
    expect(initialEntity.description).toBe('This is a test entity');

    entity.transaction();
    entity.name = 'Changed Name';
    entity.description = 'This is a changed entity';
    entity.rollback();

    expect(entity.name).toBe('Original Name');
    expect(entity.description).toBe('This is a test entity');

    // Verify database wasn't affected
    const savedEntity = await TestEntity.find('test1');
    expect(savedEntity.name).toBe('Original Name');
    expect(savedEntity.description).toBe('This is a test entity');
  });

  it('should resolve entities across multiple paths', async () => {
    // Create entities in different paths
    await TestEntity.create('shared-id', '/', {
      name: 'Root Entity',
      description: 'Entity in root path',
    });

    await TestEntity.create('shared-id', '/users/all', {
      name: 'User Entity',
      description: 'Entity in user path',
    });

    // Should find entity in first path
    const firstEntity = await TestEntity.resolve('shared-id', '/', '/users/all');
    expect(firstEntity.name).toBe('Root Entity');
    expect(firstEntity.description).toBe('Entity in root path');

    // Should find entity in second path when first path is empty
    const secondEntity = await TestEntity.resolve('shared-id', '/some/other/path', '/users/all');
    expect(secondEntity.name).toBe('User Entity');
    expect(secondEntity.description).toBe('Entity in user path');

    // Should return undefined when entity not found in any path
    const notFound = await TestEntity.resolve('missing-id', '/', '/users/all');
    expect(notFound).toBeUndefined();
  });

  afterEach(async () => {});

  afterAll(async () => {
    await TestEntity.deleteDatabase('/');
    await TestEntity.deleteDatabase('/users/all');
    await TestEntity.deleteDatabase('/some/other/path');
  });
});
