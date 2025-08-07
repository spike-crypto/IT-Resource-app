sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("itsupport.controller.LandingPage", {
        
        onInit: function () {
            // Landing page initialization
            console.log("Landing page initialized");
        },

        onNavigateToUserView: function () {
            try {
                console.log("Navigating to user view");
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteUserView");
            } catch (error) {
                console.error("Navigation to user view failed:", error);
            }
        },

        onNavigateToSupportView: function () {
            try {
                console.log("=== Support Navigation Debug ===");
                console.log("Button clicked - navigating to support view");

                var oComponent = this.getOwnerComponent();
                console.log("Component:", oComponent);

                var oRouter = oComponent.getRouter();
                console.log("Router:", oRouter);

                console.log("Attempting to navigate to RouteSupportView...");
                oRouter.navTo("RouteSupportView");
                console.log("Navigation call completed");

            } catch (error) {
                console.error("Navigation to support view failed:", error);
                console.error("Error stack:", error.stack);
            }
        }
    });
});
