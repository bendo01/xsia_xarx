export const configuration = {
    institutionId: import.meta.env.CURRENT_INSTITUTION_ID || '00000000-0000-0000-0000-000000000000',
    institutionCode: import.meta.env.VITE_INSTITUTION_CODE || import.meta.env.CURRENT_INSTITUTION_CODE || '000000',
};

export default configuration;
