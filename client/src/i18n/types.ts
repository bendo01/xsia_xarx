export type Locale = 'id' | 'en';

export interface TranslationSchema {
    common: {
        ok: string;
        cancel: string;
        save: string;
        saved: string;
        delete: string;
        edit: string;
        create: string;
        add: string;
        remove: string;
        search: string;
        filter: string;
        back: string;
        next: string;
        submit: string;
        refresh: string;
        close: string;
        loading: string;
        success: string;
        error: string;
        warning: string;
        info: string;
        confirm: string;
        actions: string;
        details: string;
        status: string;
        name: string;
        email: string;
        role: string;
        code: string;
        description: string;
        noData: string;
        selectOption: string;
        view: string;
        download: string;
        upload: string;
        yes: string;
        no: string;
        welcome: string;
    };
    roles: {
        administrator: string;
        course_department: string;
        student: string;
        lecturer: string;
        candidate: string;
        rectorat: string;
        user: string;
        guest: string;
    };
    nav: {
        brandSubtitle: string;
        activeRole: string;
        switchRole: string;
        rolesAvailable: string;
        currentRole: string;
        nim: string;
        guestMode: string;
        roleMode: string;
        workspaceMenu: string;
        systemActivity: string;
        realtimeGatewayActive: string;
        academicSessionSynced: string;
        signInJwt: string;
        sessionLogin: string;
        signOut: string;
        accountDetails: string;
        toggleDarkMode: string;
        toggleMenu: string;
        closeSidebar: string;
        language: string;
        indonesian: string;
        english: string;
        selectLanguage: string;
    };
    auth: {
        login: {
            title: string;
            subtitle: string;
            description: string;
            emailLabel: string;
            emailPlaceholder: string;
            passwordLabel: string;
            passwordPlaceholder: string;
            rememberMe: string;
            forgotPassword: string;
            signInButton: string;
            sessionLoginLink: string;
            authenticating: string;
            welcomeBack: string;
            signedOut: string;
            roleSwitched: string;
            validationEmailRequired: string;
            validationPasswordRequired: string;
            validationBothRequired: string;
            invalidCredentials: string;
            networkError: string;
        };
        sessionLogin: {
            title: string;
            subtitle: string;
            description: string;
            startSessionButton: string;
            sessionStarted: string;
            backToJwt: string;
            invalidSession: string;
        };
    };
    menu: {
        guest: {
            home: string;
            authentication: string;
            jwtSignIn: string;
            sessionSignIn: string;
            publicInfo: string;
            institutionProfile: string;
            admissionsPmb: string;
        };
        student: {
            dashboardProfile: string;
            academicAdvisers: string;
            academicActivities: string;
            semesterActivities: string;
            courseEnrollment: string;
            admittedStudents: string;
        };
        lecturer: {
            teachingActivities: string;
            lecturerProfile: string;
        };
        administrator: {
            adminDashboard: string;
            modelsTree: string;
            entitiesCount: string;
        };
        candidate: {
            candidateDashboard: string;
            admissionProcess: string;
            selectionPhases: string;
            registrationTrack: string;
            documentChecklist: string;
            pathwaysScholarships: string;
        };
        rectorat: {
            executiveDashboard: string;
            strategicAnalytics: string;
            enrollmentTrends: string;
            institutionalGovernance: string;
            facultiesDepartments: string;
            qualityAssurance: string;
        };
        courseDepartment: {
            departmentDashboard: string;
            curriculumCourses: string;
            curriculumTypes: string;
            courseGroups: string;
            competencesOutcomes: string;
            evaluationBase: string;
            gradingTypes: string;
        };
    };
    notFound: {
        title: string;
        subtitle: string;
        message: string;
        returnHome: string;
        quickLinks: string;
        copyUrl: string;
        copied: string;
        homePageTitle: string;
        homePageDesc: string;
        userDashboardTitle: string;
        userDashboardDesc: string;
        personCatalogTitle: string;
        personCatalogDesc: string;
        signInTitle: string;
        signInDesc: string;
    };
}
