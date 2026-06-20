contract JettonMaster {
    adminAddress: Address;
    supplyValue: Int = 0;

    init(admin: Address) {
        self.adminAddress = admin;
    }

    receive("mint") {
        self.supplyValue += 1;
    }

    get fun admin(): Address {
        return self.adminAddress;
    }

    get fun totalSupply(): Int {
        return self.supplyValue;
    }
}
