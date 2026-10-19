import { scenes } from "../data/scenes.js";

let currentSceneName = "outdoor";

export function getCurrentScene() {
  return scenes[currentSceneName];
}

export function getCurrentSceneName() {
  return currentSceneName;
}

export function setCurrentScene(name) {
  currentSceneName = name;
}
