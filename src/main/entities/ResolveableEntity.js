import PersistableEntity from './PersistableEntity.js';

export default class ResolvableEntity extends PersistableEntity {
  _paths = new Set();

  constructor(...args) {
  }
}
