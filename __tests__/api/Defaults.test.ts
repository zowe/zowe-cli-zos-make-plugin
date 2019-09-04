import {Defaults} from "../../src/api/Defaults";

describe("defaults", () => {
    it ("should default the HLQ name", () => {
        expect(Defaults.LOADLIB_ATTRIBUTES.name).toBe("ZOSMAKE.LOADLIB");
    });
});
