import PersistableEntity from "./PersistableEntity.js";
import PersistableProperty from "./PersistableProperty.js";

export default class Player extends PersistableEntity {
    name = new PersistableProperty();
    last = new PersistableProperty();
    alignment = new PersistableProperty();
    flags = new PersistableProperty();
    title = new PersistableProperty();
    gang = new PersistableProperty();
    status = new PersistableProperty();
    levelRange = new PersistableProperty();
    class = new PersistableProperty();
}