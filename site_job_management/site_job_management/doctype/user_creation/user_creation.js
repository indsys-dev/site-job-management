// Copyright (c) 2026, Indsys and contributors
// For license information, please see license.txt

frappe.ui.form.on("User Creation", {
    refresh(frm) {

        // Check if logged in user has specific role
        if (frappe.user.has_role("QS Manager")) {

            frm.set_df_property("category", "options", [
                "",
                "QS Manager",
                "QS Engineer - PPC",
                "QS Engineer",
                "Requester Engineer",
                "Client / Consultant Engineer",
                "QC Engineer"
            ]);


            frm.set_df_property("role_profile", "options", [
                "",
                "QS Manager",
                "QS Engineer - PPC",
                "QS Engineer",
                "Requester Engineer",
                "Client / Consultant Engineer",
                "QC Engineer"
            ]);

        } else if (frappe.user.has_role("QS Engineer - PPC")) {

            frm.set_df_property("category", "options", [
                "",
                "QS Engineer",
                "Requester Engineer",
                "Client / Consultant Engineer",
                "QC Engineer"
            ]);

            frm.set_df_property("role_profile", "options", [
                "",
                "QS Engineer",
                "Requester Engineer",
                "Client / Consultant Engineer",
                "QC Engineer"
            ]);


        } else {

            frm.set_df_property("category", "options", [
                "",
            ]);

            frm.set_df_property("role_profile", "options", [
                "",
            ]);
        }





    }
});
