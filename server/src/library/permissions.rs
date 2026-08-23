#[derive(Clone, Debug)]
pub struct PermissionDefinition {
    pub name: &'static str,
    pub uri: &'static str,
    pub is_open: bool,
    pub description: &'static str,
}

pub fn get_system_permissions() -> Vec<PermissionDefinition> {
    vec![
        // ── Person Master ──
        PermissionDefinition {
            name: "person.master.biodata",
            uri: "api/v1/person/master/biodata",
            is_open: false,
            description: "Person master biodata management",
        },
        PermissionDefinition {
            name: "person.master.individual",
            uri: "api/v1/person/master/individual",
            is_open: false,
            description: "Person master individual management",
        },

        // ── Person Reference ──
        PermissionDefinition {
            name: "person.reference.age_classification",
            uri: "api/v1/person/reference/age-classification",
            is_open: false,
            description: "Age classification reference data",
        },
        PermissionDefinition {
            name: "person.reference.blood_type",
            uri: "api/v1/person/reference/blood-type",
            is_open: false,
            description: "Blood type reference data",
        },
        PermissionDefinition {
            name: "person.reference.eye_color",
            uri: "api/v1/person/reference/eye-color",
            is_open: false,
            description: "Eye color reference data",
        },
        PermissionDefinition {
            name: "person.reference.gender",
            uri: "api/v1/person/reference/gender",
            is_open: false,
            description: "Gender reference data",
        },
        PermissionDefinition {
            name: "person.reference.hair_color",
            uri: "api/v1/person/reference/hair-color",
            is_open: false,
            description: "Hair color reference data",
        },
        PermissionDefinition {
            name: "person.reference.hair_type",
            uri: "api/v1/person/reference/hair-type",
            is_open: false,
            description: "Hair type reference data",
        },
        PermissionDefinition {
            name: "person.reference.identification_type",
            uri: "api/v1/person/reference/identification-type",
            is_open: false,
            description: "Identification type reference data",
        },
        PermissionDefinition {
            name: "person.reference.income",
            uri: "api/v1/person/reference/income",
            is_open: false,
            description: "Income range reference data",
        },
        PermissionDefinition {
            name: "person.reference.marital_status",
            uri: "api/v1/person/reference/marital-status",
            is_open: false,
            description: "Marital status reference data",
        },
        PermissionDefinition {
            name: "person.reference.occupation",
            uri: "api/v1/person/reference/occupation",
            is_open: false,
            description: "Occupation reference data",
        },
        PermissionDefinition {
            name: "person.reference.profession",
            uri: "api/v1/person/reference/profession",
            is_open: false,
            description: "Profession reference data",
        },
        PermissionDefinition {
            name: "person.reference.relative_type",
            uri: "api/v1/person/reference/relative-type",
            is_open: false,
            description: "Relative type reference data",
        },
        PermissionDefinition {
            name: "person.reference.religion",
            uri: "api/v1/person/reference/religion",
            is_open: false,
            description: "Religion reference data",
        },

        // ── Literate Module ──
        PermissionDefinition {
            name: "literate.categories",
            uri: "api/v1/categories",
            is_open: false,
            description: "Manage literate categories",
        },
        PermissionDefinition {
            name: "literate.educations",
            uri: "api/v1/educations",
            is_open: false,
            description: "Manage literate educations",
        },
        PermissionDefinition {
            name: "literate.groups",
            uri: "api/v1/groups",
            is_open: false,
            description: "Manage literate groups",
        },
        PermissionDefinition {
            name: "literate.levels",
            uri: "api/v1/levels",
            is_open: false,
            description: "Manage literate levels",
        },
        PermissionDefinition {
            name: "literate.varieties",
            uri: "api/v1/varieties",
            is_open: false,
            description: "Manage literate varieties",
        },

        // ── Auth Module ──
        PermissionDefinition {
            name: "auth.permission",
            uri: "api/v1/permission",
            is_open: false,
            description: "Manage system permissions",
        },
        PermissionDefinition {
            name: "auth.permission_role",
            uri: "api/v1/permission-role",
            is_open: false,
            description: "Manage permission role bindings",
        },
        PermissionDefinition {
            name: "auth.role",
            uri: "api/v1/role",
            is_open: false,
            description: "Manage roles",
        },
        PermissionDefinition {
            name: "auth.user",
            uri: "api/v1/user",
            is_open: false,
            description: "Manage user accounts",
        },
    ]
}
