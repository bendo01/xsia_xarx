import { describe, expect, it } from 'vitest';
import { APP_NAME, titleFromPath } from './pageTitle';

describe('titleFromPath', () => {
    it('uses the app name for the home page', () => {
        expect(titleFromPath('/')).toBe(APP_NAME);
    });

    it('names the page and the area', () => {
        expect(titleFromPath('/administrator/agent/chatbot')).toBe(`Chatbot - Administrator - ${APP_NAME}`);
        expect(titleFromPath('/student/academic/student/master')).toBe(`Student - Mahasiswa - ${APP_NAME}`);
    });

    it('turns create/edit into an action and ignores ids', () => {
        expect(titleFromPath('/administrator/location/province/create')).toBe(`Tambah Province - Administrator - ${APP_NAME}`);
        expect(titleFromPath('/administrator/location/province/0198f0a2-1111-7222-8333-444455556666/edit')).toBe(
            `Ubah Province - Administrator - ${APP_NAME}`,
        );
    });

    it('humanizes kebab-case pages without an area', () => {
        expect(titleFromPath('/authentification/forgot-password')).toBe(`Lupa Kata Sandi - Autentikasi - ${APP_NAME}`);
    });
});
