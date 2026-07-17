export interface FeatureDef {
  key: string;
  label: string;
  description: string;
  group: string;
}

export const FEATURE_GROUPS = [
  "Businesses",
  "Properties",
  "People",
  "Deliveries",
  "Finance",
  "Communication",
  "Settings",
] as const;

export const ALL_FEATURES: FeatureDef[] = [
  { key: "manage_businesses",  label: "Manage Businesses",       description: "Review, approve, reject and suspend business listings",        group: "Businesses" },
  { key: "add_business",       label: "Add Business",            description: "Create new business listings on behalf of owners",             group: "Businesses" },
  { key: "manage_featured",    label: "Featured Order",          description: "Control which businesses appear in the featured section",       group: "Businesses" },
  { key: "manage_gallery",     label: "Gallery Management",      description: "Approve or remove business photo submissions",                  group: "Businesses" },
  { key: "manage_claims",      label: "Ownership Claims",        description: "Handle business ownership claim requests",                      group: "Businesses" },
  { key: "manage_properties",  label: "Manage Properties",       description: "Review, approve and manage property listings",                  group: "Properties" },
  { key: "add_property",       label: "Add Property",            description: "Create new property listings",                                  group: "Properties" },
  { key: "manage_agents",      label: "Manage Agents",           description: "View, approve, suspend and review field agent applications",    group: "People" },
  { key: "manage_kyc",         label: "KYC Review",              description: "Access and verify KYC identity documents",                      group: "People" },
  { key: "manage_riders",      label: "Manage Riders",           description: "View, approve and manage delivery rider accounts",              group: "People" },
  { key: "manage_users",       label: "All Users",               description: "View and manage all registered user accounts",                  group: "People" },
  { key: "manage_deliveries",  label: "Deliveries",              description: "View and monitor all delivery orders",                          group: "Deliveries" },
  { key: "manage_withdrawals", label: "Withdrawals",             description: "View and resolve agent withdrawal requests",                    group: "Finance" },
  { key: "view_analytics",     label: "Analytics & Dashboard",   description: "Access platform analytics, charts and key metrics",             group: "Finance" },
  { key: "manage_commissions", label: "Commissions",             description: "Set and adjust agent commission rates",                         group: "Finance" },
  { key: "manage_messages",    label: "In-App Messages",         description: "Read and respond to in-app conversation threads",               group: "Communication" },
  { key: "manage_support",     label: "Support Tickets",         description: "Handle incoming support tickets from users",                    group: "Communication" },
  { key: "send_push",          label: "Push Notifications",      description: "Compose and send push notifications to users",                  group: "Communication" },
  { key: "manage_categories",  label: "Categories",              description: "Create and manage business categories",                         group: "Settings" },
  { key: "manage_settings",    label: "System Settings",         description: "Email configuration, map style, data export",                  group: "Settings" },
];

export const ALL_FEATURE_KEYS = ALL_FEATURES.map((f) => f.key);
