import { CrmDatabase } from './db.ts';

export function seedDatabase(db: CrmDatabase) {
  // Clear any existing data
  db.clearAll();

  // 1. Organizations
  const org1 = db.createOrganization({
    name: 'Apex Cloud Solutions',
    website: 'https://apexcloud.example.com',
    industry: 'Cloud Infrastructure & DevOps',
    notes: 'Fast-growing SaaS provider looking to modernize their multi-region cloud observability.'
  });

  const org2 = db.createOrganization({
    name: 'Horizon Logistics',
    website: 'https://horizonlogistics.example.com',
    industry: 'Supply Chain & Freight',
    notes: 'Global freight operator managing 400+ vehicle fleet and port dispatch operations.'
  });

  const org3 = db.createOrganization({
    name: 'Vertex Health',
    website: 'https://vertexhealth.example.com',
    industry: 'Healthcare Technology',
    notes: 'HIPAA-compliant telehealth platform scaling to enterprise clinic networks.'
  });

  const org4 = db.createOrganization({
    name: 'Beacon Media Labs',
    website: 'https://beaconmedia.example.com',
    industry: 'Digital Marketing & Publishing',
    notes: 'Omnichannel creative and content syndication agency with 120 employees.'
  });

  const org5 = db.createOrganization({
    name: 'Crestline Financial',
    website: 'https://crestlinefin.example.com',
    industry: 'Wealth Management',
    notes: 'Regional private banking and wealth management firm expanding digital client portal.'
  });

  const org6 = db.createOrganization({
    name: 'Nova Robotics',
    website: 'https://novarobotics.example.com',
    industry: 'Industrial Automation',
    notes: 'Specializes in warehouse robotic arms and autonomous mobile robots (AMRs).'
  });

  // 2. Contacts
  const c1 = db.createContact({
    name: 'Sarah Chen',
    email: 'sarah.chen@apexcloud.example.com',
    phone: '+1 (555) 234-5678',
    job_title: 'VP of Engineering',
    organization_id: org1.id,
    status: 'customer'
  });

  const c2 = db.createContact({
    name: 'Marcus Brody',
    email: 'mbrody@apexcloud.example.com',
    phone: '+1 (555) 234-5679',
    job_title: 'Director of Security',
    organization_id: org1.id,
    status: 'qualified'
  });

  const c3 = db.createContact({
    name: 'Elena Rostova',
    email: 'elena@horizonlogistics.example.com',
    phone: '+1 (555) 345-6789',
    job_title: 'Chief Operating Officer',
    organization_id: org2.id,
    status: 'customer'
  });

  const c4 = db.createContact({
    name: 'David Kim',
    email: 'dkim@vertexhealth.example.com',
    phone: '+1 (555) 456-7890',
    job_title: 'Head of Clinical Systems',
    organization_id: org3.id,
    status: 'qualified'
  });

  const c5 = db.createContact({
    name: 'Rachel Adams',
    email: 'rachel.a@beaconmedia.example.com',
    phone: '+1 (555) 567-8901',
    job_title: 'Managing Director',
    organization_id: org4.id,
    status: 'lead'
  });

  const c6 = db.createContact({
    name: 'Julian Vance',
    email: 'jvance@crestlinefin.example.com',
    phone: '+1 (555) 678-9012',
    job_title: 'Chief Technology Officer',
    organization_id: org5.id,
    status: 'qualified'
  });

  const c7 = db.createContact({
    name: 'Maya Patel',
    email: 'maya@novarobotics.example.com',
    phone: '+1 (555) 789-0123',
    job_title: 'VP of Product',
    organization_id: org6.id,
    status: 'lead'
  });

  const c8 = db.createContact({
    name: 'Trevor Wright',
    email: 'twright@enterprise-scout.example.com',
    phone: '+1 (555) 890-1234',
    job_title: 'Independent Procurement Consultant',
    organization_id: null,
    status: 'lead'
  });

  // Calculate dynamic dates for past months and upcoming dates
  const now = new Date();
  const formatMonth = (d: Date) => d.toISOString().substring(0, 10);

  const dMinus90 = new Date(now);
  dMinus90.setDate(dMinus90.getDate() - 90);

  const dMinus60 = new Date(now);
  dMinus60.setDate(dMinus60.getDate() - 60);

  const dMinus30 = new Date(now);
  dMinus30.setDate(dMinus30.getDate() - 30);

  const dMinus10 = new Date(now);
  dMinus10.setDate(dMinus10.getDate() - 10);

  const dMinus2 = new Date(now);
  dMinus2.setDate(dMinus2.getDate() - 2);

  const dPlus7 = new Date(now);
  dPlus7.setDate(dPlus7.getDate() + 7);

  const dPlus14 = new Date(now);
  dPlus14.setDate(dPlus14.getDate() + 14);

  const dPlus30 = new Date(now);
  dPlus30.setDate(dPlus30.getDate() + 30);

  const dPlus45 = new Date(now);
  dPlus45.setDate(dPlus45.getDate() + 45);

  // 3. Deals across all stages: New -> Qualified -> Proposal -> Negotiation -> Won -> Lost
  // Won deals in recent months
  const dealWon1 = db.createDeal({
    name: 'Enterprise Cloud Security Suite',
    organization_id: org1.id,
    contact_id: c1.id,
    stage: 'Won',
    value: 65000,
    probability: 100,
    close_date: formatMonth(dMinus60)
  });

  const dealWon2 = db.createDeal({
    name: 'Fleet Dispatch Telematics System',
    organization_id: org2.id,
    contact_id: c3.id,
    stage: 'Won',
    value: 48000,
    probability: 100,
    close_date: formatMonth(dMinus30)
  });

  const dealWon3 = db.createDeal({
    name: 'Observability Add-on License',
    organization_id: org1.id,
    contact_id: c2.id,
    stage: 'Won',
    value: 18500,
    probability: 100,
    close_date: formatMonth(dMinus10)
  });

  // Negotiation stage
  const dealNeg1 = db.createDeal({
    name: 'Private Wealth Portal Upgrade',
    organization_id: org5.id,
    contact_id: c6.id,
    stage: 'Negotiation',
    value: 92000,
    probability: 80,
    close_date: formatMonth(dPlus14)
  });

  // Proposal stage
  const dealProp1 = db.createDeal({
    name: 'Telehealth Integration Platform',
    organization_id: org3.id,
    contact_id: c4.id,
    stage: 'Proposal',
    value: 54000,
    probability: 60,
    close_date: formatMonth(dPlus30)
  });

  const dealProp2 = db.createDeal({
    name: 'Warehouse Fleet Guidance System',
    organization_id: org6.id,
    contact_id: c7.id,
    stage: 'Proposal',
    value: 78000,
    probability: 50,
    close_date: formatMonth(dPlus45)
  });

  // Qualified stage
  const dealQual1 = db.createDeal({
    name: 'Content Syndication Engine',
    organization_id: org4.id,
    contact_id: c5.id,
    stage: 'Qualified',
    value: 36000,
    probability: 40,
    close_date: formatMonth(dPlus30)
  });

  // New stage
  const dealNew1 = db.createDeal({
    name: 'Logistics Mobile Driver App',
    organization_id: org2.id,
    contact_id: c3.id,
    stage: 'New',
    value: 28000,
    probability: 20,
    close_date: formatMonth(dPlus45)
  });

  const dealNew2 = db.createDeal({
    name: 'Procurement Workflow Assessment',
    organization_id: null,
    contact_id: c8.id,
    stage: 'New',
    value: 12000,
    probability: 15,
    close_date: formatMonth(dPlus30)
  });

  // Lost deal
  const dealLost1 = db.createDeal({
    name: 'Legacy Archive Migration',
    organization_id: org5.id,
    contact_id: c6.id,
    stage: 'Lost',
    value: 32000,
    probability: 0,
    close_date: formatMonth(dMinus30)
  });

  // 4. Activities & Follow-up Tasks (note, call, email)
  // Overdue task (due 2 days ago, not done)
  db.createActivity({
    type: 'call',
    contact_id: c6.id,
    deal_id: dealNeg1.id,
    description: 'Schedule legal contract review call regarding SLA redlines',
    happened_at: dMinus10.toISOString().replace('T', ' ').substring(0, 19),
    due_date: formatMonth(dMinus2),
    is_done: 0
  });

  // Upcoming task (due in 7 days, not done)
  db.createActivity({
    type: 'email',
    contact_id: c4.id,
    deal_id: dealProp1.id,
    description: 'Send revised HIPAA compliance security questionnaire & BAA draft',
    happened_at: dMinus2.toISOString().replace('T', ' ').substring(0, 19),
    due_date: formatMonth(dPlus7),
    is_done: 0
  });

  // Upcoming task (due in 14 days, not done)
  db.createActivity({
    type: 'call',
    contact_id: c7.id,
    deal_id: dealProp2.id,
    description: 'Technical walkthrough of ROS2 sensor adapter with hardware leads',
    happened_at: dMinus2.toISOString().replace('T', ' ').substring(0, 19),
    due_date: formatMonth(dPlus14),
    is_done: 0
  });

  // Completed task
  db.createActivity({
    type: 'call',
    contact_id: c1.id,
    deal_id: dealWon1.id,
    description: 'Quarterly business review & customer satisfaction check-in',
    happened_at: dMinus10.toISOString().replace('T', ' ').substring(0, 19),
    due_date: formatMonth(dMinus10),
    is_done: 1
  });

  // Informational notes and emails
  db.createActivity({
    type: 'note',
    contact_id: c1.id,
    deal_id: dealWon1.id,
    description: 'Client confirmed procurement team signed the master agreement and approved net-30 invoicing.',
    happened_at: dMinus60.toISOString().replace('T', ' ').substring(0, 19),
    is_done: 1
  });

  db.createActivity({
    type: 'email',
    contact_id: c3.id,
    deal_id: dealWon2.id,
    description: 'Dispatched rollout schedule to regional terminal managers.',
    happened_at: dMinus30.toISOString().replace('T', ' ').substring(0, 19),
    is_done: 1
  });

  db.createActivity({
    type: 'call',
    contact_id: c5.id,
    deal_id: dealQual1.id,
    description: 'Initial discovery call with Rachel to review content marketing roadmap and platform bottlenecks.',
    happened_at: dMinus10.toISOString().replace('T', ' ').substring(0, 19),
    is_done: 1
  });

  db.createActivity({
    type: 'note',
    contact_id: c6.id,
    deal_id: dealNeg1.id,
    description: 'Julian requested custom encryption key management module for high-net-worth accounts.',
    happened_at: dMinus2.toISOString().replace('T', ' ').substring(0, 19),
    is_done: 0
  });

  return {
    orgs: [org1, org2, org3, org4, org5, org6],
    contacts: [c1, c2, c3, c4, c5, c6, c7, c8],
    deals: [dealWon1, dealWon2, dealWon3, dealNeg1, dealProp1, dealProp2, dealQual1, dealNew1, dealNew2, dealLost1],
  };
}
