import solarData from "../data/data.json";

export const normalizeDataToEarth = (objData, ignoreToNormalize) => {
  const earthData = solarData["earth"];
  const normalizedData = Object.keys(objData).reduce((acc, key) => {
    const planetValue = objData[key];
    const earthValue = earthData[key];

    // console.log("planetValue", earthData.semimajorAxis10_6Km);

    if (key === "anchorXYOffset") {
      // console.log("planetValue", planetValue, earthData.semimajorAxis10_6Km);
      return {
        ...acc,
        [key]: {
          x: planetValue.x / earthData.semimajorAxis10_6Km,
          y: planetValue.y / earthData.semimajorAxis10_6Km,
        },
      };
    } else if (
      typeof planetValue !== "number" ||
      typeof earthValue !== "number" ||
      earthValue === 0 ||
      planetValue === 0 ||
      ignoreToNormalize.includes(key)
    ) {
      return {
        ...acc,
        [key]: planetValue,
      };
    }

    // console.log("planetValue", planetValue, earthValue);
    const normalizedValue = planetValue / earthValue;
    return {
      ...acc,
      [key]: normalizedValue,
    };
  }, {});


  return normalizedData;
};

export const filterObjectData = (objData, usedProperties) => {
  return Object.keys(objData).reduce((acc, key) => {
    if (usedProperties.includes(key)) {
      return {
        ...acc,
        [key]: objData[key],
      };
    }
    return acc;
  }, {});
};
