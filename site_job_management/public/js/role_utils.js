frappe.provide("site_job_management.security");

site_job_management.security.role_manager = {

    get_user_roles: function () {
        return frappe.user_roles || [];
    },

    has_role: function (role_name) {
        return this.get_user_roles().includes(role_name);
    },

    has_any_role: function (role_list) {
        let user_roles = this.get_user_roles();
        return role_list.some(role => user_roles.includes(role));
    },

    print_roles: function () {
        console.log("Logged in user:", frappe.session.user);
        console.log("User Roles:", this.get_user_roles());
    }
};