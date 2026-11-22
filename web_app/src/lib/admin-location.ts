// Location resources of the administrator registry (continent -> country -> province -> regency ->
// sub-district -> village). Fields follow the models; the old client let the administrator only
// list continents, regions, countries and regency types, and create/edit the rest.
import { fk, int, labelKey, num, pick, str, type AdminField, type AdminResource } from './admin-fields';

const GROUP = ['ad.location'];

const resource = (singular: string, plural: string, columns: string[], fields: AdminField[], titleKey = labelKey(singular.replace(/-/g, '_'))): AdminResource => ({
  key: `location-${singular}`,
  path: `location/${singular}`,
  api: plural,
  titleKey,
  group: GROUP,
  columns: columns.map((field) => ({ label: labelKey(field), field })),
  fields,
});

const strs = (...names: string[]) => names.map((n) => str(n));
const geo = (): AdminField[] => [num('latitude', false, -90, 90), num('longitude', false, -180, 180), int('zoom', false, 0, 30)];
/** The administrative-code columns the provinces, regencies and sub-districts share. */
const ministry = (): AdminField[] => strs('state_ministry_code', 'state_ministry_full_code', 'state_post_department_code', 'state_ministry_name', 'dikti_name', 'validation_code');

export const LOCATION_RESOURCES: AdminResource[] = [
  resource('continent', 'continents', ['code', 'alphabet_code', 'name'], [int('code'), str('alphabet_code', true, 20), str('name', true), str('slug')]),
  resource('region', 'regions', ['code', 'alphabet_code', 'name'], [int('code'), str('alphabet_code', true, 20), str('name', true), str('slug'), str('alt_slug')]),
  resource('regency-type', 'regency-types', ['code', 'alphabet_code', 'name'], [int('code'), str('alphabet_code', true, 20), str('name', true)]),
  resource('country', 'countries', ['code', 'name', 'dikti_code'], [str('code', true, 50), str('name', true), str('dikti_code', false, 50), fk('continent_id', 'location-continent'), fk('region_id', 'location-region'), str('slug')]),
  resource('province', 'provinces', ['code', 'name', 'dikti_code'], [str('code', false, 50), str('name', true), str('dikti_code', false, 50), str('epsbed_code', false, 50), pick('country_id', 'location-country'), str('slug'), str('alt_slug'), str('description', false, 500), ...ministry(), ...geo()]),
  resource('regency', 'regencies', ['code', 'name', 'dikti_code'], [str('code', false, 50), str('name', true), str('dikti_code', false, 50), str('epsbed_code', false, 50), pick('province_id', 'location-province', true), fk('regency_type_id', 'location-regency-type', true), str('slug'), str('alt_slug'), str('description', false, 500), ...ministry(), ...geo()]),
  resource('sub-district', 'sub-districts', ['code', 'name', 'dikti_code'], [str('code', true, 50), str('name', true), str('dikti_code', false, 50), pick('regency_id', 'location-regency', true), str('slug'), str('alt_slug'), str('agriculture_department_name'), ...ministry(), ...geo()]),
  resource('village', 'villages', ['code', 'name', 'dikti_code'], [str('code', true, 50), str('name', true), str('dikti_code', false, 50), pick('sub_district_id', 'location-sub-district', true), str('slug'), str('alt_slug'), ...strs('state_ministry_code', 'state_post_department_code', 'state_ministry_name', 'dikti_name'), ...geo()]),
];
