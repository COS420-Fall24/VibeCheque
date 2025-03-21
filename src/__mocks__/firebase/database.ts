import { DatabaseReference } from "firebase/database";

const firebaseDatabase = jest.requireActual<typeof import("firebase/database")>("firebase/database");
const mockFirebaseDatabase = jest.createMockFromModule<typeof import("firebase/database")>("firebase/database");

const mockSnapshot = {
    exists: () => true,
    val: () => ({ count: 2 })
};

mockFirebaseDatabase.get = jest.fn().mockResolvedValue(mockSnapshot);

mockFirebaseDatabase.child = jest.fn((_, path): DatabaseReference => {
    return `servers/${path}` as unknown as DatabaseReference;
});
mockFirebaseDatabase.ref = jest.fn().mockReturnValue('mock-ref');
mockFirebaseDatabase.set = jest.fn().mockResolvedValue(undefined);
mockFirebaseDatabase.remove = jest.fn().mockResolvedValue(undefined);


module.exports = mockFirebaseDatabase;
