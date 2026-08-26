CREATE TABLE `google_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectionKey` varchar(64) NOT NULL,
	`encryptedRefreshToken` text NOT NULL,
	`grantedScopes` text,
	`connectedBy` int NOT NULL,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_connections_connectionKey_unique` UNIQUE(`connectionKey`)
);
--> statement-breakpoint
CREATE TABLE `site_google_sheets` (
	`siteId` int NOT NULL,
	`status` enum('creating','ready','failed') NOT NULL DEFAULT 'creating',
	`spreadsheetId` varchar(200),
	`spreadsheetUrl` varchar(500),
	`createdBy` int NOT NULL,
	`lastError` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_google_sheets_siteId` PRIMARY KEY(`siteId`)
);
--> statement-breakpoint
CREATE INDEX `site_google_sheets_spreadsheet_idx` ON `site_google_sheets` (`spreadsheetId`);