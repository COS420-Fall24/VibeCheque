import { DatabaseReference, DataSnapshot } from "firebase/database";

const firebaseDatabase = jest.requireActual<typeof import("firebase/database")>("firebase/database");
const mockFirebaseDatabase = jest.createMockFromModule<typeof import("firebase/database")>("firebase/database");

const mockSnapshot = {
    exists: () => true,
    val: () => ({ count: 2 }),
    forEach: () => true
};

mockFirebaseDatabase.get = jest.fn().mockResolvedValue(mockSnapshot);

mockFirebaseDatabase.child = jest.fn((_, path): DatabaseReference => {
    return `${path}` as unknown as DatabaseReference;
});
mockFirebaseDatabase.ref = jest.fn().mockReturnValue('mock-ref');
mockFirebaseDatabase.set = jest.fn().mockResolvedValue(undefined);
mockFirebaseDatabase.remove = jest.fn().mockResolvedValue(undefined);

class mockDataSnapshot {
    forEach: jest.Mock;
    constructor() {
        this.forEach = jest.fn().mockReturnValue(true);
    }
}

mockFirebaseDatabase.DataSnapshot = mockDataSnapshot as unknown as typeof DataSnapshot;

module.exports = mockFirebaseDatabase;
