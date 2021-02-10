import { IVec2 } from "okageo";

export interface Transform {
  translate: IVec2;
  origin: IVec2;
  rotate: number; // degree
  scale: IVec2;
}

export interface Armature {
  name: string;
  transform: Transform;
  parentKey: string;
  connected: boolean;
  head: IVec2;
  tail: IVec2;
}

export interface ArmatureRoot {
  name: string;
  transform: Transform;
  armatures: Armature[];
}

export interface Actor {
  parent: ArmatureRoot;
  svgElements: SvgElement[];
}

export interface SvgElement {
  id: string;
  transform: Transform;
}

export function getTransform(arg: Partial<Transform> = {}): Transform {
  return {
    translate: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
    rotate: 0,
    scale: { x: 1, y: 1 },
    ...arg,
  };
}

export function getArmature(arg: Partial<Armature> = {}): Armature {
  return {
    name: "",
    transform: getTransform(),
    parentKey: "",
    connected: false,
    head: { x: 0, y: 0 },
    tail: { x: 0, y: 0 },
    ...arg,
  };
}

export function getArmatureRoot(arg: Partial<ArmatureRoot> = {}): ArmatureRoot {
  return {
    name: "",
    transform: getTransform(),
    armatures: [],
    ...arg,
  };
}

export type ArmatureSelectedState = "" | "all" | "head" | "tail";
export type EditMode = "" | "grab" | "rotate" | "scale";
