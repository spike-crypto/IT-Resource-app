sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("itsupport.controller.UserView", {
        
        onInit: function () {
            // Initialize local model for form data
            var oFormModel = new JSONModel({
                description: "",
                userName: "",
                userEmail: "",
                raisedBy: "",
                currentUser: {
                    ID: "e2", // Default user - Alice Smith
                    Name: "Alice Smith",
                    Email: "alice.smith@example.com"
                }
            });
            this.getView().setModel(oFormModel, "form");

            // Initialize response model for success panel
            var oResponseModel = new JSONModel({
                ticketId: "",
                classification: "",
                department: "",
                message: ""
            });
            this.getView().setModel(oResponseModel, "response");

            // Initialize login model for email-based authentication
            var oLoginModel = new JSONModel({
                email: "",
                currentUserEmail: "",
                isLoggedIn: false
            });
            this.getView().setModel(oLoginModel, "login");

            // Set default raised by
            oFormModel.setProperty("/raisedBy", "e2");

            // Temporarily disable user filter to test new response panel
            // TODO: Fix user filter issue later
            console.log("User filter temporarily disabled for testing - v2.0");
            this._testNewResponsePanel();
        },

        _testNewResponsePanel: function() {
            console.log("Testing new response panel functionality - v2.0");
            // Check if the new panels exist
            var oLoadingPanel = this.byId("loadingPanel");
            var oResponsePanel = this.byId("responsePanel");

            if (oLoadingPanel && oResponsePanel) {
                console.log("✅ New response panels found in view!");
                console.log("Loading panel:", oLoadingPanel);
                console.log("Response panel:", oResponsePanel);
            } else {
                console.log("❌ New response panels NOT found - still using old view");
                console.log("Loading panel exists:", !!oLoadingPanel);
                console.log("Response panel exists:", !!oResponsePanel);
            }
        },

        _applyUserFilter: function () {
            var oTable = this.byId("myTicketsTable");
            var oBinding = oTable.getBinding("items");
            var sCurrentUserId = this.getView().getModel("form").getProperty("/currentUser/ID");

            if (oBinding && sCurrentUserId) {
                console.log("Applying user filter for user ID:", sCurrentUserId);
                // Use the foreign key field for filtering - ensure string value is properly handled
                var oFilter = new Filter("RaisedBy_ID", FilterOperator.EQ, String(sCurrentUserId));
                oBinding.filter([oFilter]);
                console.log("User filter applied successfully");
            } else {
                console.log("Cannot apply user filter - binding or user ID not available");
            }
        },

        onSubmitTicket: function () {
            var oFormModel = this.getView().getModel("form");
            var sDescription = oFormModel.getProperty("/description");
            var sUserName = oFormModel.getProperty("/userName");
            var sUserEmail = oFormModel.getProperty("/userEmail");

            // Validation
            if (!sDescription || !sDescription.trim()) {
                MessageBox.error("Please enter a problem description.");
                return;
            }

            if (!sUserName || !sUserName.trim()) {
                MessageBox.error("Please enter your name.");
                return;
            }

            if (!sUserEmail || !sUserEmail.trim()) {
                MessageBox.error("Please enter your email address.");
                return;
            }

            // Show loading panel and hide form
            console.log("=== TICKET CREATION DEBUG ===");
            console.log("About to show loading panel...");
            this._showLoadingPanel();
            console.log("Loading panel should now be visible");

            // Create ticket data (using default user ID but custom name/email in description)
            var sFullDescription = sDescription.trim() + "\n\n[Contact: " + sUserName + " - " + sUserEmail + "]";
            var oTicketData = {
                Description: sFullDescription,
                RaisedBy_ID: "e2", // Use default user ID
                Status: "Open"
            };

            // Get OData model and create ticket
            var oModel = this.getView().getModel();
            console.log("Creating ticket with data:", oTicketData);
            console.log("OData model:", oModel);

            // Try using jQuery AJAX as a fallback
            var that = this;
            $.ajax({
                url: "/odata/v4/it/Ticket",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oTicketData),
                success: function(data, textStatus, xhr) {
                    console.log("Ticket created successfully via AJAX:", data);
                    var sTicketId = data.ID;
                    console.log("Ticket ID:", sTicketId);

                    // Clear form
                    oFormModel.setProperty("/description", "");
                    oFormModel.setProperty("/userName", "");
                    oFormModel.setProperty("/userEmail", "");

                    // Wait for AI processing to complete
                    that._waitForAIProcessing(sTicketId);
                },
                error: function(xhr, textStatus, errorThrown) {
                    console.error("AJAX ticket creation failed:", xhr, textStatus, errorThrown);
                    console.error("Response text:", xhr.responseText);
                    that._hideLoadingPanel();
                    MessageBox.error("Failed to create ticket: " + (xhr.responseText || errorThrown));
                }
            });

            return; // Skip the OData V4 approach for now

            try {
                var oListBinding = oModel.bindList("/Ticket");
                console.log("List binding created:", oListBinding);

                oListBinding.create(oTicketData).created().then(function (oContext) {
                    console.log("Ticket creation successful, context:", oContext);

                    if (!oContext) {
                        throw new Error("Context is undefined - ticket creation failed");
                    }

                    var sTicketId = oContext.getProperty("ID");
                    console.log("Ticket created with ID:", sTicketId);

                    // Clear form
                    oFormModel.setProperty("/description", "");
                    oFormModel.setProperty("/userName", "");
                    oFormModel.setProperty("/userEmail", "");

                    // Wait for AI processing to complete
                    this._waitForAIProcessing(sTicketId);

                }.bind(this)).catch(function (oError) {
                    console.error("Failed to create ticket:", oError);
                    console.error("Error details:", oError.message, oError.stack);
                    this._hideLoadingPanel();
                    MessageBox.error("Failed to create ticket: " + (oError.message || "Unknown error"));
                }.bind(this));

            } catch (oError) {
                console.error("Exception during ticket creation:", oError);
                this._hideLoadingPanel();
                MessageBox.error("Failed to create ticket: " + oError.message);
            }
        },

        _showLoadingPanel: function() {
            console.log("_showLoadingPanel called");
            var oCreatePanel = this.byId("createTicketPanel");
            var oLoadingPanel = this.byId("loadingPanel");
            var oResponsePanel = this.byId("responsePanel");

            console.log("Panels found:", {
                createPanel: !!oCreatePanel,
                loadingPanel: !!oLoadingPanel,
                responsePanel: !!oResponsePanel
            });

            if (oCreatePanel) oCreatePanel.setVisible(false);
            if (oLoadingPanel) oLoadingPanel.setVisible(true);
            if (oResponsePanel) oResponsePanel.setVisible(false);

            console.log("Panel visibility set - loading should be visible now");
        },

        _hideLoadingPanel: function() {
            this.byId("loadingPanel").setVisible(false);
        },

        _showResponsePanel: function() {
            console.log("=== SHOWING RESPONSE PANEL ===");
            var oResponseModel = this.getView().getModel("response");
            console.log("Current response model data:", JSON.stringify(oResponseModel.getData(), null, 2));

            this.byId("loadingPanel").setVisible(false);
            this.byId("responsePanel").setVisible(true);

            console.log("Response panel should now be visible with updated data");
        },

        _waitForAIProcessing: function(sTicketId) {
            // Poll the ticket to check if AI processing is complete
            var iAttempts = 0;
            var iMaxAttempts = 10; // Wait up to 10 seconds

            var fnCheckTicket = function() {
                iAttempts++;
                console.log("Checking ticket AI processing, attempt:", iAttempts);

                // Use AJAX to check ticket status (compatible with OData V4)
                $.ajax({
                    url: "/odata/v4/it/Ticket(" + sTicketId + ")",
                    method: "GET",
                    success: function(oData) {
                        console.log("=== AI POLLING RESULT ===");
                        console.log("Attempt:", iAttempts, "of", iMaxAttempts);
                        console.log("Full ticket data:", JSON.stringify(oData, null, 2));
                        console.log("RequestType:", oData.RequestType);
                        console.log("ResponseMsg:", oData.ResponseMsg);
                        console.log("RouteTo:", oData.RouteTo);

                        // Check if AI processing is complete (has RequestType and ResponseMsg)
                        if (oData.RequestType && oData.ResponseMsg && oData.RequestType !== "Uncategorized") {
                            console.log("✅ AI processing complete - calling _displayTicketResponse");
                            this._displayTicketResponse(oData);
                        } else if (iAttempts < iMaxAttempts) {
                            console.log("⏳ AI still processing, continuing to poll...");
                            // Continue polling
                            setTimeout(fnCheckTicket.bind(this), 1000);
                        } else {
                            console.log("⏰ AI processing timeout, showing basic response");
                            // Timeout - show basic response
                            this._displayBasicResponse(oData);
                        }
                    }.bind(this),
                    error: function(xhr, textStatus, errorThrown) {
                        console.error("Error reading ticket:", xhr, textStatus, errorThrown);
                        this._hideLoadingPanel();
                        MessageBox.error("Error retrieving ticket information");
                    }.bind(this)
                });
            }.bind(this);

            // Start polling after a short delay
            setTimeout(fnCheckTicket, 2000);
        },

        _displayTicketResponse: function(oTicketData) {
            console.log("=== DISPLAYING TICKET RESPONSE ===");
            console.log("Ticket data received:", oTicketData);

            var oResponseModel = this.getView().getModel("response");
            console.log("Response model:", oResponseModel);

            // Format ticket ID for display
            var sDisplayId = "#" + oTicketData.ID.substring(0, 8).toUpperCase();
            console.log("Display ID:", sDisplayId);

            // Set response data
            var oResponseData = {
                ticketId: sDisplayId,
                classification: oTicketData.RequestType || "General Request",
                department: oTicketData.RouteTo || "IT Support",
                message: oTicketData.ResponseMsg || "Thank you for your request. Our support team will review it and get back to you soon."
            };

            console.log("Setting response data:", oResponseData);
            oResponseModel.setData(oResponseData);

            console.log("Response model data after setting:", oResponseModel.getData());

            this._showResponsePanel();
            this.onRefresh(); // Refresh the tickets table
        },

        _displayBasicResponse: function(oTicketData) {
            var oResponseModel = this.getView().getModel("response");

            // Format ticket ID for display
            var sDisplayId = "#" + oTicketData.ID.substring(0, 8).toUpperCase();

            // Set basic response data
            oResponseModel.setData({
                ticketId: sDisplayId,
                classification: "General Request",
                department: "IT Support",
                message: "Thank you for submitting your support request. Our team has received your ticket and will review it shortly. You will receive updates on the progress via email."
            });

            this._showResponsePanel();
            this.onRefresh(); // Refresh the tickets table
        },

        onRefresh: function () {
            var oTable = this.byId("myTicketsTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh();
                // Reapply user filter after refresh
                this._applyUserFilter();
            }
        },

        onNavigateToHome: function () {
            try {
                console.log("Navigating to home/landing page");
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteLandingPage");
            } catch (error) {
                console.error("Navigation to home failed:", error);
            }
        },

        onNavBack: function () {
            try {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteLandingPage");
            } catch (error) {
                console.error("Navigation back failed:", error);
            }
        },

        onTicketSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            var oContext = oSelectedItem.getBindingContext();
            var sTicketId = oContext.getProperty("ID");

            console.log("Ticket selected:", sTicketId);
            // Future: Navigate to ticket details view
        },

        onViewMyTickets: function() {
            // Hide response panel and show tickets table
            this.byId("responsePanel").setVisible(false);
            this.byId("createTicketPanel").setVisible(true);

            // Scroll to tickets table
            var oTicketsPanel = this.byId("myTicketsPanel");
            if (oTicketsPanel) {
                oTicketsPanel.getDomRef().scrollIntoView({ behavior: 'smooth' });
            }
        },

        onCreateAnotherTicket: function() {
            // Hide response panel and show create form
            this.byId("responsePanel").setVisible(false);
            this.byId("createTicketPanel").setVisible(true);

            // Clear form and focus on description
            var oFormModel = this.getView().getModel("form");
            oFormModel.setProperty("/description", "");

            // Focus on description field
            setTimeout(function() {
                var oDescriptionInput = this.byId("descriptionInput");
                if (oDescriptionInput) {
                    oDescriptionInput.focus();
                }
            }.bind(this), 100);
        },

        formatStatusState: function (sStatus) {
            switch (sStatus) {
                case "Open":
                    return "Warning";
                case "In Progress":
                    return "Information";
                case "Resolved":
                    return "Success";
                case "Closed":
                    return "None";
                default:
                    return "None";
            }
        },

        formatUrgencyState: function (sUrgency) {
            switch (sUrgency) {
                case "Critical":
                    return "Error";
                case "High":
                    return "Warning";
                case "Medium":
                    return "Information";
                case "Low":
                    return "Success";
                default:
                    return "None";
            }
        },

        formatUrgencyState: function (sUrgency) {
            switch (sUrgency) {
                case "Critical":
                    return "Error";
                case "High":
                    return "Warning";
                case "Medium":
                    return "Information";
                case "Low":
                    return "Success";
                default:
                    return "None";
            }
        },

        // Formatter functions for professional table
        formatRelativeTime: function(sCreatedAt) {
            if (!sCreatedAt) return "";

            var oCreatedDate = new Date(sCreatedAt);
            var oNow = new Date();
            var iDiffMs = oNow - oCreatedDate;
            var iDiffMinutes = Math.floor(iDiffMs / (1000 * 60));
            var iDiffHours = Math.floor(iDiffMs / (1000 * 60 * 60));
            var iDiffDays = Math.floor(iDiffMs / (1000 * 60 * 60 * 24));

            if (iDiffMinutes < 1) {
                return "Just now";
            } else if (iDiffMinutes < 60) {
                return iDiffMinutes + " minutes ago";
            } else if (iDiffHours < 24) {
                return iDiffHours + " hour" + (iDiffHours > 1 ? "s" : "") + " ago";
            } else {
                return iDiffDays + " day" + (iDiffDays > 1 ? "s" : "") + " ago";
            }
        },

        formatTicketId: function(sId) {
            if (!sId) return "";
            // Return first 8 characters with # prefix
            return "#" + sId.substring(0, 8).toUpperCase();
        },

        // Email-based login functionality
        onEmailLogin: function() {
            var oLoginModel = this.getView().getModel("login");
            var sEmail = oLoginModel.getProperty("/email");

            // Validation
            if (!sEmail || !sEmail.trim()) {
                MessageBox.error("Please enter your email address.");
                return;
            }

            // Simple email format validation
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(sEmail)) {
                MessageBox.error("Please enter a valid email address.");
                return;
            }

            console.log("Email login attempt for:", sEmail);

            // Set logged in state
            oLoginModel.setProperty("/currentUserEmail", sEmail);
            oLoginModel.setProperty("/isLoggedIn", true);

            // Show welcome message and sign out option
            this.byId("welcomeMessage").setVisible(true);
            this.byId("welcomeMessage").setText("Welcome back, " + sEmail + "! Showing your tickets below.");
            this.byId("signOutBox").setVisible(true);

            // Show the tickets table (was hidden by default)
            this.byId("myTicketsPanel").setVisible(true);

            // Filter tickets by email
            this._filterTicketsByEmail(sEmail);

            // Clear the input field
            oLoginModel.setProperty("/email", "");
        },

        onSignOut: function() {
            var oLoginModel = this.getView().getModel("login");

            // Reset login state
            oLoginModel.setProperty("/currentUserEmail", "");
            oLoginModel.setProperty("/isLoggedIn", false);
            oLoginModel.setProperty("/email", "");

            // Hide welcome message and sign out option
            this.byId("welcomeMessage").setVisible(false);
            this.byId("signOutBox").setVisible(false);

            // Hide the tickets table again
            this.byId("myTicketsPanel").setVisible(false);

            // Remove ticket filter (show all tickets)
            this._clearTicketFilter();

            MessageBox.success("You have been signed out successfully.");
        },

        _filterTicketsByEmail: function(sEmail) {
            var oTable = this.byId("myTicketsTable");
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                console.log("Filtering tickets for email:", sEmail);

                // Filter by email in the contact information within Description
                var oFilter = new Filter("Description", FilterOperator.Contains, sEmail);
                oBinding.filter([oFilter]);

                console.log("Ticket filter applied for user:", sEmail);
            }
        },

        _clearTicketFilter: function() {
            var oTable = this.byId("myTicketsTable");
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.filter([]);
                console.log("Ticket filter cleared - showing all tickets");
            }
        }
    });
});
