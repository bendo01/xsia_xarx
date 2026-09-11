Plan:
1. Update `loadUnitData` to use `unitRes.data.courses`, `unitRes.data.curriculums`, `unitRes.data.students`, `unitRes.data.staffes`.
2. Remove the `dashRes` fetching entirely, since the backend now embeds relations in `units/{id}`.
3. Remove the parallel `masterApiIndex` calls for courses, curriculums, students, staffes.
4. Keep the reference data fetching (`refPromises`) if needed, or we can just let it degrade gracefully. The current code uses `cachedPositionTypes`, `cachedVarieties`, `cachedGroups`. It's fine to keep `refPromises` for the maps.
