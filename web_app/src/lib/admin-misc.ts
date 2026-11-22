// Person, building, contact, document, literate and auth resources of the administrator registry.
// Fields follow the Rust models. Secrets (password hash, api key, tokens) are never registered as
// fields and the server strips them from every record it returns (see server/admin-crud.ts).
import { day, fk, flag, int, labelKey, num, pick, reference, str, text, type AdminField, type AdminResource, type RefOpts } from './admin-fields';

const ref = (area: string, kind: string, singular: string, plural: string, o: RefOpts = {}) =>
  reference(`${area}-${kind}-${singular}`, `${area}/${kind}/${singular}`, `${area}/${kind}/${plural}`, labelKey(singular.replace(/-/g, '_')), { group: [`ad.${area}`], ...o });

const res = (area: string, kind: string, singular: string, api: string, columns: string[], fields: AdminField[], extra: Partial<AdminResource> = {}): AdminResource => ({
  key: `${area}-${kind}-${singular}`,
  path: `${area}/${kind}/${singular}`,
  api,
  titleKey: labelKey(singular.replace(/-/g, '_')),
  group: [`ad.${area}`],
  columns: columns.map((field) => ({ label: labelKey(field), field })),
  fields,
  ...extra,
});

const PERSON_REFS: [string, string][] = [
  ['age-classification', 'age-classification'], ['blood-type', 'blood-type'], ['eye-color', 'eye-color'], ['gender', 'gender'],
  ['hair-color', 'hair-color'], ['hair-type', 'hair-type'], ['identification-type', 'identification-type'], ['income', 'income'],
  ['marital-status', 'marital-status'], ['occupation', 'occupation'], ['profession', 'profession'], ['relative-type', 'relative-type'], ['religion', 'religion'],
];
const personKey = (s: string) => `person-reference-${s}`;

export const MISC_RESOURCES: AdminResource[] = [
  // person (the person reference endpoints are singular)
  ...PERSON_REFS.map(([singular, api]) => ref('person', 'reference', singular, api)),
  res('person', 'master', 'individual', 'person/master/individual', ['code', 'name', 'birth_date', 'birth_place'], [
    str('code', true, 50), str('name', true), str('front_title', false, 50), str('last_title', false, 50),
    day('birth_date', true), str('birth_place', true),
    fk('gender_id', personKey('gender'), true), fk('religion_id', personKey('religion'), true), fk('occupation_id', personKey('occupation'), true),
    fk('education_id', 'education', true), fk('income_id', personKey('income'), true), fk('identification_type_id', personKey('identification-type'), true),
    fk('marital_status_id', personKey('marital-status'), true), fk('profession_id', personKey('profession'), true), fk('age_classification_id', personKey('age-classification'), true),
    flag('is_special_need'), flag('is_social_protection_card_recipient'), flag('is_deceased'),
  ], { hasProfile: true }),
  res('person', 'master', 'biodata', 'person/master/biodata', ['individual_id', 'height', 'weight', 'blood_type_id'], [
    pick('individual_id', 'individual', true), num('height', true, 0, 300), num('weight', true, 0, 700),
    fk('blood_type_id', personKey('blood-type'), true), flag('is_positive_blood_rhesus'),
    fk('hair_type_id', personKey('hair-type'), true), fk('hair_color_id', personKey('hair-color'), true), fk('eye_color_id', personKey('eye-color'), true),
    num('bust', true, 0, 500), num('waist', true, 0, 500), num('hip', true, 0, 500), num('arm_circumference', true, 0, 200),
    int('menarche_age', true, 0, 100), int('menopause_age', true, 0, 100),
  ]),
  // building
  ...[['category', 'categories'], ['condition', 'conditions'], ['room-type', 'room-types'], ['variety', 'varieties']].map(([s, p]) => ref('building', 'reference', s, p)),
  res('building', 'master', 'building', 'building/master/buildings', ['alphabet_code', 'name', 'total_floor'], [
    str('name', true), str('alphabet_code', false, 20), num('long', false, 0, 100000), num('wide', false, 0, 100000), num('high', false, 0, 100000), int('total_floor', false, 0, 500),
    fk('variety_id', 'building-reference-variety', true), fk('category_id', 'building-reference-category', true), fk('condition_id', 'building-reference-condition', true),
    pick('residence_id', 'contact-master-residence', true),
  ]),
  res('building', 'master', 'room', 'building/master/rooms', ['alphabet_code', 'name', 'building_id'], [
    str('name', true), str('alphabet_code', false, 20), num('long', false, 0, 100000), num('wide', false, 0, 100000), num('high', false, 0, 100000),
    fk('room_type_id', 'building-reference-room-type', true), fk('condition_id', 'building-reference-condition', true),
    pick('building_id', 'building-master-building', true), fk('unit_id', 'unit'),
  ]),
  // contact (owners are polymorphic: an id and a type name)
  ...[['electronic-mail-type', 'electronic-mail-types'], ['phone-type', 'phone-types'], ['residence-type', 'residence-types'], ['website-type', 'website-types']].map(([s, p]) => ref('contact', 'reference', s, p)),
  res('contact', 'master', 'electronic-mail', 'contact/master/electronic-mails', ['email_address', 'electronic_mailable_type'], [
    str('email_address', true), fk('electronic_mail_type_id', 'contact-reference-electronic-mail-type'), pick('electronic_mailable_id', 'individual', true), str('electronic_mailable_type', true, 100),
  ]),
  res('contact', 'master', 'phone', 'contact/master/phones', ['phone_number', 'phoneable_type'], [
    str('phone_number', true, 50), fk('phone_type_id', 'contact-reference-phone-type'), pick('phoneable_id', 'individual', true), str('phoneable_type', true, 100),
  ]),
  res('contact', 'master', 'website', 'contact/master/websites', ['website_url', 'websiteable_type'], [
    str('website_url', true, 500), fk('website_type_id', 'contact-reference-website-type'), pick('websiteable_id', 'individual', true), str('websiteable_type', true, 100),
  ]),
  res('contact', 'master', 'residence', 'contact/master/residences', ['street', 'citizens_association', 'neighborhood_association'], [
    str('street', true, 500), int('citizens_association', true, 0, 1000), int('neighborhood_association', true, 0, 1000),
    pick('province_id', 'location-province'), pick('regency_id', 'location-regency'), pick('sub_district_id', 'location-sub-district'), pick('village_id', 'location-village'),
    fk('residence_type_id', 'contact-reference-residence-type'), str('residenceable_type', false, 100), pick('residenceable_id', 'individual'),
    num('latitude', false, -90, 90), num('longitude', false, -180, 180), int('zoom', false, 0, 30),
  ]),
  // document: the API stores the file's metadata; the binary goes through `archives/upload`
  ref('document', 'reference', 'archive-type', 'archive-types'),
  res('document', 'transaction', 'archive', 'document/transaction/archives', ['name', 'mimetype', 'size', 'is_knowledge'], [
    str('name', true), str('dir', true, 500), str('mimetype', true, 100), int('size', false, 0, 2_000_000_000),
    fk('archive_type_id', 'document-reference-archive-type', true), str('archiveable_type', false, 100), pick('archiveable_id', 'individual'),
    str('description', false, 1000), flag('is_knowledge'),
  ], { extraLinks: [{ segment: 'upload', label: 'ad.upload' }, { segment: 'knowledge', label: 'ad.knowledgeBase' }] }),
  // literate (endpoints are top level)
  ...[['category', 'categories'], ['group', 'groups'], ['level', 'levels'], ['variety', 'varieties']].map(([s, p]) => reference(`literate-${s}`, `literate/${s}`, p, labelKey(s), { group: ['ad.literate'] })),
  {
    key: 'literate-education',
    path: 'literate/education',
    api: 'educations',
    titleKey: 'ad.education',
    group: ['ad.literate'],
    columns: ['code', 'alphabet_code', 'abbreviation', 'name'].map((field) => ({ label: labelKey(field), field })),
    fields: [int('code', true, 0, 99999), str('alphabet_code', true, 20), str('abbreviation', true, 50), str('name', true),
      fk('level_id', 'literate-level', true), fk('group_id', 'literate-group', true), fk('category_id', 'literate-category', true), fk('variety_id', 'literate-variety', true)],
  },
  // auth: users keep their credentials out of this form (no create here: it would need a password)
  {
    key: 'auth-user',
    path: 'auth/user',
    api: 'user',
    titleKey: 'ad.users',
    group: ['ad.auth'],
    columns: ['name', 'email', 'is_active'].map((field) => ({ label: labelKey(field), field })),
    fields: [str('name', true), str('email', true), pick('individual_id', 'individual', true), flag('is_active')],
    noCreate: true,
    customCreate: true,
  },
  res('auth', 'master', 'role', 'role', ['name', 'roleable_type'], [str('name', true, 100), pick('user_id', 'auth-user'), fk('position_type_id', 'position_type'), str('roleable_type', false, 100), pick('roleable_id', 'institution')], { path: 'auth/role', key: 'auth-role', titleKey: 'ad.roles', permissionOwner: 'role' }),
  res('auth', 'master', 'permission', 'permission', ['name', 'uri', 'is_open'], [str('name', true, 200), text('uri', labelKey('uri'), { max: 500 }), flag('is_open')], { path: 'auth/permission', key: 'auth-permission', titleKey: 'ad.permissions' }),
  res('auth', 'master', 'permission-position-type', 'permission-position-type', ['position_type_id', 'permission_id'], [fk('position_type_id', 'position_type', true), pick('permission_id', 'auth-permission', true)], { path: 'auth/permission-position-type', key: 'auth-permission-position-type', titleKey: 'ad.permissionPositionTypes' }),
  res('auth', 'master', 'permission-role', 'permission-role', ['role_id', 'permission_id'], [pick('role_id', 'auth-role', true), pick('permission_id', 'auth-permission', true)], { path: 'auth/permission-role', key: 'auth-permission-role', titleKey: 'ad.permissionRoles' }),
];
