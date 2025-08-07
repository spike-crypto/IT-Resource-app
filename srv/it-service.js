const cds = require('@sap/cds');
const axios = require('axios');

module.exports = cds.service.impl(async function () {
  const { Ticket } = this.entities;

  // Set default ticket status before insert (non-blocking)
  this.before('CREATE', Ticket, (req) => {
    req.data.Status = 'Open';
  });

  // After DB insert, run AI and update ticket (non-blocking)
  this.after('CREATE', Ticket, (data, req) => {
    // Run AI classification asynchronously without blocking the response
    setImmediate(async () => {
      try {
        console.log("[AI Classification] - Starting for ticket:", data.ID);

        const aiResponse = await axios.post(
          'https://it-resource-production.up.railway.app/classify',
          { query: data.Description },
          { timeout: 15000 } // 15 seconds timeout
        );

        const classification = aiResponse.data;
        console.log("[AI Classification] - Response received:", classification);

        await UPDATE(Ticket).set({
          RequestType: classification.request_type || 'Uncategorized',
          Urgency: classification.urgency || 'Low',
          AutoApproval: classification.auto_approval === 'Yes',
          RouteTo: classification.route_to || 'IT Desk',
          ResponseMsg: classification.response_message || 'We received your request.'
        }).where({ ID: data.ID });

        console.log("[AI Classification] - Ticket updated successfully:", data.ID);

      } catch (error) {
        console.error("[AI Classification Error] - Failed for ticket", data.ID, ":", error.message);
      }
    });
  });
  this.after('UPDATE', Ticket, async (data, req) => {
    
    // CONDITION: Only proceed if the RequestType is now "Hardware Request"
    // AND we have NOT already started a workflow for this specific ticket.
    if (data.RequestType === 'Hardware Request' && !data.WorkflowStarted) {

      // Run this in the background to not block the main process
      setImmediate(async () => {
        try {
          console.log(`[BPA Workflow] - Triggering for Hardware Request Ticket:`, data.ID);
          
          // 1. Connect to the BPA service defined in package.json
          const bpa = await cds.connect.to('bpa');

          // 2. Prepare the payload using the correct format we discovered
          const payload = {
            definitionId: "us10.ffcf7e90trial.hardwarerequest.hardwarePOWorkflow",
            context: {
              // Map the data from our CAPM Ticket entity to the workflow's context fields
              ticketID: data.ID,
              requestType: data.RequestType,
              employeeName: req.user.id, // The ID of the logged-in user
              // Note: you may need a description field in your BPA form as well
              // description: data.Description, 
              requestedDate: new Date().toISOString().slice(0, 10), // Use today's date
            }
          };
          await bpa.tx(req).post('/workflow/rest/v1/workflow-instances', payload);
          console.log(`[BPA Workflow] - Successfully started for Ticket:`, data.ID);

          // 4. IMPORTANT: Set the WorkflowStarted flag to true to prevent duplicates.
          await UPDATE(Ticket, data.ID).with({ WorkflowStarted: true });

        } catch (error) {
          console.error(`[BPA Workflow Error] - Failed to start for Ticket`, data.ID, ":", error.message);
        }
      });
    }
  });
  
});
