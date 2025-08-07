using { it.support as db } from '../db/schema';

// Define the service named ITService with explicit path
@path: '/odata/v4/it'
service ITService {

    // Expose the Ticket entity from the database model (db.Ticket)
    // It will be available in the API under the name "Ticket"
    entity Ticket as projection on db.Ticket;

    // You can also expose other entities here if you need them in the UI
    entity Employee    as projection on db.Employee;
    entity SupportTeam as projection on db.SupportTeam;
    entity Department  as projection on db.Department;

}