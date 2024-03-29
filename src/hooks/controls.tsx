import { useControls } from "leva";
import { useEffect } from "react";
import { useSolarStore } from "../store/systemStore";

export const useSyncControlsWithStore = () => {
  const { timeSpeed, timeOffset, objectsDistance, objectsRelativeScale, disableRandomObjects, disableMoons, disableTrash, orbitAngleOffset } =
    useControls({
      timeSpeed: {
        value: 50,
        min: 1,
        max: 100,
        step: 1,
      },
      timeOffset: {
        value: 0,
        min: -365,
        max: 365,
        step: 1,
      },
      objectsDistance: {
        value: 1,
        min: 1,
        max: 5,
        step: 1,
      },
      objectsRelativeScale: {
        value: 1,
        min: 1,
        max: 10,
        step: 1,
      },
      orbitAngleOffset: {
        value: 0,
        min: 0,
        max: 360,
        step: 1,
      },
      disableMoons: {
        value: false,
      },
      disableTrash: {
        value: false,
      },
      disableRandomObjects: {
        value: false,
      },
    });

  const updateSystemSettings = useSolarStore((state) => state.updateSystemSettings);

  useEffect(() => {
    updateSystemSettings({
      timeSpeed: timeSpeed === 1 ? 1 : timeSpeed * 100000,
      timeOffset,
      objectsDistance,
      objectsRelativeScale,
      orbitAngleOffset,
      disableMoons,
      disableTrash,
      disableRandomObjects,
    });
  }, [
    timeSpeed,
    timeOffset,
    objectsDistance,
    objectsRelativeScale,
    orbitAngleOffset,
    disableMoons,
    disableTrash,
    disableRandomObjects,
    updateSystemSettings,
  ]);
};
