sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("itsupport.controller.SupportView", {
        
        onInit: function () {
            try {
                console.log("=== SupportView onInit ===");
                console.log("Initializing SupportView controller");

                // Initialize statistics model
                var oStatsModel = new JSONModel({
                    stats: {
                        open: 0,
                        inProgress: 0,
                        highPriority: 0,
                        resolvedToday: 0
                    }
                });
                this.getView().setModel(oStatsModel, "stats");
                console.log("Statistics model set successfully");

                // Load statistics with error handling
                console.log("Loading statistics...");

                // Try to load statistics immediately, but also set up fallback
                this._loadStatistics();

                // Also try to load after a short delay to ensure model is available
                setTimeout(function() {
                    console.log("Delayed statistics loading attempt");
                    this._loadStatistics();
                }.bind(this), 1000);

                console.log("SupportView initialization completed");

                // Add click handlers to statistics boxes after a short delay
                setTimeout(function() {
                    this._attachStatsBoxClickHandlers();
                }.bind(this), 500);

            } catch (error) {
                console.error("Error in SupportView onInit:", error);
                console.error("Error stack:", error.stack);
            }
        },

        _attachStatsBoxClickHandlers: function() {
            try {
                console.log("Attaching click handlers to stats boxes");

                // Open Tickets
                var oOpenTicketsBox = this.byId("openTicketsBox");
                if (oOpenTicketsBox) {
                    oOpenTicketsBox.attachBrowserEvent("click", function() {
                        console.log("Open tickets box clicked");
                        this._filterTicketsByStatus("Open");
                    }.bind(this));
                    oOpenTicketsBox.addStyleClass("clickableStatsBox");
                }

                // In Progress Tickets
                var oInProgressBox = this.byId("inProgressBox");
                if (oInProgressBox) {
                    oInProgressBox.attachBrowserEvent("click", function() {
                        console.log("In Progress tickets box clicked");
                        this._filterTicketsByStatus("In Progress");
                    }.bind(this));
                    oInProgressBox.addStyleClass("clickableStatsBox");
                }

                // High Priority Tickets
                var oHighPriorityBox = this.byId("highPriorityBox");
                if (oHighPriorityBox) {
                    oHighPriorityBox.attachBrowserEvent("click", function() {
                        console.log("High Priority tickets box clicked");
                        this._filterTicketsByUrgency(["High", "Critical"]);
                    }.bind(this));
                    oHighPriorityBox.addStyleClass("clickableStatsBox");
                }

                // Resolved Today Tickets
                var oResolvedTodayBox = this.byId("resolvedTodayBox");
                if (oResolvedTodayBox) {
                    oResolvedTodayBox.attachBrowserEvent("click", function() {
                        console.log("Resolved Today tickets box clicked");
                        this._filterTicketsByStatus("Resolved");
                    }.bind(this));
                    oResolvedTodayBox.addStyleClass("clickableStatsBox");
                }

                console.log("Stats box click handlers attached successfully");

            } catch (error) {
                console.error("Error attaching stats box click handlers:", error);
            }
        },

        _loadStatistics: function () {
            try {
                console.log("_loadStatistics called");
                var oModel = this.getView().getModel();
                var oStatsModel = this.getView().getModel("stats");

                console.log("Models retrieved - oModel:", oModel, "oStatsModel:", oStatsModel);

                if (!oModel) {
                    console.warn("Main OData model not available yet, will retry later");
                    return;
                }

                console.log("Model is available, proceeding with statistics loading");

                // Count open tickets
                console.log("Loading open tickets...");
                oModel.bindList("/Ticket", null, null, [new Filter("Status", FilterOperator.EQ, "Open")])
                    .requestContexts().then(function (aContexts) {
                        console.log("Open tickets loaded:", aContexts.length);
                        oStatsModel.setProperty("/stats/open", aContexts.length);
                    }).catch(function (error) {
                        console.error("Error loading open tickets:", error);
                    });

                // Count in progress tickets
                console.log("Loading in progress tickets...");
                oModel.bindList("/Ticket", null, null, [new Filter("Status", FilterOperator.EQ, "In Progress")])
                    .requestContexts().then(function (aContexts) {
                        console.log("In progress tickets loaded:", aContexts.length);
                        oStatsModel.setProperty("/stats/inProgress", aContexts.length);
                    }).catch(function (error) {
                        console.error("Error loading in progress tickets:", error);
                    });

                // Count high priority tickets
                console.log("Loading high priority tickets...");
                var aHighPriorityFilters = [
                    new Filter("Urgency", FilterOperator.EQ, "High"),
                    new Filter("Urgency", FilterOperator.EQ, "Critical")
                ];
                oModel.bindList("/Ticket", null, null, [new Filter({filters: aHighPriorityFilters, and: false})])
                    .requestContexts().then(function (aContexts) {
                        console.log("High priority tickets loaded:", aContexts.length);
                        oStatsModel.setProperty("/stats/highPriority", aContexts.length);
                    }).catch(function (error) {
                        console.error("Error loading high priority tickets:", error);
                    });

                // Count resolved today (simplified - just resolved status)
                console.log("Loading resolved tickets...");
                oModel.bindList("/Ticket", null, null, [new Filter("Status", FilterOperator.EQ, "Resolved")])
                    .requestContexts().then(function (aContexts) {
                        console.log("Resolved tickets loaded:", aContexts.length);
                        oStatsModel.setProperty("/stats/resolvedToday", aContexts.length);
                    }).catch(function (error) {
                        console.error("Error loading resolved tickets:", error);
                    });

                console.log("All statistics loading initiated");

            } catch (error) {
                console.error("Error in _loadStatistics:", error);
                console.error("Error stack:", error.stack);
            }
        },

        onRefresh: function () {
            var oTable = this.byId("allTicketsTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh();
            }
            this._loadStatistics();
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

        onFilterChange: function () {
            this._applyFilters();
        },

        onSearch: function (oEvent) {
            this._applyFilters();
        },

        onClearFilters: function () {
            this.byId("statusFilter").setSelectedKey("");
            this.byId("urgencyFilter").setSelectedKey("");
            this.byId("searchField").setValue("");
            this._applyFilters();
        },

        _applyFilters: function () {
            var oTable = this.byId("allTicketsTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            // Status filter
            var sStatus = this.byId("statusFilter").getSelectedKey();
            if (sStatus) {
                aFilters.push(new Filter("Status", FilterOperator.EQ, sStatus));
            }

            // Urgency filter
            var sUrgency = this.byId("urgencyFilter").getSelectedKey();
            if (sUrgency) {
                aFilters.push(new Filter("Urgency", FilterOperator.EQ, sUrgency));
            }

            // Search filter
            var sSearch = this.byId("searchField").getValue();
            if (sSearch) {
                aFilters.push(new Filter("Description", FilterOperator.Contains, sSearch));
            }

            oBinding.filter(aFilters);
        },

        _filterTicketsByStatus: function(sStatus) {
            try {
                console.log("Filtering tickets by status:", sStatus);
                var oTable = this.byId("allTicketsTable");
                var oBinding = oTable.getBinding("items");

                if (oBinding) {
                    var oFilter = new Filter("Status", FilterOperator.EQ, sStatus);
                    oBinding.filter([oFilter]);

                    // Update the status filter dropdown to reflect the selection
                    this.byId("statusFilter").setSelectedKey(sStatus);

                    // Clear other filters
                    this.byId("urgencyFilter").setSelectedKey("");
                    this.byId("searchField").setValue("");

                    console.log("Tickets filtered by status:", sStatus);
                }
            } catch (error) {
                console.error("Error filtering tickets by status:", error);
            }
        },

        _filterTicketsByUrgency: function(aUrgencyLevels) {
            try {
                console.log("Filtering tickets by urgency levels:", aUrgencyLevels);
                var oTable = this.byId("allTicketsTable");
                var oBinding = oTable.getBinding("items");

                if (oBinding) {
                    var aFilters = aUrgencyLevels.map(function(sUrgency) {
                        return new Filter("Urgency", FilterOperator.EQ, sUrgency);
                    });

                    var oCombinedFilter = new Filter({filters: aFilters, and: false});
                    oBinding.filter([oCombinedFilter]);

                    // Update the urgency filter dropdown to reflect the selection
                    if (aUrgencyLevels.includes("High")) {
                        this.byId("urgencyFilter").setSelectedKey("High");
                    }

                    // Clear other filters
                    this.byId("statusFilter").setSelectedKey("");
                    this.byId("searchField").setValue("");

                    console.log("Tickets filtered by urgency levels:", aUrgencyLevels);
                }
            } catch (error) {
                console.error("Error filtering tickets by urgency:", error);
            }
        },

        onTicketSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            var oContext = oSelectedItem.getBindingContext();
            var sTicketId = oContext.getProperty("ID");
            
            MessageToast.show("Selected ticket: " + sTicketId);
        },

        onAssignToMe: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            var sTicketId = oContext.getProperty("ID");
            
            MessageBox.confirm("Assign this ticket to yourself?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        // In a real app, you would update the AssignedTo field
                        MessageToast.show("Ticket " + sTicketId + " assigned to you");
                    }
                }
            });
        },

        onUpdateStatus: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            var sCurrentStatus = oContext.getProperty("Status");
            var sTicketId = oContext.getProperty("ID");
            
            var aStatusOptions = ["Open", "In Progress", "Resolved", "Closed"];
            var sNextStatus = "";
            
            switch (sCurrentStatus) {
                case "Open":
                    sNextStatus = "In Progress";
                    break;
                case "In Progress":
                    sNextStatus = "Resolved";
                    break;
                case "Resolved":
                    sNextStatus = "Closed";
                    break;
                default:
                    sNextStatus = "Open";
            }
            
            MessageBox.confirm("Update status to '" + sNextStatus + "'?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oContext.setProperty("Status", sNextStatus);
                        oContext.getModel().submitBatch("updateGroup").then(function () {
                            MessageToast.show("Status updated successfully");
                            this._loadStatistics();
                        }.bind(this));
                    }
                }.bind(this)
            });
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
        }
    });
});
