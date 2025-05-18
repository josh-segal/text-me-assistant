sequenceDiagram
    participant Employee
    participant Twilio
    participant MessageLambda
    participant EscalateLambda
    participant ManagerResponseLambda
    participant Manager
    participant Supabase

    %% Initial Employee Message
    Employee->>Twilio: Sends SMS
    Twilio->>MessageLambda: Webhook POST /message
    MessageLambda->>Supabase: Store message
    MessageLambda->>MessageLambda: AI processes message
    
    alt Message needs escalation
        MessageLambda->>EscalateLambda: Invoke with message details
        EscalateLambda->>Supabase: Log escalation
        EscalateLambda->>Twilio: Send SMS to manager
        Twilio->>Manager: Forward escalation message
        
        %% Manager's Response
        Manager->>Twilio: Responds to SMS
        Twilio->>ManagerResponseLambda: Webhook POST /manager-response
        ManagerResponseLambda->>Supabase: Lookup original employee
        ManagerResponseLambda->>Twilio: Send SMS to employee
        Twilio->>Employee: Forward manager's response
    else Normal response
        MessageLambda->>Twilio: Send AI response
        Twilio->>Employee: Forward AI response
    end
