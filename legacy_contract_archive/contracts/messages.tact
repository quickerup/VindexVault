message StatusNotice {
    amount: Int;
}

contract Messages {
    versionValue: Int = 1;

    receive("tick") {
        self.versionValue += 1;
    }

    get fun version(): Int {
        return self.versionValue;
    }
}
