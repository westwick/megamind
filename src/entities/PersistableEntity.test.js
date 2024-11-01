import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import PersistableEntity from './PersistableEntity.js';
import PersistableProperty from './PersistableProperty.js';

class TestEntity extends PersistableEntity {
    name = new PersistableProperty('name');
    description = new PersistableProperty('value');
}

describe('PersistableEntity', () => {
    beforeEach(async () => {
        await TestEntity.removeAll();
    });

    it('should create and persist a new entity', async () => {
        const entity = await TestEntity.new('test1');
        entity.name = 'Test Entity';
        entity.description = "This is a test entity";
        await entity.save(); // force save as the timer may not have fired

        const savedEntity = await TestEntity.find('test1');
        expect(savedEntity).toBeDefined();
        expect(savedEntity.name).toBe('Test Entity');
        expect(savedEntity.description).toBe("This is a test entity");
    });

    it('should get an existing entity', async () => {
        await TestEntity.new('test1', { name: 'Test Entity', description: "This is a test entity" });
        
        const entity = await TestEntity.exists('test1');
        expect(entity).toBeDefined();
        expect(entity.document.name).toBe('Test Entity');
        expect(entity.document.description).toBe("This is a test entity");
    });

    it('should return null for non-existent entity', async () => {
        const entity = await TestEntity.exists('nonexistent');
        expect(entity).toBeNull();
    });

    it('should get all entities', async () => {
        await TestEntity.new('test1', { name: 'Entity 1', description: "This is a test entity 1" });
        await TestEntity.new('test2', { name: 'Entity 2', description: "This is a test entity 2" });
        
        const entities = await TestEntity.all();
        expect(entities).toHaveLength(2);
        expect(entities[0].document.name).toBe('Entity 1');
        expect(entities[1].document.name).toBe('Entity 2');
        expect(entities[0].document.description).toBe('This is a test entity 1');
        expect(entities[1].document.description).toBe('This is a test entity 2');
    });

    it('should handle transactions and commits', async () => {
        const entity = await TestEntity.new('test1');
        
        entity.transaction();
        entity.name = 'Test Entity';
        entity.description = "This is a test entity";
        
        // Changes shouldn't be saved during transaction
        let savedEntity = await TestEntity.find('test1');
        expect(savedEntity.name).toBeUndefined();
        expect(savedEntity.description).toBeUndefined();
        
        await entity.commit();
        
        // Changes should be saved after commit
        savedEntity = await TestEntity.find('test1');
        expect(savedEntity.name).toBe('Test Entity');
        expect(savedEntity.description).toBe("This is a test entity");
    });

    it('should handle transaction rollbacks', async () => {
        const entity = await TestEntity.new('test1', { name: 'Original Name', description: "This is a test entity" });
        
        // Verify initial state
        const initialEntity = await TestEntity.find('test1');
        expect(initialEntity.name).toBe('Original Name');
        expect(initialEntity.description).toBe("This is a test entity");
        
        entity.transaction();
        entity.name = 'Changed Name';
        entity.description = "This is a changed entity";
        entity.rollback();
        
        expect(entity.document.name).toBe('Original Name');
        expect(entity.document.description).toBe("This is a test entity");
        
        // Verify database wasn't affected
        const savedEntity = await TestEntity.find('test1');
        expect(savedEntity.name).toBe('Original Name');
        expect(savedEntity.description).toBe("This is a test entity");
    });

    afterEach(async () => {
    });
    
    afterAll(async () => {
        await TestEntity.deleteDatabase();
    });
});