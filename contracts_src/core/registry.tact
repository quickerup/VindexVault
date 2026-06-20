import "@stdlib/deploy";

message Update {
    id: Int as uint256;
    root: Int as uint256;
}

contract Registry with Deployable {
    owner: Address;
    roots: map<Int as uint256, Int as uint256>;

    init(owner: Address) {
        self.owner = owner;
        self.roots = emptyMap();
    }

    receive(msg: Update) {
        require(sender() == self.owner, "Only owner can update");
        self.roots.set(msg.id, msg.root);
    }

    get fun getRoot(id: Int): Int {
        return self.roots.get(id)!!;
    }

    get fun owner(): Address {
        return self.owner;
    }
}
