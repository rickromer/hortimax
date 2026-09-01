import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Tabla de usuarios. Mantiene compatibilidad con el flujo OAuth del template
 * (openId) pero el acceso real de la app es por usuario + contraseña propia.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** Identificador interno único (para OAuth del template o generado localmente). */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["field", "manager", "admin"]).default("field").notNull(),
  /** Nombre de usuario para iniciar sesión (único, en minúsculas). */
  username: varchar("username", { length: 64 }).unique(),
  /** Hash scrypt de la contraseña. Null hasta que el usuario la define. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Obliga a definir contraseña en el primer ingreso. */
  mustChangePassword: boolean("mustChangePassword").default(true).notNull(),
  /** Código temporal de activación entregado por el admin al vendedor. */
  activationCode: varchar("activationCode", { length: 32 }),
  phone: varchar("phone", { length: 40 }),
  /** Zona principal asignada al vendedor (referencial). */
  zone: varchar("zone", { length: 120 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Sitios de clientes mapeados en terreno. */
export const sites = mysqlTable(
  "sites",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    /** Tipo de cliente: productor, revendedor, etc. Texto libre con sugerencias. */
    clientType: varchar("clientType", { length: 80 }),
    /** División política principal del cliente (departamento de Paraguay). */
    department: varchar("department", { length: 120 }),
    /** Referencia local: distrito, municipio, localidad o zona comercial. */
    zone: varchar("zone", { length: 120 }),
    description: text("description"),
    contactName: varchar("contactName", { length: 160 }),
    phone: varchar("phone", { length: 40 }),
    /** Coordenadas con 7 decimales (~1 cm de precisión). */
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    /** Precisión del GPS al momento de registrar, en metros. */
    accuracy: int("accuracy"),
    address: text("address"),
    createdBy: int("createdBy").notNull(),
    /** Identifica puntos enviados durante el modo temporal de carga pública. */
    publicSubmission: boolean("publicSubmission").default(false).notNull(),
    /** Identificador generado por el dispositivo para reintentos offline seguros. */
    clientRequestId: varchar("clientRequestId", { length: 64 }),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    createdByIdx: index("sites_createdBy_idx").on(table.createdBy),
    departmentIdx: index("sites_department_idx").on(table.department),
    zoneIdx: index("sites_zone_idx").on(table.zone),
    publicSubmissionIdx: index("sites_publicSubmission_idx").on(table.publicSubmission),
  })
);

export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;

/**
 * Autorización de Google administrada por el portal. Solo conserva el refresh
 * token cifrado; permite reemplazar la cuenta personal por una corporativa sin
 * modificar los vínculos de las planillas existentes.
 */
export const googleConnections = mysqlTable("google_connections", {
  id: int("id").autoincrement().primaryKey(),
  connectionKey: varchar("connectionKey", { length: 64 }).notNull().unique(),
  encryptedRefreshToken: text("encryptedRefreshToken").notNull(),
  grantedScopes: text("grantedScopes"),
  connectedBy: int("connectedBy").notNull(),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleConnection = typeof googleConnections.$inferSelect;
export type InsertGoogleConnection = typeof googleConnections.$inferInsert;

/** Una planilla permanente por Productor; el estado evita duplicados durante una creación concurrente. */
export const siteGoogleSheets = mysqlTable(
  "site_google_sheets",
  {
    siteId: int("siteId").primaryKey(),
    status: mysqlEnum("status", ["creating", "ready", "failed"]).default("creating").notNull(),
    spreadsheetId: varchar("spreadsheetId", { length: 200 }),
    spreadsheetUrl: varchar("spreadsheetUrl", { length: 500 }),
    createdBy: int("createdBy").notNull(),
    lastError: varchar("lastError", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    spreadsheetIdx: index("site_google_sheets_spreadsheet_idx").on(table.spreadsheetId),
  })
);

export type SiteGoogleSheet = typeof siteGoogleSheets.$inferSelect;
export type InsertSiteGoogleSheet = typeof siteGoogleSheets.$inferInsert;

/** Cartera comercial: un sitio puede estar asignado a uno o varios vendedores. */
export const siteAssignments = mysqlTable(
  "site_assignments",
  {
    siteId: int("siteId").notNull(),
    userId: int("userId").notNull(),
    assignedBy: int("assignedBy").notNull(),
    assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.siteId, table.userId] }),
    siteIdx: index("site_assignments_site_idx").on(table.siteId),
    userIdx: index("site_assignments_user_idx").on(table.userId),
  })
);

export type SiteAssignment = typeof siteAssignments.$inferSelect;
export type InsertSiteAssignment = typeof siteAssignments.$inferInsert;

/** Registro de visitas (check-in) a un sitio. */
export const checkins = mysqlTable(
  "checkins",
  {
    id: int("id").autoincrement().primaryKey(),
    siteId: int("siteId").notNull(),
    userId: int("userId").notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    /** Distancia en metros entre el vendedor y el sitio al hacer check-in. */
    distanceMeters: int("distanceMeters"),
    comment: text("comment"),
    /** Clave única del dispositivo para evitar duplicados al sincronizar. */
    clientRequestId: varchar("clientRequestId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    siteIdx: index("checkins_site_idx").on(table.siteId),
    userIdx: index("checkins_user_idx").on(table.userId),
  })
);

export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = typeof checkins.$inferInsert;

/** Planilla de notas por sitio: cabecera con fecha/hora + texto libre. */
export const notes = mysqlTable(
  "notes",
  {
    id: int("id").autoincrement().primaryKey(),
    siteId: int("siteId").notNull(),
    userId: int("userId").notNull(),
    /** Check-in asociado, si la nota se cargó durante una visita. */
    checkinId: int("checkinId"),
    /** Categoría opcional: aplicación, visita, pedido, reclamo, otro. */
    category: varchar("category", { length: 80 }),
    content: text("content").notNull(),
    /** Clave única del dispositivo para evitar duplicados al sincronizar. */
    clientRequestId: varchar("clientRequestId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    siteIdx: index("notes_site_idx").on(table.siteId),
    userIdx: index("notes_user_idx").on(table.userId),
  })
);

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

/** Agenda de próximas visitas o atenciones programadas para un cliente. */
export const followups = mysqlTable(
  "followups",
  {
    id: int("id").autoincrement().primaryKey(),
    siteId: int("siteId").notNull(),
    createdBy: int("createdBy").notNull(),
    /** Tipo de agenda: recordatorio, visita o atención. */
    type: mysqlEnum("type", ["reminder", "visit", "attention"]).default("reminder").notNull(),
    description: text("description").notNull(),
    scheduledFor: timestamp("scheduledFor").notNull(),
    status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
    /** Clave única del dispositivo para reintentos offline seguros. */
    clientRequestId: varchar("clientRequestId", { length: 64 }),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    siteIdx: index("followups_site_idx").on(table.siteId),
    scheduledIdx: index("followups_scheduled_idx").on(table.scheduledFor),
    statusIdx: index("followups_status_idx").on(table.status),
  })
);

export type Followup = typeof followups.$inferSelect;
export type InsertFollowup = typeof followups.$inferInsert;

/** Catálogos configurables: zonas y tipos de cliente. */
export const catalogs = mysqlTable(
  "catalogs",
  {
    id: int("id").autoincrement().primaryKey(),
    kind: mysqlEnum("kind", ["zone", "clientType", "noteCategory"]).notNull(),
    value: varchar("value", { length: 120 }).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    kindIdx: index("catalogs_kind_idx").on(table.kind),
  })
);

export type Catalog = typeof catalogs.$inferSelect;
export type InsertCatalog = typeof catalogs.$inferInsert;
