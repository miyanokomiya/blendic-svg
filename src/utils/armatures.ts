import {
  Transform,
  Born,
  BornSelectedState,
  getTransform,
  getBorn,
} from "../models/index";
import { IVec2, add, sub, multi, rotate } from "okageo";

function convoluteTransforms(transforms: Transform[]): Transform {
  return transforms.reduce((ret, t) => {
    return {
      ...ret,
      translate: add(ret.translate, t.translate),
    };
  }, getTransform());
}

export function editTransform(
  armature: Born,
  transforms: Transform[],
  selectedState: BornSelectedState
) {
  const convoluted = convoluteTransforms(transforms);
  const head = ["all", "head"].includes(selectedState)
    ? add(armature.head, convoluted.translate)
    : armature.head;
  const tail = ["all", "tail"].includes(selectedState)
    ? add(armature.tail, convoluted.translate)
    : armature.tail;

  return {
    ...armature,
    head,
    tail,
  };
}

export function extrudeFromParent(parent: Born, fromHead = false): Born {
  const head = fromHead ? parent.head : parent.tail;
  return getBorn({
    head,
    tail: head,
    parentKey: fromHead ? parent.parentKey : parent.name,
  });
}
