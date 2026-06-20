contract Reputation {
    ownerAddress: Address;
    scoreValue: Int = 0;

    init(owner: Address) {
        self.ownerAddress = owner;
    }

    receive("bump") {
        self.scoreValue += 1;
    }

    get fun owner(): Address {
        return self.ownerAddress;
    }

    get fun score(): Int {
        return self.scoreValue;
    }
}
