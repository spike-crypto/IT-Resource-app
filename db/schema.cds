namespace it.support;

entity Department {
  key ID      : UUID;
      Name    : String(50);
      Head    : Association to Employee;
}

entity Employee {
  key ID          : UUID;
      Name        : String(100);
      Email       : String(100);
      Department  : Association to Department;
      Role        : String(50); // 'User' or 'SupportAgent'
      team_ID     : UUID;       // Foreign key to SupportTeam
}

entity SupportTeam {
  key ID         : UUID;
      Name       : String(100);
      Expertise  : String(100);  // e.g., 'Network', 'Hardware'

      Members    : Composition of many Employee
                    on Members.team_ID = $self.ID;
}

entity Ticket {
  key ID            : UUID;
      Description   : String(1000);
      RequestType   : String(100);   // from AI: "Network Issue"
      Urgency       : String(10);    // from AI: "High"
      AutoApproval  : Boolean;
      RouteTo       : String(100);   // e.g., "IT Desk"
      ResponseMsg   : String(2000);
      CreatedAt     : Timestamp default current_timestamp;
      Status        : String(20) default 'Open';

      RaisedBy      : Association to Employee;
      AssignedTo    : Association to SupportTeam;
}
