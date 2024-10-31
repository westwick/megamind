import PersistableEntity from "./PersistableEntity.js";
import PersistableProperty from "./PersistableProperty.js";

class Player extends PersistableEntity {
    Name = new PersistableProperty();

    constructor(player) {
        super(player);
    }
}