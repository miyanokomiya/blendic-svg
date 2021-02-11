import * as target from "../../src/utils/armatures";
import { getArmature, getBorn } from "../../src/models/index";

describe("utils/armatures", () => {
  describe("adjustConnectedPosition", () => {
    const parent = getBorn({ name: "parent", tail: { x: 1, y: 2 } });

    it("connected: true => connect child's head to parent's tail", () => {
      const child = getBorn({
        name: "child",
        head: { x: 0, y: 0 },
        parentKey: "parent",
        connected: true,
      });
      expect(target.adjustConnectedPosition([parent, child])).toEqual([
        parent,
        { ...child, head: { x: 1, y: 2 } },
      ]);
    });
    it("connected: false => do nothing", () => {
      const child = getBorn({
        name: "child",
        head: { x: 0, y: 0 },
        parentKey: "parent",
        connected: false,
      });
      expect(target.adjustConnectedPosition([parent, child])).toEqual([
        parent,
        child,
      ]);
    });
  });

  describe("selectBorn", () => {
    const parent = getBorn({ name: "parent" });
    const selecgted = getBorn({
      name: "selecgted",
      parentKey: "parent",
      connected: true,
    });
    const brother = getBorn({
      name: "brother",
      parentKey: "parent",
      connected: true,
    });
    const unconnectedBrother = getBorn({
      name: "unconnectedBrother",
      parentKey: "parent",
      connected: false,
    });
    const child = getBorn({
      name: "child",
      parentKey: "selecgted",
      connected: true,
    });
    const unconnectedChild = getBorn({
      name: "unconnectedChild",
      parentKey: "selecgted",
      connected: false,
    });

    describe("head: true", () => {
      it("connected: true => also select parent's tail & brother's head", () => {
        expect(
          target.selectBorn(
            getArmature({
              borns: [parent, selecgted, brother, unconnectedBrother, child],
            }),
            selecgted.name,
            { head: true, tail: false }
          )
        ).toEqual({
          parent: { tail: true },
          selecgted: { head: true, tail: false },
          brother: { head: true },
        });
      });
      it("connected: false => not select parent's tail", () => {
        expect(
          target.selectBorn(
            getArmature({
              borns: [parent, { ...selecgted, connected: false }, child],
            }),
            selecgted.name,
            { head: true, tail: false }
          )
        ).toEqual({
          selecgted: { head: true, tail: false },
        });
      });
    });
    describe("tail: true", () => {
      it("also select connected children's head", () => {
        expect(
          target.selectBorn(
            getArmature({
              borns: [parent, selecgted, child, unconnectedChild],
            }),
            selecgted.name,
            { head: false, tail: true }
          )
        ).toEqual({
          selecgted: { head: false, tail: true },
          child: { head: true },
        });
      });
    });
  });
});
