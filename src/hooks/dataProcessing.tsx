import { useEffect, useMemo, useRef } from "react";
import starsData from "../data/starsData.json";
import solarData from "../data/data.json";
import { dayInSeconds, objectsRotationSpeed, planetsNamesOrder, planetsScaleFactor, yearInSeconds } from "../data/solarSystemData";
import { filterObjectData, normalizeDataToEarth } from "../utils/dataProcessing";
import { useSolarSystemStore, useSystemStore } from "../store/systemStore";
import { useFrame } from "@react-three/fiber";
import { calculateRelativeDistance, degreesToRadians } from "../utils/calculations";
import * as THREE from "three";
import { cosmicObjectsData } from "../data/cosmicObjects";

export const useInitiateSolarSystem = () => {
  const usedProperties = [
    "volumetricMeanRadiusKm",
    "semimajorAxis10_6Km",
    "siderealOrbitPeriodDays",
    "orbitInclinationDeg",
    "siderealRotationPeriodHrs",
  ];

  const disableMoons = useSystemStore.getState().disableMoons;

  const reorderPlanets = planetsNamesOrder.reduce((acc, planetName) => ({
    ...acc,
    [planetName]: solarData[planetName],
  }), {});
  
  useEffect(() => {
    console.log("start init");
    const celestialBodiesUpdates = {};
    const propertiesUpdates = {};

    const processCelestialBody = (type, name, data, parentName = null) => {
      const filteredData = filterObjectData(data, usedProperties);
      const normalizedData = normalizeDataToEarth(filteredData);
      const additionalProcessingParams = {
        ...normalizedData,
        volumetricMeanRadiusKm: normalizedData.volumetricMeanRadiusKm / planetsScaleFactor,
      };

      celestialBodiesUpdates[type] = celestialBodiesUpdates[type] || {};
      celestialBodiesUpdates[type][name] = additionalProcessingParams;
      propertiesUpdates[name] = {
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
      };

      additionalProcessingParams['type'] = parentName;
    };

    Object.keys(reorderPlanets).forEach((planetName) => {
      const planetData = reorderPlanets[planetName];
      processCelestialBody("planets", planetName, planetData, "sun");

      if (planetData.moons && !disableMoons) {
        planetData.moons.forEach((moon) => {
          processCelestialBody("moons", moon.name, moon, planetName);
        });
      }
    });

    const sunData = starsData["sun"];
    processCelestialBody("stars", "sun", sunData);

    useSolarSystemStore.getState().batchUpdateCelestialBodies(celestialBodiesUpdates);
    useSolarSystemStore.getState().batchUpdateProperties(propertiesUpdates);
    useSystemStore.getState().updateSystemSettings({ dataInitialized: true });

    console.log("end init");

    useSystemStore.getState().setInitialized(true);
  }, []);
};

export const useCelestialBodyUpdates = () => {

  const systemState = useSystemStore.getState();
  const solarSystemState = useSolarSystemStore.getState();
  const quaternionRef = useRef(new THREE.Quaternion());

  useFrame((state, delta) => {
    const isInitialized = useSystemStore.getState().isInitialized;
    if (!isInitialized) return;

    const { timeSpeed, timeOffset, objectsDistance, orbitAngleOffset } = systemState;
    const { planets, moons } = solarSystemState.celestialBodies;
    const disableMoons = systemState.disableMoons;

    const combinedObjects = {
      ...planets,
      ...(disableMoons ? {} : moons),
    };

    const time = state.clock.getElapsedTime();
    const timeSec = time * Math.PI * 2;

    const updatedObjectsData = {};

    Object.keys(combinedObjects).forEach((name) => {
      const celestialBody = combinedObjects[name];

      if (!celestialBody || !celestialBody.semimajorAxis10_6Km) return;

      const t = ((timeSec / yearInSeconds / celestialBody.siderealOrbitPeriodDays) * timeSpeed + (timeOffset * (Math.PI * 2)) / 365) % (Math.PI * 2);
      const recalcDistance = calculateRelativeDistance(celestialBody.semimajorAxis10_6Km, objectsDistance);
      const newPosition = new THREE.Vector3(Math.cos(t) * recalcDistance, 0, Math.sin(t) * recalcDistance);
      quaternionRef.current.setFromAxisAngle(new THREE.Vector3(1, 0, 0), degreesToRadians(celestialBody.orbitInclinationDeg + orbitAngleOffset));
      newPosition.applyQuaternion(quaternionRef.current);

      const rotationSpeed = (timeSec / dayInSeconds / celestialBody.siderealRotationPeriodHrs * objectsRotationSpeed * timeSpeed) % (Math.PI * 2);
      const newRotation = new THREE.Euler(0, rotationSpeed , 0);

      updatedObjectsData[name] = { position: newPosition, rotation: newRotation };
    });

    useSolarSystemStore.getState().batchUpdateProperties(updatedObjectsData);
  });
};
