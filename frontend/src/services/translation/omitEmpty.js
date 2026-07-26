export function omitEmpty(obj) {
  const result = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      result[key] = value;
    }
  });

  return result;
}